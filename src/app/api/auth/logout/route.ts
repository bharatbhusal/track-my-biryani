import { clearAuthCookie, getAuthPayload } from '@/lib/auth';
import { errorResponse, successResponse } from '@/lib/api-response';
import { connectToDatabase } from '@/lib/db';
import { logAuditEvent } from '@/services/audit.service';

export async function POST() {
  try {
    await connectToDatabase();
    const auth = await getAuthPayload();
    await clearAuthCookie();
    await logAuditEvent({
      userId: auth.userId,
      action: 'logout',
      entityType: 'auth',
    });
    return successResponse({ message: 'Logged out' });
  } catch (error) {
    return errorResponse(error);
  }
}
