import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { AppError } from '@/lib/errors';

export function successResponse<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ success: true, data }, { status });
}

export function errorResponse(error: unknown): NextResponse {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: error.flatten(),
        },
      },
      { status: 400 },
    );
  }

  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message,
          code: error.code,
          details: error.details,
        },
      },
      { status: error.statusCode },
    );
  }

  const message = error instanceof Error ? error.message : 'Something went wrong';
  return NextResponse.json(
    {
      success: false,
      error: {
        message,
      },
    },
    { status: 500 },
  );
}
