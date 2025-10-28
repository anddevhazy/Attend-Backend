import { StatusCodes } from 'http-status-codes';
import Course from '../models/course_model.js';
import {
  BadRequestError,
  NotFoundError,
  UnauthenticatedError,
} from '../errors/index.js';
import Student from '../models/student_model.js';
import formatResponseUtil from '../utils/global/format_response_util.js';
import validateRequiredFieldsUtil from '../utils/global/validate_required_fields_util.js';
import extractCourseFormDataUtil from '../utils/student/details_extraction_util.js';
import extractResultDataUtil from '../utils/student/details_extraction_util.js';
import uploadCourseFormsToCloudinaryUtil from '../utils/student/cloudinary_upload_util.js';
import uploadResultsToCloudinaryUtil from '../utils/student/cloudinary_upload_util.js';

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

export const uploadCourseFormAndExtractData = async (req, res, next) => {
  try {
    // Ensure user is authenticated
    if (!req.user || !req.user.id) {
      throw new UnauthenticatedError('Student Must be Logged In');
    }

    // Check if file was uploaded
    if (!req.file) {
      throw new BadRequestError('Course form image is required');
    }

    // Find student
    const student = await Student.findById(req.user.id);
    if (!student) {
      throw new NotFoundError('Student not found');
    }

    // Check if already activated
    if (student.isActivated) {
      throw new BadRequestError('Account is already activated');
    }

    // Upload image to cloudinary
    const uploadResult = await uploadCourseFormsToCloudinaryUtil(
      req.file.path,
      'course-forms'
    );

    // Extract data from course form using OCR
    const extractedData = await extractCourseFormDataUtil(
      uploadResult.secure_url
    );

    // Return extracted data for confirmation
    return formatResponseUtil(
      res,
      StatusCodes.OK,
      {
        extractedData: {
          name: extractedData.name,
          matricNumber: extractedData.id,
          department: extractedData.programme,
          level: extractedData.level,
        },
        imageUrl: uploadResult.secure_url,
        message:
          'Please verify the extracted information and confirm to activate your account',
      },
      'Course form data extracted successfully'
    );
  } catch (error) {
    console.error('Course Form Upload Error:', error);
    next(error);
  }
};

export const uploadResultAndExtractData = async (req, res, next) => {
  try {
    // Ensure user is authenticated
    if (!req.user || !req.user.id) {
      throw new UnauthenticatedError('Student Must be Logged In');
    }

    // Check if file was uploaded
    if (!req.file) {
      throw new BadRequestError('Result image is required');
    }

    // Find student
    const student = await Student.findById(req.user.id);
    if (!student) {
      throw new NotFoundError('Student not found');
    }

    // Check if already activated
    if (student.isActivated) {
      throw new BadRequestError('Account is already activated');
    }

    // Upload image to cloudinary
    const uploadResult = await uploadResultsToCloudinaryUtil(
      req.file.path,
      'results'
    );

    // Extract data from course form using OCR
    const extractedData = await extractResultDataUtil(uploadResult.secure_url);

    // Return extracted data for confirmation
    return formatResponseUtil(
      res,
      StatusCodes.OK,
      {
        extractedData: {
          name: extractedData.name,
          matricNumber: extractedData.id,
          department: extractedData.programme,
          level: extractedData.level,
        },
        imageUrl: uploadResult.secure_url,
        message:
          'Please verify the extracted information and confirm to activate your account',
      },
      'Result data extracted successfully'
    );
  } catch (error) {
    console.error('Result Upload Error:', error);
    next(error);
  }
};

export const confirmActivation = async (req, res, next) => {
  try {
    // Ensure user is authenticated
    if (!req.user || !req.user.id) {
      throw new UnauthenticatedError('Authentication required');
    }

    const { name, matricNumber, department, level, college, imageUrl } =
      req.body;

    // Validate required fields
    validateRequiredFieldsUtil(
      ['name', 'matricNumber', 'department', 'level', 'imageUrl'],
      req.body
    );

    // Find student
    const student = await Student.findById(req.user.id);
    if (!student) {
      throw new NotFoundError('Student not found');
    }

    // Check if already activated
    if (student.isActivated) {
      throw new BadRequestError('Account is already activated');
    }

    // Check if matric number is already in use
    const existingStudent = await Student.findOne({
      matricNumber: matricNumber.toUpperCase(),
      _id: { $ne: student._id },
    });

    if (existingStudent) {
      throw new BadRequestError('Matric number already exists');
    }

    // Update student information
    student.name = name;
    student.matricNumber = matricNumber.toUpperCase();
    student.department = department;
    student.level = level;
    student.college = college;
    student.selfie = imageUrl; // Store the course form image
    student.isActivated = true;

    await student.save();

    // Return success response
    return formatResponseUtil(
      res,
      StatusCodes.OK,
      {
        student: {
          id: student._id,
          email: student.email,
          name: student.name,
          matricNumber: student.matricNumber,
          department: student.department,
          level: student.level,
          college: student.college,
          isActivated: student.isActivated,
        },
      },
      'Account activated successfully'
    );
  } catch (error) {
    console.error('Account Activation Confirmation Error:', error);
    next(error);
  }
};
