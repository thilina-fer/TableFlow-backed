import mongoose, { Schema, Document } from "mongoose";

export interface ISuperAdmin extends Document {
  name: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
}

const SuperAdminSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  passwordHash: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const SuperAdmin = mongoose.model<ISuperAdmin>("SuperAdmin", SuperAdminSchema);
export default SuperAdmin;
