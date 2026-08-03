import { CategoryModel } from "@/models/Category";
import { ExpenseModel } from "@/models/Expense";

const LEGACY_CATEGORY_INDEX = "userId_1_name_1";

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

	return {
		migratedCategories: categories.modifiedCount,
		migratedExpenses: expenses.modifiedCount,
	};
}
