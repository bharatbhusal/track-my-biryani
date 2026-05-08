import mongoose from 'mongoose';

const globalMongoose = globalThis as typeof globalThis & {
  mongoose?: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
};

if (!globalMongoose.mongoose) {
  globalMongoose.mongoose = { conn: null, promise: null };
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (globalMongoose.mongoose?.conn) {
    return globalMongoose.mongoose.conn;
  }

  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI is not configured');
  }

  if (!globalMongoose.mongoose?.promise) {
    globalMongoose.mongoose!.promise = mongoose.connect(uri, {
      bufferCommands: false,
    });
  }

  globalMongoose.mongoose!.conn = await globalMongoose.mongoose!.promise;
  return globalMongoose.mongoose!.conn;
}
