import { Types } from 'mongoose';

import { UserModel } from '@/models/User';

export async function createUser(data: { name: string; email: string; password: string }) {
  const user = await UserModel.create(data);
  return user.toObject();
}

export async function findUserByEmail(email: string) {
  return UserModel.findOne({ email }).select('+password').lean();
}

export async function findUserById(userId: string) {
  if (!Types.ObjectId.isValid(userId)) {
    return null;
  }
  return UserModel.findById(userId).lean();
}

export async function updateUserSettings(userId: string, preferences: Record<string, unknown>) {
  return UserModel.findByIdAndUpdate(
    userId,
    { preferences },
    {
      new: true,
      lean: true,
    },
  );
}

export async function updateUserPassword(userId: string, password: string) {
  return UserModel.findByIdAndUpdate(userId, { password }, { new: true, lean: true });
}
