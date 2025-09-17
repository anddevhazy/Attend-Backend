import User from '../models/user.model.js';
import { BadRequestError } from '../errors/index.js';

export const checkGeofence = (latitude, longitude, corners) => {
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

export const handleDeviceValidation = async (matricNumber, deviceId) => {
  // Validate inputs
  if (
    !matricNumber ||
    typeof matricNumber !== 'string' ||
    !deviceId ||
    typeof deviceId !== 'string'
  ) {
    console.error(
      `Invalid input: matricNumber=${matricNumber}, deviceId=${deviceId}`
    );
    throw new BadRequestError('Invalid matricNumber or deviceId');
  }

  try {
    // Check if matricNumber exists
    const user = await User.findOne({ matricNumber }).select('_id').lean();
    if (!user) {
      console.error(`User not found for matricNumber: ${matricNumber}`);
      throw new BadRequestError('Student not found');
    }

    // Check device ownership with atomic update
    const deviceOwner = await User.findOneAndUpdate(
      { deviceId, matricNumber: { $ne: matricNumber } }, // Find device owned by another user
      {}, // No update, just checking
      { select: 'matricNumber name', lean: true }
    );

    if (deviceOwner) {
      console.log(
        `Device conflict: deviceId=${deviceId} owned by ${deviceOwner.matricNumber}`
      );
      return {
        success: false,
        message: 'This device is already tied to another student account',
        conflictInfo: {
          matricNumber: deviceOwner.matricNumber,
          name: deviceOwner.name,
        },
      };
    }

    // Register device if not already registered
    const updatedUser = await User.findOneAndUpdate(
      { matricNumber, deviceId: { $exists: false } }, // Only update if deviceId not set
      { deviceId },
      { select: '_id', lean: true }
    );

    if (!updatedUser) {
      // Device already registered to this user
      return { success: true };
    }

    console.log(`Device ${deviceId} assigned to matricNumber: ${matricNumber}`);
    return { success: true };
  } catch (error) {
    console.error(`Device validation error: ${error.message}`);
    throw new BadRequestError(`Error validating device: ${error.message}`);
  }
};

export const fetchOriginalOwner = async (deviceId) => {
  // Validate input
  if (!deviceId || typeof deviceId !== 'string') {
    console.error(`Invalid deviceId: ${deviceId}`);
    throw new BadRequestError('Invalid deviceId');
  }

  try {
    const deviceOwner = await User.findOne({ deviceId })
      .select('matricNumber name selfie')
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
      },
    };
  } catch (error) {
    console.error(`Error fetching original owner: ${error.message}`);
    throw new BadRequestError(
      `Error fetching original device owner: ${error.message}`
    );
  }
};
