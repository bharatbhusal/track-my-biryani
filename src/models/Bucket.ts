import { Schema, model, models, Types } from "mongoose";

const bucketMemberSchema = new Schema(
  {
    userId: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      enum: ["owner", "member"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted"],
      required: true,
    },
    invitedBy: {
      type: Types.ObjectId,
      ref: "User",
    },
    invitedAt: { type: Date },
    joinedAt: { type: Date },
    upiId: { type: String },
  },
  { _id: false },
);

const bucketSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    icon: { type: String, default: "📁", trim: true },
    ownerId: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    isPersonal: { type: Boolean, default: false, index: true },
    members: {
      type: [bucketMemberSchema],
      default: [],
    },
    closedAt: { type: Date },
    shareConfiguration: { type: Map, of: Number },
  },
  { timestamps: true },
);

bucketSchema.index({ "members.userId": 1 });

export const BucketModel = models.Bucket || model("Bucket", bucketSchema);
