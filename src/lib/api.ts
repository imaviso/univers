import { API_BASE_URL, fetchWithAuth } from "./auth";
import type { NotificationDTO, Page } from "./notifications";
import type {
	DepartmentInput,
	EditUserFormInput,
	EquipmentDTOInput,
	VenueInput,
} from "./schema";
import type {
	ActivityLogDTO,
	ApiResponse,
	CancellationRateDTO,
	CreateEquipmentReservationInput,
	DepartmentDTO,
	Equipment,
	EquipmentActionInput,
	EquipmentApprovalDTO,
	EquipmentCategoryDTO,
	EquipmentChecklistStatusDTO,
	EquipmentReservationDTO,
	Event,
	EventCountDTO,
	EventDTO,
	EventDTOPayload,
	EventPersonnelDTO,
	EventTypeStatusDistributionDTO,
	PeakHourDTO,
	RecentActivityItemDTO,
	Task,
	TopDepartmentDTO,
	TopEquipmentDTO,
	TopVenueDTO,
	UserActivityDTO,
	UserDTO,
	UserReservationActivityDTO,
	VenueDTO,
} from "./types";

// Helper function to construct URL properly (works with both absolute and relative base URLs)
function createUrl(path: string): URL {
	// If path already starts with API_BASE_URL, don't add it again
	// This handles cases where path is constructed from BASE_URL constants
	if (path.startsWith(API_BASE_URL)) {
		if (API_BASE_URL.startsWith("http")) {
			// API_BASE_URL is absolute
			return new URL(path);
		}
		// API_BASE_URL is relative, use window.location.origin
		return new URL(path, window.location.origin);
	}

	// If API_BASE_URL is absolute (starts with http), use it directly
	if (API_BASE_URL.startsWith("http")) {
		return new URL(path, API_BASE_URL);
	}
	// If API_BASE_URL is relative (like /api), use window.location.origin as base
	return new URL(API_BASE_URL + path, window.location.origin);
}

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
					} catch (_e) {
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
		} catch (_e) {
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
		const response = await fetchWithAuth(`${API_BASE_URL}/admin/users`, {
			method: "GET",
			headers: { "Content-Type": "application/json" },
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
		const response = await fetchWithAuth(`${API_BASE_URL}/users/${userId}`, {
			method: "PATCH",
			body: formData,
		});
		const responseData = await handleApiResponse<string>(response, false);
		return responseData || "Profile updated successfully";
	} catch (error) {
		throw error instanceof Error
			? error
			: new Error("An unexpected error occurred during updating profile.");
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
		const payload = {
			...userData,
			roles: Array.from(userData.roles),
		};

		const response = await fetchWithAuth(`${API_BASE_URL}/admin/users`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
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
		const userDtoPayload = {
			firstName: userData.firstName,
			lastName: userData.lastName,
			idNumber: userData.idNumber,
			email: userData.email,
			password: userData.password,
			phoneNumber: userData.phoneNumber,
			telephoneNumber: userData.telephoneNumber,
			roles: Array.from(userData.roles),
			departmentPublicId: userData.departmentPublicId,
			active: userData.active,
		};

		for (const key in userDtoPayload) {
			if (userDtoPayload[key as keyof typeof userDtoPayload] === undefined) {
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
		const response = await fetchWithAuth(
			`${API_BASE_URL}/admin/users/${userId}`,
			{
				method: "PATCH",
				body: formData,
			},
		);
		const responseData = await handleApiResponse<string>(response, false);
		return responseData || "User updated successfully";
	} catch (error) {
		throw error instanceof Error
			? error
			: new Error("An unexpected error occurred during updating user.");
	}
};

export const bulkDeactivateUsersAsAdmin = async (
	userPublicIds: string[],
): Promise<string[]> => {
	try {
		const response = await fetchWithAuth(`${API_BASE_URL}/admin/users`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(userPublicIds),
		});
		const data = await handleApiResponse<string[]>(response, true);
		return data || [];
	} catch (error) {
		if (error instanceof ApiError) {
			throw error;
		}
		throw new Error(
			`An unexpected error occurred during bulk deactivating users. ${error instanceof Error ? error.message : String(error)}`,
		);
	}
};

export const activateUser = async (userId: string): Promise<string> => {
	try {
		const response = await fetchWithAuth(
			`${API_BASE_URL}/admin/users/${userId}`,
			{
				method: "POST",
			},
		);
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
		const response = await fetchWithAuth(`${API_BASE_URL}/venues`, {
			method: "GET",
			headers: { "Content-Type": "application/json" },
		});
		const data = await handleApiResponse<VenueDTO[]>(response, true);
		return data || [];
	} catch (error) {
		throw error instanceof Error
			? error
			: new Error("An unexpected error occurred during fetching venues.");
	}
};

export const getEventById = async (eventId: string): Promise<EventDTO> => {
	try {
		const response = await fetchWithAuth(`${API_BASE_URL}/events/${eventId}`, {
			method: "GET",
			headers: { "Content-Type": "application/json" },
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
		const response = await fetchWithAuth(`${API_BASE_URL}/events`, {
			method: "POST",
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
			formData.append("approvedLetter", approvedLetter, approvedLetter.name);
		}
		if (eventImage) {
			formData.append("eventImage", eventImage, eventImage.name);
		}

		const response = await fetchWithAuth(`${API_BASE_URL}/events/${eventId}`, {
			method: "PATCH",
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
		const url = createUrl(`/events/${eventId}/cancel`);
		if (reason) {
			url.searchParams.append("reason", reason);
		}
		const response = await fetchWithAuth(url.toString(), {
			method: "PATCH",
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
		const response = await fetchWithAuth(`${API_BASE_URL}/events/${eventId}`, {
			method: "DELETE",
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

export const eventApprovalAction = async (data: {
	/** One or more event public ids */
	eventPublicIds: string[];
	/** Status to apply: APPROVED | REJECTED | PAID | UNPAID | ... */
	status: import("./types").Status;
	remarks?: string;
}): Promise<string[]> => {
	try {
		const url = `${API_BASE_URL}/event-approval/action`;
		const payload = {
			eventPublicIds: data.eventPublicIds,
			status: data.status,
			remarks: data.remarks ?? "",
		};
		const response = await fetchWithAuth(url, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
		});
		const responseData = await handleApiResponse<string[]>(response, true);
		return responseData || [];
	} catch (error) {
		if (error instanceof ApiError) throw error;
		throw new Error(
			`An unexpected error occurred performing event approval action. ${error instanceof Error ? error.message : String(error)}`,
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
	const result = await eventApprovalAction({
		eventPublicIds: [eventId],
		status: "APPROVED",
		remarks,
	});
	return result && result.length > 0
		? "Event approved successfully"
		: "Approval processed";
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
		const response = await fetchWithAuth(`${API_BASE_URL}/admin/venues`, {
			method: "POST",
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
		const response = await fetchWithAuth(
			`${API_BASE_URL}/admin/venues/${venueId}`,
			{
				method: "PATCH",
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

export const bulkDeleteVenues = async (venueIds: string[]): Promise<string> => {
	try {
		const response = await fetchWithAuth(`${API_BASE_URL}/admin/venues/bulk`, {
			method: "DELETE",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(venueIds),
		});
		const responseData = await handleApiResponse<string>(response, false);
		return responseData || "Venues deleted successfully";
	} catch (error) {
		throw error instanceof Error
			? error
			: new Error("An unexpected error occurred during bulk deleting venues.");
	}
};

export const getAllEquipmentsAdmin = async (): Promise<Equipment[]> => {
	try {
		const url = createUrl("/equipments/all");
		const response = await fetchWithAuth(url.toString(), {
			method: "GET",
		});
		const data = await handleApiResponse<Equipment[]>(response, true);
		return data || [];
	} catch (error) {
		throw error instanceof Error
			? error
			: new Error("An unexpected error occurred while fetching all equipment.");
	}
};

export const getEquipmentReservationsByEventId = async (
	eventId: string,
): Promise<EquipmentReservationDTO[]> => {
	try {
		const response = await fetchWithAuth(
			`${EQUIPMENT_RESERVATIONS_BASE_URL}/event/${eventId}`,
			{
				method: "GET",
				headers: { "Content-Type": "application/json" },
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
		const url = createUrl("/equipments");
		url.searchParams.append("userId", ownerUserId);
		const response = await fetchWithAuth(url.toString(), {
			method: "GET",
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
	imageFile?: File | null;
}): Promise<Equipment> => {
	try {
		const formData = new FormData();

		const { ownerId, categoryIds, ...restOfEquipmentData } = equipmentData;

		const equipmentJsonPayload: Partial<
			Omit<
				Equipment,
				| "publicId"
				| "equipmentOwner"
				| "imagePath"
				| "createdAt"
				| "updatedAt"
				| "categories"
			>
		> & {
			equipmentOwner?: { publicId: string };
			categoryIds?: string[];
		} = {
			...restOfEquipmentData,
		};

		if (ownerId) {
			equipmentJsonPayload.equipmentOwner = { publicId: ownerId };
		}
		if (categoryIds && categoryIds.length > 0) {
			equipmentJsonPayload.categoryIds = categoryIds;
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

		const url = createUrl("/equipments");
		url.searchParams.append("userId", userId);

		const response = await fetchWithAuth(url.toString(), {
			method: "POST",
			body: formData,
		});
		const responseData = await handleApiResponse<Equipment>(response, true);
		return responseData || ({} as Equipment);
	} catch (error) {
		throw error instanceof Error
			? error
			: new Error("An unexpected error occurred during adding equipment.");
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

		const { ownerId, categoryIds, ...restOfEquipmentData } = equipmentData;

		const equipmentJsonPayload: Partial<
			Omit<
				Equipment,
				| "publicId"
				| "equipmentOwner"
				| "imagePath"
				| "createdAt"
				| "updatedAt"
				| "categories"
			>
		> & {
			equipmentOwner?: { publicId: string } | null;
			categoryIds?: string[];
		} = {
			...restOfEquipmentData,
		};

		if (Object.hasOwn(equipmentData, "ownerId")) {
			equipmentJsonPayload.equipmentOwner = ownerId
				? { publicId: ownerId }
				: null;
		}

		if (categoryIds) {
			equipmentJsonPayload.categoryIds = categoryIds;
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

		const url = createUrl(`/equipments/${equipmentId}`);
		url.searchParams.append("userId", userId);

		const response = await fetchWithAuth(url.toString(), {
			method: "PATCH",
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

export const getAllDepartments = async (): Promise<DepartmentDTO[]> => {
	try {
		const response = await fetchWithAuth(`${API_BASE_URL}/departments`, {
			method: "GET",
			headers: { "Content-Type": "application/json" },
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
			: new Error("An unexpected error occurred during fetching departments.");
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
		const response = await fetchWithAuth(`${API_BASE_URL}/admin/departments`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
		});
		const responseData = await handleApiResponse<string>(response, false);
		return responseData || "Department added successfully";
	} catch (error) {
		throw error instanceof Error
			? error
			: new Error("An unexpected error occurred during adding department.");
	}
};

export const updateDepartment = async (
	departmentId: string,
	departmentData: Partial<DepartmentInput>,
): Promise<string> => {
	try {
		const payload: Partial<DepartmentDTO> = {};
		if (departmentData.name !== undefined) payload.name = departmentData.name;
		if (departmentData.description !== undefined)
			payload.description = departmentData.description;
		if (departmentData.deptHeadId !== undefined) {
			payload.deptHead = departmentData.deptHeadId
				? ({ publicId: departmentData.deptHeadId } as UserDTO)
				: null;
		}
		const response = await fetchWithAuth(
			`${API_BASE_URL}/admin/department/${departmentId}`,
			{
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
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
		const response = await fetchWithAuth(
			`${API_BASE_URL}/admin/department/${departmentId}/assign-head/${userId}`,
			{
				method: "POST",
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

export const bulkDeleteDepartments = async (
	departmentPublicIds: string[],
): Promise<string[]> => {
	if (!departmentPublicIds || departmentPublicIds.length === 0) {
		// Optional: Add client-side validation to prevent empty requests
		// Or rely on backend validation, which is already in place.
		// For now, let the backend handle this to keep API consistent.
	}
	try {
		const response = await fetchWithAuth(
			`${API_BASE_URL}/admin/departments`, // Updated endpoint for bulk deletion
			{
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(departmentPublicIds),
			},
		);

		// Backend returns ApiResponse<List<String>>, so expect string[] and JSON true
		const responseData = await handleApiResponse<string[]>(response, true);
		return responseData || []; // Return empty array if no specific messages
	} catch (error) {
		// Propagate the error for the calling code (e.g., React Query mutation) to handle
		if (error instanceof ApiError) {
			throw error;
		}
		// Create a generic error message if it's not an ApiError
		throw new Error(
			`An unexpected error occurred during bulk deleting departments. ${error instanceof Error ? error.message : String(error)}`,
		);
	}
};

const NOTIFICATIONS_BASE_URL = `${API_BASE_URL}/notifications`;

// GET /notifications
export const getNotifications = async (
	page: number,
	size: number,
): Promise<Page<NotificationDTO>> => {
	const response = await fetchWithAuth(
		`${NOTIFICATIONS_BASE_URL}?page=${page}&size=${size}`,
		{
			method: "GET",
			headers: { "Content-Type": "application/json" },
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
	const response = await fetchWithAuth(
		`${NOTIFICATIONS_BASE_URL}/count-unread`,
		{
			method: "GET",
			headers: { "Content-Type": "application/json" },
		},
	);
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
		const response = await fetchWithAuth(`${NOTIFICATIONS_BASE_URL}/read`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
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
		const response = await fetchWithAuth(`${NOTIFICATIONS_BASE_URL}/read-all`, {
			method: "PATCH",
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
		const response = await fetchWithAuth(`${NOTIFICATIONS_BASE_URL}`, {
			method: "DELETE",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(notificationPublicIds),
		});
		await handleApiResponse<void>(response, false);
	} catch (error) {
		throw error instanceof Error
			? error
			: new Error("An unexpected error occurred while deleting notifications.");
	}
};

// DELETE /notifications/all
export const deleteAllNotifications = async (): Promise<void> => {
	try {
		const response = await fetchWithAuth(`${NOTIFICATIONS_BASE_URL}/all`, {
			method: "DELETE",
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
	reservationsInput: CreateEquipmentReservationInput[],
): Promise<EquipmentReservationDTO[]> => {
	try {
		const response = await fetchWithAuth(EQUIPMENT_RESERVATIONS_BASE_URL, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(reservationsInput),
		});
		const responseData = await handleApiResponse<EquipmentReservationDTO[]>(
			response,
			true,
		);
		return responseData || []; // Return empty array if responseData is null/undefined
	} catch (error) {
		// Log the detailed error for better debugging
		console.error("Error in createEquipmentReservation:", error);
		// Re-throw a more specific error or the original error if it's already an ApiError
		if (error instanceof ApiError) {
			throw error;
		}
		throw new Error(
			error instanceof Error
				? error.message
				: "An unexpected error occurred while creating equipment reservations.",
		);
	}
};

// GET /equipment-reservations/me
export const getOwnEquipmentReservations = async (): Promise<
	EquipmentReservationDTO[]
> => {
	try {
		const response = await fetchWithAuth(
			`${EQUIPMENT_RESERVATIONS_BASE_URL}/me`,
			{
				method: "GET",
				headers: { "Content-Type": "application/json" },
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
					"An unexpected error occurred fetching your equipment reservations.",
				);
	}
};

// GET /equipment-reservations (Admin only)
export const getAllEquipmentReservations = async (): Promise<
	EquipmentReservationDTO[]
> => {
	try {
		const response = await fetchWithAuth(EQUIPMENT_RESERVATIONS_BASE_URL, {
			method: "GET",
			headers: { "Content-Type": "application/json" },
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
		const response = await fetchWithAuth(
			`${EQUIPMENT_RESERVATIONS_BASE_URL}/${reservationId}`,
			{
				method: "GET",
				headers: { "Content-Type": "application/json" },
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

// PATCH /equipment-reservations/approve
export const approveEquipmentReservation = async ({
	reservationPublicId,
	remarks,
}: EquipmentActionInput): Promise<Map<string, string>> => {
	try {
		const payload = {
			reservationIds: [reservationPublicId],
			remarks: remarks || "",
		};
		const response = await fetchWithAuth(
			`${EQUIPMENT_RESERVATIONS_BASE_URL}/approve`,
			{
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			},
		);
		const responseData = await handleApiResponse<Map<string, string>>(
			response,
			true,
		);
		return responseData || new Map();
	} catch (error) {
		throw error instanceof Error
			? error
			: new Error(
					`An unexpected error occurred approving equipment reservation ${reservationPublicId}.`,
				);
	}
};

// PATCH /equipment-reservations/reject
export const rejectEquipmentReservation = async ({
	reservationPublicId,
	remarks,
}: EquipmentActionInput): Promise<Map<string, string>> => {
	if (!remarks || remarks.trim() === "") {
		throw new Error("Rejection remarks are required.");
	}
	try {
		const payload = {
			reservationIds: [reservationPublicId],
			remarks,
		};
		const response = await fetchWithAuth(
			`${EQUIPMENT_RESERVATIONS_BASE_URL}/reject`,
			{
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			},
		);
		const responseData = await handleApiResponse<Map<string, string>>(
			response,
			true,
		);
		return responseData || new Map();
	} catch (error) {
		throw error instanceof Error
			? error
			: new Error(
					`An unexpected error occurred rejecting equipment reservation ${reservationPublicId}.`,
				);
	}
};

// PATCH /equipment-reservations/cancel
export const cancelEquipmentReservation = async (
	reservationId: string,
): Promise<Map<string, string>> => {
	try {
		const payload = {
			reservationIds: [reservationId],
		};
		const response = await fetchWithAuth(
			`${EQUIPMENT_RESERVATIONS_BASE_URL}/cancel`,
			{
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			},
		);
		const responseData = await handleApiResponse<Map<string, string>>(
			response,
			true,
		);
		return responseData || new Map();
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
		const response = await fetchWithAuth(
			`${EQUIPMENT_RESERVATIONS_BASE_URL}/${reservationId}`,
			{
				method: "DELETE",
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
		const response = await fetchWithAuth(
			`${EQUIPMENT_RESERVATIONS_BASE_URL}/${reservationId}/approvals`,
			{
				method: "GET",
				headers: { "Content-Type": "application/json" },
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
		const response = await fetchWithAuth(
			`${EQUIPMENT_RESERVATIONS_BASE_URL}/pending/equipment-owner`,
			{
				method: "GET",
				headers: { "Content-Type": "application/json" },
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
		const response = await fetchWithAuth(
			`${EQUIPMENT_RESERVATIONS_BASE_URL}/all/equipment-owner`,
			{
				method: "GET",
				headers: { "Content-Type": "application/json" },
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
		const url = `${API_BASE_URL}/event-approval/action`;

		const payload = {
			eventPublicIds: [data.eventId],
			status: "REJECTED",
			remarks: data.remarks,
		};

		const response = await fetchWithAuth(url, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
		});
		const responseData = await handleApiResponse<unknown[]>(response, true);
		return responseData && responseData.length > 0
			? "Event rejected successfully"
			: "Rejection processed";
	} catch (error) {
		throw error instanceof Error
			? error
			: new Error("An unexpected error occurred while rejecting the event.");
	}
};

export const getApprovedEventsByVenue = async (
	venueId: string,
): Promise<Event[]> => {
	try {
		const response = await fetchWithAuth(
			`${API_BASE_URL}/events/approved/by-venue/${venueId}`,
			{
				method: "GET",
				headers: { "Content-Type": "application/json" },
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
		const response = await fetchWithAuth(
			`${API_BASE_URL}/events/ongoing-and-approved/by-venue/${venueId}`,
			{
				method: "GET",
				headers: { "Content-Type": "application/json" },
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
		const url = createUrl("/events/search");
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

		const response = await fetchWithAuth(url.toString(), {
			method: "GET",
			headers: { "Content-Type": "application/json" },
		});
		const data = await handleApiResponse<EventDTO[]>(response, true);
		return data || [];
	} catch (error) {
		throw error instanceof Error
			? error
			: new Error("An unexpected error occurred during searching events.");
	}
};

export const getTimelineEventsByDateRange = async (
	startDate?: string,
	endDate?: string,
): Promise<Event[]> => {
	const params = new URLSearchParams();
	if (startDate) params.append("startDate", startDate);
	if (endDate) params.append("endDate", endDate);

	const response = await fetchWithAuth(
		`${API_BASE_URL}/events?${params.toString()}`,
		{
			method: "GET",
			headers: { "Content-Type": "application/json" },
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
	const response = await fetchWithAuth(
		`${DASHBOARD_BASE_URL}/top-venues?${params.toString()}`,
		{
			method: "GET",
			headers: { "Content-Type": "application/json" },
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
	const response = await fetchWithAuth(
		`${DASHBOARD_BASE_URL}/top-equipment?${params.toString()}`,
		{
			method: "GET",
			headers: { "Content-Type": "application/json" },
		},
	);
	return handleApiResponse<TopEquipmentDTO[]>(response, true);
};

export const getTopDepartments = async (
	startDate: string,
	endDate: string,
	limit = 5,
): Promise<TopDepartmentDTO[]> => {
	const params = new URLSearchParams({
		startDate,
		endDate,
		limit: limit.toString(),
	});
	const response = await fetchWithAuth(
		`${DASHBOARD_BASE_URL}/top-departments?${params.toString()}`,
		{
			method: "GET",
			headers: { "Content-Type": "application/json" },
		},
	);
	return handleApiResponse<TopDepartmentDTO[]>(response, true);
};

export const getEventsOverview = async (
	startDate: string,
	endDate: string,
): Promise<EventCountDTO[]> => {
	const params = new URLSearchParams({ startDate, endDate });
	const response = await fetchWithAuth(
		`${DASHBOARD_BASE_URL}/events-overview?${params.toString()}`,
		{
			method: "GET",
			headers: { "Content-Type": "application/json" },
		},
	);
	return handleApiResponse<EventCountDTO[]>(response, true);
};

export const getCancellationRates = async (
	startDate: string,
	endDate: string,
): Promise<CancellationRateDTO[]> => {
	const params = new URLSearchParams({ startDate, endDate });
	const response = await fetchWithAuth(
		`${DASHBOARD_BASE_URL}/cancellation-rate?${params.toString()}`,
		{
			method: "GET",
			headers: { "Content-Type": "application/json" },
		},
	);
	return handleApiResponse<CancellationRateDTO[]>(response, true);
};

export const getPeakReservationHours = async (
	startDate: string,
	endDate: string,
): Promise<PeakHourDTO[]> => {
	const params = new URLSearchParams({ startDate, endDate });
	const response = await fetchWithAuth(
		`${DASHBOARD_BASE_URL}/peak-hours?${params.toString()}`,
		{
			method: "GET",
			headers: { "Content-Type": "application/json" },
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
	const response = await fetchWithAuth(
		`${DASHBOARD_BASE_URL}/user-activity?${params.toString()}`,
		{
			method: "GET",
			headers: { "Content-Type": "application/json" },
		},
	);
	return handleApiResponse<UserActivityDTO[]>(response, true);
};

export const getRecentActivityApi = async (
	limit = 10,
): Promise<RecentActivityItemDTO[]> => {
	const params = new URLSearchParams({ limit: limit.toString() });
	const response = await fetchWithAuth(
		`${DASHBOARD_BASE_URL}/recent-activity?${params.toString()}`,
		{
			method: "GET",
			headers: { "Content-Type": "application/json" },
		},
	);
	return handleApiResponse<RecentActivityItemDTO[]>(response, true);
};

export const getUpcomingApprovedEventsApi = async (
	limit = 5,
): Promise<EventDTO[]> => {
	const params = new URLSearchParams({ limit: limit.toString() });
	const response = await fetchWithAuth(
		`${DASHBOARD_BASE_URL}/upcoming-approved-events?${params.toString()}`,
		{
			method: "GET",
			headers: { "Content-Type": "application/json" },
		},
	);
	return handleApiResponse<EventDTO[]>(response, true);
};

export const getUpcomingApprovedEventsCountNextDaysApi = async (
	days = 30,
): Promise<number> => {
	const params = new URLSearchParams({ days: days.toString() });
	const response = await fetchWithAuth(
		`${DASHBOARD_BASE_URL}/upcoming-approved-events-count-next-days?${params.toString()}`,
		{
			method: "GET",
			headers: { "Content-Type": "application/json" },
		},
	);
	return handleApiResponse<number>(response, true);
};

export const getEventTypesSummary = async (
	startDate: string,
	endDate: string,
	limit = 10, // Default limit, can be adjusted or made optional
): Promise<EventTypeStatusDistributionDTO[]> => {
	const params = new URLSearchParams({
		startDate,
		endDate,
		limit: limit.toString(),
	});
	const response = await fetchWithAuth(
		`${DASHBOARD_BASE_URL}/event-types-summary?${params.toString()}`,
		{
			method: "GET",
			headers: { "Content-Type": "application/json" },
		},
	);
	return handleApiResponse<EventTypeStatusDistributionDTO[]>(response, true);
};

export const getUserReservationActivity = async (
	startDate: string,
	endDate: string,
	userFilter?: string,
	limit = 10,
): Promise<UserReservationActivityDTO[]> => {
	const params = new URLSearchParams({
		startDate,
		endDate,
		limit: limit.toString(),
	});
	if (userFilter) {
		params.append("userFilter", userFilter);
	}
	const response = await fetchWithAuth(
		`${DASHBOARD_BASE_URL}/user-reservation-activity?${params.toString()}`,
		{
			method: "GET",
			headers: { "Content-Type": "application/json" },
		},
	);
	return handleApiResponse<UserReservationActivityDTO[]>(response, true);
};

// --- Equipment Category API ---

const EQUIPMENT_CATEGORY_BASE_URL = `${API_BASE_URL}/equipment-categories`;

export const createEquipmentCategory = async (
	categoryDTO: Omit<
		EquipmentCategoryDTO,
		"publicId" | "createdAt" | "updatedAt"
	>,
): Promise<EquipmentCategoryDTO> => {
	try {
		const response = await fetchWithAuth(EQUIPMENT_CATEGORY_BASE_URL, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(categoryDTO),
		});
		return await handleApiResponse<EquipmentCategoryDTO>(response, true);
	} catch (error) {
		throw error instanceof Error
			? error
			: new Error(
					"An unexpected error occurred while creating equipment category.",
				);
	}
};

export const getAllEquipmentCategories = async (): Promise<
	EquipmentCategoryDTO[]
> => {
	try {
		const response = await fetchWithAuth(EQUIPMENT_CATEGORY_BASE_URL, {
			method: "GET",
			headers: { "Content-Type": "application/json" },
		});
		const data = await handleApiResponse<EquipmentCategoryDTO[]>(
			response,
			true,
		);
		return data || [];
	} catch (error) {
		throw error instanceof Error
			? error
			: new Error(
					"An unexpected error occurred while fetching all equipment categories.",
				);
	}
};

export const getEquipmentCategoryByPublicId = async (
	publicId: string,
): Promise<EquipmentCategoryDTO> => {
	try {
		const response = await fetchWithAuth(
			`${EQUIPMENT_CATEGORY_BASE_URL}/${publicId}`,
			{
				method: "GET",
				headers: { "Content-Type": "application/json" },
			},
		);
		return await handleApiResponse<EquipmentCategoryDTO>(response, true);
	} catch (error) {
		throw error instanceof Error
			? error
			: new Error(
					`An unexpected error occurred while fetching equipment category ${publicId}.`,
				);
	}
};

export const updateEquipmentCategory = async (
	publicId: string,
	categoryDTO: Partial<
		Omit<EquipmentCategoryDTO, "publicId" | "createdAt" | "updatedAt">
	>,
): Promise<EquipmentCategoryDTO> => {
	try {
		const response = await fetchWithAuth(
			`${EQUIPMENT_CATEGORY_BASE_URL}/${publicId}`,
			{
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(categoryDTO),
			},
		);
		return await handleApiResponse<EquipmentCategoryDTO>(response, true);
	} catch (error) {
		throw error instanceof Error
			? error
			: new Error(
					`An unexpected error occurred while updating equipment category ${publicId}.`,
				);
	}
};

export const deleteEquipmentCategory = async (
	publicId: string,
): Promise<string> => {
	try {
		const response = await fetchWithAuth(
			`${EQUIPMENT_CATEGORY_BASE_URL}/${publicId}`,
			{
				method: "DELETE",
			},
		);
		return await handleApiResponse<string>(response, false); // Expects text response
	} catch (error) {
		throw error instanceof Error
			? error
			: new Error(
					`An unexpected error occurred while deleting equipment category ${publicId}.`,
				);
	}
};

export const bulkDeleteEquipment = async ({
	equipmentIds,
	userId,
}: {
	equipmentIds: string[];
	userId: string;
}): Promise<Record<string, string>> => {
	try {
		const response = await fetchWithAuth(
			`${API_BASE_URL}/equipments/bulk?userId=${userId}`,
			{
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ equipmentIds }),
			},
		);
		const responseData = await handleApiResponse<Record<string, string>>(
			response,
			true,
		);
		return responseData || {};
	} catch (error) {
		throw error instanceof Error
			? error
			: new Error("An unexpected error occurred while deleting equipments.");
	}
};

// --- Event Personnel API ---

export const addEventPersonnel = async (
	eventId: string,
	personnelData: Omit<EventPersonnelDTO, "publicId">,
): Promise<EventPersonnelDTO[]> => {
	try {
		const payload: Omit<EventPersonnelDTO, "publicId"> = {
			personnel: personnelData.personnel,
			phoneNumber: personnelData.phoneNumber,
			task: personnelData.task,
		};

		const response = await fetchWithAuth(
			`${API_BASE_URL}/events/${eventId}/personnel`,
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			},
		);
		const responseData = await handleApiResponse<
			ApiResponse<EventPersonnelDTO[]>
		>(response, true);
		return responseData?.data || [];
	} catch (error) {
		throw error instanceof Error
			? error
			: new Error(
					`An unexpected error occurred while adding personnel to event ${eventId}.`,
				);
	}
};

export const deleteEventPersonnel = async (
	eventId: string,
	personnelPublicId: string,
): Promise<EventPersonnelDTO[]> => {
	try {
		const response = await fetchWithAuth(
			`${API_BASE_URL}/events/${eventId}/personnel/${personnelPublicId}`,
			{
				method: "DELETE",
			},
		);
		const responseData = await handleApiResponse<
			ApiResponse<EventPersonnelDTO[]>
		>(response, true);
		return responseData?.data || [];
	} catch (error) {
		throw error instanceof Error
			? error
			: new Error(
					`An unexpected error occurred while removing personnel ${personnelPublicId} from event ${eventId}.`,
				);
	}
};

export const getAllPersonnel = async (): Promise<UserDTO[]> => {
	try {
		const response = await fetchWithAuth(`${API_BASE_URL}/events/personnel`, {
			method: "GET",
			headers: { "Content-Type": "application/json" },
		});
		const data = await handleApiResponse<UserDTO[]>(response, true);
		return data || [];
	} catch (error) {
		throw error instanceof Error
			? error
			: new Error(
					"An unexpected error occurred while fetching personnel list.",
				);
	}
};

// --- Equipment Checklist API ---

const EQUIPMENT_CHECKLIST_BASE_URL = `${API_BASE_URL}/equipment-checklist`;

export const getAssignedEquipment = async (
	eventPersonnelId: string,
): Promise<string[]> => {
	try {
		const url = createUrl(`${EQUIPMENT_CHECKLIST_BASE_URL}/assigned`);
		url.searchParams.append("eventPersonnelId", eventPersonnelId);

		const response = await fetchWithAuth(url.toString(), {
			method: "GET",
			headers: { "Content-Type": "application/json" },
		});
		const data = await handleApiResponse<string[]>(response, true);
		return data || [];
	} catch (error) {
		throw error instanceof Error
			? error
			: new Error(
					`An unexpected error occurred while fetching assigned equipment for personnel ${eventPersonnelId}.`,
				);
	}
};

export const submitEquipmentChecklist = async (checklistData: {
	eventPersonnelId: string;
	equipmentIds: string[];
}): Promise<string> => {
	try {
		const response = await fetchWithAuth(
			`${EQUIPMENT_CHECKLIST_BASE_URL}/submit`,
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(checklistData),
			},
		);
		const responseData = await handleApiResponse<string>(response, false);
		return responseData || "Checklist submitted successfully";
	} catch (error) {
		throw error instanceof Error
			? error
			: new Error(
					"An unexpected error occurred while submitting equipment checklist.",
				);
	}
};

export const getEquipmentChecklistStatus = async (
	eventId: string,
	task: Task,
): Promise<string[]> => {
	try {
		const url = createUrl(`${EQUIPMENT_CHECKLIST_BASE_URL}/status`);
		url.searchParams.append("eventId", eventId);
		url.searchParams.append("task", task);

		const response = await fetchWithAuth(url.toString(), {
			method: "GET",
			headers: { "Content-Type": "application/json" },
		});
		const data = await handleApiResponse<string[]>(response, true);
		return data || [];
	} catch (error) {
		throw error instanceof Error
			? error
			: new Error(
					`An unexpected error occurred while fetching equipment checklist status for event ${eventId}.`,
				);
	}
};

export const getEquipmentChecklistStatusDetail = async (
	eventId: string,
	task: Task,
): Promise<EquipmentChecklistStatusDTO[]> => {
	try {
		const url = createUrl(`${EQUIPMENT_CHECKLIST_BASE_URL}/status/detail`);
		url.searchParams.append("eventId", eventId);
		url.searchParams.append("task", task);

		const response = await fetchWithAuth(url.toString(), {
			method: "GET",
			headers: { "Content-Type": "application/json" },
		});
		const data = await handleApiResponse<EquipmentChecklistStatusDTO[]>(
			response,
			true,
		);
		return data || [];
	} catch (error) {
		throw error instanceof Error
			? error
			: new Error(
					`An unexpected error occurred while fetching detailed equipment checklist status for event ${eventId}.`,
				);
	}
};

// --- Activity Log API ---

const ACTIVITY_LOG_BASE_URL = `${API_BASE_URL}/admin/activity-logs`;

export const getAllActivityLogs = async (
	page = 0,
	size = 20,
): Promise<Page<ActivityLogDTO>> => {
	try {
		const params = new URLSearchParams({
			page: page.toString(),
			size: size.toString(),
		});
		const response = await fetchWithAuth(
			`${ACTIVITY_LOG_BASE_URL}?${params.toString()}`,
			{
				method: "GET",
				headers: { "Content-Type": "application/json" },
			},
		);
		const data = await handleApiResponse<Page<ActivityLogDTO>>(response, true);
		return (
			data || {
				content: [],
				totalElements: 0,
				totalPages: 0,
				size: 0,
				number: 0,
			}
		);
	} catch (error) {
		throw error instanceof Error
			? error
			: new Error("An unexpected error occurred while fetching activity logs.");
	}
};

export const getActivityLogsByAction = async (
	action: string,
	page = 0,
	size = 20,
): Promise<Page<ActivityLogDTO>> => {
	try {
		const params = new URLSearchParams({
			action,
			page: page.toString(),
			size: size.toString(),
		});
		const response = await fetchWithAuth(
			`${ACTIVITY_LOG_BASE_URL}/by-action?${params.toString()}`,
			{
				method: "GET",
				headers: { "Content-Type": "application/json" },
			},
		);
		const data = await handleApiResponse<Page<ActivityLogDTO>>(response, true);
		return (
			data || {
				content: [],
				totalElements: 0,
				totalPages: 0,
				size: 0,
				number: 0,
			}
		);
	} catch (error) {
		throw error instanceof Error
			? error
			: new Error(
					`An unexpected error occurred while fetching activity logs for action ${action}.`,
				);
	}
};

export const getActivityLogsByEntityType = async (
	entityType: string,
	page = 0,
	size = 20,
): Promise<Page<ActivityLogDTO>> => {
	try {
		const params = new URLSearchParams({
			entityType,
			page: page.toString(),
			size: size.toString(),
		});
		const response = await fetchWithAuth(
			`${ACTIVITY_LOG_BASE_URL}/by-entity-type?${params.toString()}`,
			{
				method: "GET",
				headers: { "Content-Type": "application/json" },
			},
		);
		const data = await handleApiResponse<Page<ActivityLogDTO>>(response, true);
		return (
			data || {
				content: [],
				totalElements: 0,
				totalPages: 0,
				size: 0,
				number: 0,
			}
		);
	} catch (error) {
		throw error instanceof Error
			? error
			: new Error(
					`An unexpected error occurred while fetching activity logs for entity type ${entityType}.`,
				);
	}
};

export const getActivityLogsByDateRange = async (
	startDate: string,
	endDate: string,
	page = 0,
	size = 20,
): Promise<Page<ActivityLogDTO>> => {
	try {
		const params = new URLSearchParams({
			startDate,
			endDate,
			page: page.toString(),
			size: size.toString(),
		});
		const response = await fetchWithAuth(
			`${ACTIVITY_LOG_BASE_URL}/by-date-range?${params.toString()}`,
			{
				method: "GET",
				headers: { "Content-Type": "application/json" },
			},
		);
		const data = await handleApiResponse<Page<ActivityLogDTO>>(response, true);
		return (
			data || {
				content: [],
				totalElements: 0,
				totalPages: 0,
				size: 0,
				number: 0,
			}
		);
	} catch (error) {
		throw error instanceof Error
			? error
			: new Error(
					`An unexpected error occurred while fetching activity logs for date range ${startDate} to ${endDate}.`,
				);
	}
};

export const exportActivityLogsAsCSV = async (
	startDate?: string,
	endDate?: string,
): Promise<Blob> => {
	try {
		const url = createUrl(`${ACTIVITY_LOG_BASE_URL}/export/csv`);
		if (startDate) {
			url.searchParams.append("startDate", startDate);
		}
		if (endDate) {
			url.searchParams.append("endDate", endDate);
		}

		const response = await fetchWithAuth(url.toString(), {
			method: "GET",
		});

		if (!response.ok) {
			throw new ApiError(
				`Failed to export CSV: ${response.status}`,
				response.status,
			);
		}

		const blob = await response.blob();
		return blob;
	} catch (error) {
		throw error instanceof Error
			? error
			: new Error(
					"An unexpected error occurred while exporting activity logs as CSV.",
				);
	}
};

export const exportActivityLogsAsJSON = async (
	startDate?: string,
	endDate?: string,
): Promise<Blob> => {
	try {
		const url = createUrl(`${ACTIVITY_LOG_BASE_URL}/export/json`);
		if (startDate) {
			url.searchParams.append("startDate", startDate);
		}
		if (endDate) {
			url.searchParams.append("endDate", endDate);
		}

		const response = await fetchWithAuth(url.toString(), {
			method: "GET",
		});

		if (!response.ok) {
			throw new ApiError(
				`Failed to export JSON: ${response.status}`,
				response.status,
			);
		}

		const blob = await response.blob();
		return blob;
	} catch (error) {
		throw error instanceof Error
			? error
			: new Error(
					"An unexpected error occurred while exporting activity logs as JSON.",
				);
	}
};
