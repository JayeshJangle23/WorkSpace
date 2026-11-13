const jwt = require("jsonwebtoken");
const prisma = require("../config/db.js");
const { cacheGet, cacheSet, TTL, KEYS } = require("../config/redis");

const authMiddleware = async (req, res, next) => {
  try {
    
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({
        message: "Authentication token required",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const cacheKey = KEYS.userSession(decoded.id);
    const cachedUser = await cacheGet(cacheKey);

    if (cachedUser) {
      req.user = cachedUser;
      return next();
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        message: "User not found or account inactive",
      });
    }

    await cacheSet(cacheKey, user, TTL.USER_SESSION);

    req.user = user;
    next();

  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};

module.exports = authMiddleware;
