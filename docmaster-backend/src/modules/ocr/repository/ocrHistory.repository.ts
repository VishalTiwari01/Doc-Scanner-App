import mongoose from 'mongoose';
import { OCRHistory, IOCRHistory } from '../model/ocrHistory.model';

// In-memory OCR history store for testing when database is offline
const mockOCRHistory: any[] = [];

export class OCRHistoryRepository {
  private isDbConnected(): boolean {
    return mongoose.connection.readyState === 1;
  }

  async create(ocrData: Partial<IOCRHistory>): Promise<IOCRHistory> {
    if (!this.isDbConnected()) {
      const newItem = {
        _id: new mongoose.Types.ObjectId().toString(),
        userId: ocrData.userId,
        imageUrl: ocrData.imageUrl,
        extractedText: ocrData.extractedText,
        documentType: ocrData.documentType,
        structuredData: ocrData.structuredData,
        createdAt: new Date(),
      };
      mockOCRHistory.push(newItem);
      return newItem as any;
    }
    const ocrHistory = new OCRHistory(ocrData);
    return ocrHistory.save();
  }

  async findByUserId(userId: string): Promise<IOCRHistory[]> {
    if (!this.isDbConnected()) {
      return mockOCRHistory
        .filter((item) => item.userId?.toString() === userId.toString())
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    return OCRHistory.find({ userId }).sort({ createdAt: -1 });
  }

  async deleteByIdAndUser(id: string, userId: string): Promise<boolean> {
    if (!this.isDbConnected()) {
      const index = mockOCRHistory.findIndex(
        (item) => item._id?.toString() === id.toString() && item.userId?.toString() === userId.toString()
      );
      if (index !== -1) {
        mockOCRHistory.splice(index, 1);
        return true;
      }
      return false;
    }
    const result = await OCRHistory.deleteOne({ _id: id, userId });
    return result.deletedCount > 0;
  }
}
