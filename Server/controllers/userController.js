const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const prisma = require("../config/db");

const createUser = async (req, res) => {
  try {
    const { fullName, email, password, role } = req.body;

    if (!fullName || !email || !password || !role) {
      return res
        .status(400)
        .json({ message: "All fields are required" });
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
      }
    );

    return res.status(201).json({
      message: "User registered successfully",
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
      message: "Registration failed",
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
      message: "Failed to fetch user",
      error: error.message,
    });
  }
};

const editUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    const { fullName, email, role, avatarUrl } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const data = {};

    if (fullName !== undefined) data.fullName = fullName;
    if (email !== undefined) data.email = email;
    if (role !== undefined) data.role = role;
    if (avatarUrl !== undefined) data.avatarUrl = avatarUrl;

    const user = await prisma.user.update({
      where: { id: userId },
      data,
    });

    return res.status(200).json({
      message: "User updated successfully",
      user,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to update user",
      error: error.message,
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    const userId = req.params.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    return res.status(200).json({
      message: "User deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to delete user",
      error: error.message,
    });
  }
};

const updateRole = async (req, res) => {
  try {
    const userId = req.params.userId;
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({
        message: "Role is required",
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { role },
    });

    return res.status(200).json({
      message: "Role updated successfully",
      user,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to update role",
      error: error.message,
    });
  }
};

const changeUserPassword = async (req, res) => {
  try {
    const { userId } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters long",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return res.status(200).json({
      message: `Password changed successfully for ${user.fullName}`,
    });
  } catch (error) {
    console.error("Change password error:", error);

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
