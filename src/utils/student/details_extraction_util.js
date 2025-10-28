import Tesseract from 'tesseract.js';
import { BadRequestError } from '../../errors/index.js';

/**
 * Extract student information from course form image using OCR
 * @param {string} imageUrl - URL or path to the course form image
 * @returns {Promise<Object>} Extracted student data
 */
export const extractCourseFormDataUtil = async (imageUrl) => {
  try {
    console.log('🔍 Starting OCR extraction for:', imageUrl);

    // Perform OCR on the image
    const {
      data: { text },
    } = await Tesseract.recognize(imageUrl, 'eng', {
      logger: (info) => console.log(info),
    });

    console.log('📄 Extracted Text:', text);

    // Parse the extracted text to find student information
    const extractedData = parseStudentInfoFromCourseForm(text);

    // Validate that we extracted necessary information
    if (!extractedData.id) {
      throw new BadRequestError(
        'Could not extract matric number from course form'
      );
    }

    return extractedData;
  } catch (error) {
    console.error('OCR Extraction Error:', error);
    throw new BadRequestError(
      'Failed to extract data from course form. Please ensure the image is clear and try again.'
    );
  }
};

/**
 * Parse student information from OCR text
 * @param {string} text - Raw OCR text
 * @returns {Object} Parsed student data
 */
const parseStudentInfoFromCourseForm = (text) => {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line);

  const data = {
    name: null,
    id: null,
    programme: null,
    level: null,
  };

  // Regular expressions for matching patterns

  // Matches ID: 12345678  (8 digits after "ID:")
  const idRegex = /ID[:\s]*([0-9]{8})/i;

  // Matches Level: 100L
  const levelRegex = /Level[:\s]*(\d{3}L)/i;

  // Matches Name: John Doe
  const nameRegex = /Name[:\s]*([A-Z][a-z]+(?: [A-Z][a-z]+)+)/i;

  // Matches Programme: Computer Science
  const programmeRegex = /Programme[:\s]([A-Z][a-z]+(?: [A-Z][a-z]+))/i;

  // Extract matric number
  for (const line of lines) {
    const idMatch = line.match(idRegex);
    if (idMatch && !data.id) {
      data.id = idMatch[1];
    }

    // Extract level
    const levelMatch = line.match(levelRegex);
    if (levelMatch && !data.level) {
      data.level = levelMatch[1].toUpperCase();
    }

    // Extract name
    const nameMatch = line.match(nameRegex);
    if (nameMatch && !data.name) {
      data.name = nameMatch[1].trim();
    }

    // Extract department
    const programmeMatch = line.match(programmeRegex);
    if (programmeMatch && !data.programme) {
      data.programme = programmeMatch[1].trim();
    }
  }

  console.log('✅ Parsed Data:', data);
  return data;
};

/**
 * Extract student information from Result image using OCR
 * @param {string} imageUrl - URL or path to the Result image
 * @returns {Promise<Object>} Extracted student data
 */
export const extractResultDataUtil = async (imageUrl) => {
  try {
    console.log('🔍 Starting OCR extraction for:', imageUrl);

    // Perform OCR on the image
    const {
      data: { text },
    } = await Tesseract.recognize(imageUrl, 'eng', {
      logger: (info) => console.log(info),
    });

    console.log('📄 Extracted Text:', text);

    // Parse the extracted text to find student information
    const extractedData = parseStudentInfoFromResult(text);

    // Validate that we extracted necessary information
    if (!extractedData.id) {
      throw new BadRequestError('Could not extract matric number from Result');
    }

    return extractedData;
  } catch (error) {
    console.error('OCR Extraction Error:', error);
    throw new BadRequestError(
      'Failed to extract data from Result. Please ensure the image is clear and try again.'
    );
  }
};

/**
 * Parse student information from OCR text
 * @param {string} text - Raw OCR text
 * @returns {Object} Parsed student data
 */
const parseStudentInfoFromResult = (text) => {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line);

  const data = {
    name: null,
    id: null,
    programme: null,
    level: null,
  };

  // Regular expressions for matching patterns
  // Matches Matric. No.: 12345678  (8 digits after "Matric. No.:")
  const idRegex = /Matric\.?\s*No\.?:\s*(\d{8})/i;

  // Matches Level: 100L
  const levelRegex = /Level[:\s]*(\d{3}L)/i;

  // Matches Name: John Doe
  const nameRegex = /Name[:\s]*([A-Z][a-z]+(?: [A-Z][a-z]+)+)/i;

  // Matches Programme: Computer Science
  const programmeRegex = /Programme[:\s]([A-Z][a-z]+(?: [A-Z][a-z]+))/i;

  // Extract matric number
  for (const line of lines) {
    const idMatch = line.match(idRegex);
    if (idMatch && !data.id) {
      data.id = idMatch[1];
    }

    // Extract level
    const levelMatch = line.match(levelRegex);
    if (levelMatch && !data.level) {
      data.level = levelMatch[1].toUpperCase();
    }

    // Extract name
    const nameMatch = line.match(nameRegex);
    if (nameMatch && !data.name) {
      data.name = nameMatch[1].trim();
    }

    // Extract department
    const programmeMatch = line.match(programmeRegex);
    if (programmeMatch && !data.programme) {
      data.programme = programmeMatch[1].trim();
    }
  }

  console.log('✅ Parsed Data From Result:', data);
  return data;
};
