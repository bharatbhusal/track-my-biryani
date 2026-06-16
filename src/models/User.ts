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
		password: { type: String, required: true, select: false },
	},
	{ timestamps: true },
);

export const UserModel =
	models.User || model("User", userSchema);
