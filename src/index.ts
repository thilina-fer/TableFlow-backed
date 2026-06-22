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
import uploadRouter from "./routes/public/upload.routes";
import registrationsRouter from "./routes/superadmin/registrations.routes";
import superadminAnalyticsRouter from "./routes/superadmin/analytics.routes";
import superadminRestaurantsRouter from "./routes/superadmin/restaurants.routes";
import superadminAuditLogRouter from "./routes/superadmin/auditLog.routes";
import staffAuthRouter from "./routes/restaurant/auth.routes";
import categoriesRouter from "./routes/restaurant/category.routes";
import { adminMenuRouter, publicMenuRouter } from "./routes/restaurant/menuItem.routes";
import tablesRouter from "./routes/restaurant/table.routes";
import staffRouter from "./routes/restaurant/staff.routes";
import orderPublicRouter from "./routes/public/order.routes";
import paymentPublicRouter from "./routes/public/payment.routes";
import kitchenRouter from "./routes/restaurant/kitchen.routes";
import waiterRouter from "./routes/restaurant/waiter.routes";
import cashierRouter from "./routes/restaurant/cashier.routes";
import analyticsRouter from "./routes/restaurant/analytics.routes";
import onboardingRouter from "./routes/restaurant/onboarding.routes";
import { initSocket } from "./sockets/socket";

const app = express();
const httpServer = createServer(app);
initSocket(httpServer);

// Middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({ origin: [env.FRONTEND_URL, "http://localhost:5173", "http://127.0.0.1:5173"], credentials: true }));
app.use(morgan("dev"));
// stripe webhook demands raw payload for signature verification
app.use("/api/payment/webhook", express.raw({ type: "application/json" }));
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.json({ success: true, message: "TableFlow API running" });
});

// Routes
app.use("/api/superadmin/auth", superAdminAuthRouter);
app.use("/api/register", registerRouter);
app.use("/api/upload", uploadRouter);
app.use("/api/superadmin/registrations", registrationsRouter);
app.use("/api/superadmin/analytics", superadminAnalyticsRouter);
app.use("/api/superadmin/restaurants", superadminRestaurantsRouter);
app.use("/api/superadmin/audit-log", superadminAuditLogRouter);
app.use("/api/auth", staffAuthRouter);
app.use("/api/admin/categories", categoriesRouter);
app.use("/api/admin/menu", adminMenuRouter);
app.use("/api/admin/analytics", analyticsRouter);
app.use("/api", publicMenuRouter);
app.use("/api/tables", tablesRouter);
app.use("/api/admin/staff", staffRouter);
app.use("/api/orders", orderPublicRouter);
app.use("/api/payment", paymentPublicRouter);
app.use("/api/kitchen", kitchenRouter);
app.use("/api/waiter", waiterRouter);
app.use("/api/cashier", cashierRouter);
app.use("/api/admin/onboarding", onboardingRouter);

// Error handler (last eke thiyanawa)
app.use(errorHandler);

const start = async () => {
  await connectDB();
  httpServer.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT}`);
  });
};

start();