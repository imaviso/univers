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
