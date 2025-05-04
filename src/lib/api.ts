import { API_BASE_URL } from "./auth";
import type { NotificationDTO, Page } from "./notifications";
import type {
    EditUserFormInput,
    EquipmentDTOInput,
    EquipmentDTOOutput,
    EventInput,
    EventOutput,
    VenueInput,
} from "./schema";
import type {
    CreateEquipmentReservationInput,
    CreateVenueReservationInput,
    DepartmentDTO,
    DepartmentType,
    Equipment,
    EquipmentActionInput,
    EquipmentApprovalDTO,
    EquipmentReservationDTO,
    Event,
    EventApprovalDTO,
    EventDTOBackendResponse,
    EventDTOPayload,
    ReservationActionInput,
    UserDTO,
    UserRole,
    UserType,
    Venue,
    VenueApprovalDTO,
    VenueReservationDTO,
} from "./types";

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
        if (
            errorMessage.includes("Email already in use") ||
            errorMessage.includes("Department already exists") ||
            errorMessage.includes("Department does not exist") ||
            errorMessage.includes("Invalid department head") ||
            errorMessage.includes("User not found") ||
            errorMessage.includes("Invalid department Id") ||
            errorMessage.includes("User does not exist")
        ) {
        }
        throw new Error(errorMessage);
    }

    if (response.status === 204) {
        return expectJson ? null : "";
    }

    if (response.status === 204 && expectJson) {
        return [];
    }

    if (response.status === 204 && !expectJson) {
        return null;
    }

    if (!expectJson) {
        return await response.text();
    }

    try {
        const contentType = response.headers.get("content-type");
        if (contentType?.includes("application/json")) {
            // Clone the response to read the text first, in case json() fails on empty valid response
            const responseClone = response.clone();
            const text = await responseClone.text();
            if (!text) {
                // Handle cases where 200 OK might have an empty body but valid JSON (e.g., empty array/object represented as "")
                // Depending on API contract, might return [], {}, null, or undefined
                return null; // Or adjust as needed
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
            return null; // Or [], {}, null etc.
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

type UpdateProfileInput = {
    userId: string;
    data: Partial<
        Pick<
            UserType,
            | "firstName"
            | "lastName"
            | "phoneNumber"
            | "idNumber"
            | "departmentId"
        >
    >;
    imageFile?: File | null;
};

export const updateProfile = async ({
    userId,
    data,
    imageFile,
}: UpdateProfileInput): Promise<string> => {
    try {
        const numericUserId = Number.parseInt(userId, 10);
        if (Number.isNaN(numericUserId)) {
            throw new Error("Invalid User ID format.");
        }

        const formData = new FormData();

        // Construct the DTO payload matching backend expectations
        const userDtoPayload: Partial<UserDTO> = {
            // Map frontend fields to backend DTO fields
            firstName: data.firstName,
            lastName: data.lastName,
            phone_number: data.phoneNumber, // Map phoneNumber to phone_number
            id_number: data.idNumber, // Map idNumber to id_number
            departmentId: Number(data.departmentId), // Keep departmentId as is if backend expects it directly
            // Add other fields from UserDTO if needed, ensuring they are optional or handled correctly
        };

        // Remove undefined fields from the payload before stringifying
        for (const key of Object.keys(userDtoPayload)) {
            const k = key as keyof Partial<UserDTO>;
            if (userDtoPayload[k] === undefined) {
                delete userDtoPayload[k];
            }
        }

        // Append the JSON data as a blob part named "userDTO"
        formData.append(
            "userDTO", // Name must match the backend @RequestPart or inferred name
            new Blob([JSON.stringify(userDtoPayload)], {
                type: "application/json",
            }),
        );

        // Append the image file if provided, named "image"
        if (imageFile) {
            formData.append("image", imageFile, imageFile.name);
        }

        const response = await fetch(`${API_BASE_URL}/users/${numericUserId}`, {
            method: "PATCH",
            credentials: "include",
            body: formData, // Send FormData
            // No 'Content-Type' header needed; browser sets it for FormData
        });

        // Expect a string message on success
        return await handleApiResponse(response, false);
    } catch (error) {
        throw error instanceof Error
            ? error
            : new Error(
                  "An unexpected error occurred during updating profile.",
              );
    }
};

type CreateUserInputFE = Omit<
    UserType,
    "id" | "emailVerified" | "createdAt" | "updatedAt"
>;

export const createUser = async (userData: CreateUserInputFE) => {
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

export const updateUser = async ({
    userId,
    userData,
    imageFile,
}: {
    userId: string;
    userData: EditUserFormInput;
    imageFile?: File | null;
}): Promise<string> => {
    try {
        const numericUserId = Number.parseInt(userId, 10);
        if (Number.isNaN(numericUserId)) {
            throw new Error("Invalid User ID format.");
        }

        const formData = new FormData();

        const userDtoPayload: Partial<{
            firstName: string;
            lastName: string;
            idNumber: string;
            email: string;
            password?: string;
            phoneNumber?: string;
            telephoneNumber: string;
            role: UserRole;
            departmentId: number | null;
        }> = {};

        if (userData.firstName !== undefined)
            userDtoPayload.firstName = userData.firstName;
        if (userData.lastName !== undefined)
            userDtoPayload.lastName = userData.lastName;
        if (userData.idNumber !== undefined)
            userDtoPayload.idNumber = userData.idNumber;
        if (userData.email !== undefined) userDtoPayload.email = userData.email;
        if (userData.password !== undefined)
            userDtoPayload.password = userData.password;
        if (userData.phoneNumber !== undefined)
            userDtoPayload.phoneNumber = userData.phoneNumber;
        if (userData.telephoneNumber !== undefined)
            userDtoPayload.telephoneNumber = userData.telephoneNumber;
        if (userData.role !== undefined) {
            userDtoPayload.role = userData.role as UserRole;
        }
        if (userData.departmentId !== undefined)
            userDtoPayload.departmentId = Number(userData.departmentId);

        for (const key of Object.keys(userDtoPayload)) {
            const k = key as keyof typeof userDtoPayload;
            if (userDtoPayload[k] === undefined) {
                delete userDtoPayload[k];
            }
        }

        formData.append(
            "userDTO",
            new Blob([JSON.stringify(userDtoPayload)], {
                type: "application/json",
            }),
        );

        if (imageFile) {
            formData.append("image", imageFile, imageFile.name);
        }

        const response = await fetch(
            `${API_BASE_URL}/admin/users/${numericUserId}`,
            {
                method: "PATCH",
                credentials: "include",
                body: formData,
            },
        );

        return await handleApiResponse(response, false);
    } catch (error) {
        throw error instanceof Error
            ? error
            : new Error("An unexpected error occurred during updating user.");
    }
};

export const deactivateUser = async (userId: string) => {
    try {
        const numericUserId = Number.parseInt(userId, 10);
        if (Number.isNaN(numericUserId)) {
            throw new Error("Invalid User ID format for deactivation.");
        }
        const response = await fetch(
            `${API_BASE_URL}/admin/users/${numericUserId}`,
            {
                method: "DELETE",
                credentials: "include",
            },
        );
        return await handleApiResponse(response, false);
    } catch (error) {
        throw error instanceof Error
            ? error
            : new Error(
                  "An unexpected error occurred during deactivating user.",
              );
    }
};

export const activateUser = async (userId: string) => {
    try {
        const numericUserId = Number.parseInt(userId, 10);
        if (Number.isNaN(numericUserId)) {
            throw new Error("Invalid User ID format for activation.");
        }
        const response = await fetch(
            `${API_BASE_URL}/admin/users/${numericUserId}`,
            {
                method: "POST",
                credentials: "include",
            },
        );
        return await handleApiResponse(response, false);
    } catch (error) {
        throw error instanceof Error
            ? error
            : new Error("An unexpected error occurred during activating user.");
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

export const getAllEvents = async (): Promise<Event[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/events`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        });
        const data = await handleApiResponse(response, true);
        return data ?? [];
    } catch (error) {
        throw error instanceof Error
            ? error
            : new Error("An unexpected error occurred during fetching events.");
    }
};

export const getEventById = async (eventId: string): Promise<Event> => {
    try {
        const response = await fetch(`${API_BASE_URL}/events/${eventId}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        });
        // Expect JSON object, handle empty success
        const data = await handleApiResponse(response, true);
        return data ?? {}; // Default to empty object
    } catch (error) {
        throw error instanceof Error
            ? error
            : new Error(
                  `An unexpected error occurred during fetching event with ID ${eventId}.`,
              );
    }
};

export const createEvent = async (
    eventDTO: EventDTOPayload,
    approvedLetter: File,
): Promise<EventDTOBackendResponse> => {
    // Update return type if needed
    try {
        const formData = new FormData();

        formData.append(
            "event",
            new Blob([JSON.stringify(eventDTO)], {
                type: "application/json",
            }),
        );

        formData.append("approvedLetter", approvedLetter, approvedLetter.name);

        const response = await fetch(`${API_BASE_URL}/events`, {
            method: "POST",
            credentials: "include",
            body: formData,
        });

        return await handleApiResponse(response, true);
    } catch (error) {
        throw error instanceof Error
            ? error
            : new Error("An unexpected error occurred during creating event.");
    }
};

export const updateEvent = async ({
    eventId,
    eventData,
    approvedLetter,
}: {
    eventId: number;
    eventData: Partial<EventDTOPayload>; // Use Partial as not all fields might be updated
    approvedLetter?: File | null;
}): Promise<string> => {
    try {
        const formData = new FormData();

        // Append the event data as a JSON blob
        formData.append(
            "event",
            new Blob([JSON.stringify(eventData)], {
                type: "application/json",
            }),
        );

        // Append the optional approved letter file
        if (approvedLetter) {
            formData.append(
                "approvedLetter",
                approvedLetter,
                approvedLetter.name,
            );
        }

        const response = await fetch(`${API_BASE_URL}/events/${eventId}`, {
            method: "PATCH",
            credentials: "include",
            body: formData,
        });

        // Expect a string message on success
        return await handleApiResponse(response, false);
    } catch (error) {
        throw error instanceof Error
            ? error
            : new Error(
                  `An unexpected error occurred during updating event ${eventId}.`,
              );
    }
};

export const cancelEvent = async (eventId: number): Promise<string> => {
    try {
        const response = await fetch(
            `${API_BASE_URL}/events/${eventId}/cancel`,
            {
                method: "PATCH",
                credentials: "include",
            },
        );

        // Expect a string message on success
        return await handleApiResponse(response, false);
    } catch (error) {
        throw error instanceof Error
            ? error
            : new Error(
                  `An unexpected error occurred during canceling event ${eventId}.`,
              );
    }
};

export const approveEvent = async ({
    eventId,
    remarks,
}: {
    eventId: number;
    remarks: string;
}): Promise<string> => {
    try {
        const url = `${API_BASE_URL}/event-approval/${eventId}/approve`;

        const payload = { remarks: remarks || "" };

        const response = await fetch(url, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify(payload),
        });
        return await handleApiResponse(response, false);
    } catch (error) {
        if (error instanceof Error) {
            throw error;
        }
        throw new Error(
            `An unexpected error occurred during approving event ${eventId}.`,
        );
    }
};

export const getAllApprovalsOfEvent = async (
    eventId: number,
): Promise<EventApprovalDTO[]> => {
    try {
        const response = await fetch(
            `${API_BASE_URL}/event-approval/${eventId}`,
            {
                method: "GET",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
            },
        );
        const data = await handleApiResponse(response, true);
        return data ?? [];
    } catch (error) {
        throw error instanceof Error
            ? error
            : new Error(
                  `An unexpected error occurred during fetching approvals for event ${eventId}.`,
              );
    }
};

export const getOwnEvents = async (): Promise<Event[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/users/me/events`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        });
        const data = await handleApiResponse(response, true);
        return data ?? [];
    } catch (error) {
        throw error instanceof Error
            ? error
            : new Error(
                  "An unexpected error occurred during fetching own events.",
              );
    }
};

export const getApprovedEvents = async (): Promise<Event[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/events/approved`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        });
        const data = await handleApiResponse(response, true);
        return data ?? [];
    } catch (error) {
        throw error instanceof Error
            ? error
            : new Error(
                  "An unexpected error occurred during fetching own events.",
              );
    }
};

