const prisma = require("../config/db");

const createTeam = async (req, res) => {
  try {
    const { name, managerId, description } = req.body;

    if (!name || !managerId) {
      return res
        .status(400)
        .json({ message: "Name and managerId are required" });
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: managerId },
    });

    if (!existingUser) {
      return res.status(404).json({
        message: "Manager not found",
      });
    }

    const team = await prisma.team.create({
      data: {
        name,
        managerId,
        description,
      },
    });

    return res.status(201).json({
      message: "Team created successfully",
      team,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to create team",
      error: error.message,
    });
  }
};

const getTeams = async (req, res) => {
  try {
    const { id: userId, role } = req.user;

    let where = {};

    // MANAGER: teams they manage + teams they're a member of
    if (role === "MANAGER") {
      where = {
        OR: [
          { managerId: userId },
          { members: { some: { userId } } },
        ],
      };
    }
    // EMPLOYEE: only teams they're a member of
    else if (role === "EMPLOYEE") {
      where = {
        members: { some: { userId } },
      };
    }

    const teams = await prisma.team.findMany({
      where,
      include: {
        manager: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        _count: {
          select: {
            members: true,
            tasks: true,
          },
        },
      },
    });

    return res.status(200).json({ teams });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch teams",
      error: error.message,
    });
  }
};

const getTeamById = async (req, res) => {
  try {
    const teamId = req.params.teamId;
    const { role } = req.user;

    const include = {
      manager: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
      _count: {
        select: {
          members: true,
          tasks: true,
        },
      },
    };

    if (role === "ADMIN" || role === "MANAGER") {
      include.members = {
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
      };
    }

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include,
    });

    if (!team) {
      return res.status(404).json({
        message: "Team not found",
      });
    }

    return res.status(200).json({ team });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch team",
      error: error.message,
    });
  }
};

const editTeam = async (req, res) => {
  try {
    const teamId = req.params.teamId;
    const { name, description, managerId } = req.body;

    const existingTeam = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!existingTeam) {
      return res.status(404).json({
        message: "Team not found",
      });
    }

    if (managerId) {
      const manager = await prisma.user.findUnique({
        where: { id: managerId },
      });

      if (!manager) {
        return res.status(404).json({
          message: "Manager not found",
        });
      }
    }

    const data = {};

    if (name !== undefined) data.name = name;
    if (description !== undefined) data.description = description;
    if (managerId !== undefined) data.managerId = managerId;

    const team = await prisma.team.update({
      where: { id: teamId },
      data,
    });

    return res.status(200).json({
      message: "Team updated successfully",
      team,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to update team",
      error: error.message,
    });
  }
};

const deleteTeam = async (req, res) => {
  try {
    const teamId = req.params.teamId;

    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    await prisma.$transaction(async (tx) => {
      await tx.task.deleteMany({
        where: { teamId },
      });

      await tx.teamMember.deleteMany({
        where: { teamId },
      });

      await tx.team.delete({
        where: { id: teamId },
      });
    });

    return res.status(200).json({
      message: "Team deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to delete team",
      error: error.message,
    });
  }
};

const createTeamMembers = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        message: "User ID is required",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      return res.status(404).json({
        message: "Team not found",
      });
    }

    const existingMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId,
        },
      },
    });

    if (existingMember) {
      return res.status(409).json({
        message: "User is already a member of this team",
      });
    }

    const teamMember = await prisma.teamMember.create({
      data: {
        teamId,
        userId,
      },
    });

    return res.status(201).json({
      message: "Team member added successfully",
      teamMember,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to add team member",
      error: error.message,
    });
  }
};

const deleteTeamMember = async (req, res) => {
  try {
    const { teamId, userId } = req.params;

    const member = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId,
        },
      },
    });

    if (!member) {
      return res.status(404).json({
        message: "Team member not found",
      });
    }

    await prisma.teamMember.delete({
      where: {
        teamId_userId: {
          teamId,
          userId,
        },
      },
    });

    return res.status(200).json({
      message: "Team member removed successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to remove team member",
      error: error.message,
    });
  }
};

const getTeamMembers = async (req, res) => {
  try {
    const { teamId } = req.params;

    if (!teamId) {
      return res.status(400).json({
        message: "Team ID is required",
      });
    }

    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      return res.status(404).json({
        message: "Team not found",
      });
    }

    const teamMembers = await prisma.teamMember.findMany({
      where: { teamId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    return res.status(200).json({
      message: "Team members fetched successfully",
      count: teamMembers.length,
      members: teamMembers.map((member) => member.user),
    });
  } catch (error) {
    console.error("Get team members error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

module.exports = {
  createTeam,
  getTeams,
  getTeamById,
  editTeam,
  deleteTeam,
  createTeamMembers,
  deleteTeamMember,
  getTeamMembers,
};
