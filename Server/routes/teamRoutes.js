const express = require("express");
const router = express.Router();
const {
  createTeam,
  getTeams,
  getTeamById,
  editTeam,
  deleteTeam,
  createTeamMembers,
  deleteTeamMember,
  getTeamMembers,
} = require("../controllers/teamController.js");
const allowRoles = require("../middleware/roleMiddleware.js");
const authMiddleware = require("../middleware/authMiddleware.js");

router.post("/", authMiddleware, allowRoles("ADMIN"), createTeam);
router.get("/", authMiddleware, allowRoles("ADMIN", "MANAGER", "EMPLOYEE"), getTeams);
router.get("/:teamId", authMiddleware, allowRoles("ADMIN", "MANAGER", "EMPLOYEE"), getTeamById);
router.patch("/:teamId", authMiddleware, allowRoles("ADMIN", "MANAGER"), editTeam);
router.delete("/:teamId", authMiddleware, allowRoles("ADMIN"), deleteTeam);
router.post("/:teamId/members", authMiddleware, allowRoles("ADMIN", "MANAGER"), createTeamMembers);
router.delete("/:teamId/members/:userId", authMiddleware, allowRoles("ADMIN", "MANAGER"), deleteTeamMember);
router.get("/:teamId/members", authMiddleware, allowRoles("ADMIN", "MANAGER"), getTeamMembers);

module.exports = router;
