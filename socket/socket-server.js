const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // React frontend
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("🟢 Client connected:", socket.id);
});

// Endpoint ให้ Go POST เพื่อ trigger reload
app.post("/notify-maintenance", (req, res) => {
  const { event, data } = req.body;
  console.log("📨 Notify from Go:", event, data);

  io.emit(event, data);

  res.sendStatus(200);
});

app.post("/notify-news", (req, res) => {
  const { event, data } = req.body;
  console.log("📨 Notify from Go:", event, data);

  io.emit(event, data);

  res.sendStatus(200);
});

app.post("/notify-invoice", (req, res) => {
  const { event, data } = req.body;
  console.log("📨 Notify from Go:", event, data);

  io.emit(event, data);

  res.sendStatus(200);
});

server.listen(3001, () => {
  console.log("🚀 Socket.IO Gateway running on port 3001");
});
