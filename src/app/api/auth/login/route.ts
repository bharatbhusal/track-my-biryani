import { NextRequest } from 'next/server';

import { loginController } from '@/controllers/auth.controller';
import { errorResponse, successResponse } from '@/lib/api-response';

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const user = await loginController(payload);
    return successResponse(user);
  } catch (error) {
    return errorResponse(error);
  }
}
