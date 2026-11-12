const prisma = require("../config/db");
const socketAuth = require("../middleware/socketAuth");

const onlineUsers = new Map();

module.exports = (io) => {
  io.use(socketAuth);

  io.on("connection", async (socket) => {
    const userId = socket.user.id;
    console.log("User connected:", userId);

    socket.join(`user:${userId}`);
    const existingSocket = onlineUsers.get(userId) || new Set();

    existingSocket.add(socket.id);
    onlineUsers.set(userId, existingSocket);
    if (existingSocket.size === 1) {
      socket.broadcast.emit("user:online", { userId });

      await prisma.user
        .update({
          where: { id: userId },
          data: { lastSeenAt: null },
        })
        .catch(() => {});
    }
    socket.on("conversation:join", async ({ conversationId }, callback) => {
      // Join
      try {
        if (!conversationId) {
          return callback?.({
            success: false,
            message: "Conversation ID required",
          });
        }
        const member = await prisma.conversationMember.findUnique({
          where: {
            conversationId_userId: {
              conversationId,
              userId,
            },
          },
        });
        if (!member) {
          return callback?.({
            success: false,
            message: "You are not a member of this conversation",
          });
        }
        const room = `conversation:${conversationId}`;
        await socket.join(room);
        callback?.({ success: true });
      } catch (error) {
        callback?.({
          success: false,
          message: "Failed to join conversation",
        });
      }
    });

    socket.on("conversation:leave", async ({ conversationId }) => {
      if (!conversationId) return;

      await socket.leave(`conversation:${conversationId}`);

    });

    socket.on("message:send", async (payload, callback) => {
      try {
        const { conversationId, content } = payload || {};
        if (
          typeof conversationId !== "string" ||
          typeof content !== "string" ||
          !content.trim() ||
          content.length > 5000
        ) {
          return callback?.({
            success: false,
            message: "Invalid message",
          });
        }
        const conversation = await prisma.conversation.findFirst({
          where: {
            id: conversationId,
            members: {
              some: { userId },
            },
          },
          select: {
            id: true,
            type: true,
          },
        });

        if (!conversation) {
          return callback?.({
            success: false,
            message: "Conversation not found or access denied",
          });
        }
        const member = await prisma.conversationMember.findUnique({
          where: {
            conversationId_userId: {
              conversationId,
              userId,
            },
          },
        });
        if (!member) {
          return callback?.({
            success: false,
            message: "You are not a member of this conversation",
          });
        }
        const message = await prisma.$transaction(async (tx) => {
          const created = await tx.message.create({
            data: {
              conversationId,
              senderId: userId,
              content: content.trim(),
            },
            include: {
              sender: {
                select: {
                  id: true,
                  fullName: true,
                  avatarUrl: true,
                },
              },
            },
          });
          await tx.conversation.update({
            where: { id: conversationId },
            data: { updatedAt: new Date() },
          });
          await tx.messageReadReceipt.create({
            data: {
              messageId: created.id,
              userId,
            },
          });
          return created;
        });
        // io.to(`conversation:${conversationId}`).emit("message:new", message);
        io.to(`conversation:${conversationId}`).emit("message:new", {
          ...message,
          conversationId,
        });
        const otherMembers = await prisma.conversationMember.findMany({
          where: {
            conversationId,
            userId: { not: userId },
          },
          select: { userId: true },
        });
        for (const member of otherMembers) {
          io.to(`user:${member.userId}`).emit("conversation:updated", {
            conversationId,
            message,
          });
        }
        
        callback?.({
          success: true,
          message,
        });

      } catch (error) {
        console.error("Message error:", error);

        callback?.({
          success: false,
          message: "Failed to send message",
        });
      }
    });
    socket.on("typing:start", async ({ conversationId }) => {
      if (!conversationId) return;

      const member = await prisma.conversationMember.findUnique({
        where: {
          conversationId_userId: {
            conversationId,
            userId,
          },
        },
      });

      if (!member) return;

      socket.to(`conversation:${conversationId}`).emit("typing:start", {
        conversationId,
        userId,
      });
    });

    socket.on("typing:stop", async ({ conversationId }) => {
      if (!conversationId) return;

      const member = await prisma.conversationMember.findUnique({
        where: {
          conversationId_userId: {
            conversationId,
            userId,
          },
        },
      });

      if (!member) return;

      socket.to(`conversation:${conversationId}`).emit("typing:stop", {
        conversationId,
        userId,
      });
    });
    socket.on("message:read", async ({ conversationId }, callback) => {
      try {
        const member = await prisma.conversationMember.findUnique({
          where: {
            conversationId_userId: {
              conversationId,
              userId,
            },
          },
        });

        if (!member) {
          return callback?.({
            success: false,
            message: "Not a conversation member",
          });
        }
        await prisma.$transaction(async (tx) => {
          await tx.conversationMember.update({
            where: { id: member.id },
            data: { lastReadAt: new Date() },
          });
          const unread = await tx.message.findMany({
            where: {
              conversationId,
              senderId: { not: userId },
              deletedAt: null,
              readReceipts: {
                none: { userId },
              },
            },
            select: { id: true },
          });

          if (unread.length) {
            await tx.messageReadReceipt.createMany({
              data: unread.map((msg) => ({
                messageId: msg.id,
                userId,
              })),
              skipDuplicates: true,
            });
          }
        });

        io.to(`conversation:${conversationId}`).emit("message:read", {
          conversationId,
          userId,
          readAt: new Date(),
        });

        callback?.({ success: true });
      } catch (error) {
        callback?.({
          success: false,
          message: "Failed to mark messages as read",
        });
      }
    });

    socket.on("disconnect", async () => {
      const sockets = onlineUsers.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          onlineUsers.delete(userId);
          await prisma.user
            .update({
              where: { id: userId },
              data: { lastSeenAt: new Date() },
            })
            .catch(() => {});

          socket.broadcast.emit("user:offline", {
            userId,
            lastSeenAt: new Date(),
          });
        }
      }
      console.log("User disconnected:", userId);
    });
  });
};
