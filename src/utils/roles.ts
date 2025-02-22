import { Role } from '@/services/api';

export interface Permission {
  canEditWeapons: boolean;
  canDeleteWeapons: boolean;
  canManageUsers: boolean;
  canManageBaseWeapons: boolean;
  commissionRate: number;
}

export const RolePermissions: Record<Role, Permission> = {
  [Role.EMPLOYEE]: {
    canEditWeapons: false,
    canDeleteWeapons: false,
    canManageUsers: false,
    canManageBaseWeapons: false,
    commissionRate: 0.2, // 20%
  },
  [Role.CO_PATRON]: {
    canEditWeapons: true,
    canDeleteWeapons: true,
    canManageUsers: true,
    canManageBaseWeapons: false,
    commissionRate: 0.3, // 30%
  },
  [Role.PATRON]: {
    canEditWeapons: true,
    canDeleteWeapons: true,
    canManageUsers: true,
    canManageBaseWeapons: true,
    commissionRate: 0.3, // 30%
  },
  [Role.DEVELOPER]: {
    canEditWeapons: true,
    canDeleteWeapons: true,
    canManageUsers: true,
    canManageBaseWeapons: true,
    commissionRate: 0, // Developers don't get commission
  },
};

export const getRolePermissions = (role: Role): Permission => {
  return RolePermissions[role];
};

export const hasPermission = (role: Role, permission: keyof Permission): boolean => {
  return RolePermissions[role][permission] as boolean;
};

export const getCommissionRate = (role: Role): number => {
  return RolePermissions[role].commissionRate;
};

export const isValidRole = (role: string): role is Role => {
  return Object.values(Role).includes(role as Role);
};

export const getRoleName = (role: Role): string => {
  switch (role) {
    case Role.EMPLOYEE:
      return 'Employé';
    case Role.CO_PATRON:
      return 'Co-Patron';
    case Role.PATRON:
      return 'Patron';
    default:
      return role;
  }
}; 