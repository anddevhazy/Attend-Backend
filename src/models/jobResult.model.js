import mongoose from 'mongoose';

const JobResultSchema = new mongoose.Schema(
  {
    jobId: { type: String, required: true, unique: true },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['extract-data', 'mark-attendance'],
      required: true,
    },
    result: { type: mongoose.Schema.Types.Mixed },
    status: { type: String, enum: ['completed', 'failed'], required: true },
    error: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model('JobResult', JobResultSchema);
