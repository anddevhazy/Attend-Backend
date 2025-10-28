import mongoose from 'mongoose';

const CourseSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Course code is required'],
      unique: true,
      trim: true,
    },
    title: {
      type: String,
      required: [true, 'Course title is required'],
      trim: true,
    },
    units: {
      type: Number,
      required: [true, 'Course units are required'],
      min: [0, 'Units cannot be negative'],
    },
  },
  { timestamps: true }
);

export default mongoose.model('Course', CourseSchema);
