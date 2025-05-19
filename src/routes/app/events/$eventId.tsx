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
import {
    ArrowLeft,
    Building,
    CalendarPlus,
    CheckCircle2,
    Clock,
    Edit,
    MapPin,
    MoreHorizontal,
    Paperclip,
    Tag,
    Trash2,
    XCircle,
} from "lucide-react";

import { EquipmentReservationFormDialog } from "@/components/equipment-reservation/equipmentReservationForm";
import { CancelConfirmDialog } from "@/components/events/cancelEventDialog";
import { EditEventModal } from "@/components/events/editEventModal";
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
    departmentsQueryOptions,
    equipmentReservationKeys,
    equipmentReservationsByEventIdQueryOptions,
    equipmentsQueryOptions,
    eventApprovalsQueryOptions,
    eventByIdQueryOptions,
    eventsQueryKeys,
    useCancelEquipmentReservationMutation,
    useCreateEquipmentReservationMutation,
    venuesQueryOptions,
} from "@/lib/query";
import type { EquipmentReservationFormInput } from "@/lib/schema";
import type {
    CreateEquipmentReservationInput,
    DepartmentDTO,
    EventApprovalDTO,
    EventDTO,
    EventDTOPayload,
    UserDTO,
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
    getStatusColor,
} from "@/lib/utils";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import {
    Link,
    createFileRoute,
    notFound,
    useRouteContext,
    useRouter,
} from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";

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
        await queryClient.ensureQueryData(eventApprovalsQueryOptions(eventId));
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

// Define constants outside the component to prevent re-creation on re-renders
const DEFAULT_USER_PLACEHOLDER_FIELDS: Omit<
    UserDTO,
    "publicId" | "firstName" | "lastName" | "email" | "roles" | "department"
> = {
    profileImagePath: null,
    idNumber: null,
    phoneNumber: null,
    telephoneNumber: null,
    active: true,
    emailVerified: true,
    createdAt: "",
    updatedAt: "",
};

const DEFAULT_DEPARTMENT_PLACEHOLDER_FIELDS: Omit<
    DepartmentDTO,
    "publicId" | "name"
> = {
    description: "",
    deptHead: null,
    createdAt: "",
    updatedAt: "",
};

