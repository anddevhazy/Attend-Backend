import Tesseract from 'tesseract.js';
import { InternalServerError } from '../errors/index.js';

export const extractStudentDataFromImage = async (image) => {
  try {
    const {
      data: { text },
    } = await Tesseract.recognize(image, 'eng');

    const matricMatch = text.match(
      /(?:Matric(?:\.?\s*No\.?)?|ID):?\s*([A-Z0-9]+)/i
    );
    const nameMatch = text.match(/Name:?\s*([A-Za-z ]+)/i);
    const programmeMatch = text.match(/Programme:?\s*([A-Za-z ]+)/i);
    const levelMatch = text.match(/Level:?\s*([0-9]+L)/i);

    return {
      matricNumber: matricMatch ? matricMatch[1].trim() : null,
      name: nameMatch ? nameMatch[1].trim() : null,
      programme: programmeMatch ? programmeMatch[1].trim() : null,
      level: levelMatch ? levelMatch[1].trim() : null,
    };
  } catch (error) {
    console.error(error);
    throw new InternalServerError(
      'Failed to process image for data extraction'
    );
  }
};
