import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    role: {
      type: String,
      enum: {
        values: ['student', 'lecturer'],
        message: 'Role must be either student or lecturer',
      },
      required: [true, 'Role is required'],
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
      match: [/.+@.+\..+/, 'Invalid email format'],
    },
    matricNumber: {
      type: String,
      unique: true,
      sparse: true,
      uppercase: true,
      trim: true,
    },
    level: {
      type: String,
      enum: {
        values: ['100L', '200L', '300L', '400L', '500L', '600L'],
        message: 'Level must be one of 100L, 200L, 300L, 400L, 500L, or 600L',
      },
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
    },
    deviceId: {
      type: String,
      default: null,
    },
    selfie: {
      type: String,
      default: null,
    },
    selectedCourses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
      },
    ],
    attendanceSummary: {
      present: [
        { type: mongoose.Schema.Types.ObjectId, ref: 'AttendanceSession' },
      ],
      missed: [
        { type: mongoose.Schema.Types.ObjectId, ref: 'AttendanceSession' },
      ],
      pending: [
        { type: mongoose.Schema.Types.ObjectId, ref: 'AttendanceSession' },
      ],
    },
  },
  { timestamps: true }
);

export default mongoose.model('User', UserSchema);
