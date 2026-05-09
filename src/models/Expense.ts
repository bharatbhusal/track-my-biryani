import { Schema, model, models, Types } from 'mongoose';

const expenseSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    categoryId: { type: Types.ObjectId, ref: 'Category', required: true, index: true },
    images: { type: [String], default: [] },
    location: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
      address: { type: String },
    },
    currency: { type: String, default: 'INR' },
    dateTime: { type: Date, required: true, index: true },
  },
  { timestamps: true },
);

expenseSchema.index({ userId: 1, title: 'text' });

export const ExpenseModel = models.Expense || model('Expense', expenseSchema);
