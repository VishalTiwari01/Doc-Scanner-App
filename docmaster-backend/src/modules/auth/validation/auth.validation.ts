import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../../middlewares/errorHandler';

export const validateRegister = (req: Request, res: Response, next: NextFunction) => {
  const { fullName, email, phone, password } = req.body;

  if (!fullName || typeof fullName !== 'string' || fullName.trim().length === 0) {
    return next(new AppError('Full name is required', 400));
  }

  if (!email || typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email)) {
    return next(new AppError('A valid email address is required', 400));
  }

  if (!phone || typeof phone !== 'string' || phone.trim().length < 8) {
    return next(new AppError('A valid phone number is required (min 8 characters)', 400));
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    return next(new AppError('Password is required and must be at least 6 characters long', 400));
  }

  next();
};

export const validateLogin = (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;

  if (!email || typeof email !== 'string') {
    return next(new AppError('Email is required', 400));
  }

  if (!password || typeof password !== 'string') {
    return next(new AppError('Password is required', 400));
  }

  next();
};

export const validateRefresh = (req: Request, res: Response, next: NextFunction) => {
  const { refreshToken } = req.body;

  if (!refreshToken || typeof refreshToken !== 'string') {
    return next(new AppError('Refresh token is required', 400));
  }

  next();
};

export const validateProfileUpdate = (req: Request, res: Response, next: NextFunction) => {
  const { fullName, phone, email } = req.body;

  if (fullName !== undefined && (typeof fullName !== 'string' || fullName.trim().length === 0)) {
    return next(new AppError('Full name cannot be empty', 400));
  }

  if (phone !== undefined && (typeof phone !== 'string' || phone.trim().length < 8)) {
    return next(new AppError('Phone number must be at least 8 characters long', 400));
  }

  if (email !== undefined && (typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email))) {
    return next(new AppError('Email must be valid', 400));
  }

  next();
};

export const validateForgotPassword = (req: Request, res: Response, next: NextFunction) => {
  const { email } = req.body;

  if (!email || typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email)) {
    return next(new AppError('A valid email address is required', 400));
  }

  next();
};

export const validateResetPassword = (req: Request, res: Response, next: NextFunction) => {
  const { email, otp, newPassword } = req.body;

  if (!email || typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email)) {
    return next(new AppError('A valid email address is required', 400));
  }

  if (!otp || typeof otp !== 'string' || otp.trim().length !== 6) {
    return next(new AppError('A valid 6-digit OTP code is required', 400));
  }

  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
    return next(new AppError('New password is required and must be at least 6 characters long', 400));
  }

  next();
};
