import { Types } from "mongoose";

import { GoogleIdentityModel } from "@/models/GoogleIdentity";

// Atomic, conditional write so two concurrent link attempts cannot both succeed.
// On unique-index violation (duplicate googleSub or userId) the caller rejects with 409.
async function setUserGoogleIdentity(
  userId: string,
  fields: { googleSub: string; email?: string; emailVerified: boolean },
) {
  const userObjectId = new Types.ObjectId(userId);
  const result = await GoogleIdentityModel.updateOne(
    { userId: userObjectId },
    {
      $set: {
        googleSub: fields.googleSub,
        email: fields.email || null,
        emailVerified: fields.emailVerified,
        linkedAt: new Date(),
      },
    },
    { upsert: true },
  );
  const identity = await GoogleIdentityModel.findOne({ userId: userObjectId }).lean();
  return { matchedCount: result.matchedCount, upsertedCount: result.upsertedCount, identity };
}

async function findByIdentity(googleSub: string) {
  return GoogleIdentityModel.findOne({ googleSub }).lean();
}

async function findByUserId(userId: string) {
  if (!Types.ObjectId.isValid(userId)) {
    return null;
  }
  return GoogleIdentityModel.findOne({ userId: new Types.ObjectId(userId) }).lean();
}

async function deleteByUserId(userId: string) {
  return GoogleIdentityModel.deleteOne({ userId: new Types.ObjectId(userId) });
}

const googleIdentityRepository = {
  setUserGoogleIdentity,
  findByIdentity,
  findByUserId,
  deleteByUserId,
};

export default googleIdentityRepository;
