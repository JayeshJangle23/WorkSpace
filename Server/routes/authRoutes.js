const express = require("express");
const router = express.Router();
const { login, me, logout } = require("../controllers/authController.js");
const authMiddleware = require("../middleware/authMiddleware.js");

router.post("/login", login);
router.get("/me", authMiddleware, (req,res) => {
    me(req,res)
});
router.post("/logout", logout);

module.exports = router;
