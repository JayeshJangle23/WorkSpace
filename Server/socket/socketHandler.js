const prisma = require("../config/db");
const socketAuth = require("../middleware/socketAuth");
const { redis } = require("../config/redis");

const onlineKey = (userId) => `online:sockets:${userId}`;
const ONLINE_TTL = 24 * 60 * 60; 

const addSocket = async (userId, socketId) => {
  await redis.sadd(onlineKey(userId), socketId);
  await redis.expire(onlineKey(userId), ONLINE_TTL);
  return redis.scard(onlineKey(userId));
};

const removeSocket = async (userId, socketId) => {
  await redis.srem(onlineKey(userId), socketId);
  return redis.scard(onlineKey(userId));
};

module.exports = (io) => {
  io.use(socketAuth);

  io.on("connection", async (socket) => {
    const userId = socket.user.id;

    socket.join(`user:${userId}`);

    const socketCount = await addSocket(userId, socket.id);

    if (socketCount === 1) {
      socket.broadcast.emit("user:online", { userId });

      await prisma.user
        .update({
          where: { id: userId },
          data: { lastSeenAt: null },
        })
        .catch(() => {});
    }

    socket.on("conversation:join", async ({ conversationId }, callback) => {
      try {
        if (!conversationId) {
          return callback?.({
            success: false,
            message: "Conversation ID required",
          });
        }
        const member = await prisma.conversationMember.findUnique({
          where: {
            conversationId_userId: { conversationId, userId },
          },
        });
        if (!member) {
          return callback?.({
            success: false,
            message: "You are not a member of this conversation",
          });
        }
        await socket.join(`conversation:${conversationId}`);
        callback?.({ success: true });
      } catch {
        callback?.({ success: false, message: "Failed to join conversation" });
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
          return callback?.({ success: false, message: "Invalid message" });
        }

        const conversation = await prisma.conversation.findFirst({
          where: {
            id: conversationId,
            members: { some: { userId } },
          },
          select: { id: true, type: true },
        });

        if (!conversation) {
          return callback?.({
            success: false,
            message: "Conversation not found or access denied",
          });
        }

        const member = await prisma.conversationMember.findUnique({
          where: { conversationId_userId: { conversationId, userId } },
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
                select: { id: true, fullName: true, avatarUrl: true },
              },
            },
          });
          await tx.conversation.update({
            where: { id: conversationId },
            data: { updatedAt: new Date() },
          });
          await tx.messageReadReceipt.create({
            data: { messageId: created.id, userId },
          });
          return created;
        });

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
        for (const m of otherMembers) {
          io.to(`user:${m.userId}`).emit("conversation:updated", {
            conversationId,
            message,
          });
        }

        callback?.({ success: true, message });
      } catch (error) {
        console.error("Message error:", error);
        callback?.({ success: false, message: "Failed to send message" });
      }
    });

    socket.on("typing:start", async ({ conversationId }) => {
      if (!conversationId) return;
      const member = await prisma.conversationMember.findUnique({
        where: { conversationId_userId: { conversationId, userId } },
      });
      if (!member) return;
      socket
        .to(`conversation:${conversationId}`)
        .emit("typing:start", { conversationId, userId });
    });

    socket.on("typing:stop", async ({ conversationId }) => {
      if (!conversationId) return;
      const member = await prisma.conversationMember.findUnique({
        where: { conversationId_userId: { conversationId, userId } },
      });
      if (!member) return;
      socket
        .to(`conversation:${conversationId}`)
        .emit("typing:stop", { conversationId, userId });
    });

    socket.on("message:read", async ({ conversationId }, callback) => {
      try {
        const member = await prisma.conversationMember.findUnique({
          where: { conversationId_userId: { conversationId, userId } },
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
              readReceipts: { none: { userId } },
            },
            select: { id: true },
          });
          if (unread.length) {
            await tx.messageReadReceipt.createMany({
              data: unread.map((msg) => ({ messageId: msg.id, userId })),
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
      } catch {
        callback?.({ success: false, message: "Failed to mark messages as read" });
      }
    });

    socket.on("disconnect", async () => {
      const remaining = await removeSocket(userId, socket.id);

      if (remaining === 0) {
        
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

      console.log("User disconnected:", userId);
    });
  });
};
