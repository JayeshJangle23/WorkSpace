const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
const cookieParser = require("cookie-parser");
const authRoutes = require("./routes/authRoutes.js");
const userRoutes = require("./routes/userRoutes.js");
const teamRoutes = require("./routes/teamRoutes.js");
const taskRoutes = require("./routes/taskRoutes.js");
const dashboardRoutes = require("./routes/dashboardRoutes.js");
const notificationRoutes = require("./routes/notificationRoutes.js");
const conversationRoutes = require("./routes/conversationRoutes.js");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./utils/swagger-output.json");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const server = http.createServer(app);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);
app.use(cookieParser());
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods:["GET","POST"],
    credentials: true,
  },
});
app.set("io",io);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/conversations", conversationRoutes);
require("./socket/socketHandler")(io)
app.get("/", (req, res) => {
  res.send("Hello, World!");
});

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
