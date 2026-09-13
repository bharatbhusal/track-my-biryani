import { Types } from "mongoose";

import { SettlementModel } from "@/models/Settlement";

export type SettlementDoc = {
  _id: Types.ObjectId;
  bucketId: Types.ObjectId;
  fromUserId: Types.ObjectId;
  toUserId: Types.ObjectId;
  amount: number;
  note?: string;
  confirmedBy: Types.ObjectId;
  confirmedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
};

export async function createSettlement(data: {
  bucketId: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  note?: string;
  confirmedBy: string;
  confirmedAt?: Date;
}) {
  const settlement = await SettlementModel.create({
    ...data,
    confirmedAt: data.confirmedAt ?? new Date(),
  });
  return settlement.toObject() as unknown as SettlementDoc;
}

export async function listSettlements(bucketId: string) {
  if (!Types.ObjectId.isValid(bucketId)) {
    return [];
  }
  return SettlementModel.find({ bucketId })
    .sort({ createdAt: 1 })
    .lean() as unknown as SettlementDoc[];
}

const settlementRepository = {
  createSettlement,
  listSettlements,
};

export default settlementRepository;
