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
import staffAuthRouter from "./routes/restaurant/auth.routes";
import categoriesRouter from "./routes/restaurant/category.routes";
import { adminMenuRouter, publicMenuRouter } from "./routes/restaurant/menuItem.routes";
import tablesRouter from "./routes/restaurant/table.routes";
import staffRouter from "./routes/restaurant/staff.routes";

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
app.use("/api/auth", staffAuthRouter);
app.use("/api/admin/categories", categoriesRouter);
app.use("/api/admin/menu", adminMenuRouter);
app.use("/api", publicMenuRouter);
app.use("/api/tables", tablesRouter);
app.use("/api/admin/staff", staffRouter);

// Error handler (last eke thiyanawa)
app.use(errorHandler);

const start = async () => {
  await connectDB();
  httpServer.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT}`);
  });
};

start();