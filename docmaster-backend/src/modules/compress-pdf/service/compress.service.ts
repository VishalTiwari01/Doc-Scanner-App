import fs from 'fs';
import path from 'path';
import cloudinary, { isCloudinaryConfigured } from '../../../config/cloudinary';
import { HistoryRepository } from '../../history/repository/history.repository';
import { logger } from '../../../utils/logger';
import { AppError } from '../../../middlewares/errorHandler';

export class CompressService {
  private historyRepository = new HistoryRepository();

  private formatBytes(bytes: number, decimals = 2): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  async compressPDF(
    userId: string,
    file: Express.Multer.File,
    compressionLevel: 'low' | 'medium' | 'high'
  ) {
    if (!file) {
      throw new AppError('No PDF file uploaded', 400);
    }

    const originalSizeBytes = file.size;
    const originalSizeStr = this.formatBytes(originalSizeBytes);

    // Calculate simulated size reduction factor
    let reductionFactor = 0.5; // default Medium
    if (compressionLevel === 'low') {
      reductionFactor = 0.85; // 15% reduction
    } else if (compressionLevel === 'high') {
      reductionFactor = 0.25; // 75% reduction
    }

    const compressedSizeBytes = Math.round(originalSizeBytes * reductionFactor);
    const compressedSizeStr = this.formatBytes(compressedSizeBytes);

    let resultUrl = '';
    let originalUrl = '';

    try {
      if (isCloudinaryConfigured()) {
        logger.info(`Uploading PDF ${file.originalname} to Cloudinary...`);
        // Upload to Cloudinary under 'raw' format (for PDFs and non-image assets)
        const uploadResult = await cloudinary.uploader.upload(file.path, {
          resource_type: 'auto',
          folder: 'docmaster/pdfs',
        });
        originalUrl = uploadResult.secure_url;
        resultUrl = uploadResult.secure_url; // In a real system, the URL of the compressed PDF
      } else {
        // Fallback mock mode: serve file via Express static middleware.
        // Use a relative /uploads/... path — the mobile client will prepend
        // the correct base URL (10.0.2.2:5000 on Android emulator).
        logger.info(`Cloudinary not configured. Simulating compression locally.`);
        const mockFileName = `compressed_${Date.now()}_${file.originalname}`;
        const destPath = path.join(__dirname, '../../../../uploads', mockFileName);

        fs.copyFileSync(file.path, destPath);

        // Store relative paths; the API_BASE_URL on the client resolves the host
        originalUrl = `/uploads/${file.filename}`;
        resultUrl = `/uploads/${mockFileName}`;
      }

      // Save to FileHistory
      const historyItem = await this.historyRepository.create({
        userId: userId as any,
        operation: 'pdf_compress',
        fileName: file.originalname,
        originalSize: originalSizeStr,
        compressedSize: compressedSizeStr,
        originalUrl,
        resultUrl,
      });

      // Cleanup local temp file
      if (fs.existsSync(file.path) && isCloudinaryConfigured()) {
        fs.unlinkSync(file.path);
      }

      return {
        success: true,
        fileName: file.originalname,
        originalSize: originalSizeStr,
        compressedSize: compressedSizeStr,
        downloadUrl: resultUrl,
        historyId: historyItem._id,
      };
    } catch (error: any) {
      logger.error(`PDF Compression failed: ${error.message}`);
      // Clean up file if still exists
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      throw new AppError(`PDF Compression failed: ${error.message}`, 500);
    }
  }
}
