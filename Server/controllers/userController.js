const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const prisma = require("../config/db");

const createUser = async (req, res) => {
  try {
    const { fullName, email, password, role } = req.body;

    if (!fullName || !email || !password || !role) {
      return res.status(500).json({ message: "Invalis Credentials..." });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Email already exists",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        passwordHash,
        role: role || "EMPLOYEE",
      },
    });

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      },
    );

    return res.status(201).json({
      message: "User Registered Successfully",
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Registration Failed",
      error: error.message,
    });
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
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
    return res.status(200).json({ users });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch users",
      error: error.message,
    });
  }
};

const getUserById = async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
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
    return res.status(200).json({ user });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch users",
      error: error.message,
    });
  }
};
const editUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    const { fullName, email, role, avatarUrl } = req.body;

    const users = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        fullName,
        email,
        role,
        avatarUrl,
      },
    });
    return res.status(200).json({ users });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch users",
      error: error.message,
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    const users = await prisma.user.findMany({
      where: {
        id: userId,
      },
    });
    await prisma.user.deleteMany({
      where: {
        id: userId,
      },
    });
    return res.status(200).json({ users });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch users",
      error: error.message,
    });
  }
};
const updateRole = async (req, res) => {
  try {
    const userId = req.params.userId;
    const { role } = req.body;
    const users = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        role,
      },
    });

    return res.status(200).json({ users });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch users",
      error: error.message,
    });
  }
};

const changeUserPassword = async (req, res) => {
  try {
    const { userId } = req.params;
    const { newPassword } = req.body;

    // Validate password
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters long",
      });
    }

    // Check whether user exists
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        passwordHash,
      },
    });

    return res.status(200).json({
      message: `Password changed successfully for ${user.fullName}`,
    });

  } catch (error) {
    console.error("Change Password Error:", error);

    return res.status(500).json({
      message: "Failed to change password",
    });
  }
};

module.exports = {
  createUser,
  getUsers,
  getUserById,
  editUser,
  deleteUser,
  updateRole,
  changeUserPassword,
};
