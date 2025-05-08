import { API_BASE_URL } from "./auth";
import type { NotificationDTO, Page } from "./notifications";
import type {
    DepartmentInput,
    EditUserFormInput,
    EquipmentDTOInput,
    VenueInput,
} from "./schema";
import type {
    CreateEquipmentReservationInput,
    CreateVenueReservationInput,
    DepartmentDTO,
    Equipment,
    EquipmentActionInput,
    EquipmentApprovalDTO,
    EquipmentReservationDTO,
    Event,
    EventApprovalDTO,
    EventDTO,
    EventDTOPayload,
    ReservationActionInput,
    UserDTO,
    UserRole,
    VenueApprovalDTO,
    VenueDTO,
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
    data: {
        firstName?: string;
        lastName?: string;
        phoneNumber?: string;
        idNumber?: string;
        departmentPublicId?: string;
    };
    imageFile?: File | null;
};

export const updateProfile = async ({
    userId,
    data,
    imageFile,
}: UpdateProfileInput): Promise<string> => {
    try {
        const formData = new FormData();
        const userDtoPayload: Partial<UserDTO> & {
            departmentPublicId?: string;
        } = {};
        if (data.firstName !== undefined)
            userDtoPayload.firstName = data.firstName;
        if (data.lastName !== undefined)
            userDtoPayload.lastName = data.lastName;
        if (data.phoneNumber !== undefined)
            userDtoPayload.phoneNumber = data.phoneNumber;
        if (data.idNumber !== undefined)
            userDtoPayload.idNumber = data.idNumber;
        if (data.departmentPublicId !== undefined) {
            userDtoPayload.departmentPublicId = data.departmentPublicId;
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
        const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
            method: "PATCH",
            credentials: "include",
            body: formData,
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
    UserDTO,
    "id" | "emailVerified" | "createdAt" | "updatedAt" | "department"
>;

type CreateUserInputFEWithDepartment = CreateUserInputFE & {
    departmentPublicId: string;
};

export const createUser = async (userData: CreateUserInputFEWithDepartment) => {
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
        const formData = new FormData();
        const userDtoPayload: Partial<CreateUserInputFEWithDepartment> & {
            role?: UserRole;
            password?: string;
        } = {
            firstName: userData.firstName,
            lastName: userData.lastName,
            idNumber: userData.idNumber,
            email: userData.email,
            password: userData.password,
            phoneNumber: userData.phoneNumber,
            telephoneNumber: userData.telephoneNumber,
            role: userData.role as UserRole,
            departmentPublicId: userData.departmentPublicId,
            active: userData.active,
        };
        for (const key in userDtoPayload) {
            if (
                userDtoPayload[key as keyof typeof userDtoPayload] === undefined
            ) {
                delete userDtoPayload[key as keyof typeof userDtoPayload];
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
        const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
            method: "PATCH",
            credentials: "include",
            body: formData,
        });
        return await handleApiResponse(response, false);
    } catch (error) {
        throw error instanceof Error
            ? error
            : new Error("An unexpected error occurred during updating user.");
    }
};

export const deactivateUser = async (userId: string) => {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
            method: "DELETE",
            credentials: "include",
        });
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
        const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
            method: "POST",
            credentials: "include",
        });
        return await handleApiResponse(response, false);
    } catch (error) {
        throw error instanceof Error
            ? error
            : new Error("An unexpected error occurred during activating user.");
    }
};

