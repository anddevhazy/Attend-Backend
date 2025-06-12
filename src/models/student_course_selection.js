import mongoose, { Schema } from "mongoose";

const courseSchema = new Schema({
  course: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  },
});
