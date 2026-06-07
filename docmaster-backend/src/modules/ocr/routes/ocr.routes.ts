import { Router } from 'express';
import { OCRController } from '../controller/ocr.controller';
import { authenticateJWT } from '../../../middlewares/auth';
import { upload } from '../../../middlewares/multer';

const router = Router();
const controller = new OCRController();

/**
 * @swagger
 * /api/v1/ocr/process:
 *   post:
 *     summary: Run text extraction and details parsing on an image card
 *     tags: [OCR Scanner]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Document image photo to extract details from
 *               documentType:
 *                 type: string
 *                 enum: [generic, aadhaar, pan, passport]
 *                 default: generic
 *                 description: Type of document card to run parsing formats against
     *     responses:
 *       200:
 *         description: OCR processing completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 documentType:
 *                   type: string
 *                 extractedText:
 *                   type: string
 *                 structuredData:
 *                   type: object
 *                 imageUrl:
 *                   type: string
 *       400:
 *         description: Bad request or file missing
 *       401:
 *         description: Unauthorized
 */
router.post('/process', authenticateJWT, upload.single('image'), controller.processOCR);

export default router;