export const getPendingVenueOwnerEvents = async (): Promise<Event[]> => {
    try {
        const response = await fetch(
            `${API_BASE_URL}/events/pending/venue-owner`,
            {
                method: "GET",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
            },
        );
        const data = await handleApiResponse(response, true);
        return data ?? [];
    } catch (error) {
        throw error instanceof Error
            ? error
            : new Error(
                  "An unexpected error occurred while fetching pending events for venue owner.",
              );
    }
};

export const getPendingDeptHeadEvents = async (): Promise<Event[]> => {
    try {
        const response = await fetch(
            `${API_BASE_URL}/events/pending/department-head`,
            {
                method: "GET",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
            },
        );
        const data = await handleApiResponse(response, true);
        return data ?? [];
    } catch (error) {
        throw error instanceof Error
            ? error
            : new Error(
                  "An unexpected error occurred while fetching pending events for department head.",
              );
    }
};

export const createVenue = async ({
    venueData,
    imageFile,
}: {
    venueData: VenueInput; // Form data type
    imageFile: File | null; // Separate image file
}): Promise<Venue> => {
    // Returns the created Venue DTO
    try {
        const formData = new FormData();

        // Prepare the JSON part, nesting venueOwnerId
        const { venueOwnerId, ...restOfVenueData } = venueData;
        const venueJsonPayload: {
            name: string;
            location: string;
            venueOwner?: { id: number };
        } = { ...restOfVenueData }; // Start with name, location
        if (venueOwnerId) {
            // Nest owner ID according to backend DTO structure
            venueJsonPayload.venueOwner = { id: venueOwnerId };
        } else {
            // If no owner selected, venueOwner remains undefined, which is handled by JSON.stringify
        }

        // Append JSON part named "venue"
        formData.append(
            "venue",
            new Blob([JSON.stringify(venueJsonPayload)], {
                type: "application/json",
            }),
        );

        // Append image file if provided, named "image"
        if (imageFile) {
            formData.append("image", imageFile, imageFile.name);
        }

        // Endpoint is /venues (not /admin/venues)
        const response = await fetch(`${API_BASE_URL}/admin/venues`, {
            method: "POST",
            credentials: "include",
            body: formData, // Send FormData
        });
        // Expect created Venue DTO back
        return await handleApiResponse(response, true);
    } catch (error) {
        throw error instanceof Error
            ? error
            : new Error("An unexpected error occurred during creating venue.");
    }
};

