const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const { owasprouter, setSocket } = require("./routes/owaspRoutes");
const {virustotalrouter,setSocketVir }= require("./routes/virustotalRoutes");
const urlscanrouter = require("./routes/urlscanRoutes");
const http = require("http");
const { Server } = require("socket.io");
// const pythonChartRoutes = require("./routes/pythonChartRoutes");
const securityToolsRoutes = require("./routes/securityTools");
const authRoutes = require("./routes/authroutes");

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);
// const io = new Server(server, { cors: { origin: "http://localhost:5173" } });

const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173", // Your frontend URL
      methods: ["GET", "POST"],
    },
  });
  

setSocket(io); // Set socket instance globally in owaspRoutes.js
setSocketVir(io);

const PORT = process.env.PORT || 5002;

app.use(express.json());
app.use(cors({ origin: "http://localhost:5173" }));

app.use("/api/owasp", owasprouter);
app.use("/api/virustotal",virustotalrouter);
app.use("/api/urlscan",urlscanrouter);
// app.use("/api/charts", pythonChartRoutes);
app.use("/api", securityToolsRoutes);
// Use authentication routes
app.use('/api/auth', authRoutes);


server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
