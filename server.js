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
  console.log("🔌 Client connected:", socket.id);

  socket.on("join", (trackingId) => {
    console.log(`➡️  JOIN received from ${socket.id} | trackingId=${trackingId}`);
    socket.join(trackingId);
    console.log(`✅ Socket ${socket.id} joined room ${trackingId}`);

    // Send last known location immediately if available
    if (drivers[trackingId]) {
      console.log(
        `📤 Replaying last known location to ${socket.id}:`,
        drivers[trackingId]
      );
      socket.emit("location_update", drivers[trackingId]);
    } else {
      console.log(`ℹ️  No stored location yet for trackingId=${trackingId}`);
    }
  });

  socket.on("driver_location", (data) => {
    console.log("📍 DRIVER LOCATION RECEIVED:", data);

    const { trackingId, lat, lng } = data || {};

    if (!trackingId || lat == null || lng == null) {
      console.log("❌ INVALID DRIVER PAYLOAD");
      return;
    }

    drivers[trackingId] = {
      lat,
      lng,
      updatedAt: Date.now()
    };

    console.log(
      `💾 STORED LOCATION for trackingId=${trackingId}:`,
      drivers[trackingId]
    );

    io.to(trackingId).emit("location_update", drivers[trackingId]);
    console.log(`📡 Emitted location_update to room ${trackingId}`);
  });

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});

// ===============================
// HTTP API – Fetch last driver location (reload-safe)
// ===============================
app.get("/api/last-location/:trackingId", (req, res) => {
  const { trackingId } = req.params;

  console.log(`🌐 HTTP GET /api/last-location/${trackingId}`);

  const data = drivers[trackingId];
  if (!data) {
    console.log(`⚠️  No location stored for trackingId=${trackingId}`);
    return res.status(404).json({ error: "No location yet" });
  }

  console.log(`✅ Returning stored location for ${trackingId}:`, data);
  res.json(data);
});

// ===============================
// Start server
// ===============================
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});




// ===============================
// TEST ONLY — Inject driver location
// ===============================
app.post("/test/set-location", (req, res) => {
  const { trackingId, lat, lng } = req.body;

  drivers[trackingId] = {
    lat,
    lng,
    updatedAt: Date.now()
  };

  console.log("🧪 TEST location injected:", drivers[trackingId]);

  res.json({ ok: true });
});
