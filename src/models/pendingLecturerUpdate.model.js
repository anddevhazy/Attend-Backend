import mongoose from 'mongoose';

const PendingLecturerUpdateSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    email: { type: String, required: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    department: { type: String, required: true },
    faculty: { type: String, required: true },
    verificationToken: { type: String, required: true },
    expiresAt: { type: Date, required: true, expires: '24h' }, // Auto-delete after 24 hours
  },
  { timestamps: true }
);

export default mongoose.model(
  'PendingLecturerUpdate',
  PendingLecturerUpdateSchema
);
