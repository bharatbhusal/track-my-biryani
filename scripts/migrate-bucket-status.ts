// Idempotent backfill: legacy buckets predate the `status` field. Mongoose
// defaults apply on write, not read, so pre-migration docs would surface as
// "live" — including already-closed ones. Running this twice is a no-op.
// ponytail: @/lib/db pulls in @/config/env which imports "server-only" (resolved
// only by Next's bundler), so this script connects to mongoose directly.
import mongoose from "mongoose";

import { BucketModel } from "@/models/Bucket";

async function migrate() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required (set it in the environment before running)");
  }
  await mongoose.connect(databaseUrl, { bufferCommands: false });

  const closed = await BucketModel.updateMany(
    { closedAt: { $exists: true }, status: { $exists: false } },
    { $set: { status: "close" } },
  );
  const live = await BucketModel.updateMany(
    { status: { $exists: false } },
    { $set: { status: "live" } },
  );

  console.log(
    `[migrate-bucket-status] closed→close: ${closed.modifiedCount}, missing→live: ${live.modifiedCount}`,
  );
}

migrate()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("[migrate-bucket-status] failed:", error);
    process.exit(1);
  });