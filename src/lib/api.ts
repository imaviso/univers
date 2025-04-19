import { API_BASE_URL } from "./auth";
import type { EventInput, VenueInput } from "./schema";
import type { UserType, Venue } from "./types";

// ... other imports ...

// Helper function to handle response and potential errors
async function handleApiResponse(response: Response, expectJson = true) {
    if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Error! Status: ${response.status}`;
        try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
            // If parsing fails, use the raw text or the status message
            errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
    }

    // Handle 204 No Content specifically for JSON expectations
    if (response.status === 204 && expectJson) {
        return undefined; // Or return null/empty array depending on expected structure
    }

    // Handle non-JSON expectations
    if (!expectJson) {
        return await response.text();
    }

    // Try to parse JSON, handle potential empty body for 200 OK
    try {
        // Check if content-type indicates JSON before parsing
        const contentType = response.headers.get("content-type");
        if (contentType?.includes("application/json")) {
            // Clone the response to read the text first, in case json() fails on empty valid response
            const responseClone = response.clone();
            const text = await responseClone.text();
            if (!text) {
                // Handle cases where 200 OK might have an empty body but valid JSON (e.g., empty array/object represented as "")
                // Depending on API contract, might return [], {}, null, or undefined
                return undefined; // Or adjust as needed
            }
            return await response.json(); // Parse the original response
        }
        // If not JSON, but expected JSON, treat as error or return text?
        // For now, let's assume if expectJson is true, it should be JSON.
        // If API might return non-JSON on success, adjust logic.
        // This code is reached only if contentType is not application/json
        console.warn(
            "Expected JSON response but received content-type:",
            contentType,
        );
        return await response.text(); // Fallback to text if content-type is wrong
    } catch (error) {
        // Catch JSON parsing errors specifically
        if (
            error instanceof SyntaxError &&
            error.message.includes("Unexpected end of JSON input")
        ) {
            console.error(
                "API Error: Received empty or invalid JSON body despite success status.",
            );
            // Return a sensible default based on expectation, e.g., empty array for lists
            // This depends heavily on what the calling code expects on empty success
            return undefined; // Or [], {}, null etc.
        }
        // Re-throw other errors
        throw error;
    }
}

export const getAllUsers = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/users`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        });
        // Expect JSON, potentially an array. Handle empty success.
        const data = await handleApiResponse(response, true);
        return data ?? []; // Default to empty array if undefined/null
    } catch (error) {
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
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(userData),
            credentials: "include",
        });
        // Assuming backend returns text confirmation on success
        return await handleApiResponse(response, false);
    } catch (error) {
        throw error instanceof Error
            ? error
            : new Error("An unexpected error occurred during creating user.");
    }
};

export const updateUser = async (userData: UserType) => {
    try {
        // Exclude fields that shouldn't be sent on update if necessary
        const { id, createdAt, updatedAt, emailVerified, ...updateData } =
            userData;
        const response = await fetch(`${API_BASE_URL}/users/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            // Only send fields allowed by the API for update
            body: JSON.stringify(updateData),
            credentials: "include",
        });
        // Assuming backend returns text confirmation on success
        return await handleApiResponse(response, false);
    } catch (error) {
        throw error instanceof Error
            ? error
            : new Error("An unexpected error occurred during updating user.");
    }
};

export const deactivateUser = async (userData: UserType) => {
    try {
        const response = await fetch(`${API_BASE_URL}/users/${userData.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ active: false }), // Only send the 'active' field
            credentials: "include",
        });
        // Assuming backend returns text confirmation on success
        return await handleApiResponse(response, false);
    } catch (error) {
        throw error instanceof Error
            ? error
            : new Error(
                  "An unexpected error occurred during deactivating user.",
              );
    }
};

export const getAllVenues = async (): Promise<Venue[]> => {
    // Add return type
    try {
        const response = await fetch(`${API_BASE_URL}/venues`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        });
        // Expect JSON array, handle empty success (200 OK with [] or 204)
        const data = await handleApiResponse(response, true);
        return data ?? []; // Default to empty array
    } catch (error) {
        throw error instanceof Error
            ? error
            : new Error("An unexpected error occurred during fetching venues.");
    }
};

