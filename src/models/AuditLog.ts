import { Schema, model, models, Types } from "mongoose";

const auditLogSchema = new Schema(
	{
		actorId: {
			type: Types.ObjectId,
			ref: "User",
			required: true,
			index: true,
		},
		bucketId: {
			type: Types.ObjectId,
			ref: "Bucket",
			index: true,
		},
		action: { type: String, required: true },
		entity: { type: String, required: true },
		entityId: { type: String },
		note: { type: String, default: "" },
		metadata: { type: Schema.Types.Mixed, default: {} },
		timestamp: { type: Date, default: Date.now, index: true },
	},
	{ timestamps: false },
);

export const AuditLogModel =
	models.AuditLog || model("AuditLog", auditLogSchema);
