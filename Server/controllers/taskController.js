const prisma = require("../config/db");

const createTask = async (req, res) => {
  try {
    const {
      title,
      description,
      startDate,
      dueDate,
      teamId,
      priority,
      assigneeIds,
    } = req.body;

    const createdById = req.user.id;

    if (!title || !teamId || !createdById) {
      return res
        .status(400)
        .json({ message: "Title and teamId are required" });
    }

    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      return res.status(404).json({
        message: "Team not found",
      });
    }

    if (assigneeIds && assigneeIds.length > 0) {
      for (const userId of assigneeIds) {
        const member = await prisma.teamMember.findUnique({
          where: { teamId_userId: { teamId, userId } },
        });
        if (!member) {
          return res.status(400).json({
            message: "One or more assignees are not members of this team",
          });
        }
      }
    }

    const task = await prisma.$transaction(async (tx) => {
      const newTask = await tx.task.create({
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

      if (assigneeIds && assigneeIds.length > 0) {
        await tx.taskAssignment.createMany({
          data: assigneeIds.map((userId) => ({
            taskId: newTask.id,
            userId,
            assignedById: createdById,
          })),
        });
      }

      return newTask;
    });

    // Fetch the created task with relations
    const taskWithRelations = await prisma.task.findUnique({
      where: { id: task.id },
      include: {
        team: true,
        createdBy: {
          select: { id: true, fullName: true, email: true },
        },
        assignments: {
          include: {
            user: { select: { id: true, fullName: true, email: true } },
          },
        },
      },
    });

    // Log activity + notify assignees
    await logActivity({
      actorId: createdById,
      action: "CREATED_TASK",
      entityType: "Task",
      entityId: task.id,
      metadata: { title, teamId },
    });

    if (assigneeIds && assigneeIds.length > 0) {
      await prisma.notification.createMany({
        data: assigneeIds.map((userId) => ({
          userId,
          type: "TASK_ASSIGNED",
          title: "New Task Assigned",
          body: `You have been assigned to "${title}"`,
          data: { taskId: task.id, teamId },
        })),
      }).catch((err) => {
        console.error("Notification error:", err.message);
      });
    }

    return res.status(201).json({
      message: "Task created successfully",
      task: taskWithRelations,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Task creation failed",
      error: error.message,
    });
  }
};

const getTasks = async (req, res) => {
  try {
    const { id: userId, role } = req.user;

    let where = {};

    if (role === "EMPLOYEE") {
      where = {
        assignments: { some: { userId } },
      };
    }

    else if (role === "MANAGER") {
      where = {
        team: { managerId: userId },
      };
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        team: true,
        createdBy: {
          select: { id: true, fullName: true, email: true },
        },
        assignments: {
          include: {
            user: { select: { id: true, fullName: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({ count: tasks.length, tasks });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch tasks",
      error: error.message,
    });
  }
};

const getTaskById = async (req, res) => {
  try {
    const taskId = req.params.taskId;

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        team: true,
        createdBy: {
          select: { id: true, fullName: true, email: true },
        },
        assignments: {
          include: {
            user: { select: { id: true, fullName: true, email: true } },
          },
        },
        comments: true,
        attachments: true,
      },
    });

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    return res.status(200).json({ task });
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
    const {
      title,
      description,
      startDate,
      dueDate,
      priority,
      teamId,
      assigneeIds,
    } = req.body;
    const assignedById = req.user?.id;

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
        return res.status(404).json({ message: "Team not found" });
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

    await prisma.$transaction(async (tx) => {
      // Update task fields
      if (Object.keys(data).length > 0) {
        await tx.task.update({ where: { id: taskId }, data });
      }

      // Sync assignments if assigneeIds is provided
      if (assigneeIds !== undefined) {
        const currentAssignments = await tx.taskAssignment.findMany({
          where: { taskId },
          select: { userId: true },
        });
        const currentIds = currentAssignments.map((a) => a.userId);
        const newIds = assigneeIds.filter((id) => !currentIds.includes(id));
        const removedIds = currentIds.filter(
          (id) => !assigneeIds.includes(id),
        );

        // Validate new assignees are team members
        const effectiveTeamId = teamId || existingTask.teamId;
        for (const userId of newIds) {
          const member = await tx.teamMember.findUnique({
            where: {
              teamId_userId: { teamId: effectiveTeamId, userId },
            },
          });
          if (!member) {
            throw new Error(
              "One or more assignees are not members of this team",
            );
          }
        }

        if (newIds.length > 0) {
          await tx.taskAssignment.createMany({
            data: newIds.map((userId) => ({
              taskId,
              userId,
              assignedById,
            })),
          });
        }

        if (removedIds.length > 0) {
          await tx.taskAssignment.deleteMany({
            where: { taskId, userId: { in: removedIds } },
          });
        }
      }
    });

    // Fetch updated task with relations
    const updatedTask = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        team: true,
        createdBy: { select: { id: true, fullName: true, email: true } },
        assignments: {
          include: {
            user: { select: { id: true, fullName: true, email: true } },
          },
        },
      },
    });

    return res.status(200).json({
      message: "Task updated successfully",
      task: updatedTask,
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

    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    await prisma.task.delete({ where: { id: taskId } });

    return res.status(200).json({
      message: "Task deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to delete task",
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
      return res.status(404).json({ message: "Task not found" });
    }

    const member = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: { teamId: task.teamId, userId },
      },
    });

    if (!member) {
      return res.status(400).json({
        message: "User is not a member of this team",
      });
    }

    const assignment = await prisma.taskAssignment.create({
      data: { taskId, userId, assignedById },
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
      where: { taskId_userId: { taskId, userId } },
    });

    if (!assignment) {
      return res.status(404).json({
        message: "Task assignment not found",
      });
    }

    await prisma.taskAssignment.delete({
      where: { taskId_userId: { taskId, userId } },
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
      return res.status(404).json({ message: "Task not found" });
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

    // Log activity
    await logActivity({
      actorId: req.user.id,
      action: "UPDATED_TASK_STATUS",
      entityType: "Task",
      entityId: taskId,
      metadata: { status },
    });

    // Notify task creator
    await prisma.notification.create({
      data: {
        userId: task.createdById,
        type: "TASK_UPDATED",
        title: "Task Status Updated",
        body: `"${task.title}" is now ${status.replaceAll("_", " ")}`,
        data: { taskId, status },
      },
    }).catch((err) => {
      console.error("Notification error:", err.message);
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
      return res.status(404).json({ message: "Task not found" });
    }

    if (task.status !== "IN_PROGRESS") {
      return res.status(400).json({
        message: "Only in-progress tasks can be submitted for review",
      });
    }

    const assignment = await prisma.taskAssignment.findFirst({
      where: { taskId, userId },
    });

    if (!assignment) {
      return res.status(403).json({
        message: "You are not assigned to this task",
      });
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: { status: "IN_REVIEW" },
    });

    // Log activity
    await logActivity({
      actorId: userId,
      action: "SUBMITTED_TASK_FOR_REVIEW",
      entityType: "Task",
      entityId: taskId,
    });

    // Notify the team manager
    const team = await prisma.team.findUnique({
      where: { id: task.teamId },
      select: { managerId: true, name: true },
    });

    if (team) {
      await prisma.notification.create({
        data: {
          userId: team.managerId,
          type: "TASK_UPDATED",
          title: "Task Submitted for Review",
          body: `"${task.title}" is ready for review`,
          data: { taskId, teamId: task.teamId },
        },
      }).catch((err) => {
        console.error("Notification error:", err.message);
      });
    }

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

const reviewTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { reviewStatus, reviewNote } = req.body;
    const reviewedById = req.user?.id;

    const allowedReviews = ["APPROVED", "CHANGES_REQUESTED"];

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
      return res.status(404).json({ message: "Task not found" });
    }

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
          ? { status: "COMPLETED", completedAt: new Date() }
          : { status: "IN_PROGRESS", completedAt: null }),
      },
    });

    // Log activity
    await logActivity({
      actorId: reviewedById,
      action: "REVIEWED_TASK",
      entityType: "Task",
      entityId: taskId,
      metadata: { reviewStatus, reviewNote },
    });

    // Notify assigned users
    const assignments = await prisma.taskAssignment.findMany({
      where: { taskId },
      select: { userId: true },
    });

    if (assignments.length > 0) {
      await prisma.notification.createMany({
        data: assignments.map((a) => ({
          userId: a.userId,
          type: "TASK_REVIEWED",
          title: "Task Review Result",
          body:
            reviewStatus === "APPROVED"
              ? `"${task.title}" has been approved`
              : `"${task.title}" needs changes`,
          data: { taskId, reviewStatus },
        })),
      }).catch((err) => {
        console.error("Notification error:", err.message);
      });
    }

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


