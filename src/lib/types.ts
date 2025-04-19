export const isAuthenticated = !!localStorage.getItem("token");

export type UserType = {
    id: string;
    idNumber: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    password: string | undefined;
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
    | "VPAA"
    | "ORGANIZER"
    | "DEPT_HEAD"
    | "MSDO"
    | "OPC"
    | "CORE"
    | "TSG"
    | "SSD"
    | "FAO"
    | "VENUE_OWNER"
    | "EQUIPMENT_OWNER";

export type LoginResponse = {
    token: string;
    tokenType: string;
};

export const ROLES = [
    { value: "SUPER_ADMIN", label: "Super Admin" },
    { value: "VP_ADMIN", label: "VP Admin" },
    { value: "VPAA", label: "VPAA" },
    { value: "ORGANIZER", label: "Organizer" },
    { value: "DEPT_HEAD", label: "Department Head" },
    { value: "MSDO", label: "Multimedia Solutions and Documentation Office" },
    { value: "OPC", label: "Office of Property Custodian" },
    {
        value: "CORE",
        label: "Center for Communications, Creatives, and Marketing",
    },
    { value: "TSG", label: "TSG" },
    { value: "SSD", label: "Safety and Security Department" },
    { value: "FAO", label: "Finance and Accounting Office" },
    { value: "VENUE_OWNER", label: "Venue Owner" },
    { value: "EQUIPMENT_OWNER", label: "Equipment Owner" },
];

export const DEPARTMENTS = [
    { value: "VPAA", label: "Vice-President for Academic Affairs (VPAA)" },
    {
        value: "MSDO",
        label: "Multimedia Solutions and Documentation Office (MSDO)",
    },
    { value: "SSD", label: "Safety and Security Department (SSD)" },
    { value: "EO", label: "Executive Office (EO)" },
    {
        value: "OPC",
        label: "Office of Property Custodian (OPC)",
    },
    {
        value: "FAO",
        label: "Finance and Accounting Office (FAO)",
    },
    {
        value: "OAS",
        label: "Office of Admission and Scholarships (OAS)",
    },
    {
        value: "SSO",
        label: "Students Success Office (SSO)",
    },
    {
        value: "CORE",
        label: "Center for Communications, Creatives, and Marketing (CORE)",
    },
    { value: "ELEM", label: "Elementary" },
    { value: "JHS", label: "Junior High School (JHS)" },
    { value: "SHS", label: "Senior High School (SHS)" },
    { value: "PE", label: "Physical Education (PE)" },
    { value: "CASE", label: "College of Arts, Sciences, and Education (CASE)" },
    {
        value: "CMBA",
        label: "College of Management, Business and Accountancy (CMBA)",
    },
    {
        value: "CNAHS",
        label: "College of Nursing and Allied Health Services (CNAHS)",
    },
    { value: "CEA", label: "College of Engineering and Architecture (CEA)" },
    { value: "CCJ", label: "College of Criminal Justice (CCJ)" },
    { value: "CCS", label: "College of Computer Studies (CCS)" },
];

export const ACTIVE = [
    { value: true, label: "True" },
    { value: false, label: "False" },
];

export type Venue = {
    id: number;
    name: string;
    location: string;
    venueOwnerId: number;
    image?: string; // Added optional image field
    createdAt: string; // Use string for ISO date format
    updatedAt: string; // Use string for ISO date format
};
