import {
    Avatar,
    AvatarFallback /*, AvatarImage*/,
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
    CheckCircle2,
    Clock,
    Edit,
    MapPin,
    MoreHorizontal,
    Paperclip, // Added for approved letter
    Tag, // Added for event type
    Trash2,
    XCircle,
} from "lucide-react";

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
import { approveEvent, cancelEvent, updateEvent } from "@/lib/api";
import {
    eventApprovalsQueryOptions,
    eventQueryOptions,
    eventsQueryOptions,
    getApprovedEventsQuery,
    getOwnEventsQueryOptions,
    venuesQueryOptions,
} from "@/lib/query"; // Import query options
import type {
    Event,
    EventApprovalDTO,
    EventDTOPayload,
    Venue,
} from "@/lib/types"; // Import Event type
import {
    formatDateRange,
    formatDateTime,
    getApproverStatusBadge,
    getInitials,
    getStatusColor,
} from "@/lib/utils"; // Import helpers
import { useMutation, useSuspenseQuery } from "@tanstack/react-query"; // Import suspense query hook
import {
    // Link, // Removed if not used
    createFileRoute,
    notFound, // Import notFound
    useRouteContext,
    useRouter,
} from "@tanstack/react-router";
import { set } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/events/$eventId")({
    loader: async ({ params: { eventId }, context: { queryClient } }) => {
        const eventIdNum = Number.parseInt(eventId, 10);
        if (Number.isNaN(eventIdNum)) {
            throw notFound(); // Invalid event ID format
        }
        const event = await queryClient.fetchQuery(eventQueryOptions(eventId));

        if (!event || Object.keys(event).length === 0) {
            throw notFound();
        }

        const venues = await queryClient.ensureQueryData(venuesQueryOptions);
        const approvals = await queryClient.ensureQueryData(
            eventApprovalsQueryOptions(eventIdNum),
        );

        return { event, venues, approvals };
    },
    component: EventDetailsPage,
});

interface EventDetailsLoaderData {
    event: Event;
    venues: Venue[];
    approvals: EventApprovalDTO[];
}

