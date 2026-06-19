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
import { createCategory } from "@/repositories/category.repository";
import type {
	LoginInput,
	SignupInput,
} from "@/lib/validators";

const DEFAULT_CATEGORIES = [
	{ name: "Food & Dining", emoji: "🍔", color: "#FF6B6B" },
	{ name: "Transportation", emoji: "🚗", color: "#4ECDC4" },
	{ name: "Shopping", emoji: "🛍️", color: "#FFE66D" },
	{ name: "Bills & Utilities", emoji: "📄", color: "#F38181" },
	{ name: "Entertainment", emoji: "🎬", color: "#95E1D3" },
];

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
	for (const cat of DEFAULT_CATEGORIES) {
		await createCategory({
			userId,
			name: cat.name,
			color: cat.color,
			emoji: cat.emoji,
		});
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
			"Invalid username or password",
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
			"Invalid username or password",
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
