import { AuditLogModel } from "@/models/AuditLog";

export async function createAuditLog(data: {
	userId: string;
	action: string;
	entityType: string;
	entityId?: string;
	metadata?: Record<string, unknown>;
}) {
	const log = await AuditLogModel.create({
		...data,
		timestamp: new Date(),
		metadata: data.metadata ?? {},
	});

	return log.toObject();
}

export async function listAuditLogs(
	userId: string,
	page = 1,
	limit = 10,
	action?: string,
	from?: Date,
	to?: Date,
) {
	const query: Record<string, unknown> = { userId };
	if (action) {
		query.action = action;
	}
	if (from || to) {
		query.timestamp = {
			...(from ? { $gte: from } : {}),
			...(to ? { $lte: to } : {}),
		};
	}

	const skip = (page - 1) * limit;

	const [items, total] = await Promise.all([
		AuditLogModel.find(query)
			.sort({ timestamp: -1 })
			.skip(skip)
			.limit(limit)
			.lean(),
		AuditLogModel.countDocuments(query),
	]);

	return {
		items,
		total,
		page,
		totalPages: Math.ceil(total / limit) || 1,
	};
}
