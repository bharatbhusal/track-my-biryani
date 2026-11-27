import { NextRequest } from "next/server";

import { successResponse, errorResponse } from "@/lib/api-response";
import { connectToDatabase } from "@/lib/db";
import userRepository from "@/repositories/user.repository";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username");
    if (!username) {
      return errorResponse(new Error("username is required"));
    }

    const normalized = username.trim().toLowerCase();
    const existing = await userRepository.findUserByUsername(normalized);
    return successResponse({ available: !existing });
  } catch (error) {
    return errorResponse(error);
  }
}
