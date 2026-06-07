import { Router } from 'express';
import { ImageCompressController } from '../controller/imageCompress.controller';
import { upload } from '../../../middlewares/multer';
import { authenticateJWT } from '../../../middlewares/auth';

const router = Router();
const controller = new ImageCompressController();

/**
 * @swagger
 * /api/v1/image/compress:
 *   post:
 *     summary: Compress an uploaded image
 *     tags: [Image Compression]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Image file to compress (jpeg, png, webp)
 *               compressionLevel:
 *                 type: string
 *                 enum: [low, medium, high]
 *                 default: medium
 *                 description: Target compression level
 *     responses:
 *       200:
 *         description: Image compressed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 fileName:
 *                   type: string
 *                 originalSize:
 *                   type: string
 *                 compressedSize:
 *                   type: string
 *                 downloadUrl:
 *                   type: string
 *                 historyId:
 *                   type: string
 */
router.post('/compress', authenticateJWT, upload.single('image'), controller.compressImage);

export default router;