const EXPECTED_APPROVERS_CONFIG: Array<{
    id: string;
    label: string;
    isSigned: (approval: EventApprovalDTO, eventDto: EventDTO) => boolean;
    getPlaceholderData: (eventDto: EventDTO) => {
        signedByUserInitial: Partial<UserDTO> & {
            firstName: string;
            departmentName: string;
            departmentPublicId: string;
            userRole: UserRole;
        };
        approvalRole: UserRole;
    };
}> = [
    {
        id: "DEPT_HEAD",
        label: "Department Head",
        isSigned: (approval, eventDto: EventDTO) =>
            approval.userRole === "DEPT_HEAD" &&
            approval.signedByUser?.publicId ===
                eventDto.organizer?.department?.deptHead?.publicId,
        getPlaceholderData: (eventDto: EventDTO) => {
            const deptHead = eventDto.organizer?.department?.deptHead;
            const orgDept = eventDto.organizer?.department;
            return {
                signedByUserInitial: {
                    firstName: deptHead
                        ? `${deptHead.firstName} ${deptHead.lastName}`
                        : "Department Head",
                    userRole: "DEPT_HEAD",
                    departmentName: orgDept?.name || "N/A",
                    departmentPublicId: orgDept?.publicId || "",
                    publicId: deptHead?.publicId,
                },
                approvalRole: "DEPT_HEAD",
            };
        },
    },
    {
        id: "VENUE_OWNER",
        label: "Venue Owner",
        isSigned: (approval, eventDto: EventDTO) =>
            approval.userRole === "VENUE_OWNER" &&
            approval.signedByUser?.publicId ===
                eventDto.eventVenue?.venueOwner?.publicId,
        getPlaceholderData: (eventDto: EventDTO) => {
            const venueOwnerUser = eventDto.eventVenue?.venueOwner;
            const eventVenue = eventDto.eventVenue;
            return {
                signedByUserInitial: {
                    firstName: venueOwnerUser
                        ? `${venueOwnerUser.firstName} ${venueOwnerUser.lastName}`
                        : "Venue Owner",
                    userRole: "VENUE_OWNER",
                    departmentName: eventVenue?.name || "Event Venue N/A", // Using venue name as department for placeholder display
                    departmentPublicId: eventVenue?.publicId || "",
                    publicId: venueOwnerUser?.publicId,
                },
                approvalRole: "VENUE_OWNER",
            };
        },
    },
    {
        id: "VP_ADMIN",
        label: "VP Admin",
        isSigned: (approval, _eventDto: EventDTO) =>
            approval.userRole === "VP_ADMIN",
        getPlaceholderData: (_eventDto: EventDTO) => ({
            signedByUserInitial: {
                firstName: "VP Admin",
                userRole: "VP_ADMIN",
                departmentName: "Office of VP Admin",
                departmentPublicId: "vp-admin-dept",
            },
            approvalRole: "VP_ADMIN",
        }),
    },
    {
        id: "VPAA",
        label: "VPAA Representative",
        isSigned: (approval, _eventDto: EventDTO) =>
            (approval.signedByUser?.department?.name?.includes("VPAA") ??
                false) &&
            approval.userRole === "VPAA",
        getPlaceholderData: (_eventDto: EventDTO) => ({
            signedByUserInitial: {
                firstName: "VPAA Representative",
                userRole: "VPAA",
                departmentName: "VPAA",
                departmentPublicId: "vp-aa-dept",
            },
            approvalRole: "VPAA",
        }),
    },
    {
        id: "MSDO",
        label: "MSDO Representative",
        isSigned: (approval, _eventDto: EventDTO) =>
            (approval.signedByUser?.department?.name?.includes("MSDO") ??
                false) &&
            approval.userRole === "MSDO",
        getPlaceholderData: (_eventDto: EventDTO) => ({
            signedByUserInitial: {
                firstName: "MSDO Representative",
                userRole: "MSDO",
                departmentName: "MSDO",
                departmentPublicId: "msdo-dept",
            },
            approvalRole: "MSDO",
        }),
    },
    {
        id: "OPC",
        label: "OPC Representative",
        isSigned: (approval, _eventDto: EventDTO) =>
            (approval.signedByUser?.department?.name?.includes("OPC") ??
                false) &&
            approval.userRole === "OPC",
        getPlaceholderData: (_eventDto: EventDTO) => ({
            signedByUserInitial: {
                firstName: "OPC Representative",
                userRole: "OPC",
                departmentName: "OPC",
                departmentPublicId: "opc-dept",
            },
            approvalRole: "OPC",
        }),
    },
    {
        id: "SSD",
        label: "SSD",
        isSigned: (approval, _eventDto: EventDTO) =>
            approval.userRole === "SSD",
        getPlaceholderData: (_eventDto: EventDTO) => ({
            signedByUserInitial: {
                firstName: "SSD",
                userRole: "SSD",
                departmentName: "Student Services Dept.",
                departmentPublicId: "ssd-dept",
            },
            approvalRole: "SSD",
        }),
    },
    {
        id: "FAO",
        label: "FAO",
        isSigned: (approval, _eventDto: EventDTO) =>
            approval.userRole === "FAO",
        getPlaceholderData: (_eventDto: EventDTO) => ({
            signedByUserInitial: {
                firstName: "FAO",
                userRole: "FAO",
                departmentName: "Finance & Accounting Office",
                departmentPublicId: "fao-dept",
            },
            approvalRole: "FAO",
        }),
    },
];

