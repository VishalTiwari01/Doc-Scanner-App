import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../../middlewares/auth';
import { OCRService } from '../service/ocr.service';
import { AppError } from '../../../middlewares/errorHandler';

export class OCRController {
  private ocrService = new OCRService();

  processOCR = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.file) {
        return next(new AppError('Please upload an image file to scan', 400));
      }

      const userId = req.user?.userId;
      if (!userId) {
        return next(new AppError('Unauthorized access', 401));
      }

      const documentType = (req.body.documentType || 'generic') as 'generic' | 'aadhaar' | 'pan' | 'passport';
      if (!['generic', 'aadhaar', 'pan', 'passport'].includes(documentType)) {
        return next(new AppError('Invalid document type. Must be generic, aadhaar, pan, or passport', 400));
      }

      const result = await this.ocrService.processOCR(userId, req.file, documentType);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}