export const getAllVenues = async (): Promise<VenueDTO[]> => {
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

export const getEventById = async (eventId: string): Promise<EventDTO> => {
    try {
        const response = await fetch(`${API_BASE_URL}/events/${eventId}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        });
        const data = await handleApiResponse(response, true);
        return data ?? ({} as EventDTO);
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
    eventImage?: File | null,
): Promise<EventDTO> => {
    try {
        const formData = new FormData();
        formData.append(
            "event",
            new Blob([JSON.stringify(eventDTO)], { type: "application/json" }),
        );
        formData.append("approvedLetter", approvedLetter, approvedLetter.name);
        if (eventImage) {
            formData.append("eventImage", eventImage, eventImage.name);
        }
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
    eventImage,
}: {
    eventId: string;
    eventData: Partial<EventDTOPayload>;
    approvedLetter?: File | null;
    eventImage?: File | null;
}): Promise<string> => {
    try {
        const formData = new FormData();

        formData.append(
            "event",
            new Blob([JSON.stringify(eventData)], {
                type: "application/json",
            }),
        );

        if (approvedLetter) {
            formData.append(
                "approvedLetter",
                approvedLetter,
                approvedLetter.name,
            );
        }
        if (eventImage) {
            formData.append("eventImage", eventImage, eventImage.name);
        }

        const response = await fetch(`${API_BASE_URL}/events/${eventId}`, {
            method: "PATCH",
            credentials: "include",
            body: formData,
        });

        return await handleApiResponse(response, false);
    } catch (error) {
        throw error instanceof Error
            ? error
            : new Error(
                  `An unexpected error occurred during updating event ${eventId}.`,
              );
    }
};

export const cancelEvent = async (
    eventId: string,
    reason?: string,
): Promise<string> => {
    try {
        const url = new URL(`${API_BASE_URL}/events/${eventId}/cancel`);
        if (reason) {
            url.searchParams.append("reason", reason);
        }
        const response = await fetch(url.toString(), {
            method: "PATCH",
            credentials: "include",
        });

        return await handleApiResponse(response, false);
    } catch (error) {
        throw error instanceof Error
            ? error
            : new Error(
                  `An unexpected error occurred during canceling event ${eventId}.`,
              );
    }
};

export const deleteEvent = async (eventId: string): Promise<string> => {
    try {
        const response = await fetch(`${API_BASE_URL}/events/${eventId}`, {
            method: "DELETE",
            credentials: "include",
        });
        return await handleApiResponse(response, false);
    } catch (error) {
        throw error instanceof Error
            ? error
            : new Error(
                  `An unexpected error occurred during deleting event ${eventId}.`,
              );
    }
};

export const approveEvent = async ({
    eventId,
    remarks,
}: {
    eventId: string;
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
    eventId: string,
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
    venueData: VenueInput;
    imageFile: File | null;
}): Promise<VenueDTO> => {
    try {
        const formData = new FormData();
        const { venueOwnerId, ...restOfVenueData } = venueData;
        const venueJsonPayload: Partial<VenueDTO> = { ...restOfVenueData };
        if (venueOwnerId) {
            venueJsonPayload.venueOwner = { publicId: venueOwnerId } as UserDTO;
        }
        formData.append(
            "venue",
            new Blob([JSON.stringify(venueJsonPayload)], {
                type: "application/json",
            }),
        );
        if (imageFile) {
            formData.append("image", imageFile, imageFile.name);
        }
        const response = await fetch(`${API_BASE_URL}/admin/venues`, {
            method: "POST",
            credentials: "include",
            body: formData,
        });
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
    venueId: string;
    venueData: VenueInput;
    imageFile: File | null;
}): Promise<VenueDTO> => {
    try {
        const formData = new FormData();
        const { venueOwnerId, ...restOfVenueData } = venueData;
        const venueJsonPayload: Partial<VenueDTO> = { ...restOfVenueData };
        if (venueOwnerId !== undefined) {
            venueJsonPayload.venueOwner = venueOwnerId
                ? ({ publicId: venueOwnerId } as UserDTO)
                : null;
        }
        formData.append(
            "venue",
            new Blob([JSON.stringify(venueJsonPayload)], {
                type: "application/json",
            }),
        );
        if (imageFile) {
            formData.append("image", imageFile, imageFile.name);
        }
        const response = await fetch(
            `${API_BASE_URL}/admin/venues/${venueId}`,
            {
                method: "PATCH",
                credentials: "include",
                body: formData,
            },
        );
        return await handleApiResponse(response, true);
    } catch (error) {
        throw error instanceof Error
            ? error
            : new Error(
                  `An unexpected error occurred during updating venue ${venueId}.`,
              );
    }
};

export const deleteVenue = async (venueId: string): Promise<string | null> => {
    try {
        const response = await fetch(
            `${API_BASE_URL}/admin/venues/${venueId}`,
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
                  `An unexpected error occurred during deleting venue ${venueId}.`,
              );
    }
};

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
    eventId: string,
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
    ownerUserId: string,
): Promise<Equipment[]> => {
    try {
        const url = new URL(`${API_BASE_URL}/equipments`);
        url.searchParams.append("userId", ownerUserId);
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
    userId: string;
    equipmentData: EquipmentDTOInput;
    imageFile: File;
}): Promise<Equipment> => {
    try {
        const formData = new FormData();

        const { ownerId, ...restOfEquipmentData } = equipmentData;
        const equipmentJsonPayload: Partial<
            Omit<
                Equipment,
                | "publicId"
                | "equipmentOwner"
                | "imagePath"
                | "createdAt"
                | "updatedAt"
            >
        > & {
            equipmentOwner?: { publicId: string };
        } = { ...restOfEquipmentData };

        if (ownerId) {
            equipmentJsonPayload.equipmentOwner = {
                publicId: ownerId as unknown as string,
            };
        }

        formData.append(
            "equipment",
            new Blob([JSON.stringify(equipmentJsonPayload)], {
                type: "application/json",
            }),
        );

        formData.append("image", imageFile, imageFile.name);

        const url = new URL(`${API_BASE_URL}/equipments`);
        url.searchParams.append("userId", userId);

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
    equipmentId: string;
    userId: string;
    equipmentData: EquipmentDTOInput;
    imageFile?: File | null;
}): Promise<Equipment> => {
    try {
        const formData = new FormData();

        const { ownerId, ...restOfEquipmentData } = equipmentData;
        const equipmentJsonPayload: Partial<
            Omit<
                Equipment,
                | "publicId"
                | "equipmentOwner"
                | "imagePath"
                | "createdAt"
                | "updatedAt"
            >
        > & {
            equipmentOwner?: { publicId: string };
        } = { ...restOfEquipmentData };

        if (ownerId) {
            equipmentJsonPayload.equipmentOwner = {
                publicId: ownerId as unknown as string,
            };
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
        url.searchParams.append("userId", userId);

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
    equipmentId: string,
    userId: string,
): Promise<void> => {
    try {
        const url = new URL(`${API_BASE_URL}/equipments/${equipmentId}`);
        url.searchParams.append("userId", userId);

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

export const getAllDepartments = async (): Promise<DepartmentDTO[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/departments`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        });
        const data: DepartmentDTO[] =
            (await handleApiResponse(response, true)) ?? [];
        return data.map((dept) => ({
            publicId: dept.publicId,
            name: dept.name,
            description: dept.description,
            deptHead: dept.deptHead,
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

export const addDepartment = async (
    departmentData: DepartmentInput,
): Promise<string> => {
    try {
        const payload: Partial<DepartmentDTO> = {
            name: departmentData.name,
            description: departmentData.description,
            deptHead: departmentData.deptHeadId
                ? ({ publicId: departmentData.deptHeadId } as UserDTO)
                : null,
        };
        const response = await fetch(`${API_BASE_URL}/admin/departments`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(payload),
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
    departmentId: string,
    departmentData: Partial<DepartmentInput>,
): Promise<string> => {
    try {
        const payload: Partial<DepartmentDTO> = {};
        if (departmentData.name !== undefined)
            payload.name = departmentData.name;
        if (departmentData.description !== undefined)
            payload.description = departmentData.description;
        if (departmentData.deptHeadId !== undefined) {
            payload.deptHead = departmentData.deptHeadId
                ? ({ publicId: departmentData.deptHeadId } as UserDTO)
                : null;
        }
        const response = await fetch(
            `${API_BASE_URL}/admin/department/${departmentId}`,
            {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(payload),
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
    departmentId: string,
    userId: string,
): Promise<string> => {
    try {
        const response = await fetch(
            `${API_BASE_URL}/admin/department/${departmentId}/assign-head/${userId}`,
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
    departmentId: string,
): Promise<string | null> => {
    try {
        const response = await fetch(
            `${API_BASE_URL}/admin/department/${departmentId}`,
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

const NOTIFICATIONS_BASE_URL = `${API_BASE_URL}/notifications`;

// GET /notifications
export const getNotifications = async (
    page: number,
    size: number,
): Promise<Page<NotificationDTO>> => {
    const response = await fetch(
        `${NOTIFICATIONS_BASE_URL}?page=${page}&size=${size}`,
        {
            credentials: "include",
        },
    );
    return handleApiResponse(response);
};

// GET /notifications/count-unread
export const getUnreadNotificationCount = async (): Promise<{
    unreadCount: number;
}> => {
    const response = await fetch(`${NOTIFICATIONS_BASE_URL}/count-unread`, {
        credentials: "include",
    });
    return handleApiResponse(response);
};

// PATCH /notifications/read
export const markNotificationsRead = async (
    notificationPublicIds: string[],
): Promise<void> => {
    try {
        if (!notificationPublicIds || notificationPublicIds.length === 0) {
            return; // Nothing to mark
        }
        const response = await fetch(`${API_BASE_URL}/notifications/read`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(notificationPublicIds),
        });
        await handleApiResponse(response, false);
    } catch (error) {
        throw error instanceof Error
            ? error
            : new Error(
                  "An unexpected error occurred while marking notifications as read.",
              );
    }
};

// PATCH /notifications/read-all
export const markAllNotificationsRead = async (): Promise<void> => {
    try {
        const response = await fetch(`${API_BASE_URL}/notifications/read-all`, {
            method: "PATCH",
            credentials: "include",
        });
        await handleApiResponse(response, false);
    } catch (error) {
        throw error instanceof Error
            ? error
            : new Error(
                  "An unexpected error occurred while marking all notifications as read.",
              );
    }
};

// DELETE /notifications
export const deleteNotifications = async (
    notificationPublicIds: string[],
): Promise<void> => {
    try {
        if (!notificationPublicIds || notificationPublicIds.length === 0) {
            return; // Nothing to delete
        }
        const response = await fetch(`${API_BASE_URL}/notifications`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(notificationPublicIds),
        });
        await handleApiResponse(response, false);
    } catch (error) {
        throw error instanceof Error
            ? error
            : new Error(
                  "An unexpected error occurred while deleting notifications.",
              );
    }
};

// DELETE /notifications/all
export const deleteAllNotifications = async (): Promise<void> => {
    try {
        const response = await fetch(`${API_BASE_URL}/notifications/all`, {
            method: "DELETE",
            credentials: "include",
        });
        await handleApiResponse(response, false);
    } catch (error) {
        throw error instanceof Error
            ? error
            : new Error(
                  "An unexpected error occurred while deleting all notifications.",
              );
    }
};

const VENUE_RESERVATIONS_BASE_URL = `${API_BASE_URL}/venue-reservations`;

export const createVenueReservation = async (
    reservationInput: CreateVenueReservationInput,
): Promise<VenueReservationDTO> => {
    const formData = new FormData();
    formData.append(
        "reservation",
        new Blob([JSON.stringify(reservationInput)], {
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
    reservationId: string,
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

export const approveReservation = async ({
    reservationPublicId,
    remarks,
}: ReservationActionInput): Promise<string> => {
    try {
        const response = await fetch(
            `${VENUE_RESERVATIONS_BASE_URL}/${reservationPublicId}/approve`,
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
                  `An unexpected error occurred approving reservation ${reservationPublicId}.`,
              );
    }
};

export const rejectReservation = async ({
    reservationPublicId,
    remarks,
}: ReservationActionInput): Promise<string> => {
    if (!remarks || remarks.trim() === "") {
        throw new Error("Rejection remarks are required.");
    }
    try {
        const response = await fetch(
            `${VENUE_RESERVATIONS_BASE_URL}/${reservationPublicId}/reject`,
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
                  `An unexpected error occurred rejecting reservation ${reservationPublicId}.`,
              );
    }
};

export const cancelReservation = async (
    reservationId: string,
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
    reservationId: string,
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
    reservationId: string,
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

export const createEquipmentReservation = async (
    reservationInput: CreateEquipmentReservationInput,
): Promise<EquipmentReservationDTO> => {
    const formData = new FormData();
    formData.append(
        "reservation",
        new Blob([JSON.stringify(reservationInput)], {
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
    reservationId: string,
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
    reservationPublicId,
    remarks,
}: EquipmentActionInput): Promise<string> => {
    try {
        const payload = { remarks: remarks || "" };
        const response = await fetch(
            `${EQUIPMENT_RESERVATIONS_BASE_URL}/${reservationPublicId}/approve`,
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
                  `An unexpected error occurred approving equipment reservation ${reservationPublicId}.`,
              );
    }
};

// PATCH /equipment-reservations/{reservationId}/reject
export const rejectEquipmentReservation = async ({
    reservationPublicId,
    remarks,
}: EquipmentActionInput): Promise<string> => {
    if (!remarks || remarks.trim() === "") {
        throw new Error("Rejection remarks are required.");
    }
    try {
        const payload = { remarks };
        const response = await fetch(
            `${EQUIPMENT_RESERVATIONS_BASE_URL}/${reservationPublicId}/reject`,
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
                  `An unexpected error occurred rejecting equipment reservation ${reservationPublicId}.`,
              );
    }
};

// PATCH /equipment-reservations/{reservationId}/cancel
export const cancelEquipmentReservation = async (
    reservationId: string,
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
    reservationId: string,
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
    reservationId: string,
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

export const rejectEvent = async (data: {
    eventId: string;
    remarks: string;
}): Promise<string> => {
    try {
        const response = await fetch(
            `${API_BASE_URL}/event-approval/${data.eventId}/reject`,
            {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ remarks: data.remarks }),
                credentials: "include",
            },
        );
        return await handleApiResponse(response, false);
    } catch (error) {
        throw error instanceof Error
            ? error
            : new Error(
                  "An unexpected error occurred while rejecting the event.",
              );
    }
};
