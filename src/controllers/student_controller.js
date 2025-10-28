import { StatusCodes } from 'http-status-codes';
import Course from '../models/course_model.js';
// import { BadRequestError, NotFoundError } from '../errors/index.js';
// import Student from '../models/student_model.js';
import formatResponseUtil from '../utils/global/format_response_util.js';

export const fetchCourses = async (req, res, next) => {
  try {
    // 1️⃣ Retrieve all course documents from the database
    // - Only select the 'name' and '_id' fields to reduce payload size
    // - Sort results alphabetically by course title for cleaner UI presentation
    const courses = await Course.find({})
      .select('code _id')
      .sort({ title: 1 })
      .lean(); // Convert Mongoose documents to plain JS objects for faster performance

    // 2️⃣ Send standardized response
    // - Include the list of courses and total count
    return formatResponseUtil(res, StatusCodes.OK, {
      courses,
      totalCourses: courses.length,
    });
  } catch (error) {
    // 3️⃣ Pass any errors to global error handler middleware
    next(error);
  }
};
