import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../../middlewares/auth';
import { ImageToPdfService } from '../service/imageToPdf.service';
import { AppError } from '../../../middlewares/errorHandler';

export class ImageToPdfController {
  private imageToPdfService = new ImageToPdfService();

  convertImages = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return next(new AppError('Please upload at least one image', 400));
      }

      const userId = req.user?.userId;
      if (!userId) {
        return next(new AppError('Unauthorized access', 401));
      }

      const result = await this.imageToPdfService.convertImagesToPDF(userId, files);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}
