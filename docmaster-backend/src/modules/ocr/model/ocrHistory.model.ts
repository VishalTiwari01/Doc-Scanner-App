import { Schema, model, Document } from 'mongoose';

export interface IOCRHistory extends Document {
  userId: Schema.Types.ObjectId;
  imageUrl: string;
  extractedText: string;
  documentType: 'generic' | 'aadhaar' | 'pan' | 'passport';
  structuredData?: Record<string, any>;
  createdAt: Date;
}

const ocrHistorySchema = new Schema<IOCRHistory>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    imageUrl: { type: String, required: true },
    extractedText: { type: String, required: true },
    documentType: {
      type: String,
      enum: ['generic', 'aadhaar', 'pan', 'passport'],
      required: true,
    },
    structuredData: { type: Schema.Types.Mixed },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const OCRHistory = model<IOCRHistory>('OCRHistory', ocrHistorySchema);
