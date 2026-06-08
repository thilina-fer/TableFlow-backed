import { AuditLog } from "../models/AuditLog.model";
import mongoose from "mongoose";

export const createAuditLog = async (
  action: string,
  targetRestaurantId: string,
  targetRestaurantName: string,
  performedBy: string,
  reason?: string
): Promise<void> => {
  try {
    await AuditLog.create({
      action,
      targetRestaurantId: new mongoose.Types.ObjectId(targetRestaurantId),
      targetRestaurantName,
      performedBy: new mongoose.Types.ObjectId(performedBy),
      reason,
    });
    console.log(`📝 Audit log successfully created for action "${action}" on restaurant "${targetRestaurantName}"`);
  } catch (error) {
    console.error("❌ Failed to create audit log:", error);
  }
};
