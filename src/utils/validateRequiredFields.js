import BadRequestError from '../errors/BadRequestError.js';

const validateRequiredFields = (fields, data) => {
  const missingFields = fields.filter((field) => !data[field]);
  if (missingFields.length) {
    throw new BadRequestError(
      `Missing required fields: ${missingFields.join(', ')}`
    );
  }
};

export default validateRequiredFields;
