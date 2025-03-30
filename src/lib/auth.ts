import type { LoginResponse } from "./types";

export const API_BASE_URL = "http://localhost:8080"; // Backend API URL

export const userSignIn = async (
    email: string,
    password: string,
): Promise<LoginResponse> => {
    try {
        const response = await fetch(`${API_BASE_URL}/users/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                email: email,
                password: password,
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

export const userSignUp = async (
    names: string,
    email: string,
    password: string,
) => {
    try {
        const response = await fetch(`${API_BASE_URL}/users/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                names: names,
                email: email,
                password: password,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            try {
                const errorData = JSON.parse(errorText);
                throw new Error(
                    errorData.message || `Error! Status: ${response.status}`,
                );
            } catch (e) {
                throw new Error(
                    errorText || `Error! Status: ${response.status}`,
                );
            }
        }

        const data = await response.json();
        return data;
    } catch (error) {
        throw Error;
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
