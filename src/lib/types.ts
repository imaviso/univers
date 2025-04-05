export const isAuthenticated = !!localStorage.getItem("token");

export type UserType = {
    idNumber: string;
    firstName: string;
    lastName: string;
    email: string;
    role:
        | "EQUIPMENT_OWNER"
        | "ORGANIZER"
        | "SUPER_ADMIN"
        | "VENUE_OWNER"
        | "VPAA"
        | "VP_ADMIN";
    department: string;
    phoneNumber: string;
};
export type UserRole =
    | "SUPER_ADMIN"
    | "VP_ADMIN"
    | "ORGANIZER"
    | "EQUIPMENT_OWNER"
    | "VENUE_OWNER"
    | "VPAA";

export type LoginResponse = {
    token: string;
    tokenType: string;
};

export const ROLES = [
    { value: "SUPER_ADMIN", label: "Super Admin" },
    { value: "ORGANIZER", label: "Organizer" },
    { value: "EQUIPMENT_OWNER", label: "Equipment Owner" },
    { value: "VENUE_OWNER", label: "Venue Owner" },
    { value: "VPAA", label: "VPAA" },
    { value: "VP_ADMIN", label: "VP Admin" },
];

// TODO: NEEDS TO BE CHANGED TO ACTUAL DEPARTMENTS
export const DEPARTMENTS = [
    "IT Department",
    "Human Resources",
    "Marketing",
    "Finance",
    "Operations",
    "Sales",
];
