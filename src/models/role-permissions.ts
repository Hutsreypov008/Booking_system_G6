import { Role } from "../enums/role.enum";

export interface RolePermissions {
  canRegister: boolean;
  canLogin: boolean;
  canViewRooms: boolean;
  canBookRoom: boolean;
  canCreateRoom: boolean;
  canUpdateOwnRoom: boolean;
  canDeleteOwnRoom: boolean;
  canViewAllUsers: boolean;
  canManageBookings: boolean;
  canDeleteUser: boolean;
  canDeleteOwner: boolean;
  canDeleteOwnAccount: boolean;
}

export type RolePermissionKey = keyof RolePermissions;

const userPermissions: RolePermissions = {
  canRegister: true,
  canLogin: true,
  canViewRooms: true,
  canBookRoom: true,
  canCreateRoom: false,
  canUpdateOwnRoom: false,
  canDeleteOwnRoom: false,
  canViewAllUsers: false,
  canManageBookings: false,
  canDeleteUser: false,
  canDeleteOwner: false,
  canDeleteOwnAccount: false,
};

const ownerPermissions: RolePermissions = {
  canRegister: true,
  canLogin: true,
  canViewRooms: true,
  canBookRoom: false,
  canCreateRoom: true,
  canUpdateOwnRoom: true,
  canDeleteOwnRoom: true,
  canViewAllUsers: true,
  canManageBookings: true,
  canDeleteUser: true,
  canDeleteOwner: false,
  canDeleteOwnAccount: false,
};

export const getRolePermissions = (role: Role | string): RolePermissions => {
  if (role === Role.OWNER) {
    return { ...ownerPermissions };
  }

  return { ...userPermissions };
};
