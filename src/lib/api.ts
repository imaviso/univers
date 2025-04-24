import { API_BASE_URL } from "./auth";
import type {
    EquipmentDTOInput,
    EquipmentDTOOutput,
    EventInput,
    EventOutput,
    VenueInput,
} from "./schema";
import type {
    DepartmentDTO,
    DepartmentType,
    Equipment,
    EventApprovalDTO,
    EventDTOBackendResponse,
    EventDTOPayload,
    UserType,
    Venue,
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
            errorMessage.includes("Invalid department Id")
        ) {
        }
        throw new Error(errorMessage);
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

export const updateProfile = async (userData: UserType) => {
    try {
        // Exclude fields that shouldn't be sent on update if necessary
        const { id, createdAt, updatedAt, emailVerified, ...updateData } =
            userData;
        const response = await fetch(`${API_BASE_URL}/users/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updateData),
            credentials: "include",
        });
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
    "id" | "emailVerified" | "createdAt" | "updatedAt" | "department"
> & { departmentId: number | null };

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

type UpdateUserInputFE = Partial<
    Omit<
        UserType,
        "id" | "createdAt" | "updatedAt" | "emailVerified" | "department"
    > & { departmentId: number | null }
>;
export const updateUser = async (
    userId: string,
    userData: UpdateUserInputFE,
) => {
    try {
        const numericUserId = Number.parseInt(userId, 10);
        if (Number.isNaN(numericUserId)) {
            throw new Error("Invalid User ID format for update.");
        }

        const payload: any = {};
        if (userData.firstName !== undefined)
            payload.firstName = userData.firstName;
        if (userData.lastName !== undefined)
            payload.lastName = userData.lastName;
        if (userData.idNumber !== undefined)
            payload.idNumber = userData.idNumber;
        if (userData.phoneNumber !== undefined)
            payload.phoneNumber = userData.phoneNumber;
        if (userData.telephoneNumber !== undefined)
            payload.telephoneNumber = userData.telephoneNumber;
        if (userData.departmentId !== undefined)
            payload.department_id = userData.departmentId;

        const response = await fetch(`${API_BASE_URL}/users/${numericUserId}`, {
            // Use numeric ID
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
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

export const deactivateUser = async (userId: string) => {
    try {
        const numericUserId = Number.parseInt(userId, 10);
        if (Number.isNaN(numericUserId)) {
            throw new Error("Invalid User ID format for deactivation.");
        }
        const response = await fetch(
            `${API_BASE_URL}/admin/users/${numericUserId}/deactivate`,
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
            `${API_BASE_URL}/admin/users/${numericUserId}/activate`,
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

export const getAllEvents = async () => {
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

export const getEventById = async (eventId: string) => {
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

export const approveEvent = async ({
    eventId,
    userId,
    remarks,
}: {
    eventId: number;
    userId: number;
    remarks: string;
}): Promise<string> => {
    try {
        const url = new URL(`${API_BASE_URL}/event-approval/approve`);
        url.searchParams.append("eventId", eventId.toString());
        url.searchParams.append("userId", userId.toString());
        url.searchParams.append("remarks", remarks);

        const response = await fetch(url.toString(), {
            method: "PATCH",
            credentials: "include",
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
        const venueJsonPayload: any = { ...restOfVenueData }; // Start with name, location
        if (venueOwnerId) {
            // Nest owner ID according to backend DTO structure
            venueJsonPayload.venueOwner = { id: venueOwnerId };
        } else {
            venueJsonPayload.venueOwner = null; // Explicitly send null if no owner selected
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
        const venueJsonPayload: any = { ...restOfVenueData }; // name, location
        if (venueOwnerId) {
            venueJsonPayload.venueOwner = { id: venueOwnerId };
        } else {
            // If API expects null to remove owner, send null.
            // If omitting the field keeps the owner, adjust accordingly.
            venueJsonPayload.venueOwner = null; // Assuming null removes owner
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
        return await handleApiResponse(response, true);
    } catch (error) {
        throw error instanceof Error
            ? error
            : new Error(
                  "An unexpected error occurred while fetching all equipment.",
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
        return await handleApiResponse(response, true);
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
        const equipmentJsonPayload: any = { ...restOfEquipmentData };
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
        const equipmentJsonPayload: any = { ...restOfEquipmentData };
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
