import cloudinary from './src/config/cloudinary';
import fs from 'fs';
import PDFDocument from 'pdfkit';

const run = async () => {
  const doc = new PDFDocument();
  const path = 'test.pdf';
  const writeStream = fs.createWriteStream(path);
  doc.pipe(writeStream);
  doc.text('Hello world');
  doc.end();

  await new Promise<void>((resolve) => writeStream.on('finish', () => resolve()));

  const result = await cloudinary.uploader.upload(path, {
    resource_type: 'raw',
    folder: 'docmaster/test',
    public_id: 'test_pdf.pdf'
  });

  console.log('Upload Result:', result.secure_url);
};

run().catch(console.error);
