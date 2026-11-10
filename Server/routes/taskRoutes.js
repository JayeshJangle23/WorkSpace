const express = require("express");
const router = express.Router();
const allowRoles = require("../middleware/roleMiddleware.js");
const authMiddleware = require("../middleware/authMiddleware.js");
const {
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
} = require("../controllers/taskController.js");


router.post("/", authMiddleware, allowRoles("ADMIN","MANAGER"), createTask);
router.get("/", authMiddleware, allowRoles("ADMIN", "MANAGER"), getTasks);
router.get(
  "/:taskId",
  authMiddleware,
  getTaskById
);
router.patch(
  "/:taskId",
  authMiddleware,
  allowRoles("ADMIN", "MANAGER"),
  editTask,
);
router.delete("/:taskId", authMiddleware, allowRoles("ADMIN"), deleteTask);
router.post(
  "/:taskId/assignments",
  authMiddleware,
  allowRoles("ADMIN", "MANAGER"),
  assignTask,
);
router.delete(
  "/:taskId/assignments/:userId",
  authMiddleware,
  allowRoles("ADMIN", "MANAGER"),
  unassignTask,
);
router.patch(
  "/:taskId/status",
  authMiddleware,
  allowRoles("ADMIN", "MANAGER","EMPLOYEE"),
  updateTaskStatus,
);
router.patch(
  "/:taskId/review",
  authMiddleware,
  allowRoles("ADMIN", "MANAGER"),
  reviewTask,
);
router.patch(
  "/:taskId/submit-review",
  authMiddleware,
  submitTaskForReview
);

module.exports = router;
