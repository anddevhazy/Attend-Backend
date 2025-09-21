import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

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
      required: true,
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
    faculty: {
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

UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ matricNumber: 1 }, { unique: true });

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

UserSchema.methods.generateToken = function () {
  return jwt.sign(
    { id: this._id, role: this.role, email: this.email },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
};

UserSchema.methods.comparePassword = async function (userPassword) {
  return await bcrypt.compare(userPassword, this.password);
};

UserSchema.statics.verifyEmailToken = function (token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
    // eslint-disable-next-line no-unused-vars
  } catch (err) {
    return null;
  }
};

export default mongoose.model('User', UserSchema);
