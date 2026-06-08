import mongoose, { Schema, Document } from "mongoose";

export interface ICategory extends Document {
  restaurantId: mongoose.Types.ObjectId;
  name: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema: Schema = new Schema({
  restaurantId: {
    type: Schema.Types.ObjectId,
    ref: "Restaurant",
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  displayOrder: {
    type: Number,
    required: true,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
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

CategorySchema.pre<ICategory>("save", function () {
  this.updatedAt = new Date();
});

export const Category = mongoose.model<ICategory>("Category", CategorySchema);
export default Category;
