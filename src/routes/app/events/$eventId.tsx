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

export function EventDetailsPage() {
    const context = useRouteContext({ from: "/app/events" });
    const role = context.authState?.role;
    const currentUser = context.authState;
    const router = useRouter();
    const queryClient = context.queryClient;
    const onBack = () => router.history.back();

    const eventId = Route.useLoaderData();
    const { data: approvals } = useSuspenseQuery(
        eventApprovalsQueryOptions(eventId.publicId),
    );
    const { data: event } = useSuspenseQuery(
        eventByIdQueryOptions(eventId.publicId),
    );
    const { data: venues } = useSuspenseQuery(venuesQueryOptions);
    const { data: departments } = useSuspenseQuery(departmentsQueryOptions);
    const { data: availableEquipments } = useSuspenseQuery(
        equipmentsQueryOptions(currentUser),
    );
    const { data: reservedEquipments } = useSuspenseQuery(
        equipmentReservationsByEventIdQueryOptions(event.publicId),
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
    const isSuperAdmin = role === "SUPER_ADMIN";

    const canUserApprove =
        currentUser &&
        !hasUserApproved &&
        event.status === "PENDING" &&
        (isSuperAdmin || // Super Admin
            (currentUser.role === "DEPT_HEAD" &&
                event.organizer?.department?.deptHead?.publicId ===
                    currentUser.publicId) ||
            (currentUser.role === "VENUE_OWNER" &&
                eventVenue?.venueOwner?.publicId === currentUser.publicId) || // Venue Owner of event venue
            // MSDO related approval
            ((currentUser.role === "EQUIPMENT_OWNER" ||
                currentUser.role === "MSDO") &&
                currentUser.department?.name === "MSDO") ||
            // OPC related approval
            ((currentUser.role === "EQUIPMENT_OWNER" ||
                currentUser.role === "OPC") &&
                currentUser.department?.name === "OPC") ||
            // Other general approver roles
            ["VP_ADMIN", "VPAA", "SSD", "FAO"].includes(currentUser.role));

    const canUserReject =
        currentUser &&
        event.status === "PENDING" &&
        (isSuperAdmin || // Super Admin
            (currentUser.role === "DEPT_HEAD" &&
                event.organizer?.department?.deptHead?.publicId ===
                    currentUser.publicId) || // Department Head of event organizer
            (currentUser.role === "VENUE_OWNER" &&
                eventVenue?.venueOwner?.publicId === currentUser.publicId) || // Venue Owner of event venue
            // MSDO related approval
            ((currentUser.role === "EQUIPMENT_OWNER" ||
                currentUser.role === "MSDO") &&
                currentUser.department?.name === "MSDO") ||
            // OPC related approval
            ((currentUser.role === "EQUIPMENT_OWNER" ||
                currentUser.role === "OPC") &&
                currentUser.department?.name === "OPC") ||
            // Other general approver roles
            ["VP_ADMIN", "VPAA", "SSD", "FAO"].includes(currentUser.role));

    const canCancelEvent =
        event.status === "PENDING" || event.status === "APPROVED";

    const canEditEvent =
        isSuperAdmin || (isOrganizer && event.status === "PENDING");

    const approveMutation = useMutation({
        mutationFn: approveEvent,
        onSuccess: (message) => {
            toast.success(message || "Event approved successfully.");
            queryClient.invalidateQueries({
                queryKey: eventsQueryKeys.approvals(eventId.publicId),
            });
            // Invalidate the detail query for this event
            queryClient.invalidateQueries({
                queryKey: eventsQueryKeys.detail(eventId.publicId),
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
        onSuccess: (message) => {
            toast.success(message || "Event rejected successfully.");
            queryClient.invalidateQueries({
                queryKey: eventsQueryKeys.approvals(eventId.publicId),
            });
            queryClient.invalidateQueries({
                queryKey: eventsQueryKeys.detail(eventId.publicId),
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
        onSuccess: (message) => {
            toast.success(message || "Event canceled successfully.");
            // Invalidate event details and list
            queryClient.invalidateQueries({
                queryKey: eventsQueryKeys.detail(eventId.publicId),
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
        onSuccess: (message) => {
            toast.success(message || "Event updated successfully.");
            setIsEditModalOpen(false);
        },
    });

    // Using cancelEvent for delete action for now as per original code
    const deleteEventMutation = useMutation({
        mutationFn: deleteEvent,
        onSuccess: (message) => {
            toast.success(message || "Event deleted successfully."); // Changed message for clarity
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
                queryKey: eventsQueryKeys.detail(eventId.publicId),
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
            eventId: eventId.publicId,
            remarks: approvalRemarks,
        });
    };

    const handleRejectClick = () => {
        setIsRejectionDialogOpen(true);
    };

    const handleConfirmReject = () => {
        if (!currentUser) return;
        rejectEventMutation.mutate({
            eventId: eventId.publicId,
            remarks: rejectionRemarks,
        });
    };

    const handleCancelClick = () => {
        setIsCancelDialogOpen(true);
    };

    // Handler for confirming the cancellation
    const handleConfirmCancel = () => {
        cancelEventMutation.mutate(eventId.publicId);
    };

    const handleDeleteClick = () => {
        setIsDeleteDialogOpen(true);
    };

    const handleConfirmDelete = () => {
        deleteEventMutation.mutate(eventId.publicId);
    };

    // Placeholder handler for edit (e.g., navigate to an edit page)
    const handleEditClick = () => {
        setIsEditModalOpen(true);
    };

    let dateDisplayString = "Date not available";
    if (
        typeof event.startTime === "string" &&
        typeof event.endTime === "string"
    ) {
        const startDate = new Date(`${event.startTime}Z`);
        const endDate = new Date(`${event.endTime}Z`);
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
                                        {/* ID and Status */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <h3 className="text-sm font-medium text-muted-foreground">
                                                    Status
                                                </h3>
                                                <Badge
                                                    className={`${getStatusColor(event.status)} mt-1`}
                                                >
                                                    {event.status
                                                        ? event.status
                                                              .charAt(0)
                                                              .toUpperCase() +
                                                          event.status
                                                              .slice(1)
                                                              .toLowerCase()
                                                        : "Unknown"}
                                                </Badge>
                                            </div>
                                        </div>

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

                                        <div>
                                            <h3 className="text-sm font-medium text-muted-foreground">
                                                Venue
                                            </h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                                {eventVenue?.publicId ? (
                                                    <Link
                                                        to="/app/venues/$venueId"
                                                        params={{
                                                            venueId:
                                                                eventVenue.publicId,
                                                        }}
                                                        className="text-sm underline-offset-4 hover:underline text-primary"
                                                    >
                                                        {eventVenue.name ??
                                                            "Unknown Venue"}
                                                    </Link>
                                                ) : (
                                                    <span className="text-sm">
                                                        {eventVenue?.name ??
                                                            "Unknown Venue"}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        {/* Location */}
                                        <div>
                                            <h3 className="text-sm font-medium text-muted-foreground">
                                                Location
                                            </h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-sm">
                                                    {eventVenue?.location ??
                                                        "Unknown Location"}
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
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <div className="flex items-center gap-2 mt-1 cursor-pointer text-blue-600 hover:underline">
                                                            <Paperclip className="h-4 w-4" />
                                                            <span className="text-sm">
                                                                View Attached
                                                                Letter
                                                            </span>
                                                        </div>
                                                    </DialogTrigger>
                                                    <DialogContent className="sm:max-w-[600px] md:max-w-[800px] lg:max-w-[1000px]">
                                                        {" "}
                                                        {/* Adjust size */}
                                                        <DialogHeader>
                                                            <DialogTitle>
                                                                Approved Letter
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
                                                            {" "}
                                                            {/* Limit height and allow scroll */}
                                                            {/* Display image - adjust if it could be PDF */}
                                                            <img
                                                                src={
                                                                    event.approvedLetterUrl
                                                                }
                                                                alt="Approved Letter"
                                                                className="max-w-full h-auto mx-auto"
                                                            />
                                                            {/* For PDF, you might use: */}
                                                            {/* <iframe src={approvedLetterUrl} width="100%" height="600px" title="Approved Letter"></iframe> */}
                                                        </div>
                                                    </DialogContent>
                                                </Dialog>
                                            </div>
                                        )}

                                        {/* Removed Attendees */}
                                    </div>

                                    {/* Right Column */}
                                    <div className="space-y-4">
                                        {/* Organizer */}
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
                                                    {event.organizer?.role && (
                                                        <div className="text-xs text-muted-foreground">
                                                            {
                                                                event.organizer
                                                                    .role
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
                                                        {/* Add more cells if needed */}
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
                                {approvals.length > 0 ? (
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
                                            {approvals.map((approval) => (
                                                <TableRow
                                                    key={approval.publicId}
                                                >
                                                    <TableCell>
                                                        {
                                                            approval
                                                                .signedByUser
                                                                .firstName
                                                        }
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            className={getBadgeVariant(
                                                                approval.userRole,
                                                            )}
                                                        >
                                                            {formatRole(
                                                                approval.userRole,
                                                            )}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        {
                                                            approval
                                                                .signedByUser
                                                                .department
                                                                ?.name
                                                        }
                                                    </TableCell>
                                                    <TableCell>
                                                        {approval.dateSigned
                                                            ? formatDateTime(
                                                                  approval.dateSigned,
                                                              )
                                                            : "—"}
                                                    </TableCell>
                                                    <TableCell>
                                                        {getApproverStatusBadge(
                                                            approval.status,
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {approval.remarks ||
                                                            "—"}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        No approval records found yet.
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
                    event={event} // Pass current event in an array
                    // Filter available equipment (optional, could be done in dialog)
                    // Use nullish coalescing operator (??) to provide an empty array fallback
                    equipment={(availableEquipments ?? []).filter(
                        (e) => e.availability,
                    )}
                    isLoading={createEquipmentReservationMutation.isPending}
                    // Indicate that the event is pre-selected
                />
            )}
        </div>
    );
}
