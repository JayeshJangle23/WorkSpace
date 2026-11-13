const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware.js");
const {getDashboard} = require("../controllers/dashboardController.js");

router.get("/", authMiddleware, getDashboard);

module.exports = router;
