const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);

// ===============================
// Socket.IO server
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

// Serve static files from /public
app.use(express.static(path.join(__dirname, "public")));

// ===============================
// In-memory store (MVP only)
// ===============================
const drivers = {};
// drivers[trackingId] = { lat, lng, updatedAt }

// ===============================
// Socket.IO logic
// ===============================
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // Join a tracking room
  socket.on("join", (trackingId) => {
    socket.join(trackingId);
    console.log(`Socket ${socket.id} joined room ${trackingId}`);

    // Send last known location immediately (if exists)
    if (drivers[trackingId]) {
      socket.emit("location_update", drivers[trackingId]);
    }
  });

  // Receive driver GPS updates
  socket.on("driver_location", (data) => {
    const { trackingId, lat, lng } = data;

    if (!trackingId || lat === undefined || lng === undefined) {
      return;
    }

    drivers[trackingId] = {
      lat,
      lng,
      updatedAt: Date.now()
    };

    // Broadcast to all clients in the room
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

});
