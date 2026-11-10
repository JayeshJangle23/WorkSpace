const express = require("express");
const router = express.Router()
const {login,me} = require("../controllers/authController.js");
const authMiddleware = require("../middleware/authMiddleware.js");


router.post("/login",login);
router.get("/me",authMiddleware,me);

module.exports = router;