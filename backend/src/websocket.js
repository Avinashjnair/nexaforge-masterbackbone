const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

function createWebSocketServer(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || "http://localhost:5500",
      credentials: true,
    },
  });

  // JWT auth middleware for socket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.slice(7);
    if (!token) return next(new Error("Authentication required"));
    try {
      socket.user = jwt.verify(token, process.env.JWT_SECRET);
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const { email, role, department } = socket.user;
    console.log(`[WS] connected: ${email} (${socket.id})`);

    // Auto-join department room on connect — used for GM intervention pushes
    if (department) {
      socket.join(`dept:${department}`);
    }
    // GM joins all department rooms so they receive every push
    if (role === "gm") {
      const ALL_DEPTS = ["gm", "marketing", "production", "qc", "finance", "store", "hr", "procurement", "welding"];
      ALL_DEPTS.forEach(d => socket.join(`dept:${d}`));
    }

    // Auto-join personal user room for @mention notifications (NEW-08)
    if (socket.user?.sub) {
      socket.join(`user:${socket.user.sub}`);
    }

    // Client joins a project room to receive project-scoped events
    socket.on("join:project", (projectId) => {
      socket.join(`project:${projectId}`);
      console.log(`[WS] ${email} joined project:${projectId}`);
    });

    socket.on("leave:project", (projectId) => {
      socket.leave(`project:${projectId}`);
    });

    // Machine telemetry rooms — client subscribes to a specific machine
    socket.on("join:machine", (machineId) => {
      socket.join(`machine:${machineId}`);
      console.log(`[WS] ${email} joined machine:${machineId}`);
    });

    socket.on("leave:machine", (machineId) => {
      socket.leave(`machine:${machineId}`);
    });

    socket.on("disconnect", () => {
      console.log(`[WS] disconnected: ${email}`);
    });
  });

  return io;
}

module.exports = { createWebSocketServer };
