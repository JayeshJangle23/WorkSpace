const prisma = require("../config/db");

const logActivity = async ({
  actorId,
  action,
  entityType,
  entityId,
  metadata,
}) => {
  try {
    await prisma.activityLog.create({
      data: {
        actorId: actorId || null,
        action,
        entityType,
        entityId: entityId || null,
        metadata: metadata || undefined,
      },
    });
  } catch (error) {
    console.error("Activity log error:", error.message);
  }
};

module.exports = { logActivity };
