import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import cloudinary, { isCloudinaryConfigured } from '../../../config/cloudinary';
import { HistoryRepository } from '../../history/repository/history.repository';
import { logger } from '../../../utils/logger';
import { AppError } from '../../../middlewares/errorHandler';

export class ImageCompressService {
  private historyRepository = new HistoryRepository();

  private formatBytes(bytes: number, decimals = 2): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  async compressImage(
    userId: string,
    file: Express.Multer.File,
    compressionLevel: 'low' | 'medium' | 'high'
  ) {
    if (!file) {
      throw new AppError('No image file uploaded', 400);
    }

    const originalSizeBytes = file.size;
    const originalSizeStr = this.formatBytes(originalSizeBytes);

    // Set compression and resizing parameters
    let quality = 50;
    let maxWidth = 1200;

    if (compressionLevel === 'low') {
      quality = 80;
      maxWidth = 1920;
    } else if (compressionLevel === 'high') {
      quality = 25;
      maxWidth = 800;
    }

    const compressedFileName = `compressed_${Date.now()}_${file.originalname}`;
    const outputPath = path.join(__dirname, '../../../../uploads', compressedFileName);

    try {
      logger.info(`Starting image compression. Original: ${file.path}, Quality: ${quality}, Max Width: ${maxWidth}`);

      // Initialize sharp pipeline
      let pipeline = sharp(file.path);
      const metadata = await pipeline.metadata();
      const originalFormat = metadata.format;

      // Resize if the image is wider than maxWidth
      pipeline = pipeline.resize({
        width: maxWidth,
        withoutEnlargement: true,
        fit: 'inside',
      });

      // Apply quality compression based on format
      if (originalFormat === 'png') {
        pipeline = pipeline.png({ quality, compressionLevel: 9 });
      } else if (originalFormat === 'webp') {
        pipeline = pipeline.webp({ quality });
      } else if (originalFormat === 'gif') {
        // GIF compression is limited, but we can attempt to pass it through
        pipeline = pipeline.gif();
      } else {
        // Default to JPEG
        pipeline = pipeline.jpeg({ quality, progressive: true });
      }

      // Output to local file first
      await pipeline.toFile(outputPath);

      // Verify the compressed file exists and retrieve its stats
      if (!fs.existsSync(outputPath)) {
        throw new Error('Sharp processing failed to write output file');
      }

      const compressedStats = fs.statSync(outputPath);
      const compressedSizeBytes = compressedStats.size;
      const compressedSizeStr = this.formatBytes(compressedSizeBytes);

      let resultUrl = '';
      let originalUrl = '';

      if (isCloudinaryConfigured()) {
        logger.info(`Uploading original and compressed image to Cloudinary...`);
        // Upload original
        const origResult = await cloudinary.uploader.upload(file.path, {
          folder: 'docmaster/images/original',
        });
        originalUrl = origResult.secure_url;

        // Upload compressed
        const compResult = await cloudinary.uploader.upload(outputPath, {
          folder: 'docmaster/images/compressed',
        });
        resultUrl = compResult.secure_url;

        // Cleanup local copies since they are now on Cloudinary
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      } else {
        logger.info(`Cloudinary not configured. Serving local static file.`);
        // Store relative paths; client base URL resolves host
        originalUrl = `/uploads/${file.filename}`;
        resultUrl = `/uploads/${compressedFileName}`;

        // Cleanup only the uploaded temp file, but keep the output compressed file
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      }

      // Log into history
      const historyItem = await this.historyRepository.create({
        userId: userId as any,
        operation: 'image_compress',
        fileName: file.originalname,
        originalSize: originalSizeStr,
        compressedSize: compressedSizeStr,
        originalUrl,
        resultUrl,
      });

      logger.info(`Image compressed successfully. Saved: ${originalSizeStr} -> ${compressedSizeStr}`);

      return {
        success: true,
        fileName: file.originalname,
        originalSize: originalSizeStr,
        compressedSize: compressedSizeStr,
        downloadUrl: resultUrl,
        historyId: historyItem._id,
      };
    } catch (error: any) {
      logger.error(`Image compression failed: ${error.message}`);
      // Cleanup files in case of error
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      throw new AppError(`Image compression failed: ${error.message}`, 500);
    }
  }
}
