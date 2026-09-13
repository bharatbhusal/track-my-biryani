import { Schema, model, models, Types } from "mongoose";

const settlementSchema = new Schema(
  {
    bucketId: {
      type: Types.ObjectId,
      ref: "Bucket",
      required: true,
      index: true,
    },
    fromUserId: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    toUserId: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    note: { type: String },
    confirmedBy: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    confirmedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

settlementSchema.index({ bucketId: 1, fromUserId: 1, toUserId: 1 });

export const SettlementModel = models.Settlement || model("Settlement", settlementSchema);