export function EventDetailsPage() {
    const context = useRouteContext({ from: "/app/events" });
    const role = context.authState?.roles;
    const currentUser = context.authState;
    const router = useRouter();
    const queryClient = context.queryClient;
    const onBack = () => router.history.back();

    const loadedEventData = Route.useLoaderData();
    const { data: approvals } = useSuspenseQuery(
        eventApprovalsQueryOptions(loadedEventData.publicId),
    );
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

    const hasUserApproved = useMemo(() => {
        if (!currentUser) return false;

        return approvals.some((appr: EventApprovalDTO) => {
            // 1. Check by userId if both currentUser.id and appr.userId exist
            if (
                currentUser.publicId &&
                appr.signedByUser &&
                appr.signedByUser.publicId != null
            ) {
                // Check for null/undefined
                return appr.signedByUser.publicId === currentUser.publicId;
            }
            // 2. Fallback: Check by signedBy name if appr.userId is missing
            //    Ensure currentUser has names to compare against.
            if (
                appr.signedByUser &&
                currentUser.firstName &&
                currentUser.lastName
            ) {
                // Also check appr.signedBy here
                // Construct the name exactly as it appears in signedBy
                // Adjust this if the format in signedBy is different (e.g., "LastName, FirstName")
                const currentUserName = `${currentUser.firstName} ${currentUser.lastName}`;
                return appr.signedByUser.firstName === currentUserName;
            }
            // If neither check is possible, this approval doesn't match the current user
            return false;
        });
    }, [approvals, currentUser]); // Recalculate when approvals or currentUser changes

    const isOrganizer = currentUser?.publicId === event.organizer.publicId;
    const isSuperAdmin = role?.includes("SUPER_ADMIN");

    const canUserApprove =
        currentUser &&
        !hasUserApproved &&
        event.status === "PENDING" &&
        (isSuperAdmin || // Super Admin
            (currentUser.roles?.includes("DEPT_HEAD") &&
                event.organizer?.department?.deptHead?.publicId ===
                    currentUser.publicId) ||
            (currentUser.roles?.includes("VENUE_OWNER") &&
                eventVenue?.venueOwner?.publicId === currentUser.publicId) || // Venue Owner of event venue
            // MSDO related approval
            ((currentUser.roles?.includes("EQUIPMENT_OWNER") ||
                currentUser.roles?.includes("MSDO")) &&
                currentUser.department?.name?.includes("(MSDO)")) ||
            // OPC related approval
            ((currentUser.roles?.includes("EQUIPMENT_OWNER") ||
                currentUser.roles?.includes("OPC")) &&
                currentUser.department?.name?.includes("(OPC)")) ||
            // Other general approver roles
            currentUser.roles?.includes("VP_ADMIN") ||
            currentUser.roles?.includes("VPAA") ||
            currentUser.roles?.includes("SSD") ||
            currentUser.roles?.includes("FAO"));

    const canUserReject =
        currentUser &&
        event.status === "PENDING" &&
        (isSuperAdmin || // Super Admin
            (currentUser.roles?.includes("DEPT_HEAD") &&
                event.organizer?.department?.deptHead?.publicId ===
                    currentUser.publicId) || // Department Head of event organizer
            (currentUser.roles?.includes("VENUE_OWNER") &&
                eventVenue?.venueOwner?.publicId === currentUser.publicId) || // Venue Owner of event venue
            // MSDO related approval
            ((currentUser.roles?.includes("EQUIPMENT_OWNER") ||
                currentUser.roles?.includes("MSDO")) &&
                currentUser.department?.name?.includes("MSDO")) ||
            // OPC related approval
            ((currentUser.roles?.includes("EQUIPMENT_OWNER") ||
                currentUser.roles?.includes("OPC")) &&
                currentUser.department?.name?.includes("OPC")) ||
            // Other general approver roles
            currentUser.roles?.includes("VP_ADMIN") ||
            currentUser.roles?.includes("VPAA") ||
            currentUser.roles?.includes("SSD") ||
            currentUser.roles?.includes("FAO"));

    const canCancelEvent =
        event.status === "PENDING" || event.status === "APPROVED";

    const canEditEvent =
        isSuperAdmin || (isOrganizer && event.status === "PENDING");

    const canUserModifyEquipmentReservation =
        isOrganizer &&
        (event.status === "PENDING" || event.status === "APPROVED");

    const approveMutation = useMutation({
        mutationFn: approveEvent,
        onSuccess: () => {
            toast.success("Event approved successfully.");
            queryClient.invalidateQueries({
                queryKey: eventsQueryKeys.approvals(event.publicId),
            });
            // Invalidate the detail query for this event
            queryClient.invalidateQueries({
                queryKey: eventsQueryKeys.detail(event.publicId),
            });
            // Invalidate general event lists (all, approved, pending, own)
            queryClient.invalidateQueries({
                queryKey: eventsQueryKeys.lists(), // General list
            });
            queryClient.invalidateQueries({
                queryKey: eventsQueryKeys.approved(), // Approved list
            });
            queryClient.invalidateQueries({
                queryKey: eventsQueryKeys.pending(), // General pending list
            });
            queryClient.invalidateQueries({
                queryKey: eventsQueryKeys.pendingVenueOwner(), // Specific pending list
            });
            queryClient.invalidateQueries({
                queryKey: eventsQueryKeys.pendingDeptHead(), // Specific pending list
            });
            queryClient.invalidateQueries({
                queryKey: eventsQueryKeys.own(), // Own events list
            });
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
                queryKey: eventsQueryKeys.approvals(event.publicId),
            });
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
            // Invalidate event details and list
            queryClient.invalidateQueries({
                queryKey: eventsQueryKeys.detail(event.publicId),
            });
            // Invalidate relevant lists
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
                queryKey: eventsQueryKeys.pending(), // Also invalidate pending lists
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
                        variables.eventData.eventName ??
                        previousEventDetails.eventName,
                    eventType:
                        variables.eventData.eventType ??
                        previousEventDetails.eventType,
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
                        variables.eventData.startTime ??
                        previousEventDetails.startTime, // Keep as string for now
                    endTime:
                        variables.eventData.endTime ??
                        previousEventDetails.endTime, // Keep as string for now
                    // Note: approvedLetterUrl cannot be optimistically updated easily without backend response
                    // status might change based on edits, but we'll keep it for now unless logic dictates otherwise
                };
                queryClient.setQueryData(
                    eventDetailsKey,
                    optimisticEventDetails,
                );
            }

            // Optimistically update the event in the lists (approved and own)
            const updateList = (
                list: EventDTO[] | undefined,
            ): EventDTO[] | undefined => {
                return list?.map((ev) =>
                    ev.publicId === variables.eventId
                        ? {
                              ...ev,
                              eventName:
                                  variables.eventData.eventName ?? ev.eventName,
                              eventType:
                                  variables.eventData.eventType ?? ev.eventType,
                              eventVenueId:
                                  variables.eventData.venuePublicId ??
                                  ev.eventVenue.publicId,
                              startTime:
                                  variables.eventData.startTime ?? ev.startTime,
                              endTime:
                                  variables.eventData.endTime ?? ev.endTime,
                              // status might change?
                          }
                        : ev,
                );
            };

            queryClient.setQueryData(
                approvedEventsKey,
                updateList(previousApprovedEvents),
            );
            queryClient.setQueryData(
                ownEventsKey,
                updateList(previousOwnEvents),
            );
            queryClient.setQueryData(
                allEventsKey,
                updateList(previousAllEvents),
            );

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
            // Invalidate relevant lists
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

    // Handler for submitting equipment reservation from the dialog
    const handleReserveEquipmentSubmit = async (
        formData: EquipmentReservationFormInput,
    ) => {
        console.log("Reservation form submitted:", formData);
        setIsReserveEquipmentDialogOpen(false);

        const { selectedEquipment } = formData;

        if (!event || !event.publicId) {
            toast.error(
                "Event details are not available to make a reservation.",
            );
            return;
        }

        let successCount = 0;
        let errorCount = 0;

        for (const item of selectedEquipment) {
            const payload: CreateEquipmentReservationInput = {
                event: { publicId: event.publicId },
                equipment: { publicId: item.equipmentId },
                quantity: item.quantity,
            };

            try {
                await createEquipmentReservationMutation.mutateAsync(payload);
                successCount++;
            } catch (error) {
                errorCount++;
                console.error(
                    `Failed to reserve equipment ID ${item.equipmentId}:`,
                    error,
                );
                const equipmentName =
                    availableEquipments.find(
                        (eq) => eq.publicId === item.equipmentId,
                    )?.name || `ID ${item.equipmentId}`;
                toast.error(
                    `Failed to reserve item ${equipmentName}: ${
                        error instanceof Error ? error.message : String(error)
                    }`,
                );
            }
        }

        if (successCount > 0 && errorCount === 0) {
            toast.success(
                `Successfully submitted ${successCount} equipment reservation request(s).`,
            );
            queryClient.invalidateQueries({
                queryKey: equipmentReservationKeys.byEvent(event.publicId),
            });
        } else if (errorCount > 0 && successCount > 0) {
            toast.warning(
                `Partially submitted: ${successCount} succeeded, ${errorCount} failed.`,
            );
            queryClient.invalidateQueries({
                queryKey: equipmentReservationKeys.byEvent(event.publicId),
            });
        } else if (errorCount > 0 && successCount === 0) {
            toast.error("Failed to submit any equipment reservation requests.");
        }
    };

    const approvalTableRows = useMemo(() => {
        if (!event) return [];

        // Ensure currentApprovals is always an array for consistent processing
        const currentApprovals = Array.isArray(approvals) ? approvals : [];

        type PlaceholderApprovalRow = {
            publicId: string;
            signedByUser: UserDTO;
            userRole: UserRole;
            dateSigned: null;
            status: "PENDING";
            remarks: string;
            isPlaceholder: true;
            // Include all other fields from EventApprovalDTO with appropriate placeholder types/values
            approvedByDepartmentHead: boolean | null;
            approvedByVenueOwner: boolean | null;
            finalStatus: string | null;
            rejectionReason: string | null;
            version: number;
            createdAt: string;
            updatedAt: string;
            event: Partial<EventDTO> | undefined; // Keep this flexible for placeholders
        };

        type ApprovalTableRow = EventApprovalDTO | PlaceholderApprovalRow;

        const outputRows: ApprovalTableRow[] = [];
        const signedApproverConfigIds = new Set<string>();

        // Process existing approvals first and identify which config types are met
        for (const approval of currentApprovals) {
            outputRows.push({
                ...approval,
                isPlaceholder: false,
            } as EventApprovalDTO);
            for (const config of EXPECTED_APPROVERS_CONFIG) {
                if (config.isSigned(approval, event)) {
                    signedApproverConfigIds.add(config.id);
                }
            }
        }

        for (const config of EXPECTED_APPROVERS_CONFIG) {
            if (!signedApproverConfigIds.has(config.id)) {
                const placeholderData = config.getPlaceholderData(event);

                const completeSignedByUserPlaceholder: UserDTO = {
                    ...DEFAULT_USER_PLACEHOLDER_FIELDS,
                    publicId:
                        placeholderData.signedByUserInitial.publicId ||
                        `placeholder-user-${config.id}`,
                    firstName: placeholderData.signedByUserInitial.firstName,
                    lastName:
                        placeholderData.signedByUserInitial.lastName || "",
                    email: placeholderData.signedByUserInitial.email || "",
                    roles: [placeholderData.signedByUserInitial.userRole],
                    department: {
                        ...DEFAULT_DEPARTMENT_PLACEHOLDER_FIELDS,
                        publicId:
                            placeholderData.signedByUserInitial
                                .departmentPublicId,
                        name: placeholderData.signedByUserInitial
                            .departmentName,
                    },
                };

                const placeholderApproval: PlaceholderApprovalRow = {
                    publicId: `placeholder-approval-${config.id}`,
                    signedByUser: completeSignedByUserPlaceholder,
                    userRole: placeholderData.approvalRole,
                    dateSigned: null,
                    status: "PENDING",
                    remarks: "Awaiting Approval",
                    isPlaceholder: true,
                    // Default/null values for other EventApprovalDTO fields consistent with PlaceholderApprovalRow definition
                    approvedByDepartmentHead: null,
                    approvedByVenueOwner: null,
                    finalStatus: null,
                    rejectionReason: null,
                    version: 0,
                    createdAt: "",
                    updatedAt: "",
                    event: {
                        publicId: event.publicId,
                        eventName: event.eventName,
                    }, // Provide a partial event ref
                };
                outputRows.push(placeholderApproval);
            }
        }
        return outputRows;
    }, [approvals, event]); // Ensure event is a dependency if its properties are used in getPlaceholderData or isSigned

    return (
        <div className="flex h-screen bg-background">
            <div className="flex flex-col flex-1">
                <header className="flex items-center justify-between border-b px-6 py-3.5 sticky top-0 bg-background z-10">
                    {" "}
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={onBack}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <h1 className="text-xl font-semibold">
                            {event.eventName}
                        </h1>
                        <Badge className={`${getStatusColor(event.status)}`}>
                            {event.status
                                ? event.status.charAt(0).toUpperCase() +
                                  event.status.slice(1).toLowerCase()
                                : "Unknown"}
                        </Badge>
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
                                        Approve Event
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Approve Event</DialogTitle>
                                        <DialogDescription>
                                            Add optional remarks for your
                                            approval.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="py-4">
                                        <Textarea
                                            placeholder="Enter remarks (optional)..."
                                            value={approvalRemarks}
                                            onChange={(e) =>
                                                setApprovalRemarks(
                                                    e.target.value,
                                                )
                                            }
                                            rows={4}
                                        />
                                    </div>
                                    <DialogFooter>
                                        <Button
                                            variant="outline"
                                            onClick={() =>
                                                setIsApprovalDialogOpen(false)
                                            }
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={handleApproveClick}
                                            disabled={approveMutation.isPending}
                                        >
                                            {approveMutation.isPending
                                                ? "Approving..."
                                                : "Confirm Approval"}
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
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        className="gap-1"
                                    >
                                        <XCircle className="h-4 w-4" />
                                        Reject Event
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Reject Event</DialogTitle>
                                        <DialogDescription>
                                            Provide remarks for rejecting this
                                            event. Remarks are required for
                                            rejection.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="py-4">
                                        <Textarea
                                            placeholder="Enter rejection remarks (required)..."
                                            value={rejectionRemarks}
                                            onChange={(e) =>
                                                setRejectionRemarks(
                                                    e.target.value,
                                                )
                                            }
                                            rows={4}
                                        />
                                    </div>
                                    <DialogFooter>
                                        <Button
                                            variant="outline"
                                            onClick={() =>
                                                setIsRejectionDialogOpen(false)
                                            }
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
                                                ? "Rejecting..."
                                                : "Confirm Rejection"}
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
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                        >
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        {/* Cancel Event Item - Render only if canCancelEvent is true */}
                                        {canCancelEvent && (
                                            <DropdownMenuItem
                                                className="text-orange-600 focus:text-orange-700 focus:bg-orange-100"
                                                onClick={handleCancelClick}
                                                disabled={
                                                    cancelEventMutation.isPending
                                                }
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
                                                disabled={
                                                    deleteEventMutation.isPending
                                                } // Disable during delete mutation
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
                                <h2 className="text-lg font-medium">
                                    Event Overview
                                </h2>
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
                                                <span className="text-sm">
                                                    {dateDisplayString}
                                                </span>
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
                                                        {eventDepartment.name ??
                                                            "N/A"}
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
                                                {isImageUrl(
                                                    event.approvedLetterUrl,
                                                ) ? (
                                                    <Dialog>
                                                        <DialogTrigger asChild>
                                                            <div className="flex items-center gap-2 mt-1 cursor-pointer text-blue-600 hover:underline">
                                                                <Paperclip className="h-4 w-4" />
                                                                <span className="text-sm">
                                                                    View
                                                                    Attached
                                                                    Letter
                                                                    (Image)
                                                                </span>
                                                            </div>
                                                        </DialogTrigger>
                                                        <DialogContent className="sm:max-w-[600px] md:max-w-[800px] lg:max-w-[1000px]">
                                                            <DialogHeader>
                                                                <DialogTitle>
                                                                    Approved
                                                                    Letter
                                                                </DialogTitle>
                                                                <DialogDescription>
                                                                    Viewing the
                                                                    letter for
                                                                    event:{" "}
                                                                    {
                                                                        event.eventName
                                                                    }
                                                                </DialogDescription>
                                                            </DialogHeader>
                                                            <div className="mt-4 max-h-[70vh] overflow-auto">
                                                                <img
                                                                    src={
                                                                        event.approvedLetterUrl
                                                                    }
                                                                    alt="Approved Letter"
                                                                    className="max-w-full h-auto mx-auto"
                                                                />
                                                            </div>
                                                        </DialogContent>
                                                    </Dialog>
                                                ) : (
                                                    <a // Direct download link for non-images
                                                        href={
                                                            event.approvedLetterUrl
                                                        }
                                                        download
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-2 mt-1"
                                                    >
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            asChild
                                                        >
                                                            <div>
                                                                <Paperclip className="h-4 w-4" />
                                                                <span className="text-sm">
                                                                    Approved
                                                                    Letter
                                                                </span>
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
                                                        src={
                                                            event.organizer
                                                                ?.profileImagePath ??
                                                            ""
                                                        }
                                                        alt={organizerName}
                                                    />
                                                    <AvatarFallback>
                                                        {getInitials(
                                                            organizerName,
                                                        )}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <div className="text-sm font-medium">
                                                        {organizerName}
                                                    </div>
                                                    {/* Display organizer role if available */}
                                                    {event.organizer?.roles && (
                                                        <div className="text-xs text-muted-foreground">
                                                            {
                                                                event.organizer
                                                                    .roles
                                                            }
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            {/* Display organizer contact details */}
                                            {event.organizer && (
                                                <div className="mt-2 ml-13 space-y-1">
                                                    {event.organizer
                                                        .idNumber && (
                                                        <div className="text-xs text-muted-foreground">
                                                            ID:{" "}
                                                            {
                                                                event.organizer
                                                                    .idNumber
                                                            }
                                                        </div>
                                                    )}
                                                    {event.organizer.email && (
                                                        <div className="text-xs text-muted-foreground">
                                                            {
                                                                event.organizer
                                                                    .email
                                                            }
                                                        </div>
                                                    )}
                                                    {event.organizer
                                                        .phoneNumber && (
                                                        <div className="text-xs text-muted-foreground">
                                                            {
                                                                event.organizer
                                                                    .phoneNumber
                                                            }
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
                                                            eventVenue.imagePath ??
                                                            "/placeholder.svg"
                                                        }
                                                        alt={
                                                            eventVenue.name ??
                                                            "Venue image"
                                                        }
                                                        className="h-full w-full object-cover"
                                                        onError={(e) => {
                                                            e.currentTarget.src =
                                                                "/placeholder.svg";
                                                        }}
                                                    />
                                                </div>
                                                <h4 className="text-sm font-semibold hover:underline text-primary">
                                                    {eventVenue.publicId ? (
                                                        <Link
                                                            to={
                                                                "/app/venues/$venueId"
                                                            }
                                                            params={{
                                                                venueId:
                                                                    eventVenue.publicId,
                                                            }}
                                                        >
                                                            {eventVenue.name ??
                                                                "Unknown Venue"}
                                                        </Link>
                                                    ) : (
                                                        (eventVenue.name ??
                                                        "Unknown Venue")
                                                    )}
                                                </h4>
                                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                                    <MapPin className="h-3 w-3 flex-shrink-0" />
                                                    {eventVenue.location ??
                                                        "Unknown Location"}
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
                                {isOrganizer && ( // Only show button to organizer
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="gap-1"
                                        onClick={handleReserveEquipmentClick}
                                        disabled={
                                            createEquipmentReservationMutation.isPending
                                        }
                                    >
                                        <CalendarPlus className="h-4 w-4" />
                                        Reserve Equipment
                                    </Button>
                                )}
                            </CardHeader>
                            <CardContent>
                                {reservedEquipments.length > 0 ? (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Equipment</TableHead>
                                                <TableHead>Quantity</TableHead>
                                                <TableHead>Status</TableHead>
                                                {canUserModifyEquipmentReservation && (
                                                    <TableHead className="text-right">
                                                        Actions
                                                    </TableHead>
                                                )}
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {reservedEquipments.map(
                                                (reservation) => (
                                                    <TableRow
                                                        key={
                                                            reservation.publicId
                                                        }
                                                    >
                                                        <TableCell>
                                                            {reservation
                                                                .equipment
                                                                ?.name ?? "N/A"}
                                                        </TableCell>
                                                        <TableCell>
                                                            {
                                                                reservation.quantity
                                                            }
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge
                                                                className={`${getStatusColor(reservation.status)}`}
                                                            >
                                                                {reservation.status
                                                                    .charAt(0)
                                                                    .toUpperCase() +
                                                                    reservation.status
                                                                        .slice(
                                                                            1,
                                                                        )
                                                                        .toLowerCase()}
                                                            </Badge>
                                                        </TableCell>
                                                        {canUserModifyEquipmentReservation && (
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
                                                                        Cancel
                                                                        Reservation
                                                                    </span>
                                                                </Button>
                                                            </TableCell>
                                                        )}
                                                    </TableRow>
                                                ),
                                            )}
                                        </TableBody>
                                    </Table>
                                ) : (
                                    <div className="text-center text-muted-foreground py-4">
                                        No equipment reserved for this event
                                        yet.
                                    </div>
                                )}
                            </CardContent>
                        </Card>

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
                                                <TableHead>
                                                    Department
                                                </TableHead>
                                                <TableHead>
                                                    Date Signed
                                                </TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Remarks</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {approvalTableRows.map(
                                                (approvalRow) => (
                                                    <TableRow
                                                        key={
                                                            approvalRow.publicId
                                                        }
                                                    >
                                                        <TableCell>
                                                            {
                                                                approvalRow
                                                                    .signedByUser
                                                                    .firstName
                                                            }
                                                            {approvalRow
                                                                .signedByUser
                                                                .lastName
                                                                ? ` ${approvalRow.signedByUser.lastName}`
                                                                : ""}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge
                                                                className={getBadgeVariant(
                                                                    approvalRow.userRole as UserRole,
                                                                )}
                                                            >
                                                                {formatRole(
                                                                    approvalRow.userRole as UserRole,
                                                                )}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            {
                                                                approvalRow
                                                                    .signedByUser
                                                                    .department
                                                                    ?.name
                                                            }
                                                        </TableCell>
                                                        <TableCell>
                                                            {approvalRow.dateSigned &&
                                                            !(
                                                                "isPlaceholder" in
                                                                    approvalRow &&
                                                                approvalRow.isPlaceholder
                                                            )
                                                                ? formatDateTime(
                                                                      approvalRow.dateSigned,
                                                                  )
                                                                : "—"}
                                                        </TableCell>
                                                        <TableCell>
                                                            {getApproverStatusBadge(
                                                                approvalRow.status as string,
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            {"isPlaceholder" in
                                                                approvalRow &&
                                                            approvalRow.isPlaceholder
                                                                ? "Awaiting Approval"
                                                                : approvalRow.remarks ||
                                                                  "—"}
                                                        </TableCell>
                                                    </TableRow>
                                                ),
                                            )}
                                        </TableBody>
                                    </Table>
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        No approval records or pending
                                        placeholders found.
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
            {isOrganizer && (
                <EquipmentReservationFormDialog
                    isOpen={isReserveEquipmentDialogOpen}
                    onClose={() => setIsReserveEquipmentDialogOpen(false)}
                    onSubmit={handleReserveEquipmentSubmit}
                    // Pass the current event directly, not a list
                    // The dialog needs modification to accept a single event or just eventId
                    // For now, passing a single-item array might work depending on dialog logic
                    event={event} // Pass current event, assert non-null as it's guarded by useMemo
                    // Filter available equipment (optional, could be done in dialog)
                    // Use nullish coalescing operator (??) to provide an empty array fallback
                    equipment={(availableEquipments ?? []).filter(
                        (e) => e.availability,
                    )}
                    isLoading={createEquipmentReservationMutation.isPending}
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
        </div>
    );
}
