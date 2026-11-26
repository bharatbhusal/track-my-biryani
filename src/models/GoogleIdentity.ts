import { Schema, model, models, Types } from "mongoose";

// Links a canonical User (via its immutable _id) to the stable Google identity key (sub).
// `sub` is the provider identity; `email` is only profile data, never the identity key.
const googleIdentitySchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", required: true },
    googleSub: { type: String, required: true },
    email: { type: String, lowercase: true, trim: true },
    emailVerified: { type: Boolean, default: false },
    linkedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

// One Google sub may belong to only one user; one user may hold only one Google identity.
googleIdentitySchema.index({ userId: 1 }, { unique: true });
googleIdentitySchema.index({ googleSub: 1 }, { unique: true });

export const GoogleIdentityModel =
  models.GoogleIdentity || model("GoogleIdentity", googleIdentitySchema);
