import { Request, Response } from 'express';
import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { AppError } from '../../../middlewares/errorHandler';
import { logger } from '../../../utils/logger';
import cloudinary from '../../../config/cloudinary';

/**
 * Proxy download controller.
 * Fetches the file from `url` query param (Cloudinary or local /uploads/ path)
 * and pipes it to the response. This avoids the mobile client sending
 * auth headers directly to external CDNs, which causes 401 errors.
 */
export const proxyDownload = async (req: Request, res: Response): Promise<void> => {
  const fileUrl = req.query.url as string;

  if (!fileUrl) {
    res.status(400).json({ success: false, message: 'Missing url query parameter' });
    return;
  }

  try {
    // Case 1: relative /uploads/ path — serve from local filesystem
    if (fileUrl.startsWith('/uploads/')) {
      const filePath = path.join(__dirname, '../../../../uploads', path.basename(fileUrl));
      if (!fs.existsSync(filePath)) {
        res.status(404).json({ success: false, message: 'File not found' });
        return;
      }
      res.setHeader('Content-Disposition', `attachment; filename="${path.basename(filePath)}"`);
      res.setHeader('Content-Type', 'application/pdf');
      const stream = fs.createReadStream(filePath);
      stream.pipe(res);
      return;
    }

    // Case 2: external URL (Cloudinary https://...) — proxy it
    if (!fileUrl.startsWith('http://') && !fileUrl.startsWith('https://')) {
      res.status(400).json({ success: false, message: 'Invalid URL format' });
      return;
    }

    let targetUrl = fileUrl;

    // Generate signed private download URL if it's a Cloudinary URL to bypass ACL rules
    if (fileUrl.includes('res.cloudinary.com')) {
      const match = fileUrl.match(
        /res\.cloudinary\.com\/[^/]+\/(image|video|raw)\/(upload|private|authenticated)\/(?:v\d+\/)?([^?#]+)$/
      );
      if (match) {
        const resourceType = match[1];
        const type = match[2];
        const fullPath = match[3];
        const lastDotIndex = fullPath.lastIndexOf('.');
        const publicId = lastDotIndex !== -1 ? fullPath.substring(0, lastDotIndex) : fullPath;
        const format = lastDotIndex !== -1 ? fullPath.substring(lastDotIndex + 1) : '';

        targetUrl = cloudinary.utils.private_download_url(publicId, format, {
          resource_type: resourceType,
          type: type,
        });
        logger.info(`Generated Cloudinary private download URL for proxy: ${targetUrl}`);
      }
    }

    const client = targetUrl.startsWith('https://') ? https : http;

    const proxyReq = client.get(targetUrl, (proxyRes) => {
      if (proxyRes.statusCode !== 200) {
        logger.error(`Proxy download failed for ${fileUrl}: status ${proxyRes.statusCode}`);
        res.status(proxyRes.statusCode || 502).json({
          success: false,
          message: `Upstream returned ${proxyRes.statusCode}`,
        });
        return;
      }

      // Forward content headers
      const contentType = proxyRes.headers['content-type'] || 'application/octet-stream';
      const contentLength = proxyRes.headers['content-length'];
      res.setHeader('Content-Type', contentType);
      if (contentLength) res.setHeader('Content-Length', contentLength);

      // Extract filename from URL
      const urlParts = fileUrl.split('/');
      const rawName = urlParts[urlParts.length - 1].split('?')[0];
      const fileName = rawName || 'download.pdf';
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

      proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
      logger.error(`Proxy request error: ${err.message}`);
      if (!res.headersSent) {
        res.status(502).json({ success: false, message: 'Proxy download error' });
      }
    });
  } catch (err: any) {
    logger.error(`proxyDownload error: ${err.message}`);
    throw new AppError(`Proxy download failed: ${err.message}`, 500);
  }
};
