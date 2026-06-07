import { Schema, model } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser } from './user.interface';

const userSchema = new Schema<IUser>(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    password: { type: String, required: true, select: false },
    avatar: { type: String, default: '' },
    refreshToken: { type: String, select: false },
    resetPasswordOtp: { type: String },
    resetPasswordOtpExpires: { type: Date },
  },
  {
    timestamps: true,
  }
);

// Pre-save password hashing hook
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    if (!this.password) return next();
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(this.password, salt);
    this.password = hashedPassword;
    next();
  } catch (error: any) {
    next(error);
  }
});

// Instance method to check password validity
userSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.password);
};

export const User = model<IUser>('User', userSchema);
