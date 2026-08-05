import { NextRequest } from "next/server";

import { getAuthPayload } from "@/lib/auth";
import {
	acceptInviteService,
	createBucketService,
	declineInviteService,
	deleteBucketService,
	getBucketService,
	inviteUserService,
	leaveBucketService,
	listBucketsService,
	revokeInviteService,
	updateBucketService,
} from "@/services/bucket.service";

export async function listBuckets() {
	const auth = await getAuthPayload();
	return listBucketsService(auth.userId);
}

export async function createBucket(request: NextRequest) {
	const auth = await getAuthPayload();
	const body = await request.json();
	return createBucketService(auth.userId, body);
}

export async function getBucket(
	_request: NextRequest,
	context: { params: Promise<{ id: string }> },
) {
	const auth = await getAuthPayload();
	const { id } = await context.params;
	return getBucketService(auth.userId, id);
}

export async function updateBucket(
	request: NextRequest,
	context: { params: Promise<{ id: string }> },
) {
	const auth = await getAuthPayload();
	const { id } = await context.params;
	const body = await request.json();
	return updateBucketService(auth.userId, id, body);
}

export async function deleteBucket(
	_request: NextRequest,
	context: { params: Promise<{ id: string }> },
) {
	const auth = await getAuthPayload();
	const { id } = await context.params;
	return deleteBucketService(auth.userId, id);
}

export async function inviteUser(
	request: NextRequest,
	context: { params: Promise<{ id: string }> },
) {
	const auth = await getAuthPayload();
	const { id } = await context.params;
	const body = await request.json();
	return inviteUserService(auth.userId, id, body);
}

export async function acceptInvite(
	_request: NextRequest,
	context: { params: Promise<{ id: string }> },
) {
	const auth = await getAuthPayload();
	const { id } = await context.params;
	return acceptInviteService(auth.userId, id);
}

export async function declineInvite(
	_request: NextRequest,
	context: { params: Promise<{ id: string }> },
) {
	const auth = await getAuthPayload();
	const { id } = await context.params;
	return declineInviteService(auth.userId, id);
}

export async function leaveBucket(
	_request: NextRequest,
	context: { params: Promise<{ id: string }> },
) {
	const auth = await getAuthPayload();
	const { id } = await context.params;
	return leaveBucketService(auth.userId, id);
}

export async function revokeInvite(
	_request: NextRequest,
	context: { params: Promise<{ id: string; userId: string }> },
) {
	const auth = await getAuthPayload();
	const { id, userId } = await context.params;
	return revokeInviteService(auth.userId, id, userId);
}
