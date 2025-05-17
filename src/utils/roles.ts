import { type AppRole, ROLES } from "@/generated/roles";

export function isValidRole(role: string): role is AppRole {
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

type RoleConfigurations = {
	[key in AppRole]: RoleConfig;
};

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

export function getCommissionRate(role: AppRole): number {
	return roleConfigurations[role].commissionRate;
}

export function hasPermission(
	role: string | undefined | null,
	permission: keyof Omit<RoleConfig, "commissionRate">,
): boolean {
	if (!role || !isValidRole(role)) {
		return false;
	}

	const config = roleConfigurations[role];

	const permissionValue = (() => {
		switch (permission) {
			case "canManageUsers":
				return config.canManageUsers;
			case "canManageWeapons":
				return config.canManageWeapons;
			case "canViewStatistics":
				return config.canViewStatistics;
			case "canManageFeedback":
				return config.canManageFeedback;
			case "canAccessAdminPanel":
				return config.canAccessAdminPanel;
			case "isSystemAdmin":
				return config.isSystemAdmin;
			case "canManageBaseWeapons":
				return config.canManageBaseWeapons;
			default:
				return false;
		}
	})();

	return permissionValue || config.isSystemAdmin;
}

export const getRoleName = (role: string | undefined | null): string => {
	if (!role) {
		return "Rôle inconnu";
	}
	if (!isValidRole(role)) {
		return String(role);
	}

	switch (role) {
		case "EMPLOYEE":
			return "Employé";
		case "DEVELOPER":
			return "Développeur";
		case "CO_PATRON":
			return "Co-Patron";
		case "PATRON":
			return "Patron";
		default:
			return String(role);
	}
};
