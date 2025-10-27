import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const LecturerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: {
        values: ['lecturer'],
        message: 'Role must be lecturer',
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
    department: {
      type: String,
      trim: true,
    },
    college: {
      type: String,
      trim: true,
    },
    isSeeded: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      /*this token is being saved because token expiry is an existing concept, so this field always keeps 
      the most recent token that is allowed for verifying this email, we wouldn't want someone using a 
      token that's old and supposed to be expired to verify.*/
      type: String,
      default: null,
    },
    password: {
      type: String,
      required: function () {
        // Only require password if lecturer is signing up (not preloaded)
        return this.isNew && !this.isSeeded;
      },
    },
  },
  { timestamps: true }
);

LecturerSchema.index({ email: 1 }, { unique: true });

LecturerSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

LecturerSchema.methods.generateToken = function () {
  return jwt.sign(
    { id: this._id, role: this.role, email: this.email },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
};

LecturerSchema.methods.comparePassword = async function (userPassword) {
  return await bcrypt.compare(userPassword, this.password);
};

LecturerSchema.statics.verifyEmailToken = function (token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
    // eslint-disable-next-line no-unused-vars
  } catch (err) {
    return null;
  }
};

export default mongoose.model('Lecturer', LecturerSchema);
