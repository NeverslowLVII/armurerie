// import type { Role } from '@prisma/client'; // Remove this
import { type AppRole, ROLES } from '@/generated/roles'; // Import from generated file

// Remove AppRole and ALL_ROLES
// export type AppRole = 'DEVELOPER' | 'PATRON' | 'CO_PATRON' | 'EMPLOYEE';
// const ALL_ROLES: AppRole[] = ['DEVELOPER', 'PATRON', 'CO_PATRON', 'EMPLOYEE'];

export function isValidRole(role: string): role is AppRole {
  // Use the imported ROLES array
  return (ROLES as readonly string[]).includes(role);
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

// Use AppRole string literal type
type RoleConfigurations = {
  [key in AppRole]: RoleConfig;
};

// Use string literal keys matching AppRole
export const roleConfigurations: RoleConfigurations = {
  DEVELOPER: {
    commissionRate: 0,
    canManageUsers: true,
    canManageWeapons: true,
    canViewStatistics: true,
    canManageFeedback: true,
    canAccessAdminPanel: true,
    isSystemAdmin: true,
    canManageBaseWeapons: true,
  },
  PATRON: {
    commissionRate: 0.5,
    canManageUsers: true,
    canManageWeapons: true,
    canViewStatistics: true,
    canManageFeedback: false,
    canAccessAdminPanel: true,
    isSystemAdmin: false,
    canManageBaseWeapons: true,
  },
  CO_PATRON: {
    commissionRate: 0.3,
    canManageUsers: false,
    canManageWeapons: true,
    canViewStatistics: true,
    canManageFeedback: false,
    canAccessAdminPanel: false,
    isSystemAdmin: false,
    canManageBaseWeapons: false,
  },
  EMPLOYEE: {
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

// Update function signatures to use AppRole
export function getCommissionRate(role: AppRole): number {
  return roleConfigurations[role].commissionRate;
}

export function hasPermission(
  role: AppRole,
  permission: keyof Omit<RoleConfig, 'commissionRate'>
): boolean {
  const config = roleConfigurations[role];

  // Switch logic remains the same
  const permissionValue = (() => {
    switch (permission) {
      case 'canManageUsers':
        return config.canManageUsers;
      case 'canManageWeapons':
        return config.canManageWeapons;
      case 'canViewStatistics':
        return config.canViewStatistics;
      case 'canManageFeedback':
        return config.canManageFeedback;
      case 'canAccessAdminPanel':
        return config.canAccessAdminPanel;
      case 'isSystemAdmin':
        return config.isSystemAdmin;
      case 'canManageBaseWeapons':
        return config.canManageBaseWeapons;
      default:
        return false;
    }
  })();

  return permissionValue || config.isSystemAdmin;
}

export const getRoleName = (role: AppRole): string => {
  switch (role) {
    case 'EMPLOYEE':
      return 'Employé';
    case 'DEVELOPER':
      return 'Développeur';
    case 'CO_PATRON':
      return 'Co-Patron';
    case 'PATRON':
      return 'Patron';
    default:
      // Optional: Add exhaustive check for AppRole if needed
      return String(role);
  }
};
