import { Schema, model, models, Types } from "mongoose";

const categorySchema = new Schema(
  {
    userId: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    bucketId: {
      type: Types.ObjectId,
      ref: "Bucket",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    color: { type: String, required: true },
    emoji: { type: String, default: "🏷️" },
  },
  { timestamps: true },
);

categorySchema.index({ bucketId: 1, name: 1 }, { unique: true });

export const CategoryModel = models.Category || model("Category", categorySchema);
