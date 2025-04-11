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

export const DEPARTMENTS = [
    { value: "SHS", label: "SENIOR HIGH SCHOOL (SHS)" },
    { value: "VPAA", label: "VICE-PRESIDENT FOR ACADEMIC AFFAIRS (VPAA)" },
    { value: "CCS", label: "COLLEGE OF COMPUTER STUDIES (CCS)" },
    {
        value: "MSDO",
        label: "MULTIMEDIA SOLUTIONS AND DOCUMENTATION OFFICE (MSDO)",
    },
    { value: "SSD", label: "SAFETY AND SECURITY DEPARMENT (SSD)" },
    { value: "PE", label: "PHYSICAL EDUCATION (PE)" },
    { value: "JHS", label: "JUNIOR HIGH SCHOOL (JHS)" },
    {
        value: "OPC",
        label: "OFFICE OF PROPERTY CUSTODIAN (OPC)",
    },
    {
        value: "FAO",
        label: "FINANCE AND ACCOUNTING OFFICE (FAO)",
    },
    {
        value: "OAS",
        label: "OFFICE OF ADMISSION AND SCHOLARSHIPS (OAS)",
    },
    {
        value: "SSO",
        label: "STUDENTS SUCCESS OFFICE (SSO)",
    },
    { value: "CORE", label: "CORE" },
    { value: "ELEM", label: "ELEMENTARY" },
    { value: "CASE", label: "COLLEGE OF ARTS, SCIENCES, AND EDUCATION (CASE)" },
    { value: "CEA", label: "COLLEGE OF ENGINEERING AND ARCHITECHURE (CEA)" },
    { value: "EO", label: "EXECUTIVE OFFICE (EO)" },
];

export const ACTIVE = [
    { value: true, label: "True" },
    { value: false, label: "False" },
];
