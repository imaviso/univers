import { API_BASE_URL } from "./auth";
import type { NotificationDTO, Page } from "./notifications";
import type {
    DepartmentInput,
    EditUserFormInput,
    EquipmentDTOInput,
    VenueInput,
} from "./schema";
import type {
    CancellationRateDTO,
    CreateEquipmentReservationInput,
    DepartmentDTO,
    Equipment,
    EquipmentActionInput,
    EquipmentApprovalDTO,
    EquipmentReservationDTO,
    Event,
    EventApprovalDTO,
    EventCountDTO,
    EventDTO,
    EventDTOPayload,
    EventTypeSummaryDTO,
    PeakHourDTO,
    RecentActivityItemDTO,
    TopEquipmentDTO,
    TopVenueDTO,
    UserActivityDTO,
    UserDTO,
    UserRole,
    VenueDTO,
} from "./types";

// Define a custom error class
export class ApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        // Set the prototype explicitly.
        Object.setPrototypeOf(this, ApiError.prototype);
    }
}

export async function handleApiResponse<T>(
    response: Response,
    expectJson = true,
): Promise<T> {
    if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Error! Status: ${response.status}`;
        try {
            const errorData = JSON.parse(errorText);
            let potentialMessage: string | undefined;

            if (errorData && typeof errorData === "object") {
                if (errorData.error) {
                    // Check if 'error' property exists
                    if (typeof errorData.error === "object") {
                        // Case 1: { error: { message: "..." } }
                        potentialMessage =
                            errorData.error.message || errorData.error.details;
                    } else if (typeof errorData.error === "string") {
                        // Case 2: { error: "message" }
                        potentialMessage = errorData.error;
                    }
                }
                if (
                    !potentialMessage &&
                    errorData.message &&
                    typeof errorData.message === "string"
                ) {
                    // Case 3: { message: "..." }
                    potentialMessage = errorData.message;
                }

                if (potentialMessage) {
                    try {
                        // Check if the potentialMessage is itself a stringified JSON
                        const nestedErrorData = JSON.parse(potentialMessage);
                        if (
                            nestedErrorData &&
                            typeof nestedErrorData === "object" &&
                            nestedErrorData.message &&
                            typeof nestedErrorData.message === "string"
                        ) {
                            errorMessage = nestedErrorData.message; // Use nested message
                        } else {
                            errorMessage = potentialMessage; // Use as is if not further parsable or no nested message
                        }
                    } catch (e) {
                        // potentialMessage was not a stringified JSON, use it directly
                        errorMessage = potentialMessage;
                    }
                } else if (errorText && !potentialMessage) {
                    // Ensure errorText is used if potentialMessage wasn't found
                    errorMessage = errorText;
                }
            } else if (errorText) {
                // errorData was not an object, or errorText is not JSON
                errorMessage = errorText;
            }
        } catch (e) {
            // errorText wasn't valid JSON, or another parsing error occurred
            errorMessage = errorText || `Server error: ${response.status}`;
        }
        throw new ApiError(errorMessage, response.status); // Throw custom ApiError
    }

    if (response.status === 204) {
        if (expectJson) {
            return [] as unknown as T; // Return empty array for list types
        }
        return "" as unknown as T;
    }

    if (!expectJson) {
        return (await response.text()) as unknown as T;
    }

    try {
        const contentType = response.headers.get("content-type");
        if (contentType?.includes("application/json")) {
            const responseClone = response.clone();
            const text = await responseClone.text();
            if (!text) {
                return [] as unknown as T; // Return empty array for list types
            }
            const data = await response.json();
            if (data && typeof data === "object" && "data" in data) {
                // Handle ApiResponse format
                return data.data as T;
            }
            return data as T;
        }
        console.warn(
            "Expected JSON response but received content-type:",
            contentType,
        );
        return (await response.text()) as unknown as T;
    } catch (error) {
        if (
            error instanceof SyntaxError &&
            error.message.includes("Unexpected end of JSON input")
        ) {
            console.error(
                "API Error: Received empty or invalid JSON body despite success status.",
            );
            return [] as unknown as T; // Return empty array for list types
        }
        throw error;
    }
}

export const getAllUsers = async (): Promise<UserDTO[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/users`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        });
        const data = await handleApiResponse<UserDTO[]>(response, true);
        return data || [];
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
    data: profileData,
    imageFile,
}: UpdateProfileInput): Promise<string> => {
    try {
        const formData = new FormData();
        const userDtoPayload: Partial<UserDTO> & {
            departmentPublicId?: string;
        } = {};
        if (profileData.firstName !== undefined)
            userDtoPayload.firstName = profileData.firstName;
        if (profileData.lastName !== undefined)
            userDtoPayload.lastName = profileData.lastName;
        if (profileData.phoneNumber !== undefined)
            userDtoPayload.phoneNumber = profileData.phoneNumber;
        if (profileData.idNumber !== undefined)
            userDtoPayload.idNumber = profileData.idNumber;
        if (profileData.departmentPublicId !== undefined) {
            userDtoPayload.departmentPublicId = profileData.departmentPublicId;
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
        const responseData = await handleApiResponse<string>(response, false);
        return responseData || "Profile updated successfully";
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

export const createUser = async (
    userData: CreateUserInputFEWithDepartment,
): Promise<string> => {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/users`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(userData),
            credentials: "include",
        });
        const data = await handleApiResponse<string>(response, false);
        return data || "User created successfully";
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
        const data = await handleApiResponse<string>(response, false);
        return data || "User updated successfully";
    } catch (error) {
        throw error instanceof Error
            ? error
            : new Error("An unexpected error occurred during updating user.");
    }
};

export const deactivateUser = async (userId: string): Promise<string> => {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
            method: "DELETE",
            credentials: "include",
        });
        const data = await handleApiResponse<string>(response, false);
        return data || "User deactivated successfully";
    } catch (error) {
        throw error instanceof Error
            ? error
            : new Error(
                  "An unexpected error occurred during deactivating user.",
              );
    }
};

export const activateUser = async (userId: string): Promise<string> => {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
            method: "POST",
            credentials: "include",
        });
        const data = await handleApiResponse<string>(response, false);
        return data || "User activated successfully";
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
        const data = await handleApiResponse<VenueDTO[]>(response, true);
        return data || [];
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
        const data = await handleApiResponse<Event[]>(response, true);
        return data || [];
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
        const data = await handleApiResponse<EventDTO>(response, true);
        return data || ({} as EventDTO);
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
        const responseData = await handleApiResponse<EventDTO>(response, true);
        return responseData || ({} as EventDTO);
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

        const responseData = await handleApiResponse<string>(response, false);
        return responseData || "Event updated successfully";
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

        const responseData = await handleApiResponse<string>(response, false);
        return responseData || "Event cancelled successfully";
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
        const responseData = await handleApiResponse<string>(response, false);
        return responseData || "Event deleted successfully";
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
        const responseData = await handleApiResponse<string>(response, false);
        return responseData || "Event approved successfully";
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
        const data = await handleApiResponse<EventApprovalDTO[]>(
            response,
            true,
        );
        return data || [];
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
        const data = await handleApiResponse<Event[]>(response, true);
        return data || [];
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
        const data = await handleApiResponse<Event[]>(response, true);
        return data || [];
    } catch (error) {
        throw error instanceof Error
            ? error
            : new Error(
                  "An unexpected error occurred during fetching own events.",
              );
    }
};

export const getPendingVenueOwnerEvents = async (): Promise<EventDTO[]> => {
    try {
        const response = await fetch(
            `${API_BASE_URL}/events/pending/venue-owner`,
            {
                method: "GET",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
            },
        );
        const data = await handleApiResponse<EventDTO[]>(response, true);
        return data || [];
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
        const data = await handleApiResponse<Event[]>(response, true);
        return data || [];
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
        const responseData = await handleApiResponse<VenueDTO>(response, true);
        return responseData || ({} as VenueDTO);
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
        const responseData = await handleApiResponse<VenueDTO>(response, true);
        return responseData || ({} as VenueDTO);
    } catch (error) {
        throw error instanceof Error
            ? error
            : new Error(
                  `An unexpected error occurred during updating venue ${venueId}.`,
              );
    }
};

export const deleteVenue = async (venueId: string): Promise<string> => {
    try {
        const response = await fetch(
            `${API_BASE_URL}/admin/venues/${venueId}`,
            {
                method: "DELETE",
                credentials: "include",
            },
        );
        const responseData = await handleApiResponse<string>(response, false);
        return responseData || "Venue deleted successfully";
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
        const data = await handleApiResponse<Equipment[]>(response, true);
        return data || [];
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
        const data = await handleApiResponse<EquipmentReservationDTO[]>(
            response,
            true,
        );
        return data || [];
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
        const data = await handleApiResponse<Equipment[]>(response, true);
        return data || [];
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
        const responseData = await handleApiResponse<Equipment>(response, true);
        return responseData || ({} as Equipment);
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
        const responseData = await handleApiResponse<Equipment>(response, true);
        return responseData || ({} as Equipment);
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
): Promise<string> => {
    try {
        const url = new URL(`${API_BASE_URL}/equipments/${equipmentId}`);
        url.searchParams.append("userId", userId);

        const response = await fetch(url.toString(), {
            method: "DELETE",
            credentials: "include",
        });
        const responseData = await handleApiResponse<string>(response, false);
        return responseData || "Equipment deleted successfully";
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
        const data = await handleApiResponse<DepartmentDTO[]>(response, true);
        return (data || []).map((dept: DepartmentDTO) => ({
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
        const responseData = await handleApiResponse<string>(response, false);
        return responseData || "Department added successfully";
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
        const responseData = await handleApiResponse<string>(response, false);
        return responseData || "Department updated successfully";
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

        const responseData = await handleApiResponse<string>(response, false);
        return responseData || "Department head assigned successfully";
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
): Promise<string> => {
    try {
        const response = await fetch(
            `${API_BASE_URL}/admin/department/${departmentId}`,
            {
                method: "DELETE",
                credentials: "include",
            },
        );

        const responseData = await handleApiResponse<string>(response, false);
        return responseData || "Department deleted successfully";
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
    const responseData = await handleApiResponse<Page<NotificationDTO>>(
        response,
        true,
    );
    return (
        responseData || {
            content: [],
            totalElements: 0,
            totalPages: 0,
            size: 0,
            number: 0,
        }
    );
};

// GET /notifications/count-unread
export const getUnreadNotificationCount = async (): Promise<{
    unreadCount: number;
}> => {
    const response = await fetch(`${NOTIFICATIONS_BASE_URL}/count-unread`, {
        credentials: "include",
    });
    const responseData = await handleApiResponse<{ unreadCount: number }>(
        response,
        true,
    );
    return responseData || { unreadCount: 0 };
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
        await handleApiResponse<void>(response, false);
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
        await handleApiResponse<void>(response, false);
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
        await handleApiResponse<void>(response, false);
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
        await handleApiResponse<void>(response, false);
    } catch (error) {
        throw error instanceof Error
            ? error
            : new Error(
                  "An unexpected error occurred while deleting all notifications.",
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
        const responseData = await handleApiResponse<EquipmentReservationDTO>(
            response,
            true,
        );
        return responseData || ({} as EquipmentReservationDTO);
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
        const data = await handleApiResponse<EquipmentReservationDTO[]>(
            response,
            true,
        );
        return data || [];
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
        const data = await handleApiResponse<EquipmentReservationDTO[]>(
            response,
            true,
        );
        return data || [];
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
        const responseData = await handleApiResponse<EquipmentReservationDTO>(
            response,
            true,
        );
        return responseData || ({} as EquipmentReservationDTO);
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
        const responseData = await handleApiResponse<string>(response, false);
        return responseData || "Equipment reservation approved successfully";
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
        const responseData = await handleApiResponse<string>(response, false);
        return responseData || "Equipment reservation rejected successfully";
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
        const responseData = await handleApiResponse<string>(response, false);
        return responseData || "Equipment reservation cancelled successfully";
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
        const responseData = await handleApiResponse<string>(response, false);
        return responseData || "Equipment reservation deleted successfully";
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
        const data = await handleApiResponse<EquipmentApprovalDTO[]>(
            response,
            true,
        );
        return data || [];
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
        const data = await handleApiResponse<EquipmentReservationDTO[]>(
            response,
            true,
        );
        return data || [];
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
        const data = await handleApiResponse<EquipmentReservationDTO[]>(
            response,
            true,
        );
        return data || [];
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
        const responseData = await handleApiResponse<string>(response, false);
        return responseData || "Event rejected successfully";
    } catch (error) {
        throw error instanceof Error
            ? error
            : new Error(
                  "An unexpected error occurred while rejecting the event.",
              );
    }
};

export const getApprovedEventsByVenue = async (
    venueId: string,
): Promise<Event[]> => {
    try {
        const response = await fetch(
            `${API_BASE_URL}/events/approved/by-venue/${venueId}`,
            {
                method: "GET",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
            },
        );
        const data = await handleApiResponse<Event[]>(response, true);
        return data || [];
    } catch (error) {
        throw error instanceof Error
            ? error
            : new Error(
                  "An unexpected error occurred while fetching approved events for the venue.",
              );
    }
};

export const getOngoingAndApprovedEventsByVenue = async (
    venueId: string,
): Promise<Event[]> => {
    try {
        const response = await fetch(
            `${API_BASE_URL}/events/ongoing-and-approved/by-venue/${venueId}`,
            {
                method: "GET",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
            },
        );
        const data = await handleApiResponse<Event[]>(response, true);
        return data || [];
    } catch (error) {
        throw error instanceof Error
            ? error
            : new Error(
                  "An unexpected error occurred while fetching ongoing and approved events for the venue.",
              );
    }
};

export const searchEvents = async (
    scope: string,
    status?: string,
    sortBy?: string,
    startDate?: string,
    endDate?: string,
): Promise<EventDTO[]> => {
    try {
        const url = new URL(`${API_BASE_URL}/events/search`);
        url.searchParams.append("scope", scope);
        if (status && status.toUpperCase() !== "ALL") {
            url.searchParams.append("status", status.toUpperCase());
        }
        if (sortBy) {
            url.searchParams.append("sortBy", sortBy);
        }
        if (startDate) {
            url.searchParams.append("startDate", startDate);
        }
        if (endDate) {
            url.searchParams.append("endDate", endDate);
        }

        const response = await fetch(url.toString(), {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        });
        const data = await handleApiResponse<EventDTO[]>(response, true);
        return data || [];
    } catch (error) {
        throw error instanceof Error
            ? error
            : new Error(
                  "An unexpected error occurred during searching events.",
              );
    }
};

export const getTimelineEventsByDateRange = async (
    startDate?: string,
    endDate?: string,
): Promise<Event[]> => {
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);

    const response = await fetch(
        `${API_BASE_URL}/events/timeline?${params.toString()}`,
        {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        },
    );
    const data = await handleApiResponse<Event[]>(response, true);
    return data || [];
};

const DASHBOARD_BASE_URL = `${API_BASE_URL}/dashboard`;

export const getTopVenues = async (
    startDate: string,
    endDate: string,
    limit = 5,
): Promise<TopVenueDTO[]> => {
    const params = new URLSearchParams({
        startDate,
        endDate,
        limit: limit.toString(),
    });
    const response = await fetch(
        `${DASHBOARD_BASE_URL}/top-venues?${params.toString()}`,
        {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        },
    );
    return handleApiResponse<TopVenueDTO[]>(response, true);
};

export const getTopEquipment = async (
    startDate: string,
    endDate: string,
    equipmentTypeFilter?: string,
    limit = 5,
): Promise<TopEquipmentDTO[]> => {
    const params = new URLSearchParams({
        startDate,
        endDate,
        limit: limit.toString(),
    });
    if (equipmentTypeFilter) {
        params.append("equipmentTypeFilter", equipmentTypeFilter);
    }
    const response = await fetch(
        `${DASHBOARD_BASE_URL}/top-equipment?${params.toString()}`,
        {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        },
    );
    return handleApiResponse<TopEquipmentDTO[]>(response, true);
};

export const getEventsOverview = async (
    startDate: string,
    endDate: string,
): Promise<EventCountDTO[]> => {
    const params = new URLSearchParams({ startDate, endDate });
    const response = await fetch(
        `${DASHBOARD_BASE_URL}/events-overview?${params.toString()}`,
        {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        },
    );
    return handleApiResponse<EventCountDTO[]>(response, true);
};

export const getCancellationRates = async (
    startDate: string,
    endDate: string,
): Promise<CancellationRateDTO[]> => {
    const params = new URLSearchParams({ startDate, endDate });
    const response = await fetch(
        `${DASHBOARD_BASE_URL}/cancellation-rate?${params.toString()}`,
        {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        },
    );
    return handleApiResponse<CancellationRateDTO[]>(response, true);
};

export const getPeakReservationHours = async (
    startDate: string,
    endDate: string,
): Promise<PeakHourDTO[]> => {
    const params = new URLSearchParams({ startDate, endDate });
    const response = await fetch(
        `${DASHBOARD_BASE_URL}/peak-hours?${params.toString()}`,
        {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        },
    );
    return handleApiResponse<PeakHourDTO[]>(response, true);
};

export const getUserActivity = async (
    startDate: string,
    endDate: string,
    limit = 10,
): Promise<UserActivityDTO[]> => {
    const params = new URLSearchParams({
        startDate,
        endDate,
        limit: limit.toString(),
    });
    const response = await fetch(
        `${DASHBOARD_BASE_URL}/user-activity?${params.toString()}`,
        {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        },
    );
    return handleApiResponse<UserActivityDTO[]>(response, true);
};

export const getRecentActivityApi = async (
    limit = 10,
): Promise<RecentActivityItemDTO[]> => {
    const params = new URLSearchParams({ limit: limit.toString() });
    const response = await fetch(
        `${DASHBOARD_BASE_URL}/recent-activity?${params.toString()}`,
        {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        },
    );
    return handleApiResponse<RecentActivityItemDTO[]>(response, true);
};

export const getUpcomingApprovedEventsApi = async (
    limit = 5,
): Promise<EventDTO[]> => {
    const params = new URLSearchParams({ limit: limit.toString() });
    const response = await fetch(
        `${DASHBOARD_BASE_URL}/upcoming-approved-events?${params.toString()}`,
        {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        },
    );
    return handleApiResponse<EventDTO[]>(response, true);
};

export const getUpcomingApprovedEventsCountNextDaysApi = async (
    days = 30,
): Promise<number> => {
    const params = new URLSearchParams({ days: days.toString() });
    const response = await fetch(
        `${DASHBOARD_BASE_URL}/upcoming-approved-events-count-next-days?${params.toString()}`,
        {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        },
    );
    return handleApiResponse<number>(response, true);
};

export const getEventTypesSummary = async (
    startDate: string,
    endDate: string,
    limit = 10, // Default limit, can be adjusted or made optional
): Promise<EventTypeSummaryDTO[]> => {
    const params = new URLSearchParams({
        startDate,
        endDate,
        limit: limit.toString(),
    });
    const response = await fetch(
        `${DASHBOARD_BASE_URL}/event-types-summary?${params.toString()}`,
        {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        },
    );
    return handleApiResponse<EventTypeSummaryDTO[]>(response, true);
};
