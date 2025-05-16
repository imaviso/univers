import { ApiError, handleApiResponse } from "@/lib/api";
import type { UserDTO } from "@/lib/types";
export const API_BASE_URL = "http://localhost:8080"; // Backend API URL

export const userSignIn = async (email: string, password: string) => {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({
                email: email,
                password: password,
            }),
        });
        const data = await handleApiResponse<{
            token: string;
            tokenType: string;
        }>(response, true);
        return data;
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw error instanceof Error
            ? error
            : new Error("An unexpected error occurred during signin");
    }
};

export const userSignUp = async (
    idNumber: string,
    firstName: string,
    lastName: string,
    department: string,
    email: string,
    telephoneNumber: string,
    phoneNumber: string,
    password: string,
) => {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                idNumber: idNumber,
                firstName: firstName,
                lastName: lastName,
                departmentPublicId: department,
                email: email,
                telephoneNumber: telephoneNumber,
                phoneNumber: phoneNumber,
                password: password,
            }),
        });
        const data = await handleApiResponse<string>(response, false);
        return data || "Registration successful";
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw error instanceof Error
            ? error
            : new Error("An unexpected error occurred during signup");
    }
};

export const userSignOut = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/logout`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
        });
        const data = await handleApiResponse<string>(response, false);
        return data || "Logout successful";
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw error instanceof Error
            ? error
            : new Error("An unexpected error occurred during signout");
    }
};

export const getCurrentUser = async (): Promise<UserDTO | null> => {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
        });
        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                return null;
            }
        }
        const data = await handleApiResponse<UserDTO>(response, true);
        return data || null;
    } catch (error) {
        if (error instanceof ApiError) {
            console.warn(
                `ApiError in getCurrentUser (Status ${error.status}): ${error.message}`,
            );
            return null;
        }
        console.warn("Generic error in getCurrentUser:", error);
        return null;
    }
};

export const verifyOTP = async (email: string, code: string) => {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/verify-email`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                email: email,
                verification_code: code,
            }),
        });
        const data = await handleApiResponse<string>(response, false);
        return data || "Verification successful";
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw error instanceof Error
            ? error
            : new Error("An unexpected error occurred during verification");
    }
};

export const userResendVerificationCode = async (email: string) => {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/resend-code`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email }),
        });
        const data = await handleApiResponse<string>(response, false);
        return data || "Verification code resent";
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw error instanceof Error
            ? error
            : new Error("An unexpected error occurred during resend");
    }
};

export const userForgotPassword = async (email: string) => {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email }),
        });
        const data = await handleApiResponse<string>(response, false);
        return data || "Password reset email sent";
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw error instanceof Error
            ? error
            : new Error("An unexpected error occurred during forgot password");
    }
};

export const userResetVerificationCode = async (
    email: string,
    code: string,
) => {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/verify-reset-code`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, code }),
        });
        const data = await handleApiResponse<string>(response, false);
        return data || "Reset code verified";
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw error instanceof Error
            ? error
            : new Error(
                  "An unexpected error occurred during reset code verification",
              );
    }
};

export const userResetPassword = async (
    email: string,
    code: string,
    password: string,
) => {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                email,
                verificationCode: code,
                newPassword: password,
            }),
        });
        const data = await handleApiResponse<string>(response, false);
        return data || "Password reset successful";
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw error instanceof Error
            ? error
            : new Error("An unexpected error occurred during password reset");
    }
};
