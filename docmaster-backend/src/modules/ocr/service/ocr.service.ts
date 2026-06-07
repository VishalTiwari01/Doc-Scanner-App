import fs from 'fs';
import vision from '@google-cloud/vision';
import Tesseract from 'tesseract.js';
import cloudinary, { isCloudinaryConfigured } from '../../../config/cloudinary';
import { OCRHistoryRepository } from '../repository/ocrHistory.repository';
import { logger } from '../../../utils/logger';
import { AppError } from '../../../middlewares/errorHandler';
import { config } from '../../../config';

export class OCRService {
  private ocrHistoryRepository = new OCRHistoryRepository();

  async processOCR(
    userId: string,
    file: Express.Multer.File,
    documentType: 'generic' | 'aadhaar' | 'pan' | 'passport'
  ) {
    if (!file) {
      throw new AppError('No image uploaded for OCR processing', 400);
    }

    let extractedText = '';

    try {
      // 1. Run OCR Engine (Google Vision with Tesseract fallback)
      const credentialsPath = config.google.visionCredentialsPath;
      
      if (credentialsPath && fs.existsSync(credentialsPath)) {
        logger.info(`Google Vision API configured. Performing Google Cloud OCR scan.`);
        const client = new vision.ImageAnnotatorClient({ keyFilename: credentialsPath });
        const [result] = await client.textDetection(file.path);
        const detections = result.textAnnotations;
        extractedText = detections && detections[0] ? detections[0].description || '' : '';
      } else {
        logger.info(`Google Vision API credentials missing or invalid. Falling back to local Tesseract OCR.`);
        const tesseractResult = await Tesseract.recognize(file.path, 'eng');
        extractedText = tesseractResult.data.text;
      }

      if (!extractedText || extractedText.trim().length === 0) {
        throw new AppError('OCR failed to extract any readable text from the image', 422);
      }

      logger.info(`OCR Raw Text Extracted. Length: ${extractedText.length} characters.`);

      // 2. Parse Structured Data based on Document Type
      let structuredData: Record<string, any> = {};
      if (documentType !== 'generic') {
        structuredData = this.parseDocumentData(extractedText, documentType);
      }

      // 3. Upload Image to Cloudinary or serve locally
      let imageUrl = '';
      if (isCloudinaryConfigured()) {
        logger.info(`Uploading scanned image to Cloudinary...`);
        const uploadResult = await cloudinary.uploader.upload(file.path, {
          folder: 'docmaster/ocr-scans',
        });
        imageUrl = uploadResult.secure_url;
      } else {
        imageUrl = `http://localhost:5000/uploads/${file.filename}`;
      }

      // 4. Record to OCRHistory Collection
      const historyItem = await this.ocrHistoryRepository.create({
        userId: userId as any,
        imageUrl,
        extractedText,
        documentType,
        structuredData,
      });

      // Cleanup local uploaded file if using Cloudinary
      if (isCloudinaryConfigured() && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }

      return {
        success: true,
        documentType,
        extractedText,
        structuredData,
        imageUrl,
        historyId: historyItem._id,
      };
    } catch (error: any) {
      logger.error(`OCR Processing failed: ${error.message}`);
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      throw new AppError(`OCR Processing failed: ${error.message}`, 500);
    }
  }

  /**
   * Parse details like Name, ID numbers, DOB, and Gender using Regular Expressions
   */
  private parseDocumentData(text: string, type: 'aadhaar' | 'pan' | 'passport'): Record<string, any> {
    const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
    const data: Record<string, any> = {};

    // Standard DOB regex matching DD/MM/YYYY or DD-MM-YYYY
    const dobRegex = /\b(\d{2})[\/\-](\d{2})[\/\-](\d{4})\b/;
    const dobMatch = text.match(dobRegex);
    if (dobMatch) {
      data.dob = dobMatch[0];
    }

    if (type === 'aadhaar') {
      // Aadhaar Number: XXXX XXXX XXXX or XXXXXXXXXXXX
      const aadhaarRegex = /\b\d{4}\s\d{4}\s\d{4}\b|\b\d{12}\b/;
      const aadhaarMatch = text.match(aadhaarRegex);
      if (aadhaarMatch) {
        data.aadhaarNumber = aadhaarMatch[0];
      }

      // Gender: Male / Female
      const genderRegex = /\b(Male|Female|MALE|FEMALE|TRANSGENDER)\b/i;
      const genderMatch = text.match(genderRegex);
      if (genderMatch) {
        data.gender = genderMatch[0].charAt(0).toUpperCase() + genderMatch[0].slice(1).toLowerCase();
      }

      // Extract Name (Aadhaar Name is often the line before or near Father's name or after Government headers)
      // Standard search looks for lines with capital alphabetical names
      const nameLine = lines.find((line) => {
        // Exclude government headers, address text, dates, numbers, gender
        return (
          /^[A-Z\s]+$/.test(line) &&
          !/GOVERNMENT/i.test(line) &&
          !/INDIA/i.test(line) &&
          !/UNIQUE/i.test(line) &&
          !/MALE/i.test(line) &&
          !/FEMALE/i.test(line) &&
          line.split(' ').length >= 2
        );
      });
      data.name = nameLine || 'Not found';
    } 
    
    else if (type === 'pan') {
      // PAN Number: 5 letters, 4 digits, 1 letter
      const panRegex = /\b[A-Z]{5}\d{4}[A-Z]\b/;
      const panMatch = text.toUpperCase().match(panRegex);
      if (panMatch) {
        data.panNumber = panMatch[0];
      }

      // In Indian PAN card, Name is typically on line 3, Father Name on line 4
      let incomeTaxLineIndex = -1;
      lines.forEach((line, idx) => {
        if (/INCOME\s+TAX/i.test(line) || /GOVT\s+OF\s+INDIA/i.test(line)) {
          incomeTaxLineIndex = idx;
        }
      });

      if (incomeTaxLineIndex !== -1 && lines.length > incomeTaxLineIndex + 2) {
        data.name = lines[incomeTaxLineIndex + 1] || 'Not found';
        data.fatherName = lines[incomeTaxLineIndex + 2] || 'Not found';
      } else {
        // Fallback simple line detection
        const cleanLines = lines.filter((l) => /^[A-Z\s]+$/.test(l) && !/INCOME|TAX|GOVT|INDIA|CARD|DEPARTMENT/i.test(l));
        data.name = cleanLines[0] || 'Not found';
        data.fatherName = cleanLines[1] || 'Not found';
      }
    } 
    
    else if (type === 'passport') {
      // Passport Number: typically starts with letter followed by 7 digits
      const passportRegex = /\b[A-Z]\d{7}\b/;
      const passportMatch = text.toUpperCase().match(passportRegex);
      if (passportMatch) {
        data.passportNumber = passportMatch[0];
      }

      // Nationality: matches standard capitalized words representing nationalities
      const nationalityRegex = /\b(INDIAN|AMERICAN|BRITISH|CANADIAN|GERMAN|FRENCH|AUSTRALIAN|JAPANESE|CHINESE)\b/i;
      const nationalityMatch = text.match(nationalityRegex);
      if (nationalityMatch) {
        data.nationality = nationalityMatch[0].toUpperCase();
      }

      // Surname and Given name are often clearly labeled Surname/Name or extracted from top lines
      const passportNameLines = lines.filter(
        (l) => /^[A-Z\s]+$/.test(l) && !/REPUBLIC|PASSPORT|COUNTRY|NATIONALITY|CODE|SEX/i.test(l)
      );
      data.name = passportNameLines.join(' ').trim() || 'Not found';
    }

    return data;
  }
}
