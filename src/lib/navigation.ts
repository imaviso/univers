import {
	BookCheck,
	Building,
	Building2,
	CalendarDays,
	FileText,
	Home,
	LayoutGrid,
	Package,
	PackageCheck,
	Settings,
	UserCogIcon,
	Users,
} from "lucide-react";
import type { UserRole } from "./types";

type NavigationItem = {
	name: string;
	href: string;
	icon: React.ElementType;
	roles: UserRole[];
};

export const allNavigation: NavigationItem[] = [
	{
		name: "Dashboard",
		href: "/app/dashboard",
		icon: Home,
		roles: ["SUPER_ADMIN"],
	},
	{
		name: "Calendar",
		href: "/app/calendar",
		icon: CalendarDays,
		roles: [
			"SUPER_ADMIN",
			"ORGANIZER",
			"EQUIPMENT_OWNER",
			"VENUE_OWNER",
			"VP_ADMIN",
			"DEPT_HEAD",
			"ADMIN",
			"ACCOUNTING",
			"VPAA",
			"ASSIGNED_PERSONNEL",
		],
	},
	{
		name: "Events",
		href: "/app/events",
		icon: LayoutGrid,
		roles: [
			"SUPER_ADMIN",
			"ORGANIZER",
			"EQUIPMENT_OWNER",
			"VENUE_OWNER",
			"VP_ADMIN",
			"ADMIN",
			"DEPT_HEAD",
			"ACCOUNTING",
			"VPAA",
			"ASSIGNED_PERSONNEL",
		],
	},
	{
		name: "Event Personnel",
		href: "/app/event-personnel",
		icon: UserCogIcon,
		roles: ["SUPER_ADMIN", "EQUIPMENT_OWNER"],
	},
	{
		name: "Venues",
		href: "/app/venues",
		icon: Building,
		roles: [
			"SUPER_ADMIN",
			"ORGANIZER",
			"EQUIPMENT_OWNER",
			"VENUE_OWNER",
			"VP_ADMIN",
			"ADMIN",
			"DEPT_HEAD",
			"ACCOUNTING",
			"VPAA",
		],
	},
	{
		name: "Event Approval",
		href: "/app/event-approval",
		icon: BookCheck,
		roles: ["VENUE_OWNER", "VP_ADMIN", "ADMIN", "DEPT_HEAD"],
	},
	{
		name: "Users",
		href: "/app/user-management",
		icon: Users,
		roles: ["SUPER_ADMIN"],
	},
	{
		name: "Equipment",
		href: "/app/equipments",
		icon: Package,
		roles: [
			"SUPER_ADMIN",
			"ORGANIZER",
			"EQUIPMENT_OWNER",
			"VENUE_OWNER",
			"VP_ADMIN",
			"ADMIN",
			"DEPT_HEAD",
			"ACCOUNTING",
			"VPAA",
		],
	},
	{
		name: "Equipment Approval",
		href: "/app/equipment-approval",
		icon: PackageCheck,
		roles: ["EQUIPMENT_OWNER"],
	},
	{
		name: "Departments/Organization",
		href: "/app/departments",
		icon: Building2,
		roles: ["SUPER_ADMIN"],
	},
	{
		name: "Activity Logs",
		href: "/app/activity-logs",
		icon: FileText,
		roles: ["SUPER_ADMIN"],
	},
];

export const settingsNavigation: NavigationItem[] = [
	{
		name: "Settings",
		href: "/app/settings",
		icon: Settings,
		roles: [
			"SUPER_ADMIN",
			"ORGANIZER",
			"EQUIPMENT_OWNER",
			"VENUE_OWNER",
			"VP_ADMIN",
			"DEPT_HEAD",
			"ADMIN",
			"ACCOUNTING",
			"VPAA",
		],
	},
];

export const authNavigation: NavigationItem[] = [
	{
		name: "Login",
		href: "/login",
		icon: Home,
		roles: [
			"SUPER_ADMIN",
			"ORGANIZER",
			"EQUIPMENT_OWNER",
			"VENUE_OWNER",
			"VP_ADMIN",
			"ADMIN",
			"DEPT_HEAD",
			"ACCOUNTING",
			"VPAA",
		],
	},
];
