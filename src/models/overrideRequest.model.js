import mongoose from 'mongoose';

const OverrideRequestSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student ID is required'],
    },
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
      required: [true, 'Session ID is required'],
    },
    selfie: {
      type: String,
      required: [true, 'Selfie is required'],
    },
    originalOwnerMatric: {
      type: String,
      required: [true, 'Original owner matric number is required'],
    },
    originalOwnerSelfie: {
      type: String,
      required: [true, 'Original owner selfie is required'],
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'approved', 'denied'],
        message: 'Status must be pending, approved, or denied',
      },
      default: 'pending',
    },
    lecturerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    decisionTimestamp: Date,
  },
  { timestamps: true }
);

export default mongoose.model('OverrideRequest', OverrideRequestSchema);
