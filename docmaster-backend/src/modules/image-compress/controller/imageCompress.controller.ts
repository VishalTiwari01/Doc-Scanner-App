import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../../middlewares/auth';
import { ImageCompressService } from '../service/imageCompress.service';

export class ImageCompressController {
  private imageCompressService = new ImageCompressService();

  compressImage = async (
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

      const file = req.file;
      if (!file) {
        res.status(400).json({ success: false, message: 'No image file uploaded' });
        return;
      }

      // Default compression level is 'medium' if not specified
      const compressionLevel = (req.body.compressionLevel || 'medium') as 'low' | 'medium' | 'high';

      // Call service
      const result = await this.imageCompressService.compressImage(userId, file, compressionLevel);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}
