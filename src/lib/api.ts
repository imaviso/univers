import { API_BASE_URL } from "./auth";
import type { UserType } from "./types";

export const getAllUsers = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/users`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
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
            : new Error("An unexpected error occurred during fetching users.");
    }
};

export const updateUser = async (userData: UserType) => {
    try {
        const response = await fetch(`${API_BASE_URL}/users/${userData.id}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(userData),
            credentials: "include",
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
            : new Error("An unexpected error occurred during updating user.");
    }
}