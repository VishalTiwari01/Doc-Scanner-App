import { Router } from 'express';
import { CompressController } from '../controller/compress.controller';
import { proxyDownload } from '../controller/download.controller';
import { authenticateJWT } from '../../../middlewares/auth';
import { upload } from '../../../middlewares/multer';

const router = Router();
const controller = new CompressController();

router.post('/compress', authenticateJWT, upload.single('file'), controller.compressPDF);

/**
 * GET /api/v1/pdf/download?url=<encoded_url>
 * Proxy download: fetches a file from Cloudinary or local storage and
 * streams it to the client. Requires JWT so only authenticated users can
 * download — and avoids sending our JWT to external CDNs directly.
 */
router.get('/download', authenticateJWT, proxyDownload);

export default router;
