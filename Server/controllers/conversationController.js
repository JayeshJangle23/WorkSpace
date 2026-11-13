const prisma = require("../config/db");
const { cacheDel, cacheDelPattern } = require("../config/redis");

const getConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    const conversations = await prisma.conversation.findMany({
      where: {
        members: { some: { userId } },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            sender: { select: { id: true, fullName: true } },
          },
        },
        team: { select: { id: true, name: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const member = conv.members.find((m) => m.userId === userId);
        const lastReadAt = member?.lastReadAt;

        const unreadCount = await prisma.message.count({
          where: {
            conversationId: conv.id,
            senderId: { not: userId },
            deletedAt: null,
            ...(lastReadAt ? { createdAt: { gt: lastReadAt } } : {}),
          },
        });

        return { ...conv, unreadCount };
      }),
    );

    return res.status(200).json({ conversations: conversationsWithUnread });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to fetch conversations", error: error.message });
  }
};

const getUsersForChat = async (req, res) => {
  try {
    const userId = req.user.id;

    const users = await prisma.user.findMany({
      where: { id: { not: userId }, isActive: true },
      select: {
        id: true,
        fullName: true,
        email: true,
        avatarUrl: true,
        role: true,
      },
    });

    return res.status(200).json({ users });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to fetch users", error: error.message });
  }
};

const createDirectConversation = async (req, res) => {
  try {
    const { targetUserId } = req.body;
    const userId = req.user.id;

    if (!targetUserId) {
      return res.status(400).json({ message: "Target user ID is required" });
    }

    if (targetUserId === userId) {
      return res
        .status(400)
        .json({ message: "Cannot create conversation with yourself" });
    }

    const existing = await prisma.conversation.findFirst({
      where: {
        type: "DIRECT",
        AND: [
          {
            members: {
              some: { userId },
            },
          },
          {
            members: {
              some: { userId: targetUserId },
            },
          },
          {
            members: {
              every: {
                userId: {
                  in: [userId, targetUserId],
                },
              },
            },
          },
        ],
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });
    if (existing) {
      return res.status(200).json({ conversation: existing });
    }

    const conversation = await prisma.conversation.create({
      data: {
        type: "DIRECT",
        members: {
          create: [{ userId }, { userId: targetUserId }],
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    return res.status(201).json({ conversation });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to create conversation", error: error.message });
  }
};

const createGroupConversation = async (req, res) => {
  try {
    const { name, memberIds } = req.body;
    const userId = req.user.id;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Group name is required" });
    }

    if (!memberIds || memberIds.length === 0) {
      return res
        .status(400)
        .json({ message: "At least one member is required" });
    }

    const allMemberIds = [...new Set([userId, ...memberIds])];

    const conversation = await prisma.conversation.create({
      data: {
        type: "GROUP",
        title: name.trim(),
        members: {
          create: allMemberIds.map((id) => ({ userId: id })),
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    return res.status(201).json({ conversation });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to create group", error: error.message });
  }
};

const updateGroupConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { name } = req.body;

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    if (conversation.type !== "GROUP") {
      return res
        .status(400)
        .json({ message: "Only group conversations can be updated" });
    }

    const data = {};
    if (name !== undefined) data.title = name;

    const updated = await prisma.conversation.update({
      where: { id: conversationId },
      data,
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    return res.status(200).json({ conversation: updated });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to update group", error: error.message });
  }
};

const deleteGroupConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    if (conversation.type !== "GROUP") {
      return res
        .status(400)
        .json({ message: "Only group conversations can be deleted" });
    }

    await prisma.$transaction(async (tx) => {
      const messageIds = await tx.message.findMany({
        where: { conversationId },
        select: { id: true },
      });

      if (messageIds.length > 0) {
        await tx.messageReadReceipt.deleteMany({
          where: { messageId: { in: messageIds.map((m) => m.id) } },
        });
      }

      await tx.message.deleteMany({ where: { conversationId } });

      await tx.conversationMember.deleteMany({ where: { conversationId } });

      await tx.conversation.delete({ where: { id: conversationId } });
    });

    return res.status(200).json({ message: "Group deleted successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to delete group", error: error.message });
  }
};

const addGroupMember = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    if (conversation.type !== "GROUP") {
      return res
        .status(400)
        .json({ message: "Only group conversations support adding members" });
    }

    const existing = await prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });

    if (existing) {
      return res.status(409).json({ message: "User is already a member" });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.isActive) {
      return res.status(404).json({ message: "User not found or inactive" });
    }

    const member = await prisma.conversationMember.create({
      data: { conversationId, userId },
      include: {
        user: {
          select: { id: true, fullName: true, email: true, avatarUrl: true },
        },
      },
    });

    return res.status(201).json({ message: "Member added", member });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to add member", error: error.message });
  }
};

const removeGroupMember = async (req, res) => {
  try {
    const { conversationId, userId } = req.params;

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    if (conversation.type !== "GROUP") {
      return res
        .status(400)
        .json({ message: "Only group conversations support removing members" });
    }

    const member = await prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });

    if (!member) {
      return res
        .status(404)
        .json({ message: "Member not found in this group" });
    }

    await prisma.conversationMember.delete({
      where: { conversationId_userId: { conversationId, userId } },
    });

    return res.status(200).json({ message: "Member removed" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to remove member", error: error.message });
  }
};

const getTeamConversation = async (req, res) => {
  try {
    const { teamId } = req.params;
    const userId = req.user.id;

    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    const isMember = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId } },
    });
    const isManager = team.managerId === userId;

    if (!isMember && !isManager && req.user.role !== "ADMIN") {
      return res
        .status(403)
        .json({ message: "You are not a member of this team" });
    }

    let conversation = await prisma.conversation.findUnique({
      where: { teamId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    if (!conversation) {
      const teamMembers = await prisma.teamMember.findMany({
        where: { teamId },
        select: { userId: true },
      });

      const memberIds = [
        ...new Set([team.managerId, ...teamMembers.map((m) => m.userId)]),
      ];

      conversation = await prisma.conversation.create({
        data: {
          type: "TEAM",
          teamId,
          title: team.name,
          members: {
            create: memberIds.map((id) => ({ userId: id })),
          },
        },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
      });
    }

    return res.status(200).json({ conversation });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to get team conversation",
      error: error.message,
    });
  }
};

const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    const member = await prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });

    if (!member) {
      return res
        .status(403)
        .json({ message: "You are not a member of this conversation" });
    }

    const messages = await prisma.message.findMany({
      where: { conversationId, deletedAt: null },
      include: {
        sender: {
          select: { id: true, fullName: true, avatarUrl: true },
        },
        readReceipts: {
          include: { user: { select: { id: true, fullName: true } } },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return res.status(200).json({ messages });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to fetch messages", error: error.message });
  }
};

const sendMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { content } = req.body;
    const senderId = req.user.id;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: "Message content is required" });
    }

    const member = await prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId, userId: senderId } },
    });

    if (!member) {
      return res
        .status(403)
        .json({ message: "You are not a member of this conversation" });
    }

    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId,
        content: content.trim(),
      },
      include: {
        sender: {
          select: { id: true, fullName: true, avatarUrl: true },
        },
      },
    });

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    await prisma.messageReadReceipt
      .create({
        data: { messageId: message.id, userId: senderId },
      })
      .catch(() => {});

    const otherMembers = await prisma.conversationMember.findMany({
      where: { conversationId, userId: { not: senderId } },
      select: { userId: true },
    });

    if (otherMembers.length > 0) {
      await prisma.notification
        .create({
          data: otherMembers.map((m) => ({
            userId: m.userId,
            type: "MESSAGE",
            title: `New message from ${req.user.fullName}`,
            body: content.trim().slice(0, 100),
            data: { conversationId, messageId: message.id },
          })),
        })
        .catch(() => {});
    }

    return res
      .status(201)
      .json({ message: "Message sent successfully", data: message });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to send message", error: error.message });
  }
};

const markAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    const member = await prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });

    if (!member) {
      return res
        .status(403)
        .json({ message: "You are not a member of this conversation" });
    }

    await prisma.conversationMember.update({
      where: { id: member.id },
      data: { lastReadAt: new Date() },
    });

    const unreadMessages = await prisma.message.findMany({
      where: {
        conversationId,
        senderId: { not: userId },
        deletedAt: null,
        readReceipts: { none: { userId } },
      },
      select: { id: true },
    });

    if (unreadMessages.length > 0) {
      await prisma.messageReadReceipt.createMany({
        data: unreadMessages.map((msg) => ({
          messageId: msg.id,
          userId,
        })),
        skipDuplicates: true,
      });
    }

    return res.status(200).json({ message: "Marked as read" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to mark as read", error: error.message });
  }
};

const deleteMessage = async (req, res) => {
  try {
    const { conversationId, messageId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const member = await prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    if (!member) {
      return res.status(403).json({ message: "You are not a member of this conversation" });
    }

    const msg = await prisma.message.findUnique({ where: { id: messageId } });
    if (!msg || msg.conversationId !== conversationId) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (msg.senderId !== userId && userRole !== "ADMIN") {
      return res.status(403).json({ message: "You can only delete your own messages" });
    }

    await prisma.message.update({
      where: { id: messageId },
      data: { deletedAt: new Date() },
    });

    const io = req.app.get("io");
    if (io) {
      io.to(`conversation:${conversationId}`).emit("message:deleted", {
        messageId,
        conversationId,
      });
    }

    return res.status(200).json({ message: "Message deleted" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to delete message", error: error.message });
  }
};

module.exports = {
  getConversations,
  getUsersForChat,
  createDirectConversation,
  createGroupConversation,
  updateGroupConversation,
  deleteGroupConversation,
  addGroupMember,
  removeGroupMember,
  getTeamConversation,
  getMessages,
  sendMessage,
  markAsRead,
  deleteMessage,
};
