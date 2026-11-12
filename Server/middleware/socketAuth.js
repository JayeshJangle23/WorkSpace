const jwt = require("jsonwebtoken");

const socketAuth = (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error("Authentication token required"));
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    socket.user = {
      id: decoded.id,
      role: decoded.role,
    };

    console.log("Socket authenticated:", decoded.id);

    next();

  } catch (error) {
    console.error("Socket JWT error:", error.message);

    next(new Error("Invalid or expired token"));
  }
};

module.exports = socketAuth;