const getComments = async (req, res) => {
  try {
    const { taskId } = req.params;

    const comments = await prisma.taskComment.findMany({
      where: { taskId },
      include: {
        author: {
          select: { id: true, fullName: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return res.status(200).json({ comments });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to fetch comments", error: error.message });
  }
};

const addComment = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { content } = req.body;
    const authorId = req.user.id;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: "Comment content is required" });
    }

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const comment = await prisma.taskComment.create({
      data: {
        taskId,
        authorId,
        content: content.trim(),
      },
      include: {
        author: {
          select: { id: true, fullName: true, avatarUrl: true },
        },
      },
    });

    await logActivity({
      actorId: authorId,
      action: "COMMENTED_ON_TASK",
      entityType: "Task",
      entityId: taskId,
      metadata: { commentId: comment.id },
    });

    return res
      .status(201)
      .json({ message: "Comment added successfully", comment });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to add comment", error: error.message });
  }
};

const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;

    const comment = await prisma.taskComment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (comment.authorId !== userId && req.user.role !== "ADMIN") {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this comment" });
    }

    await prisma.taskComment.delete({ where: { id: commentId } });

    return res.status(200).json({ message: "Comment deleted successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to delete comment", error: error.message });
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
  submitTaskForReview,
  getComments,
  addComment,
  deleteComment,
};
