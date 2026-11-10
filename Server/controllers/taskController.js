const prisma = require("../config/db");

const createTask = async (req, res) => {
  try {
    const {
      title,
      description,
      startDate,
      dueDate,
      completedAt,
      teamId,
      priority,
    } = req.body;

    const createdById = req.user.id;
    console.log(req.user.id)
    console.log(teamId)

    if (!title || !teamId || !createdById) {
      return res.status(500).json({ message: "Invalid Credentials..." });
    }
    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      return res.status(404).json({
        message: "Team not found",
      });
    }

    const tasks = await prisma.task.create({
      data: {
        title,
        description,
        createdById,
        teamId,
        priority: priority || "MEDIUM",
        startDate: startDate ? new Date(startDate) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
    });

    return res.status(201).json({
      message: "Task Created Successfully",
      tasks,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Task Creation Failed",
      error: error.message,
    });
  }
};

const getTasks = async (req, res) => {
  try {
    const tasks = await prisma.task.findMany({
      include: {
        team: true,
        createdBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        assignments: {
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
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return res.status(200).json({ count: tasks.length, tasks });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch teams",
      error: error.message,
    });
  }
};

const getTaskById = async (req, res) => {
  try {
    const taskId = req.params.taskId;
    const tasks = await prisma.task.findUnique({
      where: {
        id: taskId,
      },
      include: {
        team: true,
        createdBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        assignments: {
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
        comments: true,
        attachments: true,
      },
    });
    if (!tasks) {
      return res.status(404).json({
        message: "Task not found",
      });
    }
    return res.status(200).json({ tasks });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch task",
      error: error.message,
    });
  }
};

const editTask = async (req, res) => {
  try {
    const taskId = req.params.taskId;
    const { title, description, startDate, dueDate, priority, teamId } =
      req.body;

    const existingTask = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!existingTask) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    if (teamId) {
      const team = await prisma.team.findUnique({
        where: { id: teamId },
      });

      if (!team) {
        return res.status(404).json({
          message: "Team not found",
        });
      }
    }

    const data = {};

    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (priority !== undefined) data.priority = priority;
    if (teamId !== undefined) data.teamId = teamId;

    if (startDate !== undefined) {
      data.startDate = startDate ? new Date(startDate) : null;
    }

    if (dueDate !== undefined) {
      data.dueDate = dueDate ? new Date(dueDate) : null;
    }

    const task = await prisma.task.update({
      where: { id: taskId },
      data,
    });

    return res.status(200).json({
      message: "Task updated successfully",
      task,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Task update failed",
      error: error.message,
    });
  }
};

const deleteTask = async (req, res) => {
  try {
    const taskId = req.params.taskId;
    const tasks = await prisma.task.findMany({
      where: {
        id: taskId,
      },
    });
    if (!tasks) {
      return res.status(404).json({ message: "Task Not Found..." });
    }
    await prisma.task.delete({
      where: {
        id: taskId,
      },
    });
    return res.status(200).json({ message: "Task deleted successfully", });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch tasks",
      error: error.message,
    });
  }
};

const assignTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { userId } = req.body;
    const assignedById = req.user?.id;

    if (!userId || !assignedById) {
      return res.status(400).json({
        message: "User ID and authenticated user are required",
      });
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    const member = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: task.teamId,
          userId,
        },
      },
    });
    console.log("Task Team ID:", task.teamId);
console.log("Requested User ID:", userId);

const allMembers = await prisma.teamMember.findMany({
});

console.log("Members found:", allMembers);  

    if (!member) {
      return res.status(400).json({
        message: "User is not a member of this team",
      });
    }

    const assignment = await prisma.taskAssignment.create({
      data: {
        taskId,
        userId,
        assignedById,
      },
    });

    return res.status(201).json({
      message: "Task assigned successfully",
      assignment,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Task assignment failed",
      error: error.message,
    });
  }
};

const unassignTask = async (req, res) => {
  try {
    const { taskId, userId } = req.params;

    const assignment = await prisma.taskAssignment.findUnique({
      where: {
        taskId_userId: {
          taskId,
          userId,
        },
      },
    });

    if (!assignment) {
      return res.status(404).json({
        message: "Task assignment not found",
      });
    }

    await prisma.taskAssignment.delete({
      where: {
        taskId_userId: {
          taskId,
          userId,
        },
      },
    });

    return res.status(200).json({
      message: "User removed from task successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to remove task assignment",
      error: error.message,
    });
  }
};

// UPDATE TASK STATUS
const updateTaskStatus = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;

    const allowedStatuses = [
      "TODO",
      "IN_PROGRESS",
      "IN_REVIEW",
      "COMPLETED",
      "BLOCKED",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid task status",
        allowedStatuses,
      });
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        status,
        ...(status === "COMPLETED"
          ? { completedAt: new Date() }
          : { completedAt: null }),
        ...(status === "IN_REVIEW"
          ? { reviewStatus: "PENDING" }
          : {}),
      },
    });

    return res.status(200).json({
      message: "Task status updated successfully",
      task: updatedTask,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Task status update failed",
      error: error.message,
    });
  }
};


const submitTaskForReview = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    if (task.status !== "IN_PROGRESS") {
      return res.status(400).json({
        message: "Only in-progress tasks can be submitted for review",
      });
    }

    // Check task assignment
    const assignment = await prisma.taskAssignment.findFirst({
      where: {
        taskId,
        userId,
      },
    });
    console.log("Task ID:", taskId);
console.log("Logged-in User ID:", userId);

const allAssignments = await prisma.taskAssignment.findMany({
  where: {
    taskId,
  },
});

console.log("Task Assignments:", allAssignments);

    if (!assignment) {
      return res.status(403).json({
        message: "You are not assigned to this task",
      });
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        status: "IN_REVIEW",
      },
    });

    return res.status(200).json({
      success: true,
      message: "Task submitted for review successfully",
      task: updatedTask,
    });

  } catch (error) {
    console.error("Submit task error:", error);

    return res.status(500).json({
      message: "Task submission failed",
      error: error.message,
    });
  }
};


// REVIEW TASK
const reviewTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { reviewStatus, reviewNote } = req.body;
    const reviewedById = req.user?.id;

    
    const allowedReviews = [
      "APPROVED",
      "CHANGES_REQUESTED",
    ];

    if (!allowedReviews.includes(reviewStatus)) {
      return res.status(400).json({
        message: "Invalid review status",
        allowedStatuses: allowedReviews,
      });
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }
    console.log("Current Task Status:", task.status);
console.log("Current Review Status:", task.reviewStatus);

    if (task.status !== "IN_REVIEW") {
      return res.status(400).json({
        message: "Only tasks submitted for review can be reviewed",
      });
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        reviewStatus,
        reviewNote: reviewNote || null,
        reviewedAt: new Date(),
        reviewedById,
        ...(reviewStatus === "APPROVED"
          ? {
              status: "COMPLETED",
              completedAt: new Date(),
            }
          : {
              status: "IN_PROGRESS",
              completedAt: null,
            }),
      },
    });

    return res.status(200).json({
      message: "Task reviewed successfully",
      task: updatedTask,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Task review failed",
      error: error.message,
    });
  }
};

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  editTask,
  deleteTask,
  assignTask,
  unassignTask,
  updateTaskStatus,
  reviewTask,
  submitTaskForReview
};