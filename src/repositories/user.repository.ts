import { Types } from "mongoose";

import { UserModel } from "@/models/User";

export async function createUser(data: { name: string; username: string; password: string }) {
  const user = await UserModel.create(data);
  return user.toObject();
}

export async function findUserByUsername(username: string) {
  return UserModel.findOne({ username }).select("+password").lean();
}

export async function findUserById(userId: string) {
  if (!Types.ObjectId.isValid(userId)) {
    return null;
  }
  return UserModel.findById(userId).lean();
}

export async function updateUserPassword(userId: string, password: string) {
  return UserModel.findByIdAndUpdate(userId, { password }, { new: true, lean: true });
}
