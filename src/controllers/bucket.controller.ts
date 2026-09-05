import { NextRequest } from "next/server";

import { getAuthPayload } from "@/lib/auth";
import {
  acceptInviteService,
  acceptRequestService,
  createBucketService,
  declineInviteService,
  deleteBucketService,
  getBucketPreviewService,
  getBucketStatsService,
  inviteUserService,
  leaveBucketService,
  listBucketsService,
  listIncomingRequestsService,
  requestToJoinService,
  revokeInviteService,
  searchBucketsService,
  updateBucketService,
} from "@/services/bucket.service";

export async function searchBuckets(request: NextRequest) {
  const auth = await getAuthPayload();
  const body = await request.json();
  return searchBucketsService(auth.id, body);
}

export async function listBuckets() {
  const auth = await getAuthPayload();
  return listBucketsService(auth.id);
}

export async function createBucket(request: NextRequest) {
  const auth = await getAuthPayload();
  const body = await request.json();
  return createBucketService(auth.id, body);
}

export async function getBucketStats(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthPayload();
  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  return getBucketStatsService(auth.id, id, body);
}

export async function updateBucket(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthPayload();
  const { id } = await context.params;
  const body = await request.json();
  return updateBucketService(auth.id, id, body);
}

export async function deleteBucket(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthPayload();
  const { id } = await context.params;
  return deleteBucketService(auth.id, id);
}

export async function inviteUser(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthPayload();
  const { id } = await context.params;
  const body = await request.json();
  return inviteUserService(auth.id, id, body);
}

export async function acceptInvite(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthPayload();
  const { id } = await context.params;
  return acceptInviteService(auth.id, id);
}

export async function declineInvite(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthPayload();
  const { id } = await context.params;
  return declineInviteService(auth.id, id);
}

export async function leaveBucket(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthPayload();
  const { id } = await context.params;
  return leaveBucketService(auth.id, id);
}

export async function revokeInvite(
  _request: NextRequest,
  context: { params: Promise<{ id: string; userId: string }> },
) {
  const auth = await getAuthPayload();
  const { id, userId } = await context.params;
  return revokeInviteService(auth.id, id, userId);
}

export async function getBucketPreview(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthPayload();
  const { id } = await context.params;
  return getBucketPreviewService(auth.id, id);
}

export async function requestToJoin(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthPayload();
  const { id } = await context.params;
  return requestToJoinService(auth.id, id);
}

export async function listIncomingRequests() {
  const auth = await getAuthPayload();
  return listIncomingRequestsService(auth.id);
}

export async function acceptRequest(
  _request: NextRequest,
  context: { params: Promise<{ id: string; userId: string }> },
) {
  const auth = await getAuthPayload();
  const { id, userId } = await context.params;
  return acceptRequestService(auth.id, id, userId);
}
