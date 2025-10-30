import Tesseract from 'tesseract.js';
import { BadRequestError } from '../../errors/index.js';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Helper: Download image from Cloudinary using axios
const downloadImage = async (url, dest) => {
  try {
    console.log('⬇️ Downloading from:', url);

    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'stream',
      timeout: 30000, // 30 seconds
      maxRedirects: 5,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AttendApp/1.0)',
      },
    });

    const writer = fs.createWriteStream(dest);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => {
        console.log('✅ Download complete:', dest);
        resolve(dest);
      });
      writer.on('error', (err) => {
        console.error('❌ Write error:', err);
        fs.unlink(dest, () => {});
        reject(err);
      });
    });
  } catch (error) {
    console.error('❌ Download error:', error.message);
    if (fs.existsSync(dest)) {
      fs.unlinkSync(dest);
    }
    throw new Error(`Failed to download image: ${error.message}`);
  }
};

/**
 * Extract student information from course form image using OCR
 * @param {string} imageUrl - URL or path to the course form image
 * @returns {Promise<Object>} Extracted student data
 */
export const extractCourseFormDataUtil = async (imageUrl) => {
  let tempFilePath = null;

  try {
    console.log('🔍 Starting OCR extraction for:', imageUrl);

    // Ensure temp directory exists
    const tempDir = path.join(__dirname, '../../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Create unique temp file name
    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    tempFilePath = path.join(tempDir, `courseform-${uniqueSuffix}.jpg`);

    // 1️⃣ Download the image locally first
    await downloadImage(imageUrl, tempFilePath);
    console.log('📥 Image downloaded for OCR:', tempFilePath);

    // Verify file was created
    if (!fs.existsSync(tempFilePath)) {
      throw new Error('Downloaded file does not exist');
    }

    // 2️⃣ Perform OCR on the local file
    const {
      data: { text },
    } = await Tesseract.recognize(tempFilePath, 'eng', {
      logger: (info) => console.log(info),
    });

    console.log('📄 Extracted Text:', text);

    // 3️⃣ Parse the text to extract student info
    const extractedData = parseStudentInfoFromCourseForm(text);

    // 4️⃣ Validate results
    if (!extractedData.id) {
      throw new BadRequestError(
        'Could not extract matric number from course form'
      );
    }

    return extractedData;
  } catch (error) {
    console.error('❌ OCR Extraction Error:', error);
    throw new BadRequestError(
      'Failed to extract data from course form. Please ensure the image is clear and try again.'
    );
  } finally {
    // 5️⃣ Always delete temp file
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
        console.log('🧹 Cleaned up temp file:', tempFilePath);
      } catch (err) {
        console.warn('⚠️ Failed to delete temp file:', err.message);
      }
    }
  }
};

/**
 * Parse student information from OCR text with improved pattern matching
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

  // Improved regex patterns to handle OCR errors
  // Handle common OCR misreadings: 'ID' as '1D', 'lD', 'iD', etc.
  const idRegex = /(?:ID|1D|iD|lD)[:\s]*([0-9]{8})/i;

  // More flexible level pattern
  const levelRegex = /Level[:\s]*([0-9]{3}L?)/i;

  // More flexible name pattern - captures 2+ word names
  const nameRegex = /Name[:\s]*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i;

  // More flexible programme pattern
  const programmeRegex = /Programme[:\s]*([A-Za-z&\s]+?)(?:\s{2,}|$)/i;

  // Extract data
  for (const line of lines) {
    // Try to extract ID/Matric number
    const idMatch = line.match(idRegex);
    if (idMatch && !data.id) {
      data.id = idMatch[1];
      console.log('✅ Matched ID:', idMatch[1]);
    }

    // Try to extract level
    const levelMatch = line.match(levelRegex);
    if (levelMatch && !data.level) {
      let level = levelMatch[1].toUpperCase();
      // Ensure it ends with 'L'
      if (!level.endsWith('L')) {
        level += 'L';
      }
      data.level = level;
      console.log('✅ Matched Level:', level);
    }

    // Try to extract name
    const nameMatch = line.match(nameRegex);
    if (nameMatch && !data.name) {
      data.name = nameMatch[1].trim();
      console.log('✅ Matched Name:', nameMatch[1]);
    }

    // Try to extract programme
    const programmeMatch = line.match(programmeRegex);
    if (programmeMatch && !data.programme) {
      data.programme = programmeMatch[1].trim();
      console.log('✅ Matched Programme:', programmeMatch[1]);
    }
  }

  console.log('✅ Final Parsed Data:', data);
  return data;
};

/**
 * Extract student information from Result image using OCR
 * @param {string} imageUrl - URL or path to the Result image
 * @returns {Promise<Object>} Extracted student data
 */
