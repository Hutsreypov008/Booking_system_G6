import { Request } from "express";
import { Role } from "../enums/role.enum";
import { RolePermissions } from "./role-permissions";

export interface AuthenticatedUser {
  id: string;
  email?: string;
  role: Role;
}

export interface RequestWithUser extends Request {
  user?: AuthenticatedUser;
}

export interface UserProfileResponse {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  profileImage: string | null;
  createdAt: Date;
  permissions: RolePermissions;
}

export interface BookingHistoryQuery {
  page: number;
  limit: number;
  status?: string;
  search?: string;
  sortBy: "createdAt" | "checkInDate" | "checkOutDate" | "status" | "totalPrice";
  sortOrder: "ASC" | "DESC";
}

export interface BookingHistoryItem {
  id: string;
  roomId: string | null;
  status: string;
  checkInDate: string | null;
  checkOutDate: string | null;
  totalPrice: number;
  createdAt: string | null;
  roomTitle: string | null;
  roomLocation: string | null;
  roomType: string | null;
  roomPrice: number | null;
  roomAvailable: boolean | null;
}

export interface PaginationMeta {
  totalItems: number;
  itemCount: number;
  itemsPerPage: number;
  totalPages: number;
  currentPage: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}
