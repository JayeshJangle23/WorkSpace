const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const prisma = require("../config/db.js");
const { cacheDel, cacheDelPattern, KEYS } = require("../config/redis");

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: false, 
  sameSite: "lax",
  path: "/",
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        message: "Your account is inactive",
      });
    }

    const isMatch = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    res.cookie("token", token, {
      ...COOKIE_OPTIONS,
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      message: "Login successful",
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });

  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const me = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        avatarUrl: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({
      message: "User profile fetched successfully",
      user,
    });

  } catch (error) {
    console.error("Profile error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const logout = async (req, res) => {
  
  if (req.user?.id) {
    await cacheDel(KEYS.userSession(req.user.id));
    
    await cacheDelPattern(`dashboard:*:${req.user.id}`);
  }

  res.clearCookie("token", COOKIE_OPTIONS);

  return res.status(200).json({
    message: "Logout successful",
  });
};

module.exports = {
  login,
  me,
  logout,
};
