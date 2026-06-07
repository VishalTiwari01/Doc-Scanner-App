import { Document } from 'mongoose';

export interface IUser extends Document {
  fullName: string;
  email: string;
  phone: string;
  password?: string;
  avatar?: string;
  refreshToken?: string;
  resetPasswordOtp?: string;
  resetPasswordOtpExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(password: string): Promise<boolean>;
}
