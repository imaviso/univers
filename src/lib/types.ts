export const isAuthenticated = !!localStorage.getItem("token");

export type UserType = {
	id: string;
	uuid: string;
	idNumber: string;
	firstName: string;
	lastName: string;
	email: string;
	roles: UserRole[];
	password: string | undefined;
	departmentId: string;
	telephoneNumber: string;
	phoneNumber: string;
	emailVerified: boolean;
	active: boolean;
	createdAt: string;
	updatedAt: string;
	profileImagePath?: string | null;
};

export type UserDTO = {
	publicId: string;
	email: string;
	firstName: string;
	lastName: string;
	password?: string;
	confirmPassword?: string;
	idNumber: string | null;
	phoneNumber: string | null;
	telephoneNumber: string | null;
	roles: UserRole[];
	department: DepartmentDTO | null;
	emailVerified: boolean | null;
	active: boolean;
	createdAt: string;
	updatedAt: string;
	profileImagePath?: string | null;
};

export type UserRole =
	| "SUPER_ADMIN"
	| "VP_ADMIN"
	| "ADMIN"
	| "ORGANIZER"
	| "DEPT_HEAD"
	| "VENUE_OWNER"
	| "EQUIPMENT_OWNER"
	| "ACCOUNTING"
	| "VPAA"
	| "ASSIGNED_PERSONNEL";

export type Status =
	| "APPROVED"
	| "PENDING"
	| "CANCELED"
	| "REJECTED"
	| "ONGOING"
	| "COMPLETED"
	| "ENDED"
	| "DEFECT"
	| "MAINTENANCE"
	| "NEED_REPLACEMENT"
	| "NEW"
	| "AVAILABLE"
	| "RESERVED"
	| "DENIED_RESERVATION"
	| "PAID"
	| "UNPAID";

export const STATUS_EQUIPMENT = [
	{ value: "DEFECT", label: "Defect" },
	{ value: "MAINTENANCE", label: "Maintenance" },
	{ value: "NEED_REPLACEMENT", label: "Need Replacement" },
	{ value: "NEW", label: "New" },
];

export type Equipment = {
	publicId: string;
	name: string;
	availability: boolean;
	brand: string;
	totalQuantity: number;
	availableQuantity: number;
	equipmentOwner: UserDTO;
	imagePath: string;
	status: "DEFECT" | "MAINTENANCE" | "NEED_REPLACEMENT" | "NEW";
	categories: EquipmentCategoryDTO[];
	serialNo: string;
	createdAt: string;
	updatedAt: string;
};

export type LoginResponse = {
	token: string;
	tokenType: string;
};

export const ROLES = [
	{ value: "SUPER_ADMIN", label: "Super Admin" },
	{ value: "VP_ADMIN", label: "VP Admin" },
	{ value: "VPAA", label: "VP Academic Affairs" },
	{ value: "ADMIN", label: "Approver" },
	{ value: "ORGANIZER", label: "Organizer" },
	{ value: "DEPT_HEAD", label: "Department Head" },
	{ value: "VENUE_OWNER", label: "Venue Owner" },
	{ value: "EQUIPMENT_OWNER", label: "Equipment Owner" },
	{ value: "ACCOUNTING", label: "Accounting" },
	{ value: "ASSIGNED_PERSONNEL", label: "Assigned Personnel" },
];

export const DEPARTMENTS: Array<{ value: string; label: string }> = [
	{
		value: "uuid-vpaa-dept",
		label: "Vice-President for Academic Affairs (VPAA)",
	},
	{
		value: "uuid-msdo-dept",
		label: "Multimedia Solutions and Documentation Office (MSDO)",
	},
	{ value: "uuid-ssd-dept", label: "Safety and Security Department (SSD)" },
	{ value: "uuid-ccs-dept", label: "College of Computer Studies (CCS)" },
];

export const OLD_DEPARTMENTS: Array<{ value: string; label: string }> = [
	{
		value: "VPAA_OLD_UUID",
		label: "Vice-President for Academic Affairs (VPAA)",
	},
	{ value: "CCS_OLD_UUID", label: "College of Computer Studies (CCS)" },
];

export const ACTIVE = [
	{ value: true, label: "True" },
	{ value: false, label: "False" },
];

export type VenueDTO = {
	publicId: string;
	name: string;
	location: string;
	venueOwner: UserDTO | null;
	imagePath: string | null;
	createdAt: string;
	updatedAt: string;
};

