import { Schema, model, models } from "mongoose";

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    // Google-only users have no password; legacy users retain their bcrypt hash.
    password: { type: String, select: false },
  },
  { timestamps: true },
);

export const UserModel = models.User || model("User", userSchema);
