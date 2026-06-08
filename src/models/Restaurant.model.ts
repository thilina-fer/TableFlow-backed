import mongoose, { Schema, Document } from "mongoose";

export interface IRestaurant extends Document {
  name: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  address: string;
  city: string;
  restaurantType: "Fine Dining" | "Fast Food" | "Café" | "Bakery" | "Other";
  description: string;
  logoUrl?: string;
  coverImageUrl?: string;
  status: "pending" | "approved" | "rejected" | "suspended";
  isActive: boolean;
  suspensionReason?: string;
  rejectionReason?: string;
  approvedAt?: Date;
  approvedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const RestaurantSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  ownerName: {
    type: String,
    required: true,
    trim: true,
  },
  ownerEmail: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  ownerPhone: {
    type: String,
    required: true,
    trim: true,
  },
  address: {
    type: String,
    required: true,
    trim: true,
  },
  city: {
    type: String,
    required: true,
    trim: true,
  },
  restaurantType: {
    type: String,
    enum: ["Fine Dining", "Fast Food", "Café", "Bakery", "Other"],
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  logoUrl: {
    type: String,
  },
  coverImageUrl: {
    type: String,
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected", "suspended"],
    default: "pending",
  },
  isActive: {
    type: Boolean,
    default: false,
  },
  suspensionReason: {
    type: String,
  },
  rejectionReason: {
    type: String,
  },
  approvedAt: {
    type: Date,
  },
  approvedBy: {
    type: Schema.Types.ObjectId,
    ref: "SuperAdmin",
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

RestaurantSchema.pre<IRestaurant>("save", function () {
  this.updatedAt = new Date();
});

export const Restaurant = mongoose.model<IRestaurant>("Restaurant", RestaurantSchema);
export default Restaurant;