export const updateVenue = async ({
    venueId,
    venueData,
    imageFile,
}: {
    venueId: number;
    venueData: VenueInput; // Form data type
    imageFile: File | null; // Optional new image file
}): Promise<Venue> => {
    // Returns the updated Venue DTO
    try {
        const formData = new FormData();

        // Prepare the JSON part for update, nesting venueOwnerId
        const { venueOwnerId, ...restOfVenueData } = venueData;
        const venueJsonPayload: Partial<{
            name: string;
            location: string;
            venueOwner?: { id: number };
        }> = { ...restOfVenueData }; // name, location
        if (venueOwnerId) {
            venueJsonPayload.venueOwner = { id: venueOwnerId };
        } else {
            // If API expects null to remove owner, send null.
            // If omitting the field keeps the owner, adjust accordingly.
            venueJsonPayload.venueOwner = undefined; // Explicitly set to undefined to potentially remove it
        }

        // Append JSON part named "venue"
        formData.append(
            "venue",
            new Blob([JSON.stringify(venueJsonPayload)], {
                type: "application/json",
            }),
        );

        // Append image file if provided, named "image"
        if (imageFile) {
            formData.append("image", imageFile, imageFile.name);
        }

        // Endpoint is PATCH /venues/{venueId}
        const response = await fetch(
            `${API_BASE_URL}/admin/venues/${venueId}`,
            {
                method: "PATCH", // Use PATCH
                credentials: "include",
                body: formData, // Send FormData
            },
        );
        // Expect updated Venue DTO back
        return await handleApiResponse(response, true);
    } catch (error) {
        throw error instanceof Error
            ? error
            : new Error(
                  `An unexpected error occurred during updating venue ${venueId}.`,
              );
    }
};

