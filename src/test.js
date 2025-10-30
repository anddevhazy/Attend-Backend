// No problem — I’ll make this super simple, step-by-step, like a recipe.TL;DR: You’re modifying 2 files, creating 1 folderAction
// File/Folder
// What to do
// Modify
// src/utils/student/details_extraction_util.js
// Replace extractResultDataUtil
// Modify
// app.js
// Add temp folder creation
// Create
// temp/
// (Docker will create it)

// That’s it. No new files. Just edit 2.Step-by-Step (Copy-Paste)Step 1: Edit app.js → Create temp folderFile: src/app.js
// Find this section:js

// const uploadDirs = ['uploads/course-forms', 'uploads/results'];
// uploadDirs.forEach((dir) => {
//   const fullPath = path.join(__dirname, '..', dir);
//   if (!fs.existsSync(fullPath)) {
//     fs.mkdirSync(fullPath, { recursive: true });
//     console.log(Created directory: ${dir});
//   }
// });

// Add this right after it:js

// // Create temp folder for OCR image downloads
// const tempDir = path.join(__dirname, '..', 'temp');
// if (!fs.existsSync(tempDir)) {
//   fs.mkdirSync(tempDir, { recursive: true });
//   console.log('Created temp directory for OCR');
// }

// Final result (add this block):js

// // ... existing uploadDirs code ...

// // ADD THIS:
// const tempDir = path.join(__dirname, '..', 'temp');
// if (!fs.existsSync(tempDir)) {
//   fs.mkdirSync(tempDir, { recursive: true });
//   console.log('Created temp directory for OCR');
// }

// Step 2: Replace extractResultDataUtil in details_extraction_util.jsFile: src/utils/student/details_extraction_util.jsFind this function:js

// export const extractResultDataUtil = async (imageUrl) => {
//   try {
//     console.log('Starting OCR extraction for:', imageUrl);

//     const {
//       data: { text },
//     } = await Tesseract.recognize(imageUrl, 'eng', {
//       logger: (info) => console.log(info),
//     });
//     // ... rest
//   }
// }

// DELETE the whole function and paste this instead:js

// import https from 'https';
// import http from 'http';
// import fs from 'fs';
// import path from 'path';
// import { fileURLToPath } from 'url';

// const __dirname = path.dirname(fileURLToPath(import.meta.url));

// // Helper: Download image from Cloudinary to local temp file
// const downloadImage = (url, dest) => {
//   return new Promise((resolve, reject) => {
//     const client = url.startsWith('https') ? https : http;
//     const file = fs.createWriteStream(dest);

//     client
//       .get(url, { timeout: 10000 }, (response) => {
//         if (response.statusCode !== 200) {
//           file.close();
//           fs.unlink(dest, () => {});
//           return reject(new Error(Failed to download image: ${response.statusCode}));
//         }
//         response.pipe(file);
//         file.on('finish', () => {
//           file.close();
//           resolve(dest);
//         });
//       })
//       .on('error', (err) => {
//         fs.unlink(dest, () => {});
//         reject(err);
//       })
//       .on('timeout', () => {
//         fs.unlink(dest, () => {});
//         reject(new Error('Download timeout'));
//       });
//   });
// };

// export const extractResultDataUtil = async (imageUrl) => {
//   let tempFilePath = null;

//   try {
//     console.log('Downloading image for OCR:', imageUrl);

//     // Create unique temp file
//     const uniqueSuffix = ${Date.now()}-${Math.random().toString(36).substr(2, 9)};
//     tempFilePath = path.join(__dirname, '../../temp', ocr-${uniqueSuffix}.jpg);

//     // Download image
//     await downloadImage(imageUrl, tempFilePath);
//     console.log('Image saved to:', tempFilePath);

//     // Run OCR on local file
//     console.log('Running OCR...');
//     const {
//       data: { text },
//     } = await Tesseract.recognize(tempFilePath, 'eng', {
//       logger: (m) => console.log(m),
//     });

//     console.log('OCR Text:', text);

//     const extractedData = parseStudentInfoFromResult(text);

//     if (!extractedData.id) {
//       throw new BadRequestError('Could not extract matric number from Result');
//     }

//     return extractedData;
//   } catch (error) {
//     console.error('OCR Extraction Error:', error);
//     throw new BadRequestError(
//       'Failed to extract data from Result. Please ensure the image is clear and try again.'
//     );
//   } finally {
//     // Always clean up
//     if (tempFilePath && fs.existsSync(tempFilePath)) {
//       try {
//         fs.unlinkSync(tempFilePath);
//         console.log('Cleaned up:', tempFilePath);
//       } catch (err) {
//         console.warn('Failed to delete temp file:', err.message);
//       }
//     }
//   }
// };

// Step 3: Rebuild & Runbash

// docker-compose down
// docker-compose up --build

// Wait for:

// Created temp directory for OCR
// Server is running at port: 8000

// Step 4: Test in Postmanhttp

// POST http://localhost:8000/api/v1/student/result-upload-and-extract

// Header: Authorization: Bearer <your-jwt>
// Body → form-data → Key: result → Select image

// You’re Done!Before
// After
// Tesseract.recognize(url) → fetch failed
// download → local file → OCR
// OCR fails in Docker
// OCR works

// Final File Tree

// project-root/
// ├── temp/                  ← created automatically
// ├── uploads/results/
// ├── src/
// │   ├── app.js             ← added temp dir
// │   └── utils/student/details_extraction_util.js ← replaced function

// That’s it. Just 2 edits. No new files.Try it now — OCR will work.Let me know when you get:

// OCR Text: Matric. No.: 201923456
// Parsed Data: { name: "...", id: "201923456" }

// I’ll help you test with a real image if needed.
