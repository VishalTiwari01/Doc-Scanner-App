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


export default router;