export const deleteVenue = async (venueId: number): Promise<string | null> => {
    try {
        const response = await fetch(
            `${API_BASE_URL}/admin/venues/${venueId}`,
            {
                method: "DELETE",
                credentials: "include",
                // No Content-Type or body needed for standard DELETE
            },
        );
        return await handleApiResponse(response, false);
    } catch (error) {
        throw error instanceof Error
            ? error
            : new Error(
                  `An unexpected error occurred during deleting venue ${venueId}.`,
              );
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
//

export const getAllEquipmentsAdmin = async (): Promise<Equipment[]> => {
    try {
        const url = new URL(`${API_BASE_URL}/equipments/all`);
        const response = await fetch(url.toString(), {
            method: "GET",
            credentials: "include",
        });
        const data = await handleApiResponse(response, true);
        return data ?? [];
    } catch (error) {
        throw error instanceof Error
            ? error
            : new Error(
                  "An unexpected error occurred while fetching all equipment.",
              );
    }
};

export const getEquipmentReservationsByEventId = async (
    eventId: number | string,
): Promise<EquipmentReservationDTO[]> => {
    try {
        const response = await fetch(
            `${EQUIPMENT_RESERVATIONS_BASE_URL}/event/${eventId}`,
            {
                method: "GET",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
            },
        );
        const data = await handleApiResponse(response, true);
        return data ?? [];
    } catch (error) {
        throw error instanceof Error
            ? error
            : new Error(
                  `An unexpected error occurred fetching equipment reservations for event ${eventId}.`,
              );
    }
};

export const getAllEquipmentsByOwner = async (
    ownerUserId: number,
): Promise<Equipment[]> => {
    try {
        const url = new URL(`${API_BASE_URL}/equipments`);
        url.searchParams.append("userId", ownerUserId.toString());
        const response = await fetch(url.toString(), {
            method: "GET",
            credentials: "include",
        });
        const data = await handleApiResponse(response, true);
        return data ?? [];
    } catch (error) {
        throw error instanceof Error
            ? error
            : new Error(
                  `An unexpected error occurred while fetching equipment for user ${ownerUserId}.`,
              );
    }
};

export const addEquipment = async ({
    userId,
    equipmentData,
    imageFile,
}: {
    userId: number;
    equipmentData: EquipmentDTOInput;
    imageFile: File;
}): Promise<Equipment> => {
    try {
        const formData = new FormData();

        const { ownerId, ...restOfEquipmentData } = equipmentData;
        const equipmentJsonPayload: {
            name: string;
            brand: string;
            quantity: number;
            equipmentOwner?: { id: number };
        } = { ...restOfEquipmentData };
        if (ownerId) {
            equipmentJsonPayload.equipmentOwner = { id: ownerId };
        }

        formData.append(
            "equipment",
            new Blob([JSON.stringify(equipmentJsonPayload)], {
                type: "application/json",
            }),
        );

        // Backend requires image for add? Controller says optional, service implies required.
        // Assuming required based on previous logic. Add check if needed.
        // if (!imageFile) throw new Error("Image file is required for adding equipment.");
        formData.append("image", imageFile, imageFile.name);

        const url = new URL(`${API_BASE_URL}/equipments`);
        url.searchParams.append("userId", userId.toString());

        const response = await fetch(url.toString(), {
            method: "POST",
            credentials: "include",
            body: formData,
        });
        return await handleApiResponse(response, true);
    } catch (error) {
        throw error instanceof Error
            ? error
            : new Error(
                  "An unexpected error occurred during adding equipment.",
              );
    }
};

export const editEquipment = async ({
    equipmentId,
    userId,
    equipmentData,
    imageFile,
}: {
    equipmentId: number;
    userId: number;
    equipmentData: EquipmentDTOInput;
    imageFile?: File | null;
}): Promise<Equipment> => {
    try {
        const formData = new FormData();

        const { ownerId, ...restOfEquipmentData } = equipmentData;
        const equipmentJsonPayload: Partial<{
            name: string;
            brand: string;
            quantity: number;
            equipmentOwner?: { id: number };
        }> = { ...restOfEquipmentData };
        if (ownerId) {
            equipmentJsonPayload.equipmentOwner = { id: ownerId };
        }

        formData.append(
            "equipment",
            new Blob([JSON.stringify(equipmentJsonPayload)], {
                type: "application/json",
            }),
        );

        if (imageFile) {
            formData.append("image", imageFile, imageFile.name);
        }

        const url = new URL(`${API_BASE_URL}/equipments/${equipmentId}`);
        url.searchParams.append("userId", userId.toString());

        const response = await fetch(url.toString(), {
            method: "PATCH",
            credentials: "include",
            body: formData,
        });
        return await handleApiResponse(response, true);
    } catch (error) {
        throw error instanceof Error
            ? error
            : new Error(
                  `An unexpected error occurred during editing equipment ${equipmentId}.`,
              );
    }
};

export const deleteEquipment = async (
    equipmentId: number,
    userId: number,
): Promise<void> => {
    try {
        const url = new URL(`${API_BASE_URL}/equipments/${equipmentId}`);
        url.searchParams.append("userId", userId.toString());

        const response = await fetch(url.toString(), {
            method: "DELETE",
            credentials: "include",
        });
        await handleApiResponse(response, false);
    } catch (error) {
        throw error instanceof Error
            ? error
            : new Error(
                  `An unexpected error occurred during deleting equipment ${equipmentId}.`,
              );
    }
};

// export const bulkDeleteEquipment = async (
//     equipmentIds: number[],
//     userId: number, // Add userId if backend needs it for authorization
// ): Promise<void> => {
//     console.warn("bulkDeleteEquipment API function not fully implemented.");
//     try {
//         const url = new URL(`${API_BASE_URL}/equipments/bulk-delete`); // Example endpoint
//         // url.searchParams.append("userId", userId.toString()); // If needed as query param

//         const response = await fetch(url.toString(), {
//             method: "POST", // Or DELETE with body
//             headers: { "Content-Type": "application/json" },
//             credentials: "include",
//             body: JSON.stringify({ ids: equipmentIds /*, userId: userId */ }), // Add userId if needed in body
//         });
//         // Expect No Content (204) or potentially text confirmation
//         await handleApiResponse(response, false);
//     } catch (error) {
//         throw error instanceof Error
//             ? error
//             : new Error(
//                   "An unexpected error occurred during bulk deleting equipment.",
//               );
//     }
// };

export const getAllDepartments = async (): Promise<DepartmentType[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/departments`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        });
        const data: DepartmentDTO[] =
            (await handleApiResponse(response, true)) ?? [];

        return data.map((dept) => ({
            id: dept.id,
            name: dept.name,
            description: dept.description,
            deptHeadName: dept.deptHead
                ? `${dept.deptHead.firstName} ${dept.deptHead.lastName}`
                : null,
            deptHeadId: dept.deptHeadId,
            createdAt: dept.createdAt,
            updatedAt: dept.updatedAt,
        }));
    } catch (error) {
        throw error instanceof Error
            ? error
            : new Error(
                  "An unexpected error occurred during fetching departments.",
              );
    }
};

type DepartmentPayload = {
    name: string;
    description?: string | null;
    deptHead?: number | null;
};

export const addDepartment = async (
    departmentData: DepartmentPayload,
): Promise<string> => {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/departments`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(departmentData),
        });

        return await handleApiResponse(response, false);
    } catch (error) {
        throw error instanceof Error
            ? error
            : new Error(
                  "An unexpected error occurred during adding department.",
              );
    }
};

