import { API_BASE_URL } from "./auth";
import type { EventInput } from "./schema";
import type { UserType } from "./types";

export const getAllUsers = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/users`, {
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

export const createUser = async (
    userData: Omit<
        UserType,
        "id" | "emailVerified" | "createdAt" | "updatedAt"
    >,
) => {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/users`, {
            method: "POST",
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

        return await response.text();
    } catch (error) {
        // Re-throw the error with the specific message
        throw error instanceof Error
            ? error
            : new Error("An unexpected error occurred during creating user.");
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

        return await response.text();
    } catch (error) {
        // Re-throw the error with the specific message
        throw error instanceof Error
            ? error
            : new Error("An unexpected error occurred during updating user.");
    }
};

export const deactivateUser = async (userData: UserType) => {
    try {
        const response = await fetch(`${API_BASE_URL}/users/${userData.id}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ active: false }),
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

        return await response.text();
    } catch (error) {
        // Re-throw the error with the specific message
        throw error instanceof Error
            ? error
            : new Error(
                  "An unexpected error occurred during deactivating user.",
              );
    }
};

export const getAllVenues = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/venues`, {
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
            : new Error("An unexpected error occurred during fetching venues.");
    }
};

export const getAllDepartments = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/departments`, {
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
    } catch (error) {
        // Re-throw the error with the specific message
        throw error instanceof Error
            ? error
            : new Error(
                  "An unexpected error occurred during fetching departments.",
              );
    }
};

export const getAllEvents = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/events`, {
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
            : new Error("An unexpected error occurred during fetching events.");
    }
};

export const createEvent = async (data: EventInput) => {
    try {
        const response = await fetch(`${API_BASE_URL}/events`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify(data),
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
            : new Error("An unexpected error occurred during fetching events.");
    }
};
