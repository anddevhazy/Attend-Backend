import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import {
  BadRequestError,
  NotFoundError,
  UnauthenticatedError,
} from '../../errors/index.js';
import formatResponseUtil from '../global/format_response_util.js';
import validateRequiredFieldsUtil from '../global/validate_required_fields_util.js';
import Student from '../../models/student_model.js';
import { StatusCodes } from 'http-status-codes';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadCourseFormsToCloudinaryUtil = async (
  filePath,
  folder = 'course-forms'
) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: 'auto',
    });

    // Delete local file after upload
    fs.unlinkSync(filePath);

    return result;
  } catch (error) {
    // Clean up local file if upload fails
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    throw error;
  }
};

export const uploadResultsToCloudinaryUtil = async (
  filePath,
  folder = 'results'
) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: 'auto',
    });

    // Delete local file after upload
    fs.unlinkSync(filePath);

    return result;
  } catch (error) {
    // Clean up local file if upload fails
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    throw error;
  }
};

export const uploadSelfieToCloudinaryUtil = async (
  filePath,
  folder = 'student-selfies'
) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: 'image',
      transformation: [
        { width: 500, height: 500, crop: 'fill', gravity: 'face' },
        { quality: 'auto:good' },
      ],
    });

    // Delete local file after upload
    fs.unlinkSync(filePath);

    return result;
  } catch (error) {
    // Clean up local file if upload fails
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    throw error;
  }
};

export const uploadSelfieAndRegisterDevice = async (req, res, next) => {
  try {
    const { deviceId } = req.body;

    // Ensure user is authenticated
    if (!req.user || !req.user.id) {
      throw new UnauthenticatedError('Student must be logged in');
    }

    // Validate required fields
    validateRequiredFieldsUtil(['deviceId'], req.body);

    // Check if selfie file was uploaded
    if (!req.file) {
      throw new BadRequestError('Selfie image is required');
    }

    // Find student
    const student = await Student.findById(req.user.id);
    if (!student) {
      throw new NotFoundError('Student not found');
    }

    // Check if device is already tied to another student
    const deviceOwner = await Student.findOne({
      deviceId,
      _id: { $ne: req.user.id },
    }).select('matricNumber name');

    if (deviceOwner) {
      throw new BadRequestError(
        'This device is already registered to another student',
        {
          conflictInfo: {
            matricNumber: deviceOwner.matricNumber,
            name: deviceOwner.name,
          },
        }
      );
    }

    // Upload selfie to Cloudinary
    const uploadResult = await uploadSelfieToCloudinaryUtil(
      req.file.path,
      'student-selfies'
    );

    // Update student with device ID and selfie
    student.deviceId = deviceId;
    student.selfie = uploadResult.secure_url;
    await student.save();

    return formatResponseUtil(
      res,
      StatusCodes.OK,
      {
        deviceId: student.deviceId,
        selfie: student.selfie,
        message: 'Device registered successfully with your selfie',
      },
      'Selfie uploaded and device registered successfully'
    );
  } catch (error) {
    console.error('Selfie Upload Error:', error);
    next(error);
  }
};
