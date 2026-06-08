import mongoose, { Schema, Document } from "mongoose";

export interface ITable extends Document {
  restaurantId: mongoose.Types.ObjectId;
  tableNumber: string;
  capacity: number;
  qrCodeUrl: string;
  status: "available" | "occupied" | "awaiting_payment";
  currentOrderId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TableSchema: Schema = new Schema({
  restaurantId: {
    type: Schema.Types.ObjectId,
    ref: "Restaurant",
    required: true,
  },
  tableNumber: {
    type: String,
    required: true,
    trim: true,
  },
  capacity: {
    type: Number,
    required: true,
    min: 1,
  },
  qrCodeUrl: {
    type: String,
    default: "",
  },
  status: {
    type: String,
    enum: ["available", "occupied", "awaiting_payment"],
    default: "available",
  },
  currentOrderId: {
    type: Schema.Types.ObjectId,
    ref: "Order",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound unique index: tableNumber must be unique within a single restaurant
TableSchema.index({ restaurantId: 1, tableNumber: 1 }, { unique: true });

TableSchema.pre<ITable>("save", function () {
  this.updatedAt = new Date();
});

export const Table = mongoose.model<ITable>("Table", TableSchema);
export default Table;
