import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../../middlewares/auth';
import { HistoryRepository } from '../repository/history.repository';
import { OCRHistoryRepository } from '../../ocr/repository/ocrHistory.repository';

export class HistoryController {
  private historyRepository = new HistoryRepository();
  private ocrHistoryRepository = new OCRHistoryRepository();

  getUserHistory = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const fileHistories = await this.historyRepository.findByUserId(userId);
      const ocrHistories = await this.ocrHistoryRepository.findByUserId(userId);

      // Map file histories to a unified shape
      const mappedFiles = fileHistories.map((fh: any) => ({
        id: fh._id || fh.id,
        type: fh.operation, // 'pdf_compress' | 'jpg_to_pdf'
        fileName: fh.fileName,
        originalSize: fh.originalSize,
        compressedSize: fh.compressedSize,
        originalUrl: fh.originalUrl,
        resultUrl: fh.resultUrl,
        createdAt: fh.createdAt,
      }));

      // Map OCR histories to a unified shape
      const mappedOcr = ocrHistories.map((ocr: any) => ({
        id: ocr._id || ocr.id,
        type: 'ocr',
        fileName: `${ocr.documentType.charAt(0).toUpperCase() + ocr.documentType.slice(1)}_OCR.txt`,
        originalSize: `${ocr.extractedText ? ocr.extractedText.length : 0} chars`,
        compressedSize: ocr.documentType, // e.g. generic, pan, aadhaar, passport
        originalUrl: ocr.imageUrl,
        resultUrl: ocr.imageUrl,
        createdAt: ocr.createdAt,
        extractedText: ocr.extractedText,
        structuredData: ocr.structuredData,
      }));

      // Combine and sort by date descending
      const combined = [...mappedFiles, ...mappedOcr].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      res.status(200).json({
        success: true,
        data: combined,
      });
    } catch (error) {
      next(error);
    }
  };

  deleteHistoryItem = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      if (!id) {
        res.status(400).json({ success: false, message: 'Missing history item ID' });
        return;
      }

      // Try deleting from file histories
      let deleted = await this.historyRepository.deleteByIdAndUser(id, userId);
      
      // If not deleted, try deleting from OCR histories
      if (!deleted) {
        deleted = await this.ocrHistoryRepository.deleteByIdAndUser(id, userId);
      }

      if (!deleted) {
        res.status(404).json({ success: false, message: 'History item not found or unauthorized' });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'History item deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };
}