export const updateDepartment = async (
    departmentId: number,
    departmentData: Partial<DepartmentPayload>,
): Promise<string> => {
    try {
        const response = await fetch(
            `${API_BASE_URL}/admin/departments/${departmentId}`,
            {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(departmentData),
            },
        );

        return await handleApiResponse(response, false);
    } catch (error) {
        throw error instanceof Error
            ? error
            : new Error(
                  `An unexpected error occurred during updating department ${departmentId}.`,
              );
    }
};

export const assignDepartmentHead = async (
    departmentId: number,
    userId: number,
): Promise<string> => {
    try {
        const response = await fetch(
            `${API_BASE_URL}/admin/${departmentId}/assign-head/${userId}`,
            {
                method: "POST",
                credentials: "include",
            },
        );

        return await handleApiResponse(response, false);
    } catch (error) {
        throw error instanceof Error
            ? error
            : new Error(
                  `An unexpected error occurred during assigning head to department ${departmentId}.`,
              );
    }
};

export const deleteDepartment = async (
    departmentId: number,
): Promise<string | null> => {
    try {
        const response = await fetch(
            `${API_BASE_URL}/admin/departments/${departmentId}`,
            {
                method: "DELETE",
                credentials: "include",
            },
        );

        return await handleApiResponse(response, false);
    } catch (error) {
        throw error instanceof Error
            ? error
            : new Error(
                  `An unexpected error occurred during deleting department ${departmentId}.`,
              );
    }
};

