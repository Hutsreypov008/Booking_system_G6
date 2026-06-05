import { Role } from "../enums/role.enum";
import { RolePermissions } from "./role-permissions";

type Nullable<T> = T | null;

export interface AuthUserResponse {
  id: string;
  name: string;
  email: string;
  phone: Nullable<string>;
  role: Role;
  profileImage: Nullable<string>;
  createdAt: Date;
  permissions: RolePermissions;
}

export interface AuthSuccessResponse {
  user: AuthUserResponse;
  accessToken: string;
  permissions: RolePermissions;
}

export interface AuthenticatedUserResponse {
  user: AuthUserResponse;
  permissions: RolePermissions;
}

export interface ForgotPasswordResponse {
  message: string;
  resetToken?: string;
  expiresIn?: string;
}
