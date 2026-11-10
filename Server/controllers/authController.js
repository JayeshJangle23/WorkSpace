const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const prisma = require("../config/db.js");

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });
    if (!user) {
      return res.status(404).json({
        message: "User Not Found...",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        message: "Your account is inactive...",
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      return res.status(401).json({
        message: "Wrong Password...",
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
      },
    );

    return res.status(200).json({
      message: "Login Successfully...",
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
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

const me = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: req.user.id,
      },
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
    res.status(500).json({
      message: error.message,
    });
  }
};

// const register = async (req, res) => {
//     try {
//         const { fullName, email, password, role } = req.body;

//         // Check existing user
//         const existingUser = await prisma.user.findUnique({
//             where: { email }
//         });

//         if (existingUser) {
//             return res.status(409).json({
//                 message: "Email already exists"
//             });
//         }

//         // Hash password
//         const passwordHash = await bcrypt.hash(password, 10);

//         // Insert user into database
//         const user = await prisma.user.create({
//             data: {
//                 fullName,
//                 email,
//                 passwordHash,
//                 role: role || "EMPLOYEE"
//             }
//         });

//         // Generate JWT
//         const token = jwt.sign(
//             {
//                 id: user.id,
//                 role: user.role
//             },
//             process.env.JWT_SECRET,
//             {
//                 expiresIn: "1d"
//             }
//         );

//         return res.status(201).json({
//             message: "User Registered Successfully",
//             token,
//             user: {
//                 id: user.id,
//                 fullName: user.fullName,
//                 email: user.email,
//                 role: user.role
//             }
//         });

//     } catch (error) {
//         return res.status(500).json({
//             message: "Registration Failed",
//             error: error.message
//         });
//     }
// };

module.exports = { login, me };
