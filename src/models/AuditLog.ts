import { Schema, model, models, Types } from "mongoose";

const auditLogSchema = new Schema(
	{
		userId: {
			type: Types.ObjectId,
			ref: "User",
			required: true,
			index: true,
		},
		action: { type: String, required: true },
		entityType: { type: String, required: true },
		entityId: { type: String },
		metadata: { type: Schema.Types.Mixed, default: {} },
		timestamp: { type: Date, default: Date.now, index: true },
	},
	{ timestamps: false },
);

export const AuditLogModel =
	models.AuditLog || model("AuditLog", auditLogSchema);
