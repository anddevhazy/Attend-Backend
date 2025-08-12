import User from '../models/user.model.js';
import BadRequestError from '../errors/BadRequestError.js';

export const checkGeofence = (latitude, longitude, corners) => {
  let inside = false;

  for (let i = 0, j = corners.length - 1; i < corners.length; j = i++) {
    if (
      corners[i].latitude > latitude !== corners[j].latitude > latitude &&
      longitude <
        ((corners[j].longitude - corners[i].longitude) *
          (latitude - corners[i].latitude)) /
          (corners[j].latitude - corners[i].latitude) +
          corners[i].longitude
    ) {
      inside = !inside;
    }
  }

  return inside;
};

export const handleDeviceValidation = async (matricNumber, deviceId) => {
  try {
    const deviceOwner = await User.findOne({ deviceId })
      .select('matricNumber name')
      .lean();

    if (!deviceOwner) {
      await User.updateOne({ matricNumber }, { deviceId });
      return { success: true };
    }

    if (deviceOwner.matricNumber === matricNumber) {
      return { success: true };
    }

    return {
      success: false,
      message: 'This device is already tied to another student account',
      conflictInfo: {
        matricNumber: deviceOwner.matricNumber,
        name: deviceOwner.name,
      },
    };
    // eslint-disable-next-line no-unused-vars
  } catch (error) {
    throw new BadRequestError('Error validating device');
  }
};

export const fetchOriginalOwner = async (deviceId) => {
  try {
    const deviceOwner = await User.findOne({ deviceId })
      .select('matricNumber name selfie')
      .lean();

    if (!deviceOwner) {
      return { success: true };
    }

    return {
      success: true,
      conflictInfo: {
        matricNumber: deviceOwner.matricNumber,
        name: deviceOwner.name,
        selfie: deviceOwner.selfie,
      },
    };
    // eslint-disable-next-line no-unused-vars
  } catch (error) {
    return {
      success: false,
      message: 'Error Fetching Original device owner',
    };
  }
};
