import mongoose from 'mongoose';
import { User } from '../model/user.model';
import { IUser } from '../model/user.interface';

// In-memory mock store for testing when database is offline
const mockUsers: any[] = [];

export class UserRepository {
  private isDbConnected(): boolean {
    return mongoose.connection.readyState === 1;
  }

  async findByEmail(email: string): Promise<IUser | null> {
    if (!this.isDbConnected()) {
      const match = mockUsers.find((u) => u.email === email.toLowerCase());
      if (!match) return null;
      return {
        ...match,
        comparePassword: async (pwd: string) => {
          const bcrypt = require('bcryptjs');
          return bcrypt.compare(pwd, match.password);
        },
      } as any;
    }
    return User.findOne({ email }).select('+password');
  }

  async findById(id: string): Promise<IUser | null> {
    if (!this.isDbConnected()) {
      const match = mockUsers.find((u) => u._id === id);
      return match || null;
    }
    return User.findById(id);
  }

  async findByIdWithRefreshToken(id: string): Promise<IUser | null> {
    if (!this.isDbConnected()) {
      const match = mockUsers.find((u) => u._id === id);
      return match || null;
    }
    return User.findById(id).select('+refreshToken');
  }

  async create(userData: Partial<IUser>): Promise<IUser> {
    if (!this.isDbConnected()) {
      const bcrypt = require('bcryptjs');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password || '', salt);

      const newUser = {
        _id: new mongoose.Types.ObjectId().toString(),
        fullName: userData.fullName,
        email: userData.email?.toLowerCase(),
        phone: userData.phone,
        password: hashedPassword,
        avatar: userData.avatar || '',
        refreshToken: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockUsers.push(newUser);
      return newUser as any;
    }
    const user = new User(userData);
    return user.save();
  }

  async updateRefreshToken(userId: string, refreshToken: string | null): Promise<void> {
    if (!this.isDbConnected()) {
      const match = mockUsers.find((u) => u._id === userId);
      if (match) {
        match.refreshToken = refreshToken || '';
      }
      return;
    }
    await User.findByIdAndUpdate(userId, { refreshToken });
  }

  async updateProfile(userId: string, profileData: Partial<IUser>): Promise<IUser | null> {
    if (!this.isDbConnected()) {
      const match = mockUsers.find((u) => u._id === userId);
      if (match) {
        if (profileData.fullName) match.fullName = profileData.fullName;
        if (profileData.phone) match.phone = profileData.phone;
        if (profileData.avatar) match.avatar = profileData.avatar;
        match.updatedAt = new Date();
      }
      return match || null;
    }
    return User.findByIdAndUpdate(userId, profileData, { new: true });
  }

  async updateResetOtp(email: string, otp: string | null, expires: Date | null): Promise<void> {
    if (!this.isDbConnected()) {
      const match = mockUsers.find((u) => u.email === email.toLowerCase());
      if (match) {
        match.resetPasswordOtp = otp || undefined;
        match.resetPasswordOtpExpires = expires || undefined;
      }
      return;
    }
    await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      { resetPasswordOtp: otp, resetPasswordOtpExpires: expires }
    );
  }

  async updatePassword(email: string, passwordHash: string): Promise<void> {
    if (!this.isDbConnected()) {
      const match = mockUsers.find((u) => u.email === email.toLowerCase());
      if (match) {
        match.password = passwordHash;
      }
      return;
    }
    const user = await User.findOne({ email: email.toLowerCase() });
    if (user) {
      user.password = passwordHash;
      await user.save();
    }
  }
}