export const getNotifications = async (
    page = 0,
    size = 10,
): Promise<Page<NotificationDTO>> => {
    try {
        const url = new URL(`${API_BASE_URL}/notifications`);
        url.searchParams.append("page", page.toString());
        url.searchParams.append("size", size.toString());
        // Add sort parameters if needed, e.g., url.searchParams.append("sort", "createdAt,desc");

        const response = await fetch(url.toString(), {
            method: "GET",
            credentials: "include",
        });
        // Expect a Page object
        const data = await handleApiResponse(response, true);
        // Provide a default structure if null/undefined is returned on empty success
        return (
            data ?? {
                content: [],
                totalPages: 0,
                totalElements: 0,
                number: 0,
                size: size,
            }
        );
    } catch (error) {
        throw error instanceof Error
            ? error
            : new Error(
                  "An unexpected error occurred while fetching notifications.",
              );
    }
};

export const getUnreadNotificationCount = async (): Promise<{
    unreadCount: number;
}> => {
    try {
        const response = await fetch(
            `${API_BASE_URL}/notifications/count-unread`,
            {
                method: "GET",
                credentials: "include",
            },
        );
        // Expect { "unreadCount": number }
        const data = await handleApiResponse(response, true);
        return data ?? { unreadCount: 0 }; // Default if null/undefined
    } catch (error) {
        throw error instanceof Error
            ? error
            : new Error(
                  "An unexpected error occurred while fetching unread notification count.",
              );
    }
};

export const markNotificationsRead = async (
    notificationIds: number[],
): Promise<void> => {
    try {
        if (!notificationIds || notificationIds.length === 0) {
            return; // Nothing to mark
        }
        const response = await fetch(`${API_BASE_URL}/notifications/read`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(notificationIds),
        });
        await handleApiResponse(response, false); // Expect no content or text
    } catch (error) {
        throw error instanceof Error
            ? error
            : new Error(
                  "An unexpected error occurred while marking notifications as read.",
              );
    }
};

export const markAllNotificationsRead = async (): Promise<void> => {
    try {
        const response = await fetch(`${API_BASE_URL}/notifications/read-all`, {
            method: "PATCH",
            credentials: "include",
        });
        await handleApiResponse(response, false); // Expect no content or text
    } catch (error) {
        throw error instanceof Error
            ? error
            : new Error(
                  "An unexpected error occurred while marking all notifications as read.",
              );
    }
};

export const deleteNotifications = async (
    notificationIds: number[],
): Promise<void> => {
    try {
        if (!notificationIds || notificationIds.length === 0) {
            return; // Nothing to delete
        }
        const response = await fetch(`${API_BASE_URL}/notifications`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(notificationIds),
        });
        await handleApiResponse(response, false); // Expect no content (204) or text
    } catch (error) {
        throw error instanceof Error
            ? error
            : new Error(
                  "An unexpected error occurred while deleting notifications.",
              );
    }
};

const VENUE_RESERVATIONS_BASE_URL = `${API_BASE_URL}/venue-reservations`;

export const createVenueReservation = async ({
    reservationData,
}: CreateVenueReservationInput): Promise<VenueReservationDTO> => {
    const formData = new FormData();
    formData.append(
        "reservation",
        new Blob([JSON.stringify(reservationData)], {
            type: "application/json",
        }),
    );

    try {
        const response = await fetch(VENUE_RESERVATIONS_BASE_URL, {
            method: "POST",
            credentials: "include",
            body: formData,
        });
        return await handleApiResponse(response);
    } catch (error) {
        throw error instanceof Error
            ? error
            : new Error(
                  "An unexpected error occurred creating the reservation.",
              );
    }
};

export const getAllReservations = async (): Promise<VenueReservationDTO[]> => {
    try {
        const response = await fetch(VENUE_RESERVATIONS_BASE_URL, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        });
        const data = await handleApiResponse(response, true); // Allow empty array
        return data ?? [];
    } catch (error) {
        throw error instanceof Error
            ? error
            : new Error(
                  "An unexpected error occurred fetching all reservations.",
              );
    }
};

export const getOwnReservations = async (): Promise<VenueReservationDTO[]> => {
    try {
        const response = await fetch(`${VENUE_RESERVATIONS_BASE_URL}/me`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        });
        const data = await handleApiResponse(response, true);
        return data ?? [];
    } catch (error) {
        throw error instanceof Error
            ? error
            : new Error(
                  "An unexpected error occurred fetching your reservations.",
              );
    }
};

export const getReservationById = async (
    reservationId: number | string,
): Promise<VenueReservationDTO> => {
    try {
        const response = await fetch(
            `${VENUE_RESERVATIONS_BASE_URL}/${reservationId}`,
            {
                method: "GET",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
            },
        );
        return await handleApiResponse(response);
    } catch (error) {
        throw error instanceof Error
            ? error
            : new Error(
                  `An unexpected error occurred fetching reservation ${reservationId}.`,
              );
    }
};

// PATCH /venue-reservations/{reservationId}/approve
export const approveReservation = async ({
    reservationId,
    remarks,
}: ReservationActionInput): Promise<string> => {
    try {
        const response = await fetch(
            `${VENUE_RESERVATIONS_BASE_URL}/${reservationId}/approve`,
            {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ remarks: remarks ?? "" }),
            },
        );
        // Expecting text response
        return await handleApiResponse(response, false);
    } catch (error) {
        throw error instanceof Error
            ? error
            : new Error(
                  `An unexpected error occurred approving reservation ${reservationId}.`,
              );
    }
};

