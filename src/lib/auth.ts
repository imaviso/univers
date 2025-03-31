import type { LoginResponse } from "./types";
export const API_BASE_URL = "http://localhost:8080"; // Backend API URL

export const userSignIn = async (email: string, password: string) => {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                email,
                password,
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
                idNumber,
                firstName,
                lastName,
                department,
                email,
                phoneNumber,
                password,
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
            : new Error("An unexpected error occurred during signup");
    }
};

export const userSignOut = async () => {
    let error = null;

    const res = await fetch(`${API_BASE_URL}/users/logout`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
    })
        .then(async (res) => {
            if (!res.ok) throw await res.json();
            localStorage.clear();
            window.location.reload();
            return res;
        })
        .catch((err) => {
            console.log(err);
            error = err.detail;
            return null;
        });

    if (error) {
        throw error;
    }
    return res;
};

export const getSessionUser = async () => {
    let error = null;

    const res = await fetch(`${API_BASE_URL}/validateSession`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
    })
        .then(async (res) => {
            if (!res.ok) throw await res.json();
            return res.json();
        })
        .catch((err) => {
            console.log(err);
            error = err.detail;
            return null;
        });

    if (error) {
        throw error;
    }

    return res;
};

export const verifyOTP = async (email: string, code: string) => {
    try {
        const response = await fetch(`${API_BASE_URL}/users/verify-email`, {
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
            throw new Error(`Error! Status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        throw Error;
    }
};
