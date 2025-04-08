import { StringValidation } from "zod";

export const isAuthenticated = !!localStorage.getItem("token");

export type UserType = {
    id: string;
    idNumber: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    department: string;
    phoneNumber: string;
    emailVerified: boolean;
    active: boolean;
    createdAt: string;
    updatedAt: string;
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

export const ACTIVE = [
    { value: true, label: "True" },
    { value: false, label: "False" },
];
