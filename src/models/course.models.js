import mongoose from 'mongoose';

const CourseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Course name is required']
  }
}, { timestamps: true });

export default mongoose.model('Course', CourseSchema);