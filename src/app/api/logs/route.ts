import { NextRequest } from "next/server";

import { getAuthPayload } from "@/lib/auth";
import {
	errorResponse,
	successResponse,
} from "@/lib/api-response";
import { parseCustomBound } from "@/lib/custom-range";
import { connectToDatabase } from "@/lib/db";
import { listAuditLogs } from "@/repositories/audit.repository";

function getDateRangeFromQuery(params: URLSearchParams): {
	from?: Date;
	to?: Date;
} {
	const now = new Date();
	const fromParam = params.get("from");
	const toParam = params.get("to");
	const preset = params.get("preset");

	if (fromParam && toParam) {
		const from = parseCustomBound(fromParam, "from");
		const to = parseCustomBound(toParam, "to");
		return { from, to };
	}

	if (preset === "this_week") {
		const from = new Date(now);
		from.setDate(now.getDate() - 6);
		from.setHours(0, 0, 0, 0);
		return { from, to: now };
	}

	if (preset === "this_year") {
		const from = new Date(now.getFullYear(), 0, 1);
		return { from, to: now };
	}

	const from = new Date(
		now.getFullYear(),
		now.getMonth(),
		1,
	);
	return { from, to: now };
}

export async function GET(request: NextRequest) {
	try {
		await connectToDatabase();
		const auth = await getAuthPayload();
		const page = Number(
			request.nextUrl.searchParams.get("page") ?? 1,
		);
		const limit = Number(
			request.nextUrl.searchParams.get("limit") ?? 10,
		);
		const action =
			request.nextUrl.searchParams.get("action") ?? undefined;
		const { from, to } = getDateRangeFromQuery(
			request.nextUrl.searchParams,
		);

		const logs = await listAuditLogs(
			auth.userId,
			page,
			limit,
			action,
			from,
			to,
		);
		return successResponse(logs);
	} catch (error) {
		return errorResponse(error);
	}
}
