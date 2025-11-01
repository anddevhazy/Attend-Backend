import Student from '../../models/student_model.js';
import { BadRequestError } from '../../errors/index.js';

export const checkGeofenceUtil = (latitude, longitude, corners) => {
  // Validating that latitude and longitude are valid numbers
  if (
    typeof latitude !== 'number' ||
    typeof longitude !== 'number' ||
    isNaN(latitude) ||
    isNaN(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    console.error(
      `Invalid coordinates: latitude=${latitude}, longitude=${longitude}`
    );
    throw new BadRequestError('Invalid latitude or longitude');
  }

  // Validating that the corners is an array with exactly 4 elements and that each has valid
  // latitude and longitude
  if (!Array.isArray(corners) || corners.length !== 4) {
    console.error(
      `Invalid corners: expected 4 corners, got ${corners?.length || 0}`
    );
    throw new BadRequestError('Classroom must have exactly 4 corners');
  }

  // Validate that each corner has latitude and longitude
  for (const [index, corner] of corners.entries()) {
    if (
      !corner ||
      typeof corner.latitude !== 'number' ||
      typeof corner.longitude !== 'number' ||
      isNaN(corner.latitude) ||
      isNaN(corner.longitude)
    ) {
      console.error(
        `Invalid corner at index ${index}: ${JSON.stringify(corner)}`
      );
      throw new BadRequestError(`Invalid corner data at index ${index}`);
    }
  }

  // Ray-casting algorithm to ensure the corners of the classroom aren't self-intersecting
  let inside = false;
  for (let i = 0, j = corners.length - 1; i < corners.length; j = i++) {
    const xi = corners[i].latitude;
    const yi = corners[i].longitude;
    const xj = corners[j].latitude;
    const yj = corners[j].longitude;

    // Avoiding division by zero
    if (xi === xj) continue;

    if (
      yi > longitude !== yj > longitude &&
      latitude < ((xj - xi) * (longitude - yi)) / (xj - xi) + xi
    ) {
      inside = !inside;
    }
  }

  if (!inside) {
    console.log(
      `Geofence check failed: point (${latitude}, ${longitude}) outside polygon`
    );
  }

  return inside;
};

export const handleDeviceValidationUtil = async (matricNumber, deviceId) => {
  if (!matricNumber || typeof matricNumber !== 'string') {
    throw new BadRequestError('Invalid matricNumber');
  }

  try {
    const user = await Student.findOne({ matricNumber })
      .select('_id deviceId selfie name')
      .lean();

    if (!user) {
      throw new BadRequestError('Student not found');
    }

    // ✅ Step 1: Always check if the device belongs to someone else
    if (deviceId) {
      const deviceOwner = await Student.findOne({
        deviceId,
        matricNumber: { $ne: matricNumber },
      }).select('matricNumber name selfie');

      if (deviceOwner) {
        return {
          success: false,
          message:
            'This device is already tied to another student account, request override',
          conflictInfo: {
            matricNumber: deviceOwner.matricNumber,
            name: deviceOwner.name,
            selfie: deviceOwner.selfie,
          },
        };
      }
    }

    // ✅ Step 2: Handle case where student has no registered device
    if (!user.deviceId) {
      return {
        success: false,
        requiresSelfie: true,
        message: 'Please upload a selfie to register this device',
      };
    }

    // ✅ Step 3: If registered device matches
    if (user.deviceId === deviceId) {
      return { success: true, alreadyRegistered: true };
    }

    // ✅ Step 4: Device mismatch
    return {
      success: false,
      message: 'You are using a different device than your registered one',
      requiresDeviceChange: true,
    };
  } catch (error) {
    throw new BadRequestError(`Error validating device: ${error.message}`);
  }
};

export const fetchOriginalOwnerUtil = async (deviceId) => {
  // Validate input
  if (!deviceId || typeof deviceId !== 'string') {
    console.error(`Invalid deviceId: ${deviceId}`);
    throw new BadRequestError('Invalid deviceId');
  }

  try {
    const deviceOwner = await Student.findOne({ deviceId })
      .select('_id matricNumber name selfie')
      .lean();

    if (!deviceOwner) {
      console.log(`No owner found for deviceId: ${deviceId}`);
      return { success: true };
    }

    console.log(
      `Found owner for deviceId: ${deviceId}, matricNumber: ${deviceOwner.matricNumber}`
    );
    return {
      success: true,
      conflictInfo: {
        matricNumber: deviceOwner.matricNumber,
        name: deviceOwner.name,
        selfie: deviceOwner.selfie,
        deviceId: deviceId,
        _id: deviceOwner._id,
      },
    };
  } catch (error) {
    console.error(`Error fetching original owner: ${error.message}`);
    throw new BadRequestError(
      `Error fetching original device owner: ${error.message}`
    );
  }
};
