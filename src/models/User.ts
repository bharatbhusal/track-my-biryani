import { Schema, model, models } from 'mongoose';

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    preferences: {
      locale: { type: String, default: 'en-IN' },
      currency: { type: String, default: 'INR' },
      timezone: { type: String, default: 'Asia/Kolkata' },
      theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
      hapticFeedback: { type: Boolean, default: true },
    },
  },
  { timestamps: true },
);

export const UserModel = models.User || model('User', userSchema);
