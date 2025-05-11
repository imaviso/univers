export const isAuthenticated = !!localStorage.getItem("token");

export type UserType = {
    id: string;
    uuid: string;
    idNumber: string;
    firstName: string;
    lastName: string;
    email: string;
    role: UserRole;
    password: string | undefined;
    departmentId: string;
    telephoneNumber: string;
    phoneNumber: string;
    emailVerified: boolean;
    active: boolean;
    createdAt: string;
    updatedAt: string;
    profileImagePath?: string | null;
};

export type UserDTO = {
    publicId: string;
    email: string;
    firstName: string;
    lastName: string;
    password?: string;
    confirmPassword?: string;
    idNumber: string | null;
    phoneNumber: string | null;
    telephoneNumber: string | null;
    role: UserRole;
    department: DepartmentDTO | null;
    emailVerified: boolean | null;
    active: boolean;
    createdAt: string;
    updatedAt: string;
    profileImagePath?: string | null;
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
    { value: "DEFECT", label: "Defect" },
    { value: "MAINTENANCE", label: "Maintenance" },
    { value: "NEED_REPLACEMENT", label: "Need Replacement" },
    { value: "NEW", label: "New" },
];

export type Equipment = {
    publicId: string;
    name: string;
    availability: boolean;
    brand: string;
    quantity: number;
    equipmentOwner: UserDTO;
    imagePath: string;
    status:
        | "APPROVED"
        | "PENDING"
        | "CANCELED"
        | "DEFECT"
        | "MAINTENANCE"
        | "NEED_REPLACEMENT"
        | "NEW";
    createdAt: string;
    updatedAt: string;
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

export const DEPARTMENTS: Array<{ value: string; label: string }> = [
    {
        value: "uuid-vpaa-dept",
        label: "Vice-President for Academic Affairs (VPAA)",
    },
    {
        value: "uuid-msdo-dept",
        label: "Multimedia Solutions and Documentation Office (MSDO)",
    },
    { value: "uuid-ssd-dept", label: "Safety and Security Department (SSD)" },
    { value: "uuid-ccs-dept", label: "College of Computer Studies (CCS)" },
];

export const OLD_DEPARTMENTS: Array<{ value: string; label: string }> = [
    {
        value: "VPAA_OLD_UUID",
        label: "Vice-President for Academic Affairs (VPAA)",
    },
    { value: "CCS_OLD_UUID", label: "College of Computer Studies (CCS)" },
];

export const ACTIVE = [
    { value: true, label: "True" },
    { value: false, label: "False" },
];

export type VenueDTO = {
    publicId: string;
    name: string;
    location: string;
    venueOwner: UserDTO | null;
    imagePath: string | null;
    createdAt: string;
    updatedAt: string;
};

export type EventDTOPayload = {
    eventName: string;
    eventType: string;
    venuePublicId: string;
    departmentPublicId: string;
    startTime: string;
    endTime: string;
};

export type EventDTO = {
    publicId: string;
    eventName: string;
    eventType: string;
    organizer: UserDTO;
    approvedLetterUrl: string | null;
    imageUrl: string | null;
    eventVenue: VenueDTO;
    department: DepartmentDTO;
    startTime: string;
    endTime: string;
    status: string;
    approvals: EventApprovalDTO[] | null;
    cancellationReason: string | null;
    createdAt: string;
    updatedAt: string;
};

export type EventInputType = {
    eventName: string;
    eventType: string;
    eventVenuePublicId: string;
    departmentPublicId: string;
    startTime: Date;
    endTime: Date;
    approvedLetter: File[];
};

export type EventOutputType = {
    eventName: string;
    eventType: string;
    eventVenueId: number;
    departmentId: number;
    startTime: Date;
    endTime: Date;
    approvedLetter: File;
};

export type Event = {
    publicId: string;
    eventName: string;
    eventType: string;
    organizer: UserDTO;
    approvedLetterUrl: string | null;
    imageUrl: string | null;
    eventVenue: VenueDTO;
    department: DepartmentDTO;
    startTime: string;
    endTime: string;
    status: string;
};

export type EventApprovalDTO = {
    publicId: string;
    eventPublicId: string;
    signedByUser: UserDTO;
    userRole: string;
    remarks: string | null;
    status: string;
    dateSigned: string | null;
};

export type DepartmentDTO = {
    publicId: string;
    name: string;
    description: string | null;
    deptHead: UserDTO | null;
    createdAt: string;
    updatedAt: string;
};

export type VenueApprovalDTO = {
    publicId: string;
    venueReservationPublicId: string;
    signedByUser: UserDTO;
    userRole: string;
    remarks: string | null;
    status: string;
    dateSigned: string | null;
};

export type VenueReservationDTO = {
    publicId: string;
    event: EventDTO | null;
    requestingUser: UserDTO;
    department: DepartmentDTO | null;
    venue: VenueDTO;
    purpose: string;
    startTime: string;
    endTime: string;
    status: string;
    approvals: VenueApprovalDTO[] | null;
    createdAt: string;
    updatedAt: string | null;
};

export type CreateVenueReservationInput = {
    event?: { publicId: string };
    requestingUser?: { publicId: string };
    department?: { publicId: string };
    venue: { publicId: string };
    purpose: string;
    startTime: string;
    endTime: string;
};

export type ReservationActionInput = {
    reservationPublicId: string;
    remarks?: string;
};

export type EquipmentApprovalDTO = {
    publicId: string;
    equipmentReservationPublicId: string;
    signedByUser: UserDTO;
    userRole: string;
    remarks: string | null;
    status: string;
    dateSigned: string | null;
};

export type EquipmentReservationDTO = {
    publicId: string;
    event: EventDTO;
    requestingUser: UserDTO;
    department: DepartmentDTO;
    equipment: Equipment;
    quantity: number;
    startTime: string;
    endTime: string;
    status: string;
    approvals: EquipmentApprovalDTO[] | null;
    createdAt: string;
    updatedAt: string | null;
};

export type CreateEquipmentReservationInput = {
    event: { publicId: string };
    equipment: { publicId: string };
    quantity: number;
    department?: { publicId: string };
    startTime?: string;
    endTime?: string;
};

export type EquipmentActionInput = {
    reservationPublicId: string;
    remarks?: string;
};

export type AUTHORIZED_ROLES =
    | "SUPER_ADMIN"
    | "VP_ADMIN"
    | "MSDO"
    | "OPC"
    | "CORE"
    | "TSG"
    | "VPAA"
    | "SSD"
    | "FAO"
    | "DEPT_HEAD";

export interface ApiResponse<T> {
    success: boolean;
    message?: string;
    data?: T;
    error?: {
        code: number;
        message: string;
        details?: string;
    };
}
