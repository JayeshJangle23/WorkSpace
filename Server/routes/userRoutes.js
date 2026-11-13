const express = require("express");
const router = express.Router();
const {
  createUser,
  getUsers,
  getUserById,
  editUser,
  deleteUser,
  updateRole,
  changeUserPassword,
  toggleUserStatus,
} = require("../controllers/userController.js");
const allowRoles = require("../middleware/roleMiddleware.js");
const authMiddleware = require("../middleware/authMiddleware.js");

router.post("/", authMiddleware, allowRoles("ADMIN"), createUser);
router.get("/", authMiddleware, allowRoles("ADMIN", "MANAGER"), getUsers);
router.get("/:userId", authMiddleware, allowRoles("ADMIN", "MANAGER"), getUserById);
router.patch("/:userId", authMiddleware, allowRoles("ADMIN"), editUser);
router.delete("/:userId", authMiddleware, allowRoles("ADMIN"), deleteUser);
router.patch("/:userId/role", authMiddleware, allowRoles("ADMIN"), updateRole);
router.patch("/:userId/password", authMiddleware, allowRoles("ADMIN"), changeUserPassword);
router.patch("/:userId/status", authMiddleware, allowRoles("ADMIN"), toggleUserStatus);

module.exports = router;
