const prisma = require("../config/db.js");
const { cacheGet, cacheSet, cacheDel, TTL, KEYS } = require("../config/redis");

const getDashboard = async (req, res) => {
  try {
    const { id: userId, role } = req.user;
    const now = new Date();

    const cacheKey = KEYS.dashboard(role, userId);
    const cached = await cacheGet(cacheKey);
    if (cached) {
      return res.status(200).json(cached);
    }

    if (role === "ADMIN") {
      const [
        totalUsers,
        activeUsers,
        totalManagers,
        totalEmployees,
        totalTeams,
        totalTasks,
        completedTasks,
        pendingReviews,
        recentUsers,
        recentTasks,
      ] = await Promise.all([
        prisma.user.count(),

        prisma.user.count({
          where: { isActive: true },
        }),

        prisma.user.count({
          where: { role: "MANAGER" },
        }),

        prisma.user.count({
          where: { role: "EMPLOYEE" },
        }),

        prisma.team.count(),

        prisma.task.count(),

        prisma.task.count({
          where: { status: "COMPLETED" },
        }),

        prisma.task.count({
          where: { reviewStatus: "PENDING" },
        }),

        prisma.user.findMany({
          take: 6,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            isActive: true,
            createdAt: true,
          },
        }),

        prisma.task.findMany({
          take: 6,
          orderBy: { createdAt: "desc" },
          include: {
            team: {
              select: {
                id: true,
                name: true,
              },
            },
            createdBy: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
        }),
      ]);

      const response = {
        role,
        stats: {
          totalUsers,
          activeUsers,
          totalManagers,
          totalEmployees,
          totalTeams,
          totalTasks,
          completedTasks,
          pendingReviews,
        },
        recentUsers,
        recentTasks,
      };

      await cacheSet(cacheKey, response, TTL.DASHBOARD);
      return res.status(200).json(response);
    }

    if (role === "MANAGER") {
      const [
        teams,
        totalTasks,
        completedTasks,
        inProgressTasks,
        pendingReviews,
        overdueTasks,
        recentTasks,
      ] = await Promise.all([
        prisma.team.findMany({
          where: {
            managerId: userId,
          },
          include: {
            _count: {
              select: {
                members: true,
                tasks: true,
              },
            },
          },
        }),

        prisma.task.count({
          where: {
            team: {
              managerId: userId,
            },
          },
        }),

        prisma.task.count({
          where: {
            team: { managerId: userId },
            status: "COMPLETED",
          },
        }),

        prisma.task.count({
          where: {
            team: { managerId: userId },
            status: "IN_PROGRESS",
          },
        }),

        prisma.task.count({
          where: {
            team: { managerId: userId },
            reviewStatus: "PENDING",
          },
        }),

        prisma.task.count({
          where: {
            team: { managerId: userId },
            dueDate: { lt: now },
            status: { not: "COMPLETED" },
          },
        }),

        prisma.task.findMany({
          where: {
            team: { managerId: userId },
          },
          take: 6,
          orderBy: { createdAt: "desc" },
          include: {
            team: {
              select: {
                name: true,
              },
            },
            assignments: {
              include: {
                user: {
                  select: {
                    id: true,
                    fullName: true,
                  },
                },
              },
            },
          },
        }),
      ]);

      const totalTeams = teams.length;

      const totalMembers = teams.reduce(
        (sum, team) => sum + team._count.members,
        0
      );

      const response = {
        role,
        stats: {
          totalTeams,
          totalMembers,
          totalTasks,
          completedTasks,
          inProgressTasks,
          pendingReviews,
          overdueTasks,
        },
        teams,
        recentTasks,
      };

      await cacheSet(cacheKey, response, TTL.DASHBOARD);
      return res.status(200).json(response);
    }

    if (role === "EMPLOYEE") {
      const assignedToMe = {
        assignments: {
          some: {
            userId,
          },
        },
      };

      const [
        totalTasks,
        todoTasks,
        inProgressTasks,
        completedTasks,
        pendingReviews,
        overdueTasks,
        recentTasks,
      ] = await Promise.all([
        prisma.task.count({
          where: assignedToMe,
        }),

        prisma.task.count({
          where: {
            ...assignedToMe,
            status: "TODO",
          },
        }),

        prisma.task.count({
          where: {
            ...assignedToMe,
            status: "IN_PROGRESS",
          },
        }),

        prisma.task.count({
          where: {
            ...assignedToMe,
            status: "COMPLETED",
          },
        }),

        prisma.task.count({
          where: {
            ...assignedToMe,
            reviewStatus: "PENDING",
          },
        }),

        prisma.task.count({
          where: {
            ...assignedToMe,
            dueDate: { lt: now },
            status: { not: "COMPLETED" },
          },
        }),

        prisma.task.findMany({
          where: assignedToMe,
          take: 6,
          orderBy: { createdAt: "desc" },
          include: {
            team: {
              select: {
                id: true,
                name: true,
              },
            },
            createdBy: {
              select: {
                fullName: true,
              },
            },
          },
        }),
      ]);

      const response = {
        role,
        stats: {
          totalTasks,
          todoTasks,
          inProgressTasks,
          completedTasks,
          pendingReviews,
          overdueTasks,
        },
        recentTasks,
      };

      await cacheSet(cacheKey, response, TTL.DASHBOARD);
      return res.status(200).json(response);
    }

    return res.status(403).json({
      message: "Invalid user role",
    });

  } catch (error) {
    console.error("Dashboard error:", error);

    return res.status(500).json({
      message: "Failed to load dashboard",
      error: error.message,
    });
  }
};

module.exports = { getDashboard };
