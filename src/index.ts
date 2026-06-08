import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { createServer } from "http";
import { connectDB } from "./config/db";
import { env } from "./config/env";
import { errorHandler } from "./middleware/errorHandler";
import superAdminAuthRouter from "./routes/superadmin/auth.routes";
import registerRouter from "./routes/public/register.routes";
import registrationsRouter from "./routes/superadmin/registrations.routes";

const app = express();
const httpServer = createServer(app);

// Middleware
app.use(helmet());
app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
app.use(morgan("dev"));
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.json({ success: true, message: "TableFlow API running" });
});

// Routes
app.use("/api/superadmin/auth", superAdminAuthRouter);
app.use("/api/register", registerRouter);
app.use("/api/superadmin/registrations", registrationsRouter);

// Error handler (last eke thiyanawa)
app.use(errorHandler);

const start = async () => {
  await connectDB();
  httpServer.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT}`);
  });
};

start();