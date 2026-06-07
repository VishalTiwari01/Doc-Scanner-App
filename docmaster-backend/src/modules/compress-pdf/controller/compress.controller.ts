import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../../middlewares/auth';
import { CompressService } from '../service/compress.service';
import { AppError } from '../../../middlewares/errorHandler';

export class CompressController {
  private compressService = new CompressService();

  compressPDF = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.file) {
        return next(new AppError('Please upload a PDF file', 400));
      }

      const userId = req.user?.userId;
      if (!userId) {
        return next(new AppError('Unauthorized access', 401));
      }

      const compressionLevel = (req.body.compressionLevel || 'medium') as 'low' | 'medium' | 'high';
      if (!['low', 'medium', 'high'].includes(compressionLevel)) {
        return next(new AppError('Invalid compression level. Choose low, medium, or high', 400));
      }

      const result = await this.compressService.compressPDF(
        userId,
        req.file,
        compressionLevel
      );

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}
