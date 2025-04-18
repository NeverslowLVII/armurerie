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
    canManageBaseWeapons: true,
  },
  [Role.PATRON]: {
    commissionRate: 0.5,
    canManageUsers: true,
    canManageWeapons: true,
    canViewStatistics: true,
    canManageFeedback: false,
    canAccessAdminPanel: true,
    isSystemAdmin: false,
    canManageBaseWeapons: true,
  },
  [Role.CO_PATRON]: {
    commissionRate: 0.3,
    canManageUsers: false,
    canManageWeapons: true,
    canViewStatistics: true,
    canManageFeedback: false,
    canAccessAdminPanel: false,
    isSystemAdmin: false,
    canManageBaseWeapons: false,
  },
  [Role.EMPLOYEE]: {
    commissionRate: 0.2,
    canManageUsers: false,
    canManageWeapons: false,
    canViewStatistics: false,
    canManageFeedback: false,
    canAccessAdminPanel: false,
    isSystemAdmin: false,
    canManageBaseWeapons: false,
  },
};

export function getCommissionRate(role: Role): number {
  return roleConfigurations[role as keyof typeof roleConfigurations].commissionRate;
}

export function hasPermission(
  role: Role,
  permission: keyof Omit<RoleConfig, 'commissionRate'>
): boolean {
  const config = roleConfigurations[role as keyof typeof roleConfigurations];

  // Use a safer pattern to check permissions
  const permissionValue = (() => {
    switch (permission) {
      case 'canManageUsers': {
        return config.canManageUsers;
      }
      case 'canManageWeapons': {
        return config.canManageWeapons;
      }
      case 'canViewStatistics': {
        return config.canViewStatistics;
      }
      case 'canManageFeedback': {
        return config.canManageFeedback;
      }
      case 'canAccessAdminPanel': {
        return config.canAccessAdminPanel;
      }
      case 'isSystemAdmin': {
        return config.isSystemAdmin;
      }
      case 'canManageBaseWeapons': {
        return config.canManageBaseWeapons;
      }
      default: {
        return false;
      }
    }
  })();

  return permissionValue || config.isSystemAdmin;
}

export const getRoleName = (role: Role): string => {
  switch (role) {
    case Role.EMPLOYEE: {
      return 'Employé';
    }
    case Role.DEVELOPER: {
      return 'Développeur';
    }
    case Role.CO_PATRON: {
      return 'Co-Patron';
    }
    case Role.PATRON: {
      return 'Patron';
    }
    default: {
      return String(role);
    }
  }
};