export type EventDTOPayload = {
	eventName: string;
	eventType: string;
	venuePublicId: string;
	departmentPublicId: string;
	startTime: string;
	endTime: string;
};

export type EventDTO = {
	publicId: string;
	eventName: string;
	eventType: string;
	organizer: UserDTO;
	approvedLetterUrl: string | null;
	imageUrl: string | null;
	eventVenue: VenueDTO;
	department: DepartmentDTO;
	startTime: string;
	endTime: string;
	status: Status;
	approvals: EventApprovalDTO[] | null;
	cancellationReason: string | null;
	createdAt: string;
	updatedAt: string;
	assignedPersonnel: EventPersonnelDTO[] | null;
};

export type EventInputType = {
	eventName: string;
	eventType: string;
	eventVenuePublicId: string;
	departmentPublicId: string;
	startTime: Date;
	endTime: Date;
	approvedLetter: File[];
};

export type EventOutputType = {
	eventName: string;
	eventType: string;
	eventVenueId: number;
	departmentId: number;
	startTime: Date;
	endTime: Date;
	approvedLetter: File;
};

export type Event = {
	publicId: string;
	eventName: string;
	eventType: string;
	organizer: UserDTO;
	approvedLetterUrl: string | null;
	imageUrl: string | null;
	eventVenue: VenueDTO;
	department: DepartmentDTO;
	startTime: string;
	endTime: string;
	status: string;
	assignedPersonnel: EventPersonnelDTO[] | null;
};

export type EventApprovalDTO = {
	publicId: string;
	eventPublicId: string;
	signedByUser: UserDTO;
	userRole: string;
	remarks: string | null;
	status: string;
	dateSigned: string | null;
};

export type DepartmentDTO = {
	publicId: string;
	name: string;
	description: string | null;
	deptHead: UserDTO | null;
	createdAt: string;
	updatedAt: string;
};

export type VenueApprovalDTO = {
	publicId: string;
	venueReservationPublicId: string;
	signedByUser: UserDTO;
	userRole: string;
	remarks: string | null;
	status: string;
	dateSigned: string | null;
};

export type VenueReservationDTO = {
	publicId: string;
	event: EventDTO | null;
	requestingUser: UserDTO;
	department: DepartmentDTO | null;
	venue: VenueDTO;
	purpose: string;
	startTime: string;
	endTime: string;
	status: string;
	approvals: VenueApprovalDTO[] | null;
	createdAt: string;
	updatedAt: string | null;
};

export type CreateVenueReservationInput = {
	event?: { publicId: string };
	requestingUser?: { publicId: string };
	department?: { publicId: string };
	venue: { publicId: string };
	purpose: string;
	startTime: string;
	endTime: string;
};

export type ReservationActionInput = {
	reservationPublicId: string;
	remarks?: string;
};

export type EquipmentApprovalDTO = {
	publicId: string;
	equipmentReservationPublicId: string;
	signedByUser: UserDTO;
	userRole: string;
	remarks: string | null;
	status: string;
	dateSigned: string | null;
};

export type EquipmentReservationDTO = {
	publicId: string;
	event: EventDTO;
	requestingUser: UserDTO;
	department: DepartmentDTO;
	equipment: Equipment;
	quantity: number;
	startTime: string;
	endTime: string;
	status: string;
	approvals: EquipmentApprovalDTO[] | null;
	createdAt: string;
	updatedAt: string | null;
};

export type CreateEquipmentReservationInput = {
	event: { publicId: string };
	equipment: { publicId: string };
	department: { publicId: string };
	quantity: number;
	startTime: string;
	endTime: string;
};

export type EquipmentActionInput = {
	reservationPublicId: string;
	remarks?: string;
};

export type AUTHORIZED_ROLES =
	| "SUPER_ADMIN"
	| "VP_ADMIN"
	| "VPAA"
	| "MSDO"
	| "OPC"
	| "CORE"
	| "TSG"
	| "VPAA"
	| "SSD"
	| "FAO"
	| "ACCOUNTING"
	| "DEPT_HEAD";

export interface ApiResponse<T> {
	success: boolean;
	message?: string;
	data?: T;
	error?: {
		code: number;
		message: string;
		details?: string;
	};
}

export interface EventTypeStatusDistributionDTO {
	name: string; // Event Type Name
	totalCount: number;
	approvedCount: number;
	pendingCount: number;
	canceledCount: number;
	rejectedCount: number;
	ongoingCount: number;
	completedCount: number;
}