export const getAllDepartments = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/departments`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        });
        // Expect JSON array, handle empty success
        const data = await handleApiResponse(response, true);
        return data ?? []; // Default to empty array
    } catch (error) {
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
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        });
        // Expect JSON array, handle empty success
        const data = await handleApiResponse(response, true);
        return data ?? []; // Default to empty array
    } catch (error) {
        throw error instanceof Error
            ? error
            : new Error("An unexpected error occurred during fetching events.");
    }
};

export const createEvent = async (data: EventInput) => {
    try {
        const response = await fetch(`${API_BASE_URL}/events`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(data),
        });
        // Assuming backend returns text confirmation on success
        return await handleApiResponse(response, false);
    } catch (error) {
        throw error instanceof Error
            ? error
            : new Error("An unexpected error occurred during creating event.");
    }
};

export const createVenue = async (data: VenueInput) => {
    try {
        // Handle potential File object for image upload
        const formData = new FormData();
        for (const [key, value] of Object.entries(data)) {
            if (key === "image" && value instanceof File) {
                formData.append(key, value);
            } else if (value !== undefined && value !== null) {
                // Append other fields if they exist
                formData.append(key, String(value)); // Convert non-file values to string
            }
        }

        const response = await fetch(`${API_BASE_URL}/venues`, {
            method: "POST",
            // Don't set Content-Type header when using FormData, browser does it
            credentials: "include",
            body: formData, // Send FormData
        });
        // Assuming backend returns the created venue object as JSON on success
        return await handleApiResponse(response, true); // Expect JSON back
    } catch (error) {
        throw error instanceof Error
            ? error
            : new Error("An unexpected error occurred during creating venue.");
    }
};

export const updateVenue = async (data: Venue) => {
    try {
        // Handle potential File object for image upload if API supports it on PATCH
        // This might require FormData similar to createVenue, or a separate endpoint
        // For simplicity, assuming API accepts JSON patch and image URL update separately or handles JSON payload
        const { id, ...updateData } = data; // Separate ID from data

        // If image is a File, it cannot be directly stringified in JSON.
        // Decide how to handle: omit, send via FormData (if API supports), or use separate endpoint.
        // Let's assume for now we only send non-File data via JSON PATCH.
        const jsonData: Partial<Venue> = {};
        // Use for...of loop and ensure value is not a File before assigning
        for (const [keyAsString, value] of Object.entries(updateData)) {
            // Skip if the value is a File object
            if (
                typeof value === "object" &&
                value !== null &&
                value instanceof File
            ) {
                continue;
            }
            // Assert key type and assign the value
            const key = keyAsString as keyof Venue;
            jsonData[key] = value;
        }

        const response = await fetch(`${API_BASE_URL}/venues/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(jsonData), // Send JSON data without File
        });
        // Assuming backend returns the updated venue object as JSON on success
        return await handleApiResponse(response, true); // Expect JSON back
    } catch (error) {
        throw error instanceof Error
            ? error
            : new Error("An unexpected error occurred during updating venue.");
    }
};

// Change deleteVenue to accept ID instead of full object
export const deleteVenue = async (venueId: number) => {
    try {
        const response = await fetch(`${API_BASE_URL}/venues/${venueId}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        });
        // DELETE often returns 204 No Content or text confirmation
        return await handleApiResponse(response, false); // Expect text or no content
    } catch (error) {
        throw error instanceof Error
            ? error
            : new Error("An unexpected error occurred during deleting venue.");
    }
};

// Add deleteVenues function if needed by the UI (currently commented out)
// export const deleteVenues = async (venueIds: number[]) => {
//     try {
//         const response = await fetch(`${API_BASE_URL}/venues/bulk-delete`, { // Example endpoint
//             method: "POST", // Or DELETE with body, depending on API design
//             headers: { "Content-Type": "application/json" },
//             credentials: "include",
//             body: JSON.stringify({ ids: venueIds }),
//         });
//         // Expect text or no content
//         return await handleApiResponse(response, false);
//     } catch (error) {
//         throw error instanceof Error ? error : new Error("An unexpected error occurred during bulk deleting venues.");
//     }
// };