// PATCH /venue-reservations/{reservationId}/reject
export const rejectReservation = async ({
    reservationId,
    remarks,
}: ReservationActionInput): Promise<string> => {
    if (!remarks || remarks.trim() === "") {
        throw new Error("Rejection remarks are required.");
    }
    try {
        const response = await fetch(
            `${VENUE_RESERVATIONS_BASE_URL}/${reservationId}/reject`,
            {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ remarks }),
            },
        );
        // Expecting text response
        return await handleApiResponse(response, false);
    } catch (error) {
        throw error instanceof Error
            ? error
            : new Error(
                  `An unexpected error occurred rejecting reservation ${reservationId}.`,
              );
    }
};

// PATCH /venue-reservations/{reservationId}/cancel
export const cancelReservation = async (
    reservationId: number | string,
): Promise<string> => {
    try {
        const response = await fetch(
            `${VENUE_RESERVATIONS_BASE_URL}/${reservationId}/cancel`,
            {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
            },
        );
        // Expecting text response
        return await handleApiResponse(response, false);
    } catch (error) {
        throw error instanceof Error
            ? error
            : new Error(
                  `An unexpected error occurred cancelling reservation ${reservationId}.`,
              );
    }
};

export const deleteReservation = async (
    reservationId: number | string,
): Promise<string> => {
    try {
        const response = await fetch(
            `${VENUE_RESERVATIONS_BASE_URL}/${reservationId}`,
            {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
            },
        );
        // Expecting text response
        return await handleApiResponse(response, false);
    } catch (error) {
        throw error instanceof Error
            ? error
            : new Error(
                  `An unexpected error occurred deleting reservation ${reservationId}.`,
              );
    }
};

export const getApprovalsForReservation = async (
    reservationId: number | string,
): Promise<VenueApprovalDTO[]> => {
    try {
        const response = await fetch(
            `${VENUE_RESERVATIONS_BASE_URL}/${reservationId}/approvals`,
            {
                method: "GET",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
            },
        );
        const data = await handleApiResponse(response, true); // Allow empty array
        return data ?? [];
    } catch (error) {
        throw error instanceof Error
            ? error
            : new Error(
                  `An unexpected error occurred fetching approvals for reservation ${reservationId}.`,
              );
    }
};

export const getPendingVenueOwnerReservations = async (): Promise<
    VenueReservationDTO[]
> => {
    try {
        const response = await fetch(
            `${VENUE_RESERVATIONS_BASE_URL}/pending/venue-owner`,
            {
                method: "GET",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
            },
        );
        const data = await handleApiResponse(response, true); // Allow empty array
        return data ?? [];
    } catch (error) {
        throw error instanceof Error
            ? error
            : new Error(
                  "An unexpected error occurred fetching pending venue owner reservations.",
              );
    }
};

export const getAllVenueOwnerReservations = async (): Promise<
    VenueReservationDTO[]
> => {
    try {
        const response = await fetch(
            `${VENUE_RESERVATIONS_BASE_URL}/all/venue-owner`,
            {
                method: "GET",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
            },
        );
        const data = await handleApiResponse(response, true); // Allow empty array
        return data ?? [];
    } catch (error) {
        throw error instanceof Error
            ? error
            : new Error(
                  "An unexpected error occurred fetching all venue owner reservations.",
              );
    }
};

const EQUIPMENT_RESERVATIONS_BASE_URL = `${API_BASE_URL}/equipment-reservations`;

export const createEquipmentReservation = async ({
    reservationData,
}: CreateEquipmentReservationInput): Promise<EquipmentReservationDTO> => {
    const formData = new FormData();
    formData.append(
        "reservation",
        new Blob([JSON.stringify(reservationData)], {
            type: "application/json",
        }),
    );

    try {
        const response = await fetch(EQUIPMENT_RESERVATIONS_BASE_URL, {
            method: "POST",
            credentials: "include",
            body: formData,
        });
        return await handleApiResponse(response, true);
    } catch (error) {
        throw error instanceof Error
            ? error
            : new Error(
                  "An unexpected error occurred creating equipment reservation.",
              );
    }
};

// GET /equipment-reservations/me
export const getOwnEquipmentReservations = async (): Promise<
    EquipmentReservationDTO[]
> => {
    try {
        const response = await fetch(`${EQUIPMENT_RESERVATIONS_BASE_URL}/me`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        });
        const data = await handleApiResponse(response, true);
        return data ?? [];
    } catch (error) {
        throw error instanceof Error
            ? error
            : new Error(
                  "An unexpected error occurred fetching your equipment reservations.",
              );
    }
};

// GET /equipment-reservations (Admin only)
export const getAllEquipmentReservations = async (): Promise<
    EquipmentReservationDTO[]
