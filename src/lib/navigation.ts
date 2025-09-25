import {
	BookCheck,
	Building,
	Building2,
	CalendarDays,
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
		],
	},
	{
		name: "Events",
		href: "/app/events/timeline",
		icon: LayoutGrid,
		roles: [
			"SUPER_ADMIN",
			"ORGANIZER",
			"EQUIPMENT_OWNER",
			"VENUE_OWNER",
			"VP_ADMIN",
			"ADMIN",
			"DEPT_HEAD",
		],
	},
	{
		name: "Event Staffing",
		href: "/app/event-staffing/staff",
		icon: UserCogIcon,
		roles: ["SUPER_ADMIN", "EQUIPMENT_OWNER"],
	},
	{
		name: "Venues",
		href: "/app/venues/dashboard",
		icon: Building,
		roles: [
			"SUPER_ADMIN",
			"ORGANIZER",
			"EQUIPMENT_OWNER",
			"VENUE_OWNER",
			"VP_ADMIN",
			"ADMIN",
			"DEPT_HEAD",
		],
	},
	{
		name: "Event Approval",
		href: "/app/event-approval/approval",
		icon: BookCheck,
		roles: ["VENUE_OWNER", "VP_ADMIN", "ADMIN", "DEPT_HEAD"],
	},
	{
		name: "Users",
		href: "/app/user-management/users",
		icon: Users,
		roles: ["SUPER_ADMIN"],
	},
	{
		name: "Equipments",
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
		],
	},
	{
		name: "Equipment Approval",
		href: "/app/equipment-approval/approval",
		icon: PackageCheck,
		roles: ["EQUIPMENT_OWNER"],
	},
	{
		name: "Departments",
		href: "/app/departments/dashboard",
		icon: Building2,
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
		],
	},
];
