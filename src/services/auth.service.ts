import { AppError } from "@/lib/errors";
import {
	comparePassword,
	hashPassword,
	signToken,
} from "@/lib/auth";
import {
	createUser,
	findUserByUsername,
} from "@/repositories/user.repository";
import { createBucket } from "@/repositories/bucket.repository";
import { ensureCategoryInBucket } from "@/repositories/category.repository";
import { DEFAULT_CATEGORIES } from "@/lib/constants";
import type {
	LoginInput,
	SignupInput,
} from "@/lib/validators";

export async function registerUser(
	input: SignupInput,
): Promise<{
	token: string;
	user: { id: string; name: string; username: string };
}> {
	const existing = await findUserByUsername(input.username);
	if (existing) {
		throw new AppError(
			"Username already in use",
			409,
			"EMAIL_EXISTS",
		);
	}

	const password = await hashPassword(input.password);
	const user = await createUser({
		name: input.name,
		username: input.username,
		password,
	});

	const userId = user._id.toString();

	const personalBucket = await createBucket({
		name: "Personal",
		icon: "📁",
		ownerId: userId,
		isPersonal: true,
		members: [
			{
				userId,
				role: "owner",
				status: "accepted",
				joinedAt: new Date(),
			},
		],
	});
	const bucketId = personalBucket._id.toString();

	for (const cat of DEFAULT_CATEGORIES) {
		await ensureCategoryInBucket(userId, bucketId, cat);
	}

	const token = signToken({
		userId,
		username: user.username,
	});

	return {
		token,
		user: {
			id: userId,
			name: user.name,
			username: user.username,
		},
	};
}

export async function loginUser(
	input: LoginInput,
): Promise<{
	token: string;
	user: { id: string; name: string; username: string };
}> {
	const user = await findUserByUsername(input.username);
	if (!user?.password) {
		throw new AppError(
			"User doesn't exist",
			401,
			"INVALID_CREDENTIALS",
		);
	}

	const isValid = await comparePassword(
		input.password,
		user.password,
	);
	if (!isValid) {
		throw new AppError(
			"Incorrect username or password",
			401,
			"INVALID_CREDENTIALS",
		);
	}

	const token = signToken({
		userId: user._id.toString(),
		username: user.username,
	});

	return {
		token,
		user: {
			id: user._id.toString(),
			name: user.name,
			username: user.username,
		},
	};
}