> => {
    try {
        const response = await fetch(EQUIPMENT_RESERVATIONS_BASE_URL, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        });
        const data = await handleApiResponse(response, true);
        return data ?? [];
    } catch (error) {
        throw error instanceof Error
            ? error
            : new Error(
                  "An unexpected error occurred fetching all equipment reservations.",
              );
    }
};

// GET /equipment-reservations/{reservationId}
export const getEquipmentReservationById = async (
    reservationId: number | string,
): Promise<EquipmentReservationDTO> => {
    try {
        const response = await fetch(
            `${EQUIPMENT_RESERVATIONS_BASE_URL}/${reservationId}`,
            {
                method: "GET",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
            },
        );
        return await handleApiResponse(response, true);
    } catch (error) {
        throw error instanceof Error
            ? error
            : new Error(
                  `An unexpected error occurred fetching equipment reservation ${reservationId}.`,
              );
    }
};

// PATCH /equipment-reservations/{reservationId}/approve
export const approveEquipmentReservation = async ({
    reservationId,
    remarks,
}: EquipmentActionInput): Promise<string> => {
    try {
        const payload = { remarks: remarks || "" };
        const response = await fetch(
            `${EQUIPMENT_RESERVATIONS_BASE_URL}/${reservationId}/approve`,
            {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(payload),
            },
        );
        // Expects text response
        return await handleApiResponse(response, false);
    } catch (error) {
        throw error instanceof Error
            ? error
            : new Error(
                  `An unexpected error occurred approving equipment reservation ${reservationId}.`,
              );
    }
};

// PATCH /equipment-reservations/{reservationId}/reject
export const rejectEquipmentReservation = async ({
    reservationId,
    remarks,
}: EquipmentActionInput): Promise<string> => {
    if (!remarks || remarks.trim() === "") {
        throw new Error("Rejection remarks are required.");
    }
    try {
        const payload = { remarks };
        const response = await fetch(
            `${EQUIPMENT_RESERVATIONS_BASE_URL}/${reservationId}/reject`,
            {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(payload),
            },
        );
        // Expects text response
        return await handleApiResponse(response, false);
    } catch (error) {
        throw error instanceof Error
            ? error
            : new Error(
                  `An unexpected error occurred rejecting equipment reservation ${reservationId}.`,
              );
    }
};

// PATCH /equipment-reservations/{reservationId}/cancel
export const cancelEquipmentReservation = async (
    reservationId: number | string,
): Promise<string> => {
    try {
        const response = await fetch(
            `${EQUIPMENT_RESERVATIONS_BASE_URL}/${reservationId}/cancel`,
            {
                method: "PATCH",
                credentials: "include",
            },
        );
        // Expects text response
        return await handleApiResponse(response, false);
    } catch (error) {
        throw error instanceof Error
            ? error
            : new Error(
                  `An unexpected error occurred cancelling equipment reservation ${reservationId}.`,
              );
    }
};

// DELETE /equipment-reservations/{reservationId}
export const deleteEquipmentReservation = async (
    reservationId: number | string,
): Promise<string> => {
    try {
        const response = await fetch(
            `${EQUIPMENT_RESERVATIONS_BASE_URL}/${reservationId}`,
            {
                method: "DELETE",
                credentials: "include",
            },
        );
        // Expects text response
        return await handleApiResponse(response, false);
    } catch (error) {
        throw error instanceof Error
            ? error
            : new Error(
                  `An unexpected error occurred deleting equipment reservation ${reservationId}.`,
              );
    }
};

// GET /equipment-reservations/{reservationId}/approvals
export const getApprovalsForEquipmentReservation = async (
    reservationId: number | string,
): Promise<EquipmentApprovalDTO[]> => {
    try {
        const response = await fetch(
            `${EQUIPMENT_RESERVATIONS_BASE_URL}/${reservationId}/approvals`,
            {
                method: "GET",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
            },
        );
        const data = await handleApiResponse(response, true);
        return data ?? [];
    } catch (error) {
        throw error instanceof Error
            ? error
            : new Error(
                  `An unexpected error occurred fetching approvals for equipment reservation ${reservationId}.`,
              );
    }
};

// GET /equipment-reservations/pending/equipment-owner
export const getPendingEquipmentOwnerReservations = async (): Promise<
    EquipmentReservationDTO[]
> => {
    try {
        const response = await fetch(
            `${EQUIPMENT_RESERVATIONS_BASE_URL}/pending/equipment-owner`,
            {
                method: "GET",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
            },
        );
        const data = await handleApiResponse(response, true);
        return data ?? [];
    } catch (error) {
        throw error instanceof Error
            ? error
            : new Error(
                  "An unexpected error occurred fetching pending equipment owner reservations.",
              );
    }
};

// GET /equipment-reservations/all/equipment-owner
export const getAllEquipmentOwnerReservations = async (): Promise<
    EquipmentReservationDTO[]
> => {
    try {
        const response = await fetch(
            `${EQUIPMENT_RESERVATIONS_BASE_URL}/all/equipment-owner`,
            {
                method: "GET",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
            },
        );
        const data = await handleApiResponse(response, true);
        return data ?? [];
    } catch (error) {
        throw error instanceof Error
            ? error
            : new Error(
                  "An unexpected error occurred fetching all equipment owner reservations.",
              );
    }
};
