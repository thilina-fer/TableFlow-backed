declare namespace Express {
  interface Request {
    user?: {
      userId: string;
      role: "admin" | "kitchen" | "waiter" | "cashier";
      restaurantId: string;
      isFirstLogin: boolean;
    };
    superAdmin?: {
      superAdminId: string;
    };
  }
}