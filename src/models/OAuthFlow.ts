import { Schema, model, models } from "mongoose";

// One-time, time-bound OAuth flow (Google sign-in or account linking).
// The state value is the CSRF token echoed back by Google and is single-use.
const oauthFlowSchema = new Schema(
  {
    state: { type: String, required: true, unique: true },
    purpose: { type: String, enum: ["login", "link"], required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    nonce: { type: String, required: true },
    codeVerifier: { type: String, required: true },
    redirectPath: { type: String },
    expiresAt: { type: Date },
  },
  { timestamps: true },
);

oauthFlowSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 600 });

export const OAuthFlowModel = models.OAuthFlow || model("OAuthFlow", oauthFlowSchema);
