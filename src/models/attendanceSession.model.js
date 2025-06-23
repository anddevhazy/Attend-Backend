import mongoose from 'mongoose';

const SessionsSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course ID is required']
  },
  lecturerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Lecturer ID is required']
  },
  locationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location',
    required: [true, 'Location ID is required']
  },
  startTime: {
    type: Date,
    required: [true, 'Start time is required']
  },
  endTime: {
    type: Date,
    required: [true, 'End time is required']
  },
  attendees: [
    {
      studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Student ID is required']
      },
      selfie: {
        type: String,
        required: [true, 'Selfie URL is required']
      },
      timestamp: {
        type: Date,
        default: Date.now
      },
      deviceIdUsed: {
        type: String,
        required: [true, 'Device ID used is required']
      }
    }
  ],
  status: {
    type: String,
    enum: {
      values: ['active', 'ended'],
      message: 'Status must be either active or ended'
    },
    default: 'active'
  }
}, { timestamps: true });

export default mongoose.model('Session', SessionsSchema);