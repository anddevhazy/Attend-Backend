import mongoose from 'mongoose';

const RefreshTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    userType: {
      type: String,
      enum: ['student', 'lecturer'],
      required: true,
      index: true,
    },

    // device binding
    deviceId: { type: String, default: null, index: true },

    // unique token id (for rotation/revocation)
    jti: { type: String, required: true, unique: true, index: true },

    // store hashed refresh token, not the raw token
    tokenHash: { type: String, required: true },

    revokedAt: { type: Date, default: null },
    expiresAt: { type: Date, required: true, index: true },
  },
  { timestamps: true }
);

// TTL cleanup (Mongo will delete expired docs automatically)
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('RefreshToken', RefreshTokenSchema);
