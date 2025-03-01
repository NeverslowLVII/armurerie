import { Role } from '@prisma/client';

export function isValidRole(role: string): role is Role {
  return Object.values(Role).includes(role as Role);
}

interface RoleConfig {
  commissionRate: number;
  canManageUsers: boolean;
  canManageWeapons: boolean;
  canViewStatistics: boolean;
  canManageFeedback: boolean;
  canAccessAdminPanel: boolean;
  isSystemAdmin: boolean;
  canManageBaseWeapons: boolean;
}

type RoleConfigurations = {
  [key in Role]: RoleConfig;
};

export const roleConfigurations: RoleConfigurations = {
  [Role.DEVELOPER]: {
    commissionRate: 0,
    canManageUsers: true,
    canManageWeapons: true,
    canViewStatistics: true,
    canManageFeedback: true,
    canAccessAdminPanel: true,
    isSystemAdmin: true,
    canManageBaseWeapons: true
  },
  [Role.PATRON]: {
    commissionRate: 0.50,
    canManageUsers: true,
    canManageWeapons: true,
    canViewStatistics: true,
    canManageFeedback: false,
    canAccessAdminPanel: true,
    isSystemAdmin: false,
    canManageBaseWeapons: true
  },
  [Role.CO_PATRON]: {
    commissionRate: 0.30,
    canManageUsers: false,
    canManageWeapons: true,
    canViewStatistics: true,
    canManageFeedback: false,
    canAccessAdminPanel: false,
    isSystemAdmin: false,
    canManageBaseWeapons: false
  },
  [Role.EMPLOYEE]: {
    commissionRate: 0.20,
    canManageUsers: false,
    canManageWeapons: false,
    canViewStatistics: false,
    canManageFeedback: false,
    canAccessAdminPanel: false,
    isSystemAdmin: false,
    canManageBaseWeapons: false
  }
};

export function getCommissionRate(role: Role): number {
  return roleConfigurations[role].commissionRate;
}

export function canManageUsers(role: Role): boolean {
  return roleConfigurations[role].canManageUsers || roleConfigurations[role].isSystemAdmin;
}

export function canManageWeapons(role: Role): boolean {
  return roleConfigurations[role].canManageWeapons || roleConfigurations[role].isSystemAdmin;
}

export function canViewStatistics(role: Role): boolean {
  return roleConfigurations[role].canViewStatistics || roleConfigurations[role].isSystemAdmin;
}

export function canManageFeedback(role: Role): boolean {
  return roleConfigurations[role].canManageFeedback || roleConfigurations[role].isSystemAdmin;
}

export function canAccessAdminPanel(role: Role): boolean {
  return roleConfigurations[role].canAccessAdminPanel || roleConfigurations[role].isSystemAdmin;
}

export function isSystemAdmin(role: Role): boolean {
  return roleConfigurations[role].isSystemAdmin;
}

export function hasPermission(role: Role, permission: keyof Omit<RoleConfig, 'commissionRate'>): boolean {
  return roleConfigurations[role][permission] as boolean || roleConfigurations[role].isSystemAdmin;
}

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