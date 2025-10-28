import { StatusCodes } from 'http-status-codes';
import Course from '../models/course_model.js';
import { BadRequestError, NotFoundError } from '../errors/index.js';
import Student from '../models/student_model.js';
import formatResponseUtil from '../utils/global/format_response_util.js';
import validateRequiredFieldsUtil from '../utils/global/validate_required_fields_util.js';

export const fetchCourses = async (req, res, next) => {
  try {
    // 1️⃣ Retrieve all course documents from the database
    // - Only select the 'name' and '_id' fields to reduce payload size
    // - Sort results alphabetically by course title for cleaner UI presentation
    const courses = await Course.find({})
      .select('units title code _id')
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

export const selectCourses = async (req, res, next) => {
  try {
    const { courseIds } = req.body; // Array of course IDs
    const studentId = req.user.id; // From auth middleware

    // Validate required fields
    validateRequiredFieldsUtil(['courseIds'], req.body);

    // Validate courseIds is an array
    if (!Array.isArray(courseIds) || courseIds.length === 0) {
      throw new BadRequestError('courseIds must be a non-empty array');
    }

    // Find the student
    const student = await Student.findById(studentId);
    if (!student) {
      throw new NotFoundError('Student not found');
    }

    // Verify all course IDs exist
    const courses = await Course.find({ _id: { $in: courseIds } });
    if (courses.length !== courseIds.length) {
      throw new BadRequestError('One or more course IDs are invalid');
    }

    // Update student's selected courses
    student.selectedCourses = courseIds;
    await student.save();

    // Fetch updated student with populated courses
    const updatedStudent = await Student.findById(studentId)
      .select('selectedCourses')
      .populate('selectedCourses', 'code title');

    return formatResponseUtil(
      res,
      StatusCodes.OK,
      {
        selectedCourses: updatedStudent.selectedCourses,
        totalSelected: updatedStudent.selectedCourses.length,
      },
      'Courses selected successfully'
    );
  } catch (error) {
    console.error('SELECT COURSES Error:', error);
    next(error);
  }
};
