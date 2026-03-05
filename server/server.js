import http from "http";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { Server } from "socket.io";

import app from "./app.js";
import { connectDatabase } from "./config/db.js";
import { setIo } from "./services/socketService.js";

dotenv.config();

const basePort = Number(process.env.PORT || 8000);
const maxPortRetries = Number(process.env.PORT_RETRY_COUNT || 10);
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: String(process.env.FRONTEND_ORIGIN || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    credentials: true,
  },
});

setIo(io);

io.use((socket, next) => {
  const tokenFromAuth = socket.handshake.auth?.token;
  const tokenFromHeader = String(socket.handshake.headers?.authorization || "").startsWith("Bearer ")
    ? String(socket.handshake.headers.authorization).slice(7)
    : null;

  const token = tokenFromAuth || tokenFromHeader;
  if (!token) return next(new Error("Unauthorized"));

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || "dev_secret");
    socket.userId = String(payload.id);
    return next();
  } catch (_err) {
    return next(new Error("Unauthorized"));
  }
});

io.on("connection", (socket) => {
  if (socket.userId) {
    socket.join(`user:${socket.userId}`);
  }
});

function tryListen(port) {
  return new Promise((resolve, reject) => {
    const onError = (error) => {
      server.off("listening", onListening);
      reject(error);
    };

    const onListening = () => {
      server.off("error", onError);
      resolve(port);
    };

    server.once("error", onError);
    server.once("listening", onListening);
    server.listen(port);
  });
}

async function startWithPortRetry(startPort) {
  let currentPort = startPort;

  for (let attempt = 0; attempt <= maxPortRetries; attempt += 1) {
    try {
      const activePort = await tryListen(currentPort);
      console.log(`Server listening on port ${activePort}`);
      return;
    } catch (error) {
      if (error?.code === "EADDRINUSE" && attempt < maxPortRetries) {
        const nextPort = currentPort + 1;
        console.warn(`Port ${currentPort} is already in use. Retrying on port ${nextPort}...`);
        currentPort = nextPort;
        continue;
      }
      throw error;
    }
  }
}

connectDatabase()
  .then(async () => {
    await startWithPortRetry(basePort);
  })
  .catch((error) => {
    console.error("Failed to start server:", error);
    process.exit(1);
  });
