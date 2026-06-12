import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import { verifyAccessToken } from "../utils/jwt";
import { env } from "../config/env";

export let io: Server;

export const initSocket = (httpServer: HttpServer): void => {
  io = new Server(httpServer, {
    cors: {
      origin: [env.FRONTEND_URL, "http://localhost:5173", "http://127.0.0.1:5173"],
      credentials: true,
    },
  });

  // Authentication Middleware on Handshake
  io.use((socket, next) => {
    const token = socket.handshake.query.token as string | undefined;
    if (!token) {
      // Unauthenticated client (customer scanning QR)
      return next();
    }

    try {
      const decoded = verifyAccessToken(token);
      socket.data.user = decoded; // { userId, role, restaurantId, isFirstLogin }
      next();
    } catch (error) {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    // If staff connection
    if (socket.data.user) {
      const { restaurantId, role } = socket.data.user;
      const room = `restaurant:${restaurantId}:${role}`;
      socket.join(room);
      console.log(`🔌 Staff connected: Role "${role}" joined restaurant room "${room}"`);
    } else {
      console.log(`🔌 Customer connected: Socket ID "${socket.id}"`);
    }

    // Join room for active orders tracking
    socket.on("join_order_room", ({ orderId }) => {
      if (orderId) {
        socket.join(`order:${orderId}`);
        console.log(`📦 Socket "${socket.id}" joined order room "order:${orderId}"`);
      }
    });

    socket.on("disconnect", () => {
      console.log(`🔌 Socket disconnected: "${socket.id}"`);
    });
  });
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
};
