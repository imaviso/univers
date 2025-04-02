export const isAuthenticated = !!localStorage.getItem("token");

export type UserType = {
    idNumber: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    department: string;
    phoneNumber: string;
};

export type LoginResponse = {
    token: string;
    tokenType: string;
};
