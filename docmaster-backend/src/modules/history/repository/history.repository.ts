import mongoose from 'mongoose';
import { FileHistory, IFileHistory } from '../model/history.model';

// In-memory file history store for testing when database is offline
const mockFileHistory: any[] = [];

export class HistoryRepository {
  private isDbConnected(): boolean {
    return mongoose.connection.readyState === 1;
  }

  async create(historyData: Partial<IFileHistory>): Promise<IFileHistory> {
    if (!this.isDbConnected()) {
      const newItem = {
        _id: new mongoose.Types.ObjectId().toString(),
        userId: historyData.userId,
        operation: historyData.operation,
        fileName: historyData.fileName,
        originalSize: historyData.originalSize,
        compressedSize: historyData.compressedSize,
        originalUrl: historyData.originalUrl,
        resultUrl: historyData.resultUrl,
        createdAt: new Date(),
      };
      mockFileHistory.push(newItem);
      return newItem as any;
    }
    const history = new FileHistory(historyData);
    return history.save();
  }

  async findByUserId(userId: string): Promise<IFileHistory[]> {
    if (!this.isDbConnected()) {
      return mockFileHistory
        .filter((item) => item.userId?.toString() === userId.toString())
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    return FileHistory.find({ userId }).sort({ createdAt: -1 });
  }

  async deleteByIdAndUser(id: string, userId: string): Promise<boolean> {
    if (!this.isDbConnected()) {
      const index = mockFileHistory.findIndex(
        (item) => item._id?.toString() === id.toString() && item.userId?.toString() === userId.toString()
      );
      if (index !== -1) {
        mockFileHistory.splice(index, 1);
        return true;
      }
      return false;
    }
    const result = await FileHistory.deleteOne({ _id: id, userId });
    return result.deletedCount > 0;
  }
}
