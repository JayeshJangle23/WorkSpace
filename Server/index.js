const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const authRoutes = require("./routes/authRoutes.js")
const userRoutes = require("./routes/userRoutes.js")
const teamRoutes = require("./routes/teamRoutes.js")
const taskRoutes = require("./routes/taskRoutes.js")
const dashboardRoutes = require("./routes/dashboardRoutes.js");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const cors = require("cors");

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));
app.use("/api/auth",authRoutes)
app.use("/api/users",userRoutes)
app.use("/api/teams",teamRoutes)
app.use("/api/tasks",taskRoutes)
app.use("/api/dashboard", dashboardRoutes);
app.get('/', (req, res) => {
  res.send('Hello, World!');
});



app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
