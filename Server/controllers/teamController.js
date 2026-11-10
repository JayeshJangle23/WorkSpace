const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const prisma = require("../config/db");

const createTeam = async (req, res) => {
  try {
    const { name, managerId, description } = req.body;

    if (!name || !managerId) {
      return res.status(500).json({ message: "Invalis Credentials..." });
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: managerId },
    });

    if (!existingUser) {
      return res.status(409).json({
        message: "Manager Not Found",
      });
    }

    const team = await prisma.team.create({
      data: {
        name ,
        managerId,
        description,
      },
    });

    return res.status(201).json({
      message: "Team Created Successfully",
      team,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Registration Failed",
      error: error.message,
    });
  }
};

const getTeams = async (req, res) => {
  try {
    const teams = await prisma.team.findMany({
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
    const teams = await prisma.team.findUnique({
      where: {
        id: teamId,
      },
      include: {
        manager: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
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
    if (!teams) {
      return res.status(404).json({
        message: "Team not found",
      });
    }
    return res.status(200).json({ teams });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch teams",
      error: error.message,
    });
  }
};
const editTeam = async (req, res) => {
  try {
    const teamId = req.params.teamId;
    const { name, description, managerId } = req.body;

    const teams = await prisma.team.update({
      where: {
        id: teamId,
      },
      data: {
        name,
        description,
        managerId,
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

const deleteTeam = async (req, res) => {
  try {
    const teamId = req.params.teamId;
    const teams = await prisma.team.findUnique({
      where: {
        id: teamId,
      },
    });
    if (!teams) {
      return res.status(404).json({ message : "Team Not Found..." });
    }
    await prisma.$transaction(async (tx) => {

      await tx.task.deleteMany({
        where: {
          teamId: teamId,
        },
      });

      await tx.teamMember.deleteMany({
        where: {
          teamId: teamId,
        },
      });

      await tx.team.delete({
        where: {
          id: teamId,
        },
      });

    });
    return res.status(200).json({ teams });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch teams",
      error: error.message,
    });
  }
};

const createTeamMembers = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { userId } = req.body;
    console.log(userId)

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
        success: false,
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
      message: "Team Member Registration Failed",
      error: error.message,
    });
  }
};

const deleteTeamMember = async (req, res) => {
  try {
    const { teamId, userId } = req.params;

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
      message: "Failed to fetch teams",
      error: error.message,
    });
  }
};

const getTeamMembers = async (req, res) => {
        try {
        const { teamId } = req.params;

        if (!teamId) {
            return res.status(400).json({
                success: false,
                message: "Team ID is required"
            });
        }

        // Check if team exists
        const team = await prisma.team.findUnique({
            where: {
                id: teamId
            }
        });

        if (!team) {
            return res.status(404).json({
                success: false,
                message: "Team not found"
            });
        }

        // Fetch members through TeamMember table
        const teamMembers = await prisma.teamMember.findMany({
            where: {
                teamId: teamId
            },
            include: {
                user: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true
                    }
                }
            }
        });

        return res.status(200).json({
            success: true,
            message: "Team members fetched successfully",
            count: teamMembers.length,
            members: teamMembers.map((member) => member.user)
        });

    } catch (error) {
        console.error("Get team members error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}

module.exports = {
  createTeam,
  getTeams,
  getTeamById,
  editTeam,
  deleteTeam,
  createTeamMembers,
  deleteTeamMember,
  getTeamMembers
};
