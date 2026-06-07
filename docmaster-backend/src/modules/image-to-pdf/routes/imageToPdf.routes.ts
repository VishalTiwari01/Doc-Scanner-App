import { Router } from 'express';
import { ImageToPdfController } from '../controller/imageToPdf.controller';
import { authenticateJWT } from '../../../middlewares/auth';
import { upload } from '../../../middlewares/multer';

const router = Router();
const controller = new ImageToPdfController();

/**
 * @swagger
 * /api/v1/pdf/image-to-pdf:
 *   post:
 *     summary: Compile multiple images into a single PDF document
 *     tags: [PDF Tools]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - images
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Set of images (JPG, PNG) to compile into a PDF
 *     responses:
 *       200:
 *         description: Images compiled into PDF successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 pdfUrl:
 *                   type: string
 *                 historyId:
 *                   type: string
 *       400:
 *         description: Bad request or files missing
 *       401:
 *         description: Unauthorized
 */
router.post('/image-to-pdf', authenticateJWT, upload.array('images', 20), controller.convertImages);

export default router;
