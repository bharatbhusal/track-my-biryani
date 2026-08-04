import { AuditLogModel } from "@/models/AuditLog";

export async function createAuditLog(input: {
	actorId: string;
	bucketId?: string;
	action: string;
	entity: string;
	entityId?: string;
	note?: string;
	metadata?: Record<string, unknown>;
}) {
	const log = await AuditLogModel.create({
		...input,
		timestamp: new Date(),
		metadata: input.metadata ?? {},
	});

	return log.toObject();
}

export async function listAuditLogs(
	userId: string,
	bucketId?: string,
	page = 1,
	limit = 30,
	sortBy: "timestamp" | "action" | "entity" = "timestamp",
	order: "asc" | "desc" = "desc",
) {
	const query: Record<string, unknown> = {};
	if (bucketId) {
		query.bucketId = bucketId;
	}

	const skip = (page - 1) * limit;

	const [logs, total] = await Promise.all([
		AuditLogModel.find(query)
			.sort({ [sortBy]: order === "asc" ? 1 : -1 })
			.skip(skip)
			.limit(limit)
			.populate("actorId", "name username")
			.populate("bucketId", "name icon")
			.lean(),
		AuditLogModel.countDocuments(query),
	]);

	const items = logs.map((log) => {
		const actor = log.actorId as
			| { name?: string; username?: string }
			| null
			| undefined;
		const bucket = log.bucketId as
			| { name?: string; icon?: string }
			| null
			| undefined;

		return {
			_id: log._id,
			action: log.action,
			entity: log.entity,
			...(log.entityId ? { entityId: log.entityId } : {}),
			...(log.note ? { note: log.note } : {}),
			metadata: log.metadata,
			timestamp: log.timestamp,
			...(actor?.name ? { actorName: actor.name } : {}),
			...(actor?.username
				? { actorUsername: actor.username }
				: {}),
			...(bucket?.name ? { bucketName: bucket.name } : {}),
			...(bucket?.icon ? { bucketIcon: bucket.icon } : {}),
		};
	});

	return {
		items,
		total,
		page,
		totalPages: Math.ceil(total / limit) || 1,
	};
}
