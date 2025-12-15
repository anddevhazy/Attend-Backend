import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const StudentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ['student'],
      default: 'student',
      required: [true, 'Role is required'],
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: [/.+@.+\..+/, 'Invalid email format'],
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    matricNumber: {
      type: String,
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
    department: {
      type: String,
      trim: true,
    },
    college: {
      type: String,
      trim: true,
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
    isActivated: { type: Boolean, default: false },
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

StudentSchema.index({ email: 1 }, { unique: true });
StudentSchema.index({ matricNumber: 1 }, { unique: true, sparse: true });

StudentSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

StudentSchema.methods.generateEmailVerificationToken = function () {
  return jwt.sign({ id: this._id, email: this.email }, process.env.JWT_SECRET, {
    expiresIn: '1h',
  });
};

StudentSchema.methods.generateLoginToken = function () {
  return jwt.sign({ id: this._id, email: this.email }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};
StudentSchema.methods.comparePassword = async function (userPassword) {
  return await bcrypt.compare(userPassword, this.password);
};

StudentSchema.statics.verifyEmailVerificationToken = function (token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
    // eslint-disable-next-line no-unused-vars
  } catch (err) {
    return null;
  }
};

export default mongoose.model('Student', StudentSchema);
