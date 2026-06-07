import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import cloudinary, { isCloudinaryConfigured } from '../../../config/cloudinary';
import { HistoryRepository } from '../../history/repository/history.repository';
import { logger } from '../../../utils/logger';
import { AppError } from '../../../middlewares/errorHandler';

export class ImageToPdfService {
  private historyRepository = new HistoryRepository();

  async convertImagesToPDF(
    userId: string,
    files: Express.Multer.File[]
  ): Promise<{ success: boolean; pdfUrl: string; historyId: string; originalSize: string; pdfSize: string }> {
    if (!files || files.length === 0) {
      throw new AppError('No images uploaded for PDF conversion', 400);
    }

    const outputFileName = `converted_${Date.now()}.pdf`;
    const outputPath = path.join(__dirname, '../../../../uploads', outputFileName);

    try {
      logger.info(`Compiling ${files.length} images into a PDF...`);

      // Initialize PDF Document
      const doc = new PDFDocument({ autoFirstPage: false });
      const writeStream = fs.createWriteStream(outputPath);
      doc.pipe(writeStream);

      // Add each image to a new page
      for (const file of files) {
        // A4 page dimensions in PDF points: 595.28 x 841.89
        doc.addPage({ size: 'A4' });
        doc.image(file.path, 0, 0, {
          fit: [595.28, 841.89],
          align: 'center',
          valign: 'center',
        });
      }

      // End PDF definition
      doc.end();

      // Wait for file writing to finish
      await new Promise<void>((resolve, reject) => {
        writeStream.on('finish', () => resolve());
        writeStream.on('error', (err) => reject(err));
      });

      logger.info(`PDF compile finished: ${outputPath}`);

      let resultUrl = '';
      
      // Upload generated PDF to Cloudinary or serve locally
      if (isCloudinaryConfigured()) {
        logger.info(`Uploading compiled PDF ${outputFileName} to Cloudinary...`);
        const uploadResult = await cloudinary.uploader.upload(outputPath, {
          resource_type: 'auto',
          folder: 'docmaster/compiled-pdfs',
        });
        resultUrl = uploadResult.secure_url;
      } else {
        resultUrl = `http://localhost:5000/uploads/${outputFileName}`;
      }

      // Calculate sum of input image sizes
      const totalOriginalBytes = files.reduce((sum, f) => sum + f.size, 0);
      const totalOriginalSizeStr = this.formatBytes(totalOriginalBytes);

      // Get output size
      const outputStats = fs.statSync(outputPath);
      const outputSizeStr = this.formatBytes(outputStats.size);

      // Save to FileHistory
      const historyItem = await this.historyRepository.create({
        userId: userId as any,
        operation: 'jpg_to_pdf',
        fileName: `Images_To_PDF_${Date.now().toString().slice(-4)}.pdf`,
        originalSize: totalOriginalSizeStr,
        compressedSize: outputSizeStr,
        originalUrl: resultUrl, // URL of output
        resultUrl,
      });

      // Cleanup local images & generated PDF if using Cloudinary
      if (isCloudinaryConfigured()) {
        fs.unlinkSync(outputPath);
        for (const file of files) {
          if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        }
      } else {
        // Keep output PDF for local static downloading, but delete individual uploaded images
        for (const file of files) {
          if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        }
      }

      return {
        success: true,
        pdfUrl: resultUrl,
        historyId: historyItem._id.toString(),
        originalSize: totalOriginalSizeStr,
        pdfSize: outputSizeStr,
      };
    } catch (error: any) {
      logger.error(`Image to PDF conversion failed: ${error.message}`);
      // Clean up files in case of error
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      for (const file of files) {
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      }
      throw new AppError(`Image to PDF conversion failed: ${error.message}`, 500);
    }
  }

  private formatBytes(bytes: number, decimals = 2): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
}
