import { Role } from "../enums/role.enum";

export interface AuthUserResponse {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: Role | string;
  profileImage: string | null;
  createdAt: Date;
}

export interface AuthSuccessResponse {
  user: AuthUserResponse;
  accessToken: string;
}

export interface ForgotPasswordResponse {
  message: string;
  resetToken?: string;
  expiresIn?: string;
}
