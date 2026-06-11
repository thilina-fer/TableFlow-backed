import mongoose, { Schema, Document } from "mongoose";

export interface IOrderItem {
  menuItemId: mongoose.Types.ObjectId;
  name: string;
  variantName?: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface IOrder extends Document {
  restaurantId: mongoose.Types.ObjectId;
  tableId: mongoose.Types.ObjectId;
  items: IOrderItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  paymentMethod: "cash" | "card";
  paymentStatus: "pending" | "paid" | "failed";
  status: "placed" | "preparing" | "completed" | "delivered" | "rejected";
  assignedWaiterId?: mongoose.Types.ObjectId;
  rejectionReason?: string;
  billPdfUrl?: string;
  stripePaymentIntentId?: string;
  specialNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema({
  menuItemId: {
    type: Schema.Types.ObjectId,
    ref: "MenuItem",
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  variantName: {
    type: String,
  },
  quantity: {
    type: Number,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  subtotal: {
    type: Number,
    required: true,
  },
});

const OrderSchema: Schema = new Schema({
  restaurantId: {
    type: Schema.Types.ObjectId,
    ref: "Restaurant",
    required: true,
  },
  tableId: {
    type: Schema.Types.ObjectId,
    ref: "Table",
    required: true,
  },
  items: {
    type: [OrderItemSchema],
    required: true,
  },
  subtotal: {
    type: Number,
    required: true,
  },
  taxAmount: {
    type: Number,
    required: true,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  paymentMethod: {
    type: String,
    enum: ["cash", "card"],
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: ["pending", "paid", "failed"],
    default: "pending",
  },
  status: {
    type: String,
    enum: ["placed", "preparing", "completed", "delivered", "rejected"],
    default: "placed",
  },
  assignedWaiterId: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  rejectionReason: {
    type: String,
  },
  billPdfUrl: {
    type: String,
  },
  stripePaymentIntentId: {
    type: String,
  },
  specialNote: {
    type: String,
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

OrderSchema.pre<IOrder>("save", function () {
  this.updatedAt = new Date();
});

export const Order = mongoose.model<IOrder>("Order", OrderSchema);
export default Order;
