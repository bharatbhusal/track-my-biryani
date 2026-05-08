import { NextRequest } from 'next/server';

import { getAuthPayload } from '@/lib/auth';
import { errorResponse, successResponse } from '@/lib/api-response';
import { connectToDatabase } from '@/lib/db';
import { listAuditLogs } from '@/repositories/audit.repository';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const auth = await getAuthPayload();
    const page = Number(request.nextUrl.searchParams.get('page') ?? 1);
    const limit = Number(request.nextUrl.searchParams.get('limit') ?? 10);
    const action = request.nextUrl.searchParams.get('action') ?? undefined;

    const logs = await listAuditLogs(auth.userId, page, limit, action);
    return successResponse(logs);
  } catch (error) {
    return errorResponse(error);
  }
}
