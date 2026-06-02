import { randomUUID } from "crypto";
import { comparePassword, hashPassword } from "./bcrypt";
import { signAccessToken, signResetToken, verifyResetToken } from "./jwt";
import { User } from "../models/user.entity";
import { AuthModuleError } from "./auth.error";
import { ForgotPasswordDto } from "../Authentication/dto/forgot-password.dto";
import { LoginDto } from "../Authentication/dto/login.dto";
import { RegisterDto } from "../Authentication/dto/register.dto";
import { ResetPasswordDto } from "../Authentication/dto/reset-password.dto";
import {
  AuthenticatedUserResponse,
  AuthSuccessResponse,
  AuthUserResponse,
  ForgotPasswordResponse,
} from "../models/auth.interface";
import { getRolePermissions } from "../models/role-permissions";
import { UserRepository } from "../repositories/user.repository";

type UserWithPassword = User & { passwordHash: string };

export class AuthService {
  constructor(private readonly userRepository: UserRepository) {}

  async register(registerDto: RegisterDto): Promise<AuthSuccessResponse> {
    const existingUser = await this.userRepository.findByEmail(registerDto.email);

    if (existingUser) {
      throw new AuthModuleError("Email is already registered", 409);
    }

    const user = this.userRepository.create({
      id: randomUUID(),
      name: registerDto.name,
      email: registerDto.email,
      passwordHash: await hashPassword(registerDto.password),
      phone: registerDto.phone ?? null,
      role: registerDto.role,
      profileImage: null,
    });

    const savedUser = await this.userRepository.save(user);

    return this.buildAuthResponse(savedUser);
  }

  async login(loginDto: LoginDto): Promise<AuthSuccessResponse> {
    const user = await this.userRepository.findByEmailWithPassword(loginDto.email);

    if (!user) {
      throw new AuthModuleError("Invalid email or password", 401);
    }

    const passwordMatched = await comparePassword(loginDto.password, user.passwordHash);

    if (!passwordMatched) {
      throw new AuthModuleError("Invalid email or password", 401);
    }

    return this.buildAuthResponse(user);
  }

  async getCurrentUser(userId: string): Promise<AuthenticatedUserResponse> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new AuthModuleError("Authenticated user was not found", 404);
    }

    const authUser = this.mapUser(user);

    return {
      user: authUser,
      permissions: authUser.permissions,
    };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<ForgotPasswordResponse> {
    const user = await this.userRepository.findByEmail(forgotPasswordDto.email);

    if (!user) {
      return {
        message: "If an account exists with this email, a reset link has been prepared.",
      };
    }

    const resetToken = signResetToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      message:
        "Password reset token generated successfully. Connect an email service later to send this token.",
      resetToken,
      expiresIn: "15m",
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    let payload;

    try {
      payload = verifyResetToken(resetPasswordDto.token);
    } catch (_error) {
      throw new AuthModuleError("Reset token is invalid or expired", 401);
    }

    if (payload.type !== "reset-password") {
      throw new AuthModuleError("Reset token is invalid", 401);
    }

    const user = await this.userRepository.findById(payload.sub);

    if (!user) {
      throw new AuthModuleError("User not found for this reset token", 404);
    }

    await this.userRepository.updatePassword(user.id, await hashPassword(resetPasswordDto.newPassword));

    return {
      message: "Password reset successfully",
    };
  }

  private buildAuthResponse(user: User | UserWithPassword): AuthSuccessResponse {
    const authUser = this.mapUser(user);

    return {
      user: authUser,
      accessToken: signAccessToken({
        sub: authUser.id,
        email: authUser.email,
        role: authUser.role,
      }),
      permissions: authUser.permissions,
    };
  }

  private mapUser(user: User | UserWithPassword): AuthUserResponse {
    const permissions = getRolePermissions(user.role);

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      profileImage: user.profileImage,
      createdAt: user.createdAt,
      permissions,
    };
  }
}
