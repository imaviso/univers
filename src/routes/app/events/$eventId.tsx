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
import { approveEvent, cancelEvent, updateEvent } from "@/lib/api";
import {
    eventApprovalsQueryOptions,
    eventQueryOptions,
    eventsQueryOptions,
    venuesQueryOptions,
} from "@/lib/query"; // Import query options
import type { Event, EventApprovalDTO, Venue } from "@/lib/types"; // Import Event type
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
import { useState } from "react";
import { toast } from "sonner";
import { DeleteConfirmDialog } from "@/components/user-management/deleteConfirmDialog";
import { EditEventModal } from "@/components/events/editEventModal";
import { set } from "date-fns";

export const Route = createFileRoute("/app/events/$eventId")({
    loader: async ({ params: { eventId }, context: { queryClient } }) => {
        const eventIdNum = Number.parseInt(eventId, 10);
        if (Number.isNaN(eventIdNum)) {
            throw notFound(); // Invalid event ID format
        }
        const event = await queryClient.ensureQueryData(
            eventQueryOptions(eventId),
        );

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

    const isOrganizer = currentUser?.id === String(event.organizer.id); // Compare IDs as strings or numbers consistently
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
    // Determine if the event can be edited (similar logic, maybe stricter)
    const canEditEvent =
        event.status !== "CANCELED" && event.status !== "COMPLETED";

    const approveMutation = useMutation({
        mutationFn: approveEvent,
        onSuccess: (message) => {
            toast.success(message || "Event approved successfully.");
            queryClient.invalidateQueries({
                queryKey: eventApprovalsQueryOptions(eventIdNum).queryKey,
            });
            queryClient.invalidateQueries({
                queryKey: eventQueryOptions(eventIdNum).queryKey,
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
            setIsCancelDialogOpen(false); // Close the dialog
        },
        onError: (error) => {
            toast.error(`Cancellation failed: ${error.message}`);
        },
    });

    // Mutation for updating the event (Setup, UI not implemented here)
    const updateEventMutation = useMutation({
        mutationFn: updateEvent,
        onSuccess: (message) => {
            toast.success(message || "Event updated successfully.");
            // Invalidate event details and list
            queryClient.invalidateQueries({
                queryKey: eventQueryOptions(eventIdNum).queryKey,
            });
            queryClient.invalidateQueries({
                queryKey: eventsQueryOptions.queryKey,
            });
            // TODO: Close edit modal/navigate back if applicable
        },
        onError: (error) => {
            toast.error(`Update failed: ${error.message}`);
        },
    });

    const deleteEventMutation = useMutation({
        mutationFn: cancelEvent,
        onSuccess: (message) => {
            toast.success(message || "Event deleted successfully.");
            // Invalidate the list query
            queryClient.invalidateQueries({
                queryKey: eventsQueryOptions.queryKey,
            });
            setIsDeleteDialogOpen(false); // Close the dialog
            // Navigate back to the events list after successful deletion
            router.navigate({ to: "/app/events" });
        },
        onError: (error) => {
            toast.error(`Deletion failed: ${error.message}`);
            // Optionally close dialog on error too, or keep it open for retry
            // setIsDeleteDialogOpen(false);
        },
    });

    const handleApproveClick = () => {
        if (!currentUser) return;
        approveMutation.mutate({
            eventId: eventIdNum,
            userId: Number.parseInt(currentUser.id, 10),
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
    let approvedLetterUrl: string | null = null;
    if (event.approvedLetterPath) {
        // Example: Extract filename if path is like '/path/to/static/dir/filename.ext'
        const filename = event.approvedLetterPath.split("/").pop();
        if (filename) {
            // Example: Assuming files are served under '/api/files/approved-letters/'
            approvedLetterUrl = `/api/files/approved-letters/${filename}`;
            // If served directly from root static path:
            // approvedLetterUrl = `/approved-letters/${filename}`;
        } else {
            console.error(
                "Could not extract filename from approvedLetterPath:",
                event.approvedLetterPath,
            );
        }
    }

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
                                        {/* <DropdownMenuItem
                                            className="text-orange-600 focus:text-orange-700 focus:bg-orange-100"
                                            onClick={handleCancelClick}
                                            disabled={
                                                !canCancelEvent ||
                                                cancelEventMutation.isPending
                                            }
                                        >
                                            <XCircle className="mr-2 h-4 w-4" />
                                            Cancel Event
                                        </DropdownMenuItem> */}
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
                                                Cancel Event
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
                                        {event.approvedLetterPath &&
                                            approvedLetterUrl && (
                                                <div>
                                                    <h3 className="text-sm font-medium text-muted-foreground">
                                                        Approved Letter
                                                    </h3>
                                                    <Dialog>
                                                        <DialogTrigger asChild>
                                                            <div className="flex items-center gap-2 mt-1 cursor-pointer text-blue-600 hover:underline">
                                                                <Paperclip className="h-4 w-4" />
                                                                <span className="text-sm">
                                                                    View
                                                                    Attached
                                                                    Letter
                                                                </span>
                                                            </div>
                                                        </DialogTrigger>
                                                        <DialogContent className="sm:max-w-[600px] md:max-w-[800px] lg:max-w-[1000px]">
                                                            {" "}
                                                            {/* Adjust size */}
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
                                                                {" "}
                                                                {/* Limit height and allow scroll */}
                                                                {/* Display image - adjust if it could be PDF */}
                                                                <img
                                                                    src={
                                                                        approvedLetterUrl
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
            {role === "SUPER_ADMIN" && (
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
