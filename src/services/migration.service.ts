import { CategoryModel } from "@/models/Category";
import { ExpenseModel } from "@/models/Expense";

const LEGACY_CATEGORY_INDEX = "userId_1_name_1";
const DEFAULT_CATEGORY_COLOR = "#6b7280";

export async function runBucketMigration(userId: string): Promise<{
	migratedCategories: number;
	migratedExpenses: number;
}> {
	// 1. Drop the legacy unique index that collides with shared buckets.
	try {
		await CategoryModel.collection.dropIndex(
			LEGACY_CATEGORY_INDEX,
		);
	} catch {
		// Ignore: index already absent.
	}

	// 2. Ensure the partial unique index (bucketId + name) exists.
	await CategoryModel.collection.createIndex(
		{ bucketId: 1, name: 1 },
		{
			unique: true,
			partialFilterExpression: {
				bucketId: { $type: "objectId" },
			},
		},
	);

	// 3. Backfill bucketId: null on legacy docs missing the field.
	const [categories, expenses] = await Promise.all([
		CategoryModel.updateMany(
			{ userId, bucketId: { $exists: false } },
			{ $set: { bucketId: null } },
		),
		ExpenseModel.updateMany(
			{ userId, bucketId: { $exists: false } },
			{ $set: { bucketId: null } },
		),
	]);

	// 4. Remap personal expenses onto personal-bucket categories.
	const personalExpenses = await ExpenseModel.find({
		userId,
		bucketId: null,
	})
		.select("categoryId")
		.lean();

	const categoryIds = [
		...new Set(
			personalExpenses
				.map((e) => e.categoryId?.toString())
				.filter((id): id is string => Boolean(id)),
		),
	];

	let createdCategories = 0;
	let remappedExpenses = 0;
	for (const categoryId of categoryIds) {
		const category = await CategoryModel.findById(categoryId).lean();
		if (category && category.bucketId === null) {
			// Already a personal category — nothing to remap.
			continue;
		}

		const name = category?.name ?? "Miscellaneous";
		const target =
			(await CategoryModel.findOne({
				userId,
				bucketId: null,
				name,
			}).lean()) ??
			(await CategoryModel.create({
				userId,
				bucketId: null,
				name,
				// ponytail: color is required by the schema; a deleted category
				// has no color to copy, so fall back to a neutral default.
				color: category?.color ?? DEFAULT_CATEGORY_COLOR,
				emoji: category?.emoji,
			}).then((doc) => {
				createdCategories += 1;
				return doc.toObject();
			}));

		const result = await ExpenseModel.updateMany(
			{ userId, bucketId: null, categoryId },
			{ $set: { categoryId: target._id } },
		);
		remappedExpenses += result.modifiedCount;
	}

	return {
		migratedCategories: categories.modifiedCount + createdCategories,
		migratedExpenses: expenses.modifiedCount + remappedExpenses,
	};
}
