const express = require("express");
const http = require("http");
const path = require("path");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

// ===============================
// Socket.IO
// ===============================
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// ===============================
// Middleware
// ===============================
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ===============================
// In-memory store (MVP)
// ===============================
const drivers = {};
// drivers[trackingId] = { lat, lng, updatedAt }

// ===============================
// Socket.IO logic
// ===============================
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("join", (trackingId) => {
    socket.join(trackingId);
    console.log(`Socket ${socket.id} joined room ${trackingId}`);

    if (drivers[trackingId]) {
      socket.emit("location_update", drivers[trackingId]);
    }
  });

  socket.on("driver_location", (data) => {
    const { trackingId, lat, lng } = data;

    if (!trackingId || lat == null || lng == null) {
      return;
    }

    drivers[trackingId] = {
      lat,
      lng,
      updatedAt: Date.now()
    };

    io.to(trackingId).emit("location_update", drivers[trackingId]);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// ===============================
// Start server
// ===============================
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