export const extractResultDataUtil = async (imageUrl) => {
  let tempFilePath = null;

  try {
    console.log('🔍 Starting Result OCR extraction for:', imageUrl);

    // Ensure temp directory exists
    const tempDir = path.join(__dirname, '../../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Create unique temp file
    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    tempFilePath = path.join(tempDir, `result-${uniqueSuffix}.jpg`);

    // Download image
    await downloadImage(imageUrl, tempFilePath);
    console.log('📥 Image saved to:', tempFilePath);

    // Verify file exists
    if (!fs.existsSync(tempFilePath)) {
      throw new Error('Downloaded file does not exist');
    }

    // Run OCR on local file
    console.log('🔍 Running OCR...');
    const {
      data: { text },
    } = await Tesseract.recognize(tempFilePath, 'eng', {
      logger: (m) => console.log(m),
    });

    console.log('📄 OCR Text:', text);

    const extractedData = parseStudentInfoFromResult(text);

    if (!extractedData.id) {
      throw new BadRequestError('Could not extract matric number from Result');
    }

    return extractedData;
  } catch (error) {
    console.error('❌ Result OCR Extraction Error:', error);
    throw new BadRequestError(
      'Failed to extract data from Result. Please ensure the image is clear and try again.'
    );
  } finally {
    // Always clean up
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
        console.log('🧹 Cleaned up:', tempFilePath);
      } catch (err) {
        console.warn('⚠️ Failed to delete temp file:', err.message);
      }
    }
  }
};

/**
 * Parse student information from Result OCR text
 * @param {string} text - Raw OCR text
 * @returns {Object} Parsed student data
 */
// Similarly update parseStudentInfoFromResult
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

  // Handle variations: "Matric No:", "Matric. No:", "Matrlc No:", etc.
  const idRegex =
    /(?:Matric|Matrlc|Matr[il]c)\.?\s*(?:No|N0)\.?[:\s]*([0-9]{8})/i;

  const levelRegex = /Level[:\s]*([0-9]{3}L?)/i;
  const nameRegex = /Name[:\s]*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i;
  const programmeRegex = /Programme[:\s]*([A-Za-z&\s]+?)(?:\s{2,}|$)/i;

  // Extract data
  for (const line of lines) {
    const idMatch = line.match(idRegex);
    if (idMatch && !data.id) {
      data.id = idMatch[1];
      console.log('✅ Matched Matric No:', idMatch[1]);
    }

    const levelMatch = line.match(levelRegex);
    if (levelMatch && !data.level) {
      let level = levelMatch[1].toUpperCase();
      if (!level.endsWith('L')) {
        level += 'L';
      }
      data.level = level;
      console.log('✅ Matched Level:', level);
    }

    const nameMatch = line.match(nameRegex);
    if (nameMatch && !data.name) {
      data.name = nameMatch[1].trim();
      console.log('✅ Matched Name:', nameMatch[1]);
    }

    const programmeMatch = line.match(programmeRegex);
    if (programmeMatch && !data.programme) {
      data.programme = programmeMatch[1].trim();
      console.log('✅ Matched Programme:', programmeMatch[1]);
    }
  }

  console.log('✅ Final Parsed Data From Result:', data);
  return data;
};
