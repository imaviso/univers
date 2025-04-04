import type { UserType } from "@/lib/types";
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

        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = `Error! Status: ${response.status}`;

            try {
                const errorData = JSON.parse(errorText);
                errorMessage =
                    errorData.message || errorData.error || errorMessage;
            } catch {
                errorMessage = errorText || errorMessage;
            }

            throw new Error(errorMessage);
        }

        return await response.json();
    } catch (error) {
        // Re-throw the error with the specific message
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
                department: department,
                email: email,
                phoneNumber: phoneNumber,
                password: password,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = `Error! Status: ${response.status}`;

            try {
                const errorData = JSON.parse(errorText);
                errorMessage =
                    errorData.message || errorData.error || errorMessage;
            } catch {
                errorMessage = errorText || errorMessage;
            }

            throw new Error(errorMessage);
        }

        return await response.text();
    } catch (error) {
        // Re-throw the error with the specific message
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
        });

        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = `Error! Status: ${response.status}`;

            try {
                const errorData = JSON.parse(errorText);
                errorMessage =
                    errorData.message || errorData.error || errorMessage;
            } catch {
                errorMessage = errorText || errorMessage;
            }

            throw new Error(errorMessage);
        }

        return await response.text();
    } catch (error) {
        // Re-throw the error with the specific message
        throw error instanceof Error
            ? error
            : new Error("An unexpected error occurred during signout");
    }
};

export const getCurrentUser = async (): Promise<UserType | null> => {
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

            const errorText = await response.text();
            let errorMessage = `Error! Status: ${response.status}`;

            try {
                const errorData = JSON.parse(errorText);
                errorMessage =
                    errorData.message || errorData.error || errorMessage;
            } catch {
                errorMessage = errorText || errorMessage;
            }

            throw new Error(errorMessage);
        }

        const userData = await response.json();
        return userData as UserType; // Type assertion to User
    } catch (error) {
        console.error("Error fetching user:", error);
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

        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = `Error! Status: ${response.status}`;

            try {
                const errorData = JSON.parse(errorText);
                errorMessage =
                    errorData.message || errorData.error || errorMessage;
            } catch {
                errorMessage = errorText || errorMessage;
            }

            throw new Error(errorMessage);
        }

        return await response.text();
    } catch (error) {
        // Re-throw the error with the specific message
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
            body: JSON.stringify({
                email: email,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = `Error! Status: ${response.status}`;

            try {
                const errorData = JSON.parse(errorText);
                errorMessage =
                    errorData.message || errorData.error || errorMessage;
            } catch {
                errorMessage = errorText || errorMessage;
            }

            throw new Error(errorMessage);
        }

        return await response.text();
    } catch (error) {
        // Re-throw the error with the specific message
        throw error instanceof Error
            ? error
            : new Error("An unexpected error occurred during resending code");
    }
};

export const userForgotPassword = async (email: string) => {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                email: email,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = `Error! Status: ${response.status}`;

            try {
                const errorData = JSON.parse(errorText);
                errorMessage =
                    errorData.message || errorData.error || errorMessage;
            } catch {
                errorMessage = errorText || errorMessage;
            }

            throw new Error(errorMessage);
        }

        return await response.text();
    } catch (error) {
        // Re-throw the error with the specific message
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
            body: JSON.stringify({
                email: email,
                verificationCode: code,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = `Error! Status: ${response.status}`;

            try {
                const errorData = JSON.parse(errorText);
                errorMessage =
                    errorData.message || errorData.error || errorMessage;
            } catch {
                errorMessage = errorText || errorMessage;
            }

            throw new Error(errorMessage);
        }

        return await response.text();
    } catch (error) {
        // Re-throw the error with the specific message
        throw error instanceof Error
            ? error
            : new Error(
                  "An unexpected error occurred during reset verification code",
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
                email: email,
                verificationCode: code,
                newPassword: password,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = `Error! Status: ${response.status}`;

            try {
                const errorData = JSON.parse(errorText);
                errorMessage =
                    errorData.message || errorData.error || errorMessage;
            } catch {
                errorMessage = errorText || errorMessage;
            }

            throw new Error(errorMessage);
        }

        return await response.text();
    } catch (error) {
        // Re-throw the error with the specific message
        throw error instanceof Error
            ? error
            : new Error("An unexpected error occurred during reset password");
    }
};