// Dashboard-specific DTOs
export interface TopVenueDTO {
	venueName: string;
	totalEventCount: number;
	pendingCount: number;
	approvedCount: number;
	rejectedCount: number;
	canceledCount: number;
	ongoingCount: number;
	completedCount: number;
}

export interface TopEquipmentDTO {
	equipmentName: string;
	totalReservationCount: number;
	pendingCount: number;
	approvedCount: number;
	rejectedCount: number;
	canceledCount: number;
	ongoingCount: number;
	completedCount: number;
}

export interface EventCountDTO {
	date: string; // LocalDate is typically string "YYYY-MM-DD"
	pendingCount?: number;
	approvedCount?: number;
	rejectedCount?: number;
	canceledCount?: number;
	ongoingCount?: number;
	completedCount?: number;
}

export interface CancellationRateDTO {
	date: string;
	cancellationRate: number;
	canceledCount: number;
	totalCreatedCount: number;
}

export interface PeakHourDTO {
	hourOfDay: number;
	eventCount: number;
}

export interface UserActivityDTO {
	userPublicId: string; // UUID is string
	userFirstName: string;
	userLastName: string;
	eventCount: number;
}

export interface UserReservationActivityDTO {
	userPublicId: string; // UUID is string
	userFirstName: string;
	userLastName: string;
	totalReservationCount: number;
	pendingCount: number;
	approvedCount: number;
	rejectedCount: number;
	canceledCount: number;
	ongoingCount: number;
	completedCount: number;
}

export type RecentActivityItemDTO = {
	id: string;
	type: string; // e.g., "Event", "Equipment Reservation"
	title: string; // e.g., Event Name, Equipment Name
	description: string;
	timestamp: string; // ISO Date string
	actorName: string; // User who performed the action or "System"
	entityPath: string; // Path to the entity (e.g., event ID) for linking
};

export type EventTypeSummaryDTO = {
	name: string; // Event type name
	value: number; // Count of events for this type (using number for frontend consistency with charts)
};

export type EquipmentCategoryDTO = {
	publicId: string;
	name: string;
	description: string | null;
	createdAt: string;
	updatedAt: string | null;
};

export type Personnel = {
	publicId: string;
	personnel: UserDTO;
	phoneNumber: string;
	task: Task;
	status: string;
};

export type EventPersonnelDTO = {
	publicId: string;
	personnel: UserDTO;
	phoneNumber: string;
	task: Task;
};

export type Task = "SETUP" | "PULLOUT";

export type EquipmentChecklistDTO = {
	publicId: string;
	eventPersonnel: EventPersonnelDTO;
	task: Task;
	equipmentIds: string[];
};

export type EquipmentChecklistRequest = {
	eventPersonnelId: string;
	equipmentIds: string[];
};

export type EquipmentChecklistStatusDTO = {
	equipmentId: string;
	checked: boolean;
	checkedByPersonnelIds: string[];
};

// Activity Logging Types
export type ActivityLogDTO = {
	publicId: string;
	action: string;
	entityType: string;
	entityId: string;
	user: UserDTO | null;
	userEmail: string;
	details: string | null;
	ipAddress: string | null;
	createdAt: string;
};

export type ActivityLogAction =
	| "USER_REGISTERED"
	| "USER_CREATED_BY_ADMIN"
	| "USER_UPDATED_BY_ADMIN"
	| "USER_ACTIVATED"
	| "USER_DEACTIVATED"
	| "EVENT_CREATED"
	| "EVENT_UPDATED"
	| "EVENT_DELETED"
	| "EVENT_CANCELED"
	| "EVENT_APPROVAL_APPROVED"
	| "EVENT_APPROVAL_REJECTED"
	| "VENUE_CREATED"
	| "VENUE_UPDATED"
	| "VENUE_DELETED"
	| "DEPARTMENT_CREATED"
	| "DEPARTMENT_UPDATED"
	| "DEPARTMENT_DELETED"
	| "DEPARTMENT_HEAD_ASSIGNED"
	| "EQUIPMENT_CREATED"
	| "EQUIPMENT_UPDATED"
	| "EQUIPMENT_RESERVATION_APPROVED"
	| "EQUIPMENT_RESERVATION_REJECTED";

export type ActivityLogEntityType =
	| "USER"
	| "EVENT"
	| "VENUE"
	| "EQUIPMENT"
	| "DEPARTMENT"
	| "EVENT_APPROVAL"
	| "EQUIPMENT_RESERVATION";

export interface ActivityLogsPageParams {
	page?: number;
	size?: number;
	action?: string;
	entityType?: string;
	startDate?: string;
	endDate?: string;
}
