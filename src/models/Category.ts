import { Schema, model, models, Types } from 'mongoose';

const categorySchema = new Schema(
	{
		userId: { type: Types.ObjectId, ref: 'User', required: true, index: true },
		name: { type: String, required: true, trim: true },
		color: { type: String, required: true },
		emoji: { type: String, default: "🏷️" },
	},
  { timestamps: true },
);

categorySchema.index({ userId: 1, name: 1 }, { unique: true });

export const CategoryModel = models.Category || model('Category', categorySchema);
