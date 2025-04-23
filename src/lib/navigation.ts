import {
    BookCheck,
    BookText,
    Building,
    CalendarDays,
    Home,
    LayoutGrid,
    Package,
    PackageCheck,
    PackagePlus,
    Settings,
    Users,
} from "lucide-react";

export const allNavigation = [
    {
        name: "Dashboard",
        href: "/app/dashboard",
        icon: Home,
        roles: ["SUPER_ADMIN", "VP_ADMIN"],
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
            "VPAA",
            "VP_ADMIN",
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
            "VPAA",
            "VP_ADMIN",
        ],
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
            "VPAA",
            "VP_ADMIN",
        ],
    },
    {
        name: "Venue Approval",
        href: "/app/venue-approval/approval",
        icon: BookCheck,
        roles: ["SUPER_ADMIN", "VENUE_OWNER", "VPAA", "VP_ADMIN"],
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
            "VPAA",
            "VP_ADMIN",
        ],
    },
    {
        name: "Equipment Approval",
        href: "/app/equipment-approval/approval",
        icon: PackageCheck,
        roles: ["SUPER_ADMIN", "EQUIPMENT_OWNER", "VP_ADMIN"],
    },
];

export const settingsNavigation = [
    {
        name: "Settings",
        href: "/app/settings",
        icon: Settings,
        roles: [
            "SUPER_ADMIN",
            "ORGANIZER",
            "EQUIPMENT_OWNER",
            "VENUE_OWNER",
            "VPAA",
            "VP_ADMIN",
            "MSDO",
            "OPC",
            "CORE",
            "TSG",
            "SSD",
            "FAO",
            "DEPT_HEAD",
        ],
    },
];

export const authNavigation = [
    {
        name: "Login",
        href: "/login",
        icon: Home,
        roles: [
            "SUPER_ADMIN",
            "ORGANIZER",
            "EQUIPMENT_OWNER",
            "VENUE_OWNER",
            "VPAA",
            "VP_ADMIN",
            "MSDO",
            "OPC",
            "CORE",
            "TSG",
            "SSD",
            "FAO",
            "DEPT_HEAD",
        ],
    },
];
