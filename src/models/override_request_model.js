import mongoose from 'mongoose';

const OverrideRequestSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
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
    originalOwnerId: {
      type: String,
      ref: 'Student',
      required: [true, 'Original owner  Id is required'],
    },
    deviceIdUsed: {
      type: String,
      required: [true, 'Device ID is required to process override'],
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
      ref: 'Lecturer',
    },
    decisionTimestamp: Date,
  },
  { timestamps: true }
);

export default mongoose.model('OverrideRequest', OverrideRequestSchema);
