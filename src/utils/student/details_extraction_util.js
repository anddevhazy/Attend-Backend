import Tesseract from 'tesseract.js';
import { BadRequestError } from '../../errors/index.js';

/**
 * Extract student information from course form image using OCR
 * @param {string} imageUrl - URL or path to the course form image
 * @returns {Promise<Object>} Extracted student data
 */
const extractCourseFormDataUtil = async (imageUrl) => {
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
    const extractedData = parseStudentInfo(text);

    // Validate that we extracted necessary information
    if (!extractedData.matricNumber) {
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
const parseStudentInfo = (text) => {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line);

  const data = {
    name: null,
    matricNumber: null,
    department: null,
    level: null,
    college: null,
  };

  // Regular expressions for matching patterns
  const matricRegex =
    /\b([A-Z]{3}\/\d{2,4}\/\d{3,4}|\d{2,4}\/\d{4,6}|[A-Z]{2,3}\d{6,8})\b/i;
  const levelRegex = /\b(100L|200L|300L|400L|500L|600L)\b/i;
  const nameRegex =
    /(?:name|student name|full name)[:\s]*([A-Z][a-z]+(?: [A-Z][a-z]+)+)/i;
  const deptRegex = /(?:department|dept)[:\s]([A-Z][a-z]+(?: [A-Z][a-z]+))/i;
  const collegeRegex = /(?:college|faculty)[:\s]([A-Z][a-z]+(?: [A-Z][a-z]+))/i;

  // Extract matric number
  for (const line of lines) {
    const matricMatch = line.match(matricRegex);
    if (matricMatch && !data.matricNumber) {
      data.matricNumber = matricMatch[1].toUpperCase();
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
    const deptMatch = line.match(deptRegex);
    if (deptMatch && !data.department) {
      data.department = deptMatch[1].trim();
    }

    // Extract college
    const collegeMatch = line.match(collegeRegex);
    if (collegeMatch && !data.college) {
      data.college = collegeMatch[1].trim();
    }
  }

  // Fallback: Try to find name in first few lines if not found
  if (!data.name) {
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const line = lines[i];
      // Look for lines with multiple capitalized words
      if (/^[A-Z][a-z]+(?: [A-Z][a-z]+){1,3}$/.test(line) && line.length > 5) {
        data.name = line;
        break;
      }
    }
  }

  console.log('✅ Parsed Data:', data);
  return data;
};

export default extractCourseFormDataUtil;
