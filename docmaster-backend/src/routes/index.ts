import { Router } from 'express';
import authRouter from '../modules/auth/routes/auth.routes';
import compressRouter from '../modules/compress-pdf/routes/compress.routes';
import imageToPdfRouter from '../modules/image-to-pdf/routes/imageToPdf.routes';
import ocrRouter from '../modules/ocr/routes/ocr.routes';
import historyRouter from '../modules/history/routes/history.routes';
import imageCompressRouter from '../modules/image-compress/routes/imageCompress.routes';


const router = Router();

// Register routers
router.use('/auth', authRouter);
router.use('/pdf', compressRouter);
router.use('/pdf', imageToPdfRouter);
router.use('/ocr', ocrRouter);
router.use('/history', historyRouter);
router.use('/image', imageCompressRouter);


router.get('/status', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'DocMaster API v1 is fully operational',
    version: '1.0.3-email-bypass',
    timestamp: new Date(),
    env: process.env.NODE_ENV || 'development'
  });
});

export default router;
