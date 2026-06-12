import jwt from 'jsonwebtoken';
import { UserRepository } from '../repository/user.repository';
import { config } from '../../../config';
import { AppError } from '../../../middlewares/errorHandler';
import { IUser } from '../model/user.interface';
import { logger } from '../../../utils/logger';
import { sendOtpEmail } from '../../../utils/emailService';


export class AuthService {
  private userRepository = new UserRepository();

  private generateTokens(user: IUser) {
    const accessToken = jwt.sign(
      { userId: user._id, email: user.email },
      config.jwt.secret as jwt.Secret,
      { expiresIn: config.jwt.accessExpiration as any }
    );

    const refreshToken = jwt.sign(
      { userId: user._id },
      config.jwt.refreshSecret as jwt.Secret,
      { expiresIn: config.jwt.refreshExpiration as any }
    );

    return { accessToken, refreshToken };
  }

  async register(userData: Partial<IUser>) {
    const existingUser = await this.userRepository.findByEmail(userData.email || '');
    if (existingUser) {
      throw new AppError('Email already registered', 400);
    }

    const newUser = await this.userRepository.create(userData);
    const tokens = this.generateTokens(newUser);

    // Save refresh token to user
    await this.userRepository.updateRefreshToken(newUser._id.toString(), tokens.refreshToken);

    return {
      user: {
        id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        phone: newUser.phone,
        avatar: newUser.avatar,
      },
      ...tokens,
    };
  }

  async login(email: string, password: string) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new AppError('Invalid email or password', 401);
    }

    const tokens = this.generateTokens(user);
    await this.userRepository.updateRefreshToken(user._id.toString(), tokens.refreshToken);

    return {
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
      },
      ...tokens,
    };
  }

  async refresh(token: string) {
    try {
      const decoded = jwt.verify(token, config.jwt.refreshSecret) as { userId: string };
      const user = await this.userRepository.findById(decoded.userId);
      
      // Select User refresh token specifically to compare using repository method
      const fullUser = await this.userRepository.findByIdWithRefreshToken(decoded.userId);
      if (!fullUser || fullUser.refreshToken !== token) {
        throw new AppError('Invalid refresh token', 401);
      }

      const tokens = this.generateTokens(fullUser);
      await this.userRepository.updateRefreshToken(fullUser._id.toString(), tokens.refreshToken);

      return tokens;
    } catch (error: any) {
      throw new AppError('Invalid or expired refresh token', 401);
    }
  }

  async logout(userId: string) {
    await this.userRepository.updateRefreshToken(userId, null);
  }

  async updateProfile(userId: string, profileData: Partial<IUser>) {
    const updatedUser = await this.userRepository.updateProfile(userId, profileData);
    if (!updatedUser) {
      throw new AppError('User not found', 404);
    }
    return {
      id: updatedUser._id,
      fullName: updatedUser.fullName,
      email: updatedUser.email,
      phone: updatedUser.phone,
      avatar: updatedUser.avatar,
    };
  }

  async getProfile(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    return {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
    };
  }

  async forgotPassword(email: string) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new AppError('User not found with this email', 404);
    }

    // Generate 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes validity

    await this.userRepository.updateResetOtp(email, otp, expires);

    logger.info(`[AuthService] Password reset OTP generated for ${email}: ${otp}`);

    try {
      // Send OTP via Nodemailer email utility
      await sendOtpEmail(email, otp);
      console.log(`\n✅ SUCCESS: OTP email was successfully sent to ${email} via Nodemailer!\n`);
    } catch (emailError: any) {
      console.log(`\n❌ ERROR: Failed to send OTP email to ${email}: ${emailError.message}\n`);
      logger.warn(`[AuthService] Non-fatal email error sending to ${email}: ${emailError.message}. Proceeding with response for demo/testing convenience.`);
    }

    return {
      message: 'Password reset OTP generated successfully',
    };
  }

  async resetPassword(email: string, otp: string, newPassword: string) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new AppError('User not found with this email', 404);
    }

    // Verify OTP and expiration
    const isOtpValid = user.resetPasswordOtp === otp;
    const isOtpNotExpired = user.resetPasswordOtpExpires && new Date(user.resetPasswordOtpExpires) > new Date();

    if (!isOtpValid || !isOtpNotExpired) {
      throw new AppError('Invalid or expired OTP', 400);
    }

    // Set new password (it will be hashed by mongoose pre-save hook on the User model)
    await this.userRepository.updatePassword(email, newPassword);

    // Clear reset OTP fields
    await this.userRepository.updateResetOtp(email, null, null);

    logger.info(`[AuthService] Password successfully reset for user: ${email}`);

    return {
      message: 'Password reset successfully',
    };
  }
}
