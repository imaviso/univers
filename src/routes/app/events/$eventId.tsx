import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import {
	createFileRoute,
	Link,
	notFound,
	useRouteContext,
	useRouter,
} from "@tanstack/react-router";
import { useAtom } from "jotai";
import {
	ArrowLeft,
	Building,
	CalendarPlus,
	CheckCircle2,
	ClipboardCheck,
	Clock,
	Edit,
	MapPin,
	MoreHorizontal,
	Paperclip,
	Tag,
	Trash2,
	Users,
	XCircle,
} from "lucide-react";
import { Fragment, useMemo, useState } from "react";
import { toast } from "sonner";
import { EquipmentReservationFormDialog } from "@/components/equipment-reservation/equipmentReservationForm";
import { EquipmentChecklistDialog } from "@/components/event-staffing/equipmentChecklistDialog";
import { ManageAssignmentsDialog } from "@/components/event-staffing/manageAssignmentsDialog";
import { CancelConfirmDialog } from "@/components/events/cancelEventDialog";
import { EditEventModal } from "@/components/events/editEventModal";
import {
	Avatar,
	AvatarFallback /*, AvatarImage*/,
	AvatarImage,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { DeleteConfirmDialog } from "@/components/user-management/deleteConfirmDialog";
import {
	approveEvent,
	cancelEvent,
	deleteEvent,
	rejectEvent,
	updateEvent,
} from "@/lib/api";
import {
	manageAssignmentsDialogAtom,
	selectedEventForAssignmentAtom,
} from "@/lib/atoms";
import { DEFAULT_VENUE_IMAGE_URL } from "@/lib/constants";
import {
	departmentsQueryOptions,
	equipmentReservationKeys,
	equipmentReservationsByEventIdQueryOptions,
	equipmentsQueryOptions,
	eventByIdQueryOptions,
	eventsQueryKeys,
	useCancelEquipmentReservationMutation,
	useCreateEquipmentReservationMutation,
	venuesQueryOptions,
} from "@/lib/query";
import type {
	DepartmentDTO,
	EquipmentReservationDTO,
	EventApprovalDTO,
	EventDTO,
	EventDTOPayload,
	EventPersonnelDTO,
	UserRole,
	VenueDTO,
} from "@/lib/types";
import {
	formatDateRange,
	formatDateTime,
	formatRole,
	getApproverStatusBadge,
	getBadgeVariant,
	getInitials,
} from "@/lib/utils";

// Helper function to check if URL likely points to an image
const isImageUrl = (url: string | undefined | null): boolean => {
	if (!url) return false;
	return /\.(jpeg|jpg|gif|png|webp)$/i.test(url);
};

export const Route = createFileRoute("/app/events/$eventId")({
	loader: async ({
		params: { eventId },
		context: { authState, queryClient },
	}) => {
		if (!eventId) {
			throw notFound();
		}
		const event = await queryClient.ensureQueryData(
			eventByIdQueryOptions(eventId),
		);

		if (!event || Object.keys(event).length === 0) {
			throw notFound();
		}
		await queryClient.ensureQueryData(venuesQueryOptions);
		await queryClient.ensureQueryData(equipmentsQueryOptions(authState));
		await queryClient.ensureQueryData(
			equipmentReservationsByEventIdQueryOptions(eventId),
		);
		await queryClient.ensureQueryData(departmentsQueryOptions);
		return event;
	},
	component: EventDetailsPage,
});

export function EventDetailsPage() {
	const context = useRouteContext({ from: "/app/events" });
	const currentUser = context.authState;
	const router = useRouter();
	const queryClient = context.queryClient;
	const onBack = () => router.history.back();

	const loadedEventData = Route.useLoaderData();
	const { data: event } = useSuspenseQuery<EventDTO>(
		eventByIdQueryOptions(loadedEventData.publicId),
	);
	const { data: venues } = useSuspenseQuery(venuesQueryOptions);
	const { data: departments } = useSuspenseQuery(departmentsQueryOptions);
	const { data: availableEquipments } = useSuspenseQuery(
		equipmentsQueryOptions(currentUser),
	);
	const { data: reservedEquipments } = useSuspenseQuery(
		equipmentReservationsByEventIdQueryOptions(loadedEventData.publicId),
	);

	const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
	const [approvalRemarks, setApprovalRemarks] = useState("");
	const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [isReserveEquipmentDialogOpen, setIsReserveEquipmentDialogOpen] =
		useState(false);
	const [isRejectionDialogOpen, setIsRejectionDialogOpen] = useState(false);
	const [rejectionRemarks, setRejectionRemarks] = useState("");
	const [
		isCancelEquipmentReservationDialogOpen,
		setIsCancelEquipmentReservationDialogOpen,
	] = useState(false);
	const [equipmentReservationToCancelId, setEquipmentReservationToCancelId] =
		useState<string | null>(null);
	const [isEquipmentChecklistDialogOpen, setIsEquipmentChecklistDialogOpen] =
		useState(false);
	const [selectedPersonnelForChecklist, setSelectedPersonnelForChecklist] =
		useState<string | null>(null);

	// Staff management state
	const [, setManageAssignmentsDialogOpen] = useAtom(
		manageAssignmentsDialogAtom,
	);
	const [, setSelectedEventId] = useAtom(selectedEventForAssignmentAtom);

	const venueMap1 = useMemo(() => {
		const map = new Map<string, VenueDTO>();
		for (const venue of venues ?? []) {
			map.set(venue.publicId, venue);
		}
		return map;
	}, [venues]);
	const eventVenue = venueMap1.get(event.eventVenue.publicId);

	const departmentMap = useMemo(() => {
		const map = new Map<string, DepartmentDTO>();
		for (const dept of departments ?? []) {
			map.set(dept.publicId, dept);
		}
		return map;
	}, [departments]);

	const eventDepartment = event.department.publicId
		? departmentMap.get(event.department.publicId)
		: null;

	const isOrganizer = currentUser?.publicId === event.organizer.publicId;
	const isSuperAdmin = currentUser?.roles?.includes("SUPER_ADMIN");
	const isAssignedPersonnel =
		currentUser?.roles?.includes("ASSIGNED_PERSONNEL");
	const canViewEquipmentChecklist = isAssignedPersonnel || isSuperAdmin;
	const isEventPending = event.status === "PENDING";

	// Role-based label overrides for VPAA + ADMIN
	const userRoles = currentUser?.roles || [];
	const isVpaaAdmin = userRoles.includes("VPAA") && userRoles.includes("ADMIN");
	const approveActionLabel = isVpaaAdmin ? "Recommend" : "Approve Reservation";
	const approveDialogTitle = isVpaaAdmin
		? "Recommend Event"
		: "Approve Reservation";
	const approveConfirmLabel = isVpaaAdmin
		? "Recommend Event"
		: "Confirm Approve Reservation";
	const approvePendingLabel = isVpaaAdmin ? "Recommending..." : "Approving...";

	const rejectActionLabel = isVpaaAdmin
		? "Not Recommended"
		: "Deny Reservation";
	const rejectDialogTitle = isVpaaAdmin
		? "Not Recommended"
		: "Deny Reservation";
	const rejectConfirmLabel = isVpaaAdmin
		? "Not Recommended"
		: "Confirm Deny Reservation";
	const rejectPendingLabel = isVpaaAdmin ? "Processing..." : "Denying...";

	// Get current user's approval record to check their status
	const currentUserApprovalRecord = useMemo(() => {
		if (
			!currentUser?.publicId ||
			!event?.approvals ||
			!Array.isArray(event.approvals)
		) {
			return null;
		}
		return event.approvals.find(
			(appr: EventApprovalDTO) =>
				appr.signedByUser?.publicId === currentUser.publicId,
		);
	}, [event?.approvals, currentUser]);

	// Determine if user can approve/reject based on their presence in the approvals array
	const canUserApprove = useMemo(() => {
		if (!isEventPending || !currentUser) return false;

		// Super admins can approve any event (except their own)
		if (isSuperAdmin && !isOrganizer) return true;

		// Organizers cannot approve their own events
		if (isOrganizer) return false;

		// Assigned personnel can approve if they are assigned to this event
		// const isAssignedPersonnel =
		// 	currentUser.roles?.includes("ASSIGNED_PERSONNEL");
		// const isAssignedToEvent = event.assignedPersonnel?.some(
		// 	(staff) => staff.personnel.publicId === currentUser.publicId,
		// );
		// if (isAssignedPersonnel && isAssignedToEvent) return true;

		// Check if current user is in the approvals list and hasn't already approved
		const hasAlreadyApproved = currentUserApprovalRecord?.status === "APPROVED";
		const isInApprovalsList = currentUserApprovalRecord != null;

		return isInApprovalsList && !hasAlreadyApproved;
	}, [
		isEventPending,
		currentUser,
		currentUserApprovalRecord,
		isOrganizer,
		isSuperAdmin,
		// event.assignedPersonnel,
	]);

	// User can reject if they are in the approvals list and haven't already rejected
	const canUserReject = useMemo(() => {
		if (!isEventPending || !currentUser) return false;

		// Super admins can reject any event (except their own)
		if (isSuperAdmin && !isOrganizer) return true;

		// Organizers cannot reject their own events
		if (isOrganizer) return false;

		// Assigned personnel can reject if they are assigned to this event
		// const isAssignedPersonnel =
		// 	currentUser.roles?.includes("ASSIGNED_PERSONNEL");
		// const isAssignedToEvent = event.assignedPersonnel?.some(
		// 	(staff) => staff.personnel.publicId === currentUser.publicId,
		// );
		// if (isAssignedPersonnel && isAssignedToEvent) return true;

		// Check if current user is in the approvals list and hasn't already rejected
		const hasAlreadyRejected = currentUserApprovalRecord?.status === "REJECTED";
		const isInApprovalsList = currentUserApprovalRecord != null;

		return isInApprovalsList && !hasAlreadyRejected;
	}, [
		isEventPending,
		currentUser,
		currentUserApprovalRecord,
		isOrganizer,
		isSuperAdmin,
		// event.assignedPersonnel,
	]);

	const canCancelEvent =
		(isOrganizer || isSuperAdmin) &&
		(event.status === "PENDING" || event.status === "APPROVED");

	const canEditEvent =
		isSuperAdmin || (isOrganizer && event.status === "PENDING");

	const canUserModifyEquipmentReservation =
		(isOrganizer || isSuperAdmin) &&
		(event.status === "PENDING" || event.status === "APPROVED");

	// Staff management permissions - Super admins and users in the approval list can manage staff
	const canManageStaff = useMemo(() => {
		if (!currentUser) return false;

		// Super admins can always manage staff
		if (isSuperAdmin) return true;

		// Users who are in the approval list can manage staff
		const isInApprovalsList = currentUserApprovalRecord != null;
		return isInApprovalsList;
	}, [currentUser, isSuperAdmin, currentUserApprovalRecord]);

	const approveMutation = useMutation({
		mutationFn: approveEvent,
		onSuccess: () => {
			toast.success("Event approved successfully.");
			queryClient.invalidateQueries({
				queryKey: eventsQueryKeys.detail(event.publicId),
			});
			queryClient.invalidateQueries({
				queryKey: eventsQueryKeys.lists(),
			});
			queryClient.invalidateQueries({
				queryKey: eventsQueryKeys.approved(),
			});
			queryClient.invalidateQueries({
				queryKey: eventsQueryKeys.pending(),
			});
			queryClient.invalidateQueries({
				queryKey: eventsQueryKeys.pendingVenueOwner(),
			});
			queryClient.invalidateQueries({
				queryKey: eventsQueryKeys.pendingDeptHead(),
			});
			queryClient.invalidateQueries({
				queryKey: eventsQueryKeys.own(),
			});

			if (currentUser?.roles?.includes("EQUIPMENT_OWNER")) {
				queryClient.invalidateQueries({
					queryKey: equipmentReservationKeys.byEvent(event.publicId),
				});
				queryClient.invalidateQueries({
					queryKey: equipmentReservationKeys.allEquipmentOwner(),
				});
				queryClient.invalidateQueries({
					queryKey: equipmentReservationKeys.pendingEquipmentOwner(),
				});
			}

			setIsApprovalDialogOpen(false);
			setApprovalRemarks("");
		},
		onError: (error) => {
			toast.error(`Approval failed: ${error.message}`);
		},
	});

	const rejectEventMutation = useMutation({
		mutationFn: rejectEvent,
		onSuccess: () => {
			toast.success("Event rejected successfully.");
			queryClient.invalidateQueries({
				queryKey: eventsQueryKeys.detail(event.publicId),
			});
			queryClient.invalidateQueries({
				queryKey: eventsQueryKeys.lists(),
			});
			queryClient.invalidateQueries({
				queryKey: eventsQueryKeys.approved(),
			});
			queryClient.invalidateQueries({
				queryKey: eventsQueryKeys.pending(),
			});
			queryClient.invalidateQueries({
				queryKey: eventsQueryKeys.pendingVenueOwner(),
			});
			queryClient.invalidateQueries({
				queryKey: eventsQueryKeys.pendingDeptHead(),
			});
			queryClient.invalidateQueries({ queryKey: eventsQueryKeys.own() });
			setIsRejectionDialogOpen(false);
			setRejectionRemarks("");
		},
		onError: (error) => {
			toast.error(`Rejection failed: ${error.message}`);
		},
	});

	const cancelEventMutation = useMutation({
		mutationFn: cancelEvent,
		onSuccess: () => {
			toast.success("Event canceled successfully.");
			queryClient.invalidateQueries({
				queryKey: eventsQueryKeys.detail(event.publicId),
			});
			queryClient.invalidateQueries({
				queryKey: eventsQueryKeys.lists(),
			});
			queryClient.invalidateQueries({
				queryKey: eventsQueryKeys.approved(),
			});
			queryClient.invalidateQueries({
				queryKey: eventsQueryKeys.own(),
			});
			queryClient.invalidateQueries({
				queryKey: eventsQueryKeys.pending(),
			});
			queryClient.invalidateQueries({
				queryKey: eventsQueryKeys.pendingVenueOwner(),
			});
			queryClient.invalidateQueries({
				queryKey: eventsQueryKeys.pendingDeptHead(),
			});
			setIsCancelDialogOpen(false);
			onBack();
		},
		onError: (error) => {
			toast.error(`Cancellation failed: ${error.message}`);
		},
	});

	// Mutation for updating the event (Setup, UI not implemented here)
	const updateEventMutation = useMutation({
		mutationFn: updateEvent, // API function: updateEvent({ eventId, eventData, approvedLetter? })

		onMutate: async (variables: {
			eventId: string;
			eventData: Partial<EventDTOPayload>;
			approvedLetter?: File | null;
		}) => {
			const { eventId } = variables;
			// Use the key factory for snapshotting
			const eventDetailsKey = eventsQueryKeys.detail(eventId);
			const approvedEventsKey = eventsQueryKeys.approved();
			const ownEventsKey = eventsQueryKeys.own();
			const allEventsKey = eventsQueryKeys.lists(); // Key for the general list

			// Cancel outgoing refetches
			await queryClient.cancelQueries({ queryKey: eventDetailsKey });
			await queryClient.cancelQueries({ queryKey: approvedEventsKey });
			await queryClient.cancelQueries({ queryKey: ownEventsKey });
			await queryClient.cancelQueries({ queryKey: allEventsKey }); // Cancel general list too

			// Snapshot previous values
			const previousEventDetails =
				queryClient.getQueryData<EventDTO>(eventDetailsKey);
			const previousApprovedEvents =
				queryClient.getQueryData<EventDTO[]>(approvedEventsKey);
			const previousOwnEvents =
				queryClient.getQueryData<EventDTO[]>(ownEventsKey);
			const previousAllEvents =
				queryClient.getQueryData<EventDTO[]>(allEventsKey);

			// Optimistically update the event details
			if (previousEventDetails) {
				const optimisticEventDetails: EventDTO = {
					...previousEventDetails,
					eventName:
						variables.eventData.eventName ?? previousEventDetails.eventName,
					eventType:
						variables.eventData.eventType ?? previousEventDetails.eventType,
					eventVenue: variables.eventData.venuePublicId
						? ({
								// If venuePublicId is changing, optimistically update/create a VenueDTO like object
								// It's best if previousEventDetails.eventVenue is guaranteed to exist or handled
								...(previousEventDetails.eventVenue || {}),
								publicId: variables.eventData.venuePublicId,
								// 'name' and other VenueDTO fields would ideally be updated here
								// but we might not have them. For optimistic update, an ID change is key.
								// If previousEventDetails.eventVenue is null/undefined and we have a new ID,
								// we'd ideally show a placeholder name or fetch it.
								// For now, we ensure the structure is at least partially a VenueDTO.
								name:
									previousEventDetails.eventVenue?.name ||
									"Venue name updating...", // Example placeholder
							} as VenueDTO) // Type assertion might be needed if structure isn't full enough
						: previousEventDetails.eventVenue,
					startTime:
						variables.eventData.startTime ?? previousEventDetails.startTime, // Keep as string for now
					endTime: variables.eventData.endTime ?? previousEventDetails.endTime, // Keep as string for now
					// Note: approvedLetterUrl cannot be optimistically updated easily without backend response
					// status might change based on edits, but we'll keep it for now unless logic dictates otherwise
				};
				queryClient.setQueryData(eventDetailsKey, optimisticEventDetails);
			}

			// Optimistically update the event in the lists (approved and own)
			const updateList = (
				list: EventDTO[] | undefined,
			): EventDTO[] | undefined => {
				return list?.map((ev) =>
					ev.publicId === variables.eventId
						? {
								...ev,
								eventName: variables.eventData.eventName ?? ev.eventName,
								eventType: variables.eventData.eventType ?? ev.eventType,
								eventVenueId:
									variables.eventData.venuePublicId ?? ev.eventVenue.publicId,
								startTime: variables.eventData.startTime ?? ev.startTime,
								endTime: variables.eventData.endTime ?? ev.endTime,
								// status might change?
							}
						: ev,
				);
			};

			queryClient.setQueryData(
				approvedEventsKey,
				updateList(previousApprovedEvents),
			);
			queryClient.setQueryData(ownEventsKey, updateList(previousOwnEvents));
			queryClient.setQueryData(allEventsKey, updateList(previousAllEvents));

			// Return context with snapshots
			return {
				previousEventDetails,
				previousApprovedEvents,
				previousOwnEvents,
				previousAllEvents,
			};
		},

		onError: (error, variables, context) => {
			toast.error(`Update failed: ${error.message}`);
			// Rollback on error using the key factory
			if (context?.previousEventDetails) {
				queryClient.setQueryData(
					eventsQueryKeys.detail(variables.eventId),
					context.previousEventDetails,
				);
			}
			if (context?.previousApprovedEvents) {
				queryClient.setQueryData(
					eventsQueryKeys.approved(),
					context.previousApprovedEvents,
				);
			}
			if (context?.previousOwnEvents) {
				queryClient.setQueryData(
					eventsQueryKeys.own(),
					context.previousOwnEvents,
				);
			}
			if (context?.previousAllEvents) {
				// Rollback general list
				queryClient.setQueryData(
					eventsQueryKeys.lists(),
					context.previousAllEvents,
				);
			}
		},
		onSettled: (_data, _error, variables) => {
			// Always invalidate after error or success using the key factory
			queryClient.invalidateQueries({
				queryKey: eventsQueryKeys.detail(variables.eventId),
			});
			queryClient.invalidateQueries({
				queryKey: eventsQueryKeys.lists(),
			});
			queryClient.invalidateQueries({
				queryKey: eventsQueryKeys.approved(),
			});
			queryClient.invalidateQueries({ queryKey: eventsQueryKeys.own() });
			queryClient.invalidateQueries({
				queryKey: eventsQueryKeys.pending(),
			});
			queryClient.invalidateQueries({
				queryKey: eventsQueryKeys.pendingVenueOwner(),
			});
			queryClient.invalidateQueries({
				queryKey: eventsQueryKeys.pendingDeptHead(),
			});
			queryClient.invalidateQueries({
				queryKey: eventsQueryKeys.approvals(variables.eventId),
			});
		},
		onSuccess: () => {
			toast.success("Event updated successfully.");
			setIsEditModalOpen(false);
		},
	});

	// Using cancelEvent for delete action for now as per original code
	const deleteEventMutation = useMutation({
		mutationFn: deleteEvent,
		onSuccess: () => {
			toast.success("Event deleted successfully."); // Changed message for clarity
			queryClient.invalidateQueries({
				queryKey: eventsQueryKeys.lists(),
			});
			queryClient.invalidateQueries({
				queryKey: eventsQueryKeys.approved(),
			});
			queryClient.invalidateQueries({ queryKey: eventsQueryKeys.own() });
			queryClient.invalidateQueries({
				queryKey: eventsQueryKeys.pending(),
			});
			queryClient.invalidateQueries({
				queryKey: eventsQueryKeys.pendingVenueOwner(),
			});
			queryClient.invalidateQueries({
				queryKey: eventsQueryKeys.pendingDeptHead(),
			});

			// Remove the specific event query from cache
			queryClient.removeQueries({
				queryKey: eventsQueryKeys.detail(event.publicId),
			});

			setIsDeleteDialogOpen(false); // Close the dialog
			onBack();
		},
		onError: (error) => {
			toast.error(`Deletion failed: ${error.message}`);
		},
		// Optimistic deletion could remove the item from lists in onMutate
		// and add it back in onError.
	});

	const handleApproveClick = () => {
		if (!currentUser) return;
		approveMutation.mutate({
			eventId: event.publicId,
			remarks: approvalRemarks,
		});
	};

	// const handleRejectClick = () => {
	//     setIsRejectionDialogOpen(true);
	// };

	const handleConfirmReject = () => {
		if (!currentUser) return;
		rejectEventMutation.mutate({
			eventId: event.publicId,
			remarks: rejectionRemarks,
		});
	};

	const handleCancelClick = () => {
		setIsCancelDialogOpen(true);
	};

	// Handler for confirming the cancellation
	const handleConfirmCancel = () => {
		cancelEventMutation.mutate(event.publicId);
	};

	const handleDeleteClick = () => {
		setIsDeleteDialogOpen(true);
	};

	const handleConfirmDelete = () => {
		deleteEventMutation.mutate(event.publicId);
	};

	// Placeholder handler for edit (e.g., navigate to an edit page)
	const handleEditClick = () => {
		setIsEditModalOpen(true);
	};

	// Use the existing cancel equipment reservation mutation
	const cancelEquipmentReservationMutationHook =
		useCancelEquipmentReservationMutation();

	const handleCancelEquipmentReservationClick = (reservationId: string) => {
		setEquipmentReservationToCancelId(reservationId);
		setIsCancelEquipmentReservationDialogOpen(true);
	};

	const handleConfirmCancelEquipmentReservation = () => {
		if (equipmentReservationToCancelId && event?.publicId) {
			// Use the imported hook's mutate function
			cancelEquipmentReservationMutationHook.mutate({
				reservationId: equipmentReservationToCancelId,
				eventId: event.publicId, // Pass the current event's publicId
			});
		}
	};

	let dateDisplayString = "Date not available";
	if (
		typeof event.startTime === "string" &&
		typeof event.endTime === "string"
	) {
		const startDate = new Date(event.startTime);
		const endDate = new Date(event.endTime);
		if (
			!Number.isNaN(startDate.getTime()) &&
			!Number.isNaN(endDate.getTime())
		) {
			dateDisplayString = formatDateRange(startDate, endDate);
		} else {
			dateDisplayString = "Invalid date format";
		}
	} else {
		dateDisplayString = "Date missing";
	}

	// Get organizer details
	const organizerName = event.organizer
		? `${event.organizer.firstName} ${event.organizer.lastName}`
		: "Unknown Organizer";
	// const organizerAvatar = event.organizer?.avatarUrl; // If avatar exists

	const createEquipmentReservationMutation =
		useCreateEquipmentReservationMutation();

	const handleReserveEquipmentClick = () => {
		setIsReserveEquipmentDialogOpen(true);
	};

	// Handler for the completion of equipment reservation from the dialog
	const handleReserveEquipmentSubmit = (
		success: boolean,
		reservations?: EquipmentReservationDTO[],
	) => {
		setIsReserveEquipmentDialogOpen(false);
		console.log(
			"EquipmentReservationFormDialog submission complete. Success:",
			success,
			"Reservations:",
			reservations,
		);

		if (success) {
			const successCount = reservations ? reservations.length : 0;
			if (successCount > 0) {
				toast.success(
					`Successfully submitted ${successCount} equipment reservation request(s).`,
				);
				// Ensure event and event.publicId are available before invalidating queries
				if (event?.publicId) {
					queryClient.invalidateQueries({
						queryKey: equipmentReservationKeys.byEvent(event.publicId),
					});
				} else {
					console.warn(
						"Event details not available for query invalidation after reservation.",
					);
				}
			} else {
				// This case could mean success=true but no actual reservations were made (e.g., empty selection in dialog)
				// Or it's an edge case. A general info toast might be appropriate.
				toast.info("Reservation process completed.");
			}
		} else {
			toast.error(
				"Failed to submit equipment reservation request(s). Please check details or try again.",
			);
		}
	};

	const approvalTableRows = useMemo(() => {
		if (!event || !event.approvals) return [];

		const currentApprovals = Array.isArray(event.approvals)
			? event.approvals
			: [];

		// Directly map backend approvals from event.approvals
		return currentApprovals.map((approval) => ({
			...approval,
		}));
	}, [event]);

	const groupedReservedEquipment = useMemo(() => {
		const groups = new Map<
			string,
			{
				categoryName: string;
				reservations: EquipmentReservationDTO[];
			}
		>();
		for (const reservation of reservedEquipments || []) {
			if (
				reservation.equipment?.categories &&
				reservation.equipment.categories.length > 0
			) {
				for (const category of reservation.equipment.categories) {
					if (!groups.has(category.publicId)) {
						groups.set(category.publicId, {
							categoryName: category.name,
							reservations: [],
						});
					}
					const group = groups.get(category.publicId);
					if (group) {
						group.reservations.push(reservation);
					}
				}
			} else {
				const uncategorizedKey = "_uncategorized";
				if (!groups.has(uncategorizedKey)) {
					groups.set(uncategorizedKey, {
						categoryName: "Uncategorized",
						reservations: [],
					});
				}
				const group = groups.get(uncategorizedKey);
				if (group) {
					group.reservations.push(reservation);
				}
			}
		}
		return Array.from(groups.values());
	}, [reservedEquipments]);

	// Group personnel by task type
	const groupedPersonnelByTask = useMemo(() => {
		const groups = new Map<string, EventPersonnelDTO[]>();
		for (const staff of event.assignedPersonnel || []) {
			const task = staff.task;
			if (!groups.has(task)) {
				groups.set(task, []);
			}
			const group = groups.get(task);
			if (group) {
				group.push(staff);
			}
		}
		return Array.from(groups.entries());
	}, [event.assignedPersonnel]);

	// Check if current user is assigned to this event
	const isCurrentUserAssigned = useMemo(() => {
		if (!currentUser?.publicId) return false;
		return event.assignedPersonnel?.some(
			(staff) => staff.personnel.publicId === currentUser.publicId,
		);
	}, [event.assignedPersonnel, currentUser?.publicId]);

	return (
		<div className="flex h-screen bg-background">
			<div className="flex flex-col flex-1">
				<header className="flex items-center justify-between border-b px-6 py-3.5 sticky top-0 bg-background z-10">
					{" "}
					<div className="flex items-center gap-4">
						<Button variant="ghost" size="icon" onClick={onBack}>
							<ArrowLeft className="h-4 w-4" />
						</Button>
						<h1 className="text-xl font-semibold">{event.eventName}</h1>
						{getApproverStatusBadge(event.status)}
					</div>
					<div className="flex items-center gap-2">
						{/* Show Approve Button if user can approve */}
						{canUserApprove && (
							<Dialog
								open={isApprovalDialogOpen}
								onOpenChange={setIsApprovalDialogOpen}
							>
								<DialogTrigger asChild>
									<Button size="sm" className="gap-1">
										<CheckCircle2 className="h-4 w-4" />
										{approveActionLabel}
									</Button>
								</DialogTrigger>
								<DialogContent>
									<DialogHeader>
										<DialogTitle>{approveDialogTitle}</DialogTitle>
										<DialogDescription>
											Add optional remarks for your approval.
										</DialogDescription>
									</DialogHeader>
									<div className="py-4">
										<Textarea
											placeholder="Enter remarks (optional)..."
											value={approvalRemarks}
											onChange={(e) => setApprovalRemarks(e.target.value)}
											rows={4}
										/>
									</div>
									<DialogFooter>
										<Button
											variant="outline"
											onClick={() => setIsApprovalDialogOpen(false)}
										>
											Cancel
										</Button>
										<Button
											onClick={handleApproveClick}
											disabled={approveMutation.isPending}
										>
											{approveMutation.isPending
												? approvePendingLabel
												: approveConfirmLabel}
										</Button>
									</DialogFooter>
								</DialogContent>
							</Dialog>
						)}
						{/* Show Reject Button if user can reject */}
						{canUserReject && (
							<Dialog
								open={isRejectionDialogOpen}
								onOpenChange={setIsRejectionDialogOpen}
							>
								<DialogTrigger asChild>
									<Button variant="destructive" size="sm" className="gap-1">
										<XCircle className="h-4 w-4" />
										{rejectActionLabel}
									</Button>
								</DialogTrigger>
								<DialogContent>
									<DialogHeader>
										<DialogTitle>{rejectDialogTitle}</DialogTitle>
										<DialogDescription>
											Provide remarks for rejecting this event. Remarks are
											required for rejection.
										</DialogDescription>
									</DialogHeader>
									<div className="py-4">
										<Textarea
											placeholder="Enter rejection remarks (required)..."
											value={rejectionRemarks}
											onChange={(e) => setRejectionRemarks(e.target.value)}
											rows={4}
										/>
									</div>
									<DialogFooter>
										<Button
											variant="outline"
											onClick={() => setIsRejectionDialogOpen(false)}
										>
											Cancel
										</Button>
										<Button
											variant="destructive"
											onClick={handleConfirmReject}
											disabled={
												rejectEventMutation.isPending ||
												!rejectionRemarks.trim()
											}
										>
											{rejectEventMutation.isPending
												? rejectPendingLabel
												: rejectConfirmLabel}
										</Button>
									</DialogFooter>
								</DialogContent>
							</Dialog>
						)}

						{/* Container for Edit and More Options buttons */}
						{/* Render Edit button only if canEditEvent is true */}
						{canEditEvent && (
							<Button
								variant="outline"
								size="sm"
								className="gap-1"
								onClick={handleEditClick}
								disabled={updateEventMutation.isPending} // Only disable if mutation is pending
							>
								<Edit className="h-4 w-4" />
								Edit
							</Button>
						)}

						{/* Render More Options Dropdown if user is organizer or superAdmin AND there are actions available (cancel or delete) */}
						{(isOrganizer || isSuperAdmin) &&
							(canCancelEvent || isSuperAdmin) && (
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button variant="ghost" size="icon" className="h-8 w-8">
											<MoreHorizontal className="h-4 w-4" />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end">
										{/* Cancel Event Item - Render only if canCancelEvent is true */}
										{canCancelEvent && (
											<DropdownMenuItem
												className="text-orange-600 focus:text-orange-700 focus:bg-orange-100"
												onClick={handleCancelClick}
												disabled={cancelEventMutation.isPending}
											>
												<XCircle className="mr-2 h-4 w-4" />
												Cancel Event
											</DropdownMenuItem>
										)}
										{/* Delete Event Item (Only for SUPER_ADMIN) */}
										{isSuperAdmin && (
											<DropdownMenuItem
												className="text-destructive focus:text-destructive focus:bg-destructive/10"
												onClick={handleDeleteClick} // Use delete handler
												disabled={deleteEventMutation.isPending} // Disable during delete mutation
											>
												<Trash2 className="mr-2 h-4 w-4" />
												Delete Event
											</DropdownMenuItem>
										)}
									</DropdownMenuContent>
								</DropdownMenu>
							)}
					</div>
				</header>
				<ScrollArea className="flex-1">
					<div className="p-6 space-y-6">
						{/* Event Overview Card */}
						<Card>
							<CardHeader className="pb-2">
								<h2 className="text-lg font-medium">Event Overview</h2>
							</CardHeader>
							<CardContent>
								<div className="grid md:grid-cols-2 gap-6">
									{/* Left Column */}
									<div className="space-y-4">
										{/* Event Type */}
										<div>
											<h3 className="text-sm font-medium text-muted-foreground">
												Event Type
											</h3>
											<div className="flex items-center gap-2 mt-1">
												<Tag className="h-4 w-4 text-muted-foreground" />
												<span className="text-sm">
													{event.eventType ?? "N/A"}
												</span>
											</div>
										</div>

										{/* Date & Time */}
										<div>
											<h3 className="text-sm font-medium text-muted-foreground">
												Date & Time
											</h3>
											<div className="flex items-center gap-2 mt-1">
												<Clock className="h-4 w-4 text-muted-foreground" />
												{/* Display formatted date range */}
												<span className="text-sm">{dateDisplayString}</span>
											</div>
										</div>

										{/* Department */}
										{eventDepartment && (
											<div>
												<h3 className="text-sm font-medium text-muted-foreground">
													Department
												</h3>
												<div className="flex items-center gap-2 mt-1">
													<Building className="h-4 w-4 text-muted-foreground" />
													<span className="text-sm">
														{eventDepartment.name ?? "N/A"}
													</span>
												</div>
											</div>
										)}

										{/* Approved Letter - Updated */}
										{event.approvedLetterUrl && (
											<div>
												<h3 className="text-sm font-medium text-muted-foreground">
													Approved Letter
												</h3>
												{isImageUrl(event.approvedLetterUrl) ? (
													<Dialog>
														<DialogTrigger asChild>
															<div className="flex items-center gap-2 mt-1 cursor-pointer text-blue-600 hover:underline">
																<Paperclip className="h-4 w-4" />
																<span className="text-sm">
																	View Attached Letter (Image)
																</span>
															</div>
														</DialogTrigger>
														<DialogContent className="sm:max-w-[600px] md:max-w-[800px] lg:max-w-[1000px]">
															<DialogHeader>
																<DialogTitle>Approved Letter</DialogTitle>
																<DialogDescription>
																	Viewing the letter for event:{" "}
																	{event.eventName}
																</DialogDescription>
															</DialogHeader>
															<div className="mt-4 max-h-[70vh] overflow-auto">
																<img
																	src={event.approvedLetterUrl}
																	alt="Approved Letter"
																	className="max-w-full h-auto mx-auto"
																/>
															</div>
														</DialogContent>
													</Dialog>
												) : (
													<a // Direct download link for non-images
														href={event.approvedLetterUrl}
														download
														target="_blank"
														rel="noopener noreferrer"
														className="inline-flex items-center gap-2 mt-1"
													>
														<Button variant="outline" size="sm" asChild>
															<div>
																<Paperclip className="h-4 w-4" />
																<span className="text-sm">Approved Letter</span>
															</div>
														</Button>
													</a>
												)}
											</div>
										)}
										<div>
											<h3 className="text-sm font-medium text-muted-foreground">
												Organizer
											</h3>
											<div className="flex items-center gap-3 mt-2">
												<Avatar className="h-10 w-10">
													<AvatarImage
														src={event.organizer?.profileImagePath ?? ""}
														alt={organizerName}
													/>
													<AvatarFallback>
														{getInitials(organizerName)}
													</AvatarFallback>
												</Avatar>
												<div>
													<div className="text-sm font-medium">
														{organizerName}
													</div>
													{/* Display organizer role if available */}
													{event.organizer?.roles && (
														<div className="text-xs text-muted-foreground">
															{event.organizer.roles}
														</div>
													)}
												</div>
											</div>
											{/* Display organizer contact details */}
											{event.organizer && (
												<div className="mt-2 ml-13 space-y-1">
													{event.organizer.idNumber && (
														<div className="text-xs text-muted-foreground">
															ID: {event.organizer.idNumber}
														</div>
													)}
													{event.organizer.email && (
														<div className="text-xs text-muted-foreground">
															{event.organizer.email}
														</div>
													)}
													{event.organizer.phoneNumber && (
														<div className="text-xs text-muted-foreground">
															{event.organizer.phoneNumber}
														</div>
													)}
												</div>
											)}
										</div>
									</div>

									<div className="space-y-4">
										{eventVenue && (
											<div>
												<div className="rounded-lg overflow-hidden border aspect-[16/10] bg-muted mb-2 max-h-80">
													<img
														src={
															eventVenue.imagePath ?? DEFAULT_VENUE_IMAGE_URL
														}
														alt={eventVenue.name ?? "Venue image"}
														className="h-full w-full object-cover"
														onError={(e) => {
															e.currentTarget.src = DEFAULT_VENUE_IMAGE_URL;
														}}
													/>
												</div>
												<h4 className="text-sm font-semibold hover:underline text-primary">
													{eventVenue.publicId ? (
														<Link
															to={"/app/venues/$venueId"}
															params={{
																venueId: eventVenue.publicId,
															}}
														>
															{eventVenue.name ?? "Unknown Venue"}
														</Link>
													) : (
														(eventVenue.name ?? "Unknown Venue")
													)}
												</h4>
												<p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
													<MapPin className="h-3 w-3 flex-shrink-0" />
													{eventVenue.location ?? "Unknown Location"}
												</p>
											</div>
										)}
										{/* Removed Description (can add back if needed) */}
										{/* Removed Progress */}
									</div>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="flex flex-row items-center justify-between pb-2">
								<CardTitle>Reserved Equipment</CardTitle>
								{canUserModifyEquipmentReservation && (
									<Button
										size="sm"
										variant="outline"
										className="gap-1"
										onClick={handleReserveEquipmentClick}
										disabled={createEquipmentReservationMutation.isPending}
									>
										<CalendarPlus className="h-4 w-4" />
										Reserve Equipment
									</Button>
								)}
							</CardHeader>
							<CardContent>
								{reservedEquipments && reservedEquipments.length > 0 ? (
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>Equipment</TableHead>
												<TableHead>Quantity</TableHead>
												<TableHead>Status</TableHead>
												{canUserModifyEquipmentReservation && (
													<TableHead className="text-right">Actions</TableHead>
												)}
											</TableRow>
										</TableHeader>
										<TableBody>
											{groupedReservedEquipment.map((group) => (
												<Fragment key={group.categoryName}>
													<TableRow className="bg-muted/50 hover:bg-muted/50">
														<TableCell
															colSpan={
																canUserModifyEquipmentReservation ? 4 : 3
															}
															className="py-2 font-semibold px-3"
														>
															{group.categoryName}
														</TableCell>
													</TableRow>
													{group.reservations.map((reservation) => (
														<TableRow key={reservation.publicId}>
															<TableCell>
																{reservation.equipment?.name ?? "N/A"}
															</TableCell>
															<TableCell>{reservation.quantity}</TableCell>
															<TableCell>
																{getApproverStatusBadge(reservation.status)}
															</TableCell>
															{(reservation.status === "PENDING" ||
																reservation.status === "APPROVED") &&
																canUserModifyEquipmentReservation && (
																	<TableCell className="text-right">
																		<Button
																			variant="ghost"
																			size="icon"
																			onClick={() =>
																				handleCancelEquipmentReservationClick(
																					reservation.publicId,
																				)
																			}
																			disabled={
																				cancelEquipmentReservationMutationHook.isPending &&
																				equipmentReservationToCancelId ===
																					reservation.publicId
																			}
																		>
																			<XCircle className="h-4 w-4 text-destructive" />
																			<span className="sr-only">
																				Cancel Reservation
																			</span>
																		</Button>
																	</TableCell>
																)}
														</TableRow>
													))}
												</Fragment>
											))}
										</TableBody>
									</Table>
								) : (
									<p className="text-sm text-muted-foreground py-4">
										No equipment reserved for this event yet.
									</p>
								)}
							</CardContent>
						</Card>

						{/* Event Staff Section */}
						<Card>
							<CardHeader className="flex flex-row items-center justify-between pb-2">
								<CardTitle>Event Personnel</CardTitle>
								{canManageStaff && (
									<Button
										size="sm"
										variant="outline"
										className="gap-1"
										onClick={() => {
											setSelectedEventId(event.publicId);
											setManageAssignmentsDialogOpen(true);
										}}
									>
										<Users className="h-4 w-4" />
										Manage Personnel
									</Button>
								)}
							</CardHeader>
							<CardContent>
								{event.assignedPersonnel &&
								event.assignedPersonnel.length > 0 ? (
									<div className="space-y-3">
										<div className="text-sm text-muted-foreground">
											{event.assignedPersonnel.length} personnel(s) assigned
										</div>
										<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
											{event.assignedPersonnel?.map((staff) => (
												<div
													key={staff.publicId}
													className="flex items-center gap-3 p-3 rounded-lg border bg-card"
												>
													<Avatar className="h-10 w-10">
														<AvatarFallback>
															{getInitials(
																`${staff.personnel.firstName} ${staff.personnel.lastName}`,
															)}
														</AvatarFallback>
													</Avatar>
													<div className="flex-1 min-w-0">
														<div className="font-medium text-sm truncate">
															{staff.personnel.firstName}{" "}
															{staff.personnel.lastName}
														</div>
														<div className="text-xs text-muted-foreground">
															{staff.phoneNumber}
														</div>
													</div>
												</div>
											))}
										</div>
									</div>
								) : (
									<p className="text-sm text-muted-foreground py-4">
										No staff assigned to this event yet.
									</p>
								)}
							</CardContent>
						</Card>

						{/* Equipment Checklist Section */}
						{canViewEquipmentChecklist && (
							<Card>
								<CardHeader className="flex flex-row items-center justify-between pb-2">
									<CardTitle className="flex items-center gap-2">
										<ClipboardCheck className="h-5 w-5" />
										Equipment Checklist
									</CardTitle>
								</CardHeader>
								<CardContent>
									{event.assignedPersonnel &&
									event.assignedPersonnel.length > 0 ? (
										<div className="space-y-4">
											<p className="text-sm text-muted-foreground">
												Track equipment for each task during setup and pullout
												phases.
											</p>
											{groupedPersonnelByTask.map(([task, personnelList]) => (
												<div key={task} className="space-y-2">
													<h3 className="text-sm font-semibold text-muted-foreground">
														{task === "SETUP" ? "Setup Phase" : "Pullout Phase"}
													</h3>
													<div className="space-y-2">
														{personnelList.map((staff) => {
															const canOpenChecklist =
																isCurrentUserAssigned &&
																staff.personnel.publicId ===
																	currentUser?.publicId
																	? true
																	: isSuperAdmin;
															return (
																<div
																	key={staff.publicId}
																	className="flex items-center justify-between p-3 border rounded-lg bg-card"
																>
																	<div className="flex-1">
																		<div className="font-medium text-sm">
																			{staff.personnel.firstName}{" "}
																			{staff.personnel.lastName}
																		</div>
																		<div className="text-xs text-muted-foreground">
																			Role: {staff.task}
																		</div>
																	</div>
																	{canOpenChecklist && (
																		<Button
																			size="sm"
																			variant="outline"
																			className="gap-2"
																			onClick={() => {
																				setSelectedPersonnelForChecklist(
																					staff.publicId,
																				);
																				setIsEquipmentChecklistDialogOpen(true);
																			}}
																		>
																			<ClipboardCheck className="h-4 w-4" />
																			Checklist
																		</Button>
																	)}
																</div>
															);
														})}
													</div>
												</div>
											))}
										</div>
									) : (
										<p className="text-sm text-muted-foreground py-4">
											No personnel assigned to this event yet.
										</p>
									)}
								</CardContent>
							</Card>
						)}

						<Card>
							<CardHeader>
								<CardTitle>Approval Status</CardTitle>
							</CardHeader>
							<CardContent>
								{approvalTableRows.length > 0 ? (
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>Approver</TableHead>
												<TableHead>Role</TableHead>
												<TableHead>Department</TableHead>
												<TableHead>Date Signed</TableHead>
												<TableHead>Status</TableHead>
												<TableHead>Remarks</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{approvalTableRows.map((approvalRow) => (
												<TableRow key={approvalRow.publicId}>
													<TableCell>
														{approvalRow.signedByUser.firstName}
														{approvalRow.signedByUser.lastName
															? ` ${approvalRow.signedByUser.lastName}`
															: ""}
													</TableCell>
													<TableCell>
														<div className="flex flex-wrap gap-1">
															{approvalRow.signedByUser.roles.map((role) => (
																<Badge
																	key={role}
																	className={getBadgeVariant(role as UserRole)}
																>
																	{formatRole(role as UserRole)}
																</Badge>
															))}
														</div>
													</TableCell>
													<TableCell>
														{approvalRow.signedByUser.department?.name}
													</TableCell>
													<TableCell>
														{approvalRow.dateSigned
															? formatDateTime(approvalRow.dateSigned)
															: "—"}
													</TableCell>
													<TableCell>
														{getApproverStatusBadge(
															approvalRow.status,
															approvalRow.signedByUser.roles ||
																approvalRow.userRole,
														)}
													</TableCell>
													<TableCell>{approvalRow.remarks} </TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								) : (
									<p className="text-sm text-muted-foreground">
										No approval records or pending placeholders found.
									</p>
								)}
							</CardContent>
						</Card>
					</div>
				</ScrollArea>
			</div>
			<DeleteConfirmDialog
				isOpen={isDeleteDialogOpen}
				onClose={() => setIsDeleteDialogOpen(false)}
				onConfirm={handleConfirmDelete}
				title="Delete Event"
				description={`Are you sure you want to permanently delete the event "${event.eventName}"? This action cannot be undone.`}
				isLoading={deleteEventMutation.isPending}
			/>
			<CancelConfirmDialog
				isOpen={isCancelDialogOpen}
				onClose={() => setIsCancelDialogOpen(false)}
				onConfirm={handleConfirmCancel}
				title="Cancel Event"
				description={`Are you sure you want to cancel the event "${event.eventName}"?`}
				isLoading={cancelEventMutation.isPending}
			/>
			{(isOrganizer || isSuperAdmin) && (
				<EditEventModal
					isOpen={isEditModalOpen}
					onClose={() => setIsEditModalOpen(false)}
					event={event} // Pass the loaded event data
					venues={venues} // Pass the loaded venues data
					departments={departments} // Pass the loaded departments data
				/>
			)}
			{canUserModifyEquipmentReservation && (
				<EquipmentReservationFormDialog
					isOpen={isReserveEquipmentDialogOpen}
					onClose={() => setIsReserveEquipmentDialogOpen(false)}
					onSubmissionComplete={handleReserveEquipmentSubmit}
					// Pass the current event directly, not a list
					// The dialog needs modification to accept a single event or just eventId
					// For now, passing a single-item array might work depending on dialog logic
					event={event} // Pass current event, assert non-null as it's guarded by useMemo
					// Filter available equipment (optional, could be done in dialog)
					// Use nullish coalescing operator (??) to provide an empty array fallback
					equipment={(availableEquipments ?? []).filter((e) => e.availability)}
					// Indicate that the event is pre-selected
				/>
			)}
			{/* Confirmation Dialog for Cancelling Equipment Reservation */}
			<DeleteConfirmDialog
				isOpen={isCancelEquipmentReservationDialogOpen}
				onClose={() => setIsCancelEquipmentReservationDialogOpen(false)}
				onConfirm={handleConfirmCancelEquipmentReservation}
				title="Cancel Equipment Reservation"
				description="Are you sure you want to cancel this equipment reservation? This action cannot be undone."
				isLoading={cancelEquipmentReservationMutationHook.isPending}
			/>
			{/* Staff Management Dialogs */}
			{canManageStaff && <ManageAssignmentsDialog />}
			{/* Equipment Checklist Dialog */}
			{selectedPersonnelForChecklist &&
				event.assignedPersonnel?.find(
					(p) => p.publicId === selectedPersonnelForChecklist,
				) && (
					<EquipmentChecklistDialog
						isOpen={isEquipmentChecklistDialogOpen}
						onClose={() => {
							setIsEquipmentChecklistDialogOpen(false);
							setSelectedPersonnelForChecklist(null);
						}}
						personnel={
							event.assignedPersonnel.find(
								(p) => p.publicId === selectedPersonnelForChecklist,
							)!
						}
						eventId={event.publicId}
						reservedEquipmentIds={
							reservedEquipments?.map((r) => r.equipment.publicId) ?? []
						}
						reservedEquipmentNames={
							reservedEquipments
								? Object.fromEntries(
										reservedEquipments.map((r) => [
											r.equipment.publicId,
											r.equipment.name,
										]),
									)
								: {}
						}
					/>
				)}
		</div>
	);
}
