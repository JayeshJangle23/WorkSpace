const jwt = require("jsonwebtoken");

const socketAuth = (socket, next) => {
  try {
    const cookieHeader = socket.handshake.headers.cookie || "";

    const tokenCookie = cookieHeader
      .split(";")
      .map((item) => item.trim())
      .find((item) => item.startsWith("token="));

    const token = tokenCookie
      ? decodeURIComponent(tokenCookie.substring(6))
      : null;

    if (!token) {
      console.log("SOCKET TOKEN MISSING");
      return next(new Error("Socket token missing"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    socket.user = {
      id: decoded.id,
      role: decoded.role,
    };

    next();
  } catch (error) {
    next(new Error("Invalid or expired token"));
  }
};

module.exports = socketAuth;
