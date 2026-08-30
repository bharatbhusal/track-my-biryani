import { Schema, model, models, Types } from "mongoose";

const budgetSchema = new Schema(
  {
    bucketId: {
      type: Types.ObjectId,
      ref: "Bucket",
      required: true,
      index: true,
    },
    categoryId: {
      type: Types.ObjectId,
      ref: "Category",
      default: null,
      index: true,
    },
    ownerId: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    amount: { type: Number, required: true, min: 0 },
    period: {
      type: String,
      enum: ["weekly", "monthly", "yearly"],
      required: true,
    },
  },
  { timestamps: true },
);

// one budget per bucket + period + category (null = bucket-level)
budgetSchema.index({ bucketId: 1, period: 1, categoryId: 1 }, { unique: true });

export const BudgetModel = models.Budget || model("Budget", budgetSchema);
