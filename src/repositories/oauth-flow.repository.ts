import { OAuthFlowModel } from "@/models/OAuthFlow";

async function create(data: {
  state: string;
  purpose: "login" | "link";
  userId?: string;
  nonce: string;
  codeVerifier: string;
  redirectPath?: string;
  expiresAt: Date;
}) {
  const flow = await OAuthFlowModel.create(data);
  return flow.toObject();
}

async function findByState(state: string) {
  return OAuthFlowModel.findOne({ state }).lean();
}

async function deleteByState(state: string) {
  return OAuthFlowModel.deleteOne({ state });
}

const oauthFlowRepository = {
  create,
  findByState,
  deleteByState,
};

export default oauthFlowRepository;
