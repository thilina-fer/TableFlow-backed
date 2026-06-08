import mongoose, { Schema, Document } from "mongoose";

export interface IAuditLog extends Document {
  action: string;
  targetRestaurantId: mongoose.Types.ObjectId;
  targetRestaurantName: string;
  performedBy: mongoose.Types.ObjectId;
  reason?: string;
  createdAt: Date;
}

const AuditLogSchema: Schema = new Schema({
  action: {
    type: String,
    required: true,
  },
  targetRestaurantId: {
    type: Schema.Types.ObjectId,
    ref: "Restaurant",
    required: true,
  },
  targetRestaurantName: {
    type: String,
    required: true,
  },
  performedBy: {
    type: Schema.Types.ObjectId,
    ref: "SuperAdmin",
    required: true,
  },
  reason: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const AuditLog = mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);
export default AuditLog;
