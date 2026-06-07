import { Schema, model, Document } from 'mongoose';

export interface IFileHistory extends Document {
  userId: Schema.Types.ObjectId;
  operation: 'pdf_compress' | 'jpg_to_pdf' | 'image_compress';
  fileName: string;
  originalSize?: string;
  compressedSize?: string;
  originalUrl: string;
  resultUrl: string;
  createdAt: Date;
}

const fileHistorySchema = new Schema<IFileHistory>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    operation: { type: String, enum: ['pdf_compress', 'jpg_to_pdf', 'image_compress'], required: true },
    fileName: { type: String, required: true },
    originalSize: { type: String },
    compressedSize: { type: String },
    originalUrl: { type: String, required: true },
    resultUrl: { type: String, required: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const FileHistory = model<IFileHistory>('FileHistory', fileHistorySchema);
