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
    telephoneNumber: string; // Added based on userFormSchema and EditUserFormDialog usage
    phoneNumber: string;
    emailVerified: boolean;
    active: boolean;
    createdAt: string;
    updatedAt: string;
};

export type UserDTO = {
    id: number;
    email: string;
    firstName: string; // Ensure frontend names match backend (firstname vs firstName)
    lastName: string; // Ensure frontend names match backend (lastname vs lastName)
    id_number: string | null; // Match backend field name
    phone_number: string | null; // Match backend field name
    telephoneNumber: string | null;
    roles: string; // Or specific role enum/type
    departmentId: number | null;
    emailVerified: boolean | null;
    active: boolean;
    createdAt: string; // Or Date
    updatedAt: string; // Or Date
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

export const STATUS_EQUIPMENT = [
    { value: "APPROVED", label: "Approved" },
    { value: "PENDING", label: "Pending" },
    { value: "CANCELED", label: "Canceled" },
    { value: "DEFECT", label: "Defect" },
    { value: "MAINTENANCE", label: "Maintenance" },
    { value: "NEED_REPLACEMENT", label: "Need Replacement" },
    { value: "NEW", label: "New" },
];

export type Equipment = {
    id: number; // Changed from string to number if backend uses Long/Integer ID
    name: string;
    availability: boolean;
    brand: string;
    quantity: number;
    equipmentOwner: UserType;
    imagePath: string; // Path to the image file
    status: // Use the exact enum values from backend
        | "APPROVED"
        | "PENDING"
        | "CANCELED"
        | "DEFECT"
        | "MAINTENANCE"
        | "NEED_REPLACEMENT"
        | "NEW";
    createdAt: string; // ISO Date string
    updatedAt: string; // ISO Date string
};
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
    venueOwner: UserType;
    image?: string;
    createdAt: string;
    updatedAt: string;
};

export type EventDTOPayload = {
    eventName: string;
    eventType: string;
    eventVenueId: number;
    startTime: string; // ISO string
    endTime: string; // ISO string
    organizer: {
        // Nested organizer object
        id: number;
    };
};

export type EventDTOBackendResponse = {
    id: number;
    eventName: string;
    eventType: string;
    organizer: UserDTO;
    approvedLetterPath: string | null;
    eventVenueId: number;
    startTime: string; // Or Date if parsed on frontend
    endTime: string; // Or Date if parsed on frontend
    status: string; // e.g., "PENDING"
};

export type EventInputType = {
    eventName: string;
    eventType: string;
    eventVenueId: number;
    startTime: Date;
    endTime: Date;
    approvedLetter: File[]; // Input is array
};

export type EventOutputType = {
    eventName: string;
    eventType: string;
    eventVenueId: number;
    startTime: Date;
    endTime: Date;
    approvedLetter: File; // Output is single file
};

export type Event = {
    id: number;
    eventName: string;
    eventType: string;
    organizer: UserType; // Changed from organizerId: number
    approvedLetterPath: string | null; // Assuming it can be null
    eventVenueId: number;
    startTime: string;
    endTime: string;
    status: string;
};