export function EventDetailsPage() {
    const context = useRouteContext({ from: "/app/events" });
    const role = context.authState?.role;
    const currentUser = context.authState;
    const router = useRouter();
    const queryClient = context.queryClient;
    const onBack = () => router.history.back();

    const { event, venues, approvals } = Route.useLoaderData();
    const eventIdNum = event.id;

    const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
    const [approvalRemarks, setApprovalRemarks] = useState("");
    const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const venueMap = new Map(venues.map((venue) => [venue.id, venue.name]));

    const hasUserApproved = approvals.some(
        (appr) =>
            // Compare based on user ID if available and reliable
            (currentUser?.id && appr.userId === Number(currentUser.id)) ||
            // Fallback to comparing names if ID isn't available/reliable in approval DTO
            (!currentUser?.id &&
                appr.signedBy ===
                    `${currentUser?.firstName} ${currentUser?.lastName}`),
    );

    const isOrganizer = currentUser?.id === event.organizer.id;
    const isSuperAdmin = role === "SUPER_ADMIN";

    const canUserApprove =
        currentUser &&
        [
            "SUPER_ADMIN",
            "OPC",
            "MSDO",
            "EQUIPMENT_OWNER",
            "DEPT_HEAD",
            "VP_ADMIN",
            "VPAA",
            "SSD",
            "FAO",
        ].includes(currentUser.role) &&
        !hasUserApproved &&
        event.status === "PENDING";

    const canCancelEvent =
        event.status !== "CANCELED" && event.status !== "COMPLETED";

    const canEditEvent =
        (isOrganizer || isSuperAdmin) && // User must be organizer OR super admin
        event.status !== "CANCELED" && // Event must not be canceled
        event.status !== "COMPLETED"; // Event must not be completed

    const approveMutation = useMutation({
        mutationFn: approveEvent,
        onSuccess: (message) => {
            toast.success(message || "Event approved successfully.");
            queryClient.invalidateQueries({
                queryKey: eventApprovalsQueryOptions(eventIdNum).queryKey,
            });
            queryClient.refetchQueries({
                queryKey: eventApprovalsQueryOptions(eventIdNum).queryKey,
            });
            queryClient.invalidateQueries({
                queryKey: eventQueryOptions(eventIdNum).queryKey,
            });
            queryClient.refetchQueries({
                queryKey: eventQueryOptions(eventIdNum).queryKey,
            });
            queryClient.invalidateQueries({
                queryKey: eventsQueryOptions.queryKey,
            });
            queryClient.invalidateQueries({
                queryKey: getApprovedEventsQuery.queryKey,
            });
            setIsApprovalDialogOpen(false);
            setApprovalRemarks("");
        },
        onError: (error) => {
            toast.error(`Approval failed: ${error.message}`);
        },
    });

    const cancelEventMutation = useMutation({
        mutationFn: cancelEvent,
        onSuccess: (message) => {
            toast.success(message || "Event canceled successfully.");
            // Invalidate event details and list
            queryClient.invalidateQueries({
                queryKey: eventQueryOptions(eventIdNum).queryKey,
            });
            queryClient.invalidateQueries({
                queryKey: eventsQueryOptions.queryKey,
            });
            queryClient.invalidateQueries({
                queryKey: getApprovedEventsQuery.queryKey,
            });
            queryClient.invalidateQueries({
                queryKey: getOwnEventsQueryOptions.queryKey,
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
            eventId: number;
            eventData: Partial<EventDTOPayload>;
            approvedLetter?: File | null;
        }) => {
            const { eventId, eventData, approvedLetter } = variables;
            const eventDetailsKey = eventQueryOptions(
                eventId.toString(),
            ).queryKey;
            const approvedEventsKey = getApprovedEventsQuery.queryKey;
            const ownEventsKey = getOwnEventsQueryOptions.queryKey; // Assuming organizer might see this list

            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: eventDetailsKey });
            await queryClient.cancelQueries({ queryKey: approvedEventsKey });
            await queryClient.cancelQueries({ queryKey: ownEventsKey });

            // Snapshot previous values
            const previousEventDetails =
                queryClient.getQueryData<Event>(eventDetailsKey);
            const previousApprovedEvents =
                queryClient.getQueryData<Event[]>(approvedEventsKey);
            const previousOwnEvents =
                queryClient.getQueryData<Event[]>(ownEventsKey); // Snapshot own events too

            // Optimistically update the event details
            if (previousEventDetails) {
                const optimisticEventDetails: Event = {
                    ...previousEventDetails,
                    eventName:
                        eventData.eventName ?? previousEventDetails.eventName,
                    eventType:
                        eventData.eventType ?? previousEventDetails.eventType,
                    eventVenueId:
                        eventData.eventVenueId ??
                        previousEventDetails.eventVenueId,
                    startTime:
                        eventData.startTime ?? previousEventDetails.startTime, // Keep as string for now
                    endTime: eventData.endTime ?? previousEventDetails.endTime, // Keep as string for now
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
                list: Event[] | undefined,
            ): Event[] | undefined => {
                return list?.map((ev) =>
                    ev.id === eventId
                        ? {
                              ...ev,
                              eventName: eventData.eventName ?? ev.eventName,
                              eventType: eventData.eventType ?? ev.eventType,
                              eventVenueId:
                                  eventData.eventVenueId ?? ev.eventVenueId,
                              startTime: eventData.startTime ?? ev.startTime,
                              endTime: eventData.endTime ?? ev.endTime,
                              // status might change?
                          }
                        : ev,
                );
            };

            queryClient.setQueryData(approvedEventsKey, updateList);
            queryClient.setQueryData(ownEventsKey, updateList); // Update own events list optimistically

            // Return context with snapshots
            return {
                previousEventDetails,
                previousApprovedEvents,
                previousOwnEvents, // Include own events snapshot
            };
        },

        onError: (error, variables, context) => {
            toast.error(`Update failed: ${error.message}`);
            // Rollback on error
            if (context?.previousEventDetails) {
                queryClient.setQueryData(
                    eventQueryOptions(variables.eventId.toString()).queryKey,
                    context.previousEventDetails,
                );
            }
            if (context?.previousApprovedEvents) {
                queryClient.setQueryData(
                    getApprovedEventsQuery.queryKey,
                    context.previousApprovedEvents,
                );
            }
            if (context?.previousOwnEvents) {
                // Rollback own events
                queryClient.setQueryData(
                    getOwnEventsQueryOptions.queryKey,
                    context.previousOwnEvents,
                );
            }
        },

        onSettled: (data, error, variables) => {
            // Always refetch after error or success to ensure consistency
            queryClient.invalidateQueries({
                queryKey: eventQueryOptions(variables.eventId.toString())
                    .queryKey,
            });
            queryClient.invalidateQueries({
                queryKey: getApprovedEventsQuery.queryKey,
            });
            queryClient.invalidateQueries({
                // Invalidate own events too
                queryKey: getOwnEventsQueryOptions.queryKey,
            });
            queryClient.invalidateQueries({
                // Invalidate own events too
                queryKey: eventsQueryOptions.queryKey,
            });
            queryClient.invalidateQueries({
                // Also invalidate approvals in case status changed
                queryKey: eventApprovalsQueryOptions(variables.eventId)
                    .queryKey,
            });
        },

        onSuccess: (message) => {
            // API returns string message on success
            toast.success(message || "Event updated successfully.");
            setIsEditModalOpen(false); // Close the edit modal on success
            // Navigation or other UI updates can happen here if needed
            // Invalidation is handled in onSettled
        },
    });

    // Using cancelEvent for delete action for now as per original code
    const deleteEventMutation = useMutation({
        mutationFn: cancelEvent, // Still using cancelEvent based on original code
        onSuccess: (message) => {
            toast.success(message || "Event deleted successfully."); // Changed message for clarity
            // Invalidate relevant lists
            queryClient.invalidateQueries({
                queryKey: getApprovedEventsQuery.queryKey,
            });
            queryClient.invalidateQueries({
                queryKey: getOwnEventsQueryOptions.queryKey,
            });
            queryClient.invalidateQueries({
                // Invalidate own events too
                queryKey: eventsQueryOptions.queryKey,
            });
            // Remove the specific event query from cache if it exists
            queryClient.removeQueries({
                queryKey: eventQueryOptions(eventIdNum.toString()).queryKey,
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
            eventId: eventIdNum,
            remarks: approvalRemarks,
        });
    };

    const handleCancelClick = () => {
        setIsCancelDialogOpen(true);
    };

    // Handler for confirming the cancellation
    const handleConfirmCancel = () => {
        cancelEventMutation.mutate(eventIdNum);
    };

    const handleDeleteClick = () => {
        setIsDeleteDialogOpen(true);
    };

    const handleConfirmDelete = () => {
        deleteEventMutation.mutate(eventIdNum);
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

    return (
        <div className="flex h-screen bg-background">
            <div className="flex flex-col flex-1 overflow-hidden">
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

                        {(isOrganizer || isSuperAdmin) && (
                            <>
                                {/* Edit Button */}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-1"
                                    onClick={handleEditClick} // Use updated handler
                                    disabled={
                                        !canEditEvent ||
                                        updateEventMutation.isPending
                                    }
                                >
                                    <Edit className="h-4 w-4" />
                                    Edit
                                </Button>
                                {/* More Options Dropdown */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            // Disable dropdown if no actions are available
                                            disabled={
                                                !canCancelEvent && !isSuperAdmin
                                            }
                                        >
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        {/* Cancel Event Item */}
                                        <DropdownMenuItem
                                            className="text-orange-600 focus:text-orange-700 focus:bg-orange-100"
                                            onClick={handleCancelClick}
                                            disabled={
                                                !canCancelEvent ||
                                                cancelEventMutation.isPending
                                            }
                                        >
                                            <XCircle className="mr-2 h-4 w-4" />
                                            Cancel Event
                                        </DropdownMenuItem>
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
                            </>
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
                                                    Event ID
                                                </h3>
                                                <p className="text-sm font-medium">
                                                    {event.id}{" "}
                                                    {/* Display real ID */}
                                                </p>
                                            </div>
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

                                        {/* Location */}
                                        <div>
                                            <h3 className="text-sm font-medium text-muted-foreground">
                                                Location
                                            </h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-sm">
                                                    {/* Look up venue name */}
                                                    {venueMap.get(
                                                        event.eventVenueId,
                                                    ) ?? "Unknown Venue"}
                                                </span>
                                            </div>
                                            {/* Removed hardcoded address */}
                                        </div>

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
                                                    {/* <AvatarImage src={organizerAvatar} /> */}
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
                            <CardHeader>
                                <CardTitle>Approval Status</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {approvals.length > 0 ? (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Approver</TableHead>
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
                                                <TableRow key={approval.id}>
                                                    <TableCell>
                                                        {approval.signedBy}
                                                    </TableCell>
                                                    <TableCell>
                                                        {approval.department}
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
                title="Cancel Event"
                description={`Are you sure you want to permanently cancel the event "${event.eventName}"? This action cannot be undone.`}
                isLoading={deleteEventMutation.isPending}
                confirmText="Yes, Cancel Event"
                confirmVariant="destructive"
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
                />
            )}
        </div>
    );
}
