import mongoose, { Schema, Document } from "mongoose";

export interface IPayment extends Document {
  restaurantId: mongoose.Types.ObjectId;
  orderId: mongoose.Types.ObjectId;
  amount: number;
  paymentMethod: "card" | "cash";
  status: "pending" | "succeeded" | "failed";
  stripePaymentIntentId?: string;
  stripeEventId?: string;
  rawStripeData?: any;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema: Schema = new Schema(
  {
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ["card", "cash"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "succeeded", "failed"],
      required: true,
      default: "pending",
    },
    stripePaymentIntentId: {
      type: String,
    },
    stripeEventId: {
      type: String,
    },
    rawStripeData: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

export const Payment = mongoose.model<IPayment>("Payment", PaymentSchema);
export default Payment;
