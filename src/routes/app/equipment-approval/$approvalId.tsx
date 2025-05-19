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
} from "@/components/ui/dialog";
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
import {
    equipmentReservationApprovalsQueryOptions,
    equipmentReservationByIdQueryOptions,
    useApproveEquipmentReservationMutation,
    useCurrentUser, // To check current user's role
    useRejectEquipmentReservationMutation,
} from "@/lib/query";
import { formatDateTime, formatRole, getStatusBadgeClass } from "@/lib/utils";
import { useSuspenseQueries } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, FileText, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/equipment-approval/$approvalId")({
    component: EquipmentReservationDetails,
    // Loader now uses TanStack Query's prefetching/suspense capabilities
    loader: async ({ params: { approvalId }, context: { queryClient } }) => {
        // Ensure data is fetched or being fetched
        await queryClient.ensureQueryData(
            equipmentReservationByIdQueryOptions(approvalId),
        );
        await queryClient.ensureQueryData(
            equipmentReservationApprovalsQueryOptions(approvalId),
        );
    },
});

export function EquipmentReservationDetails() {
    const router = useRouter();
    const onBack = () => router.history.back();

    const { approvalId } = Route.useParams();
    const reservationId = approvalId;
    const { data: currentUser } = useCurrentUser(); // Get current user

    // Fetch data using TanStack Query
    const [{ data: reservation }, { data: approvals }] = useSuspenseQueries({
        queries: [
            equipmentReservationByIdQueryOptions(reservationId),
            equipmentReservationApprovalsQueryOptions(reservationId),
        ],
    });

    // Dialog states
    const [isRejectionDialogOpen, setIsRejectionDialogOpen] = useState(false);
    const [rejectionRemarks, setRejectionRemarks] = useState("");

    // Mutations
    const approveMutation = useApproveEquipmentReservationMutation();
    const rejectMutation = useRejectEquipmentReservationMutation();

    // Handle reservation operations
    const handleApproveReservation = () => {
        // Remarks can be added optionally for approval if needed, but API takes empty string
        approveMutation.mutate(
            { reservationPublicId: reservation.publicId, remarks: "" },
            {
                onSuccess: () => {
                    toast.success("Reservation approved.");
                },
                onError: () => {
                    toast.error("Failed to approve reservation.");
                },
            },
        );
    };

    const handleRejectReservation = () => {
        if (!rejectionRemarks.trim()) {
            toast.warning("Please provide a reason for rejection.");
            return;
        }

        rejectMutation.mutate(
            {
                reservationPublicId: reservation.publicId,
                remarks: rejectionRemarks,
            },
            {
                onSuccess: () => {
                    toast.success("Reservation rejected.");
                    setIsRejectionDialogOpen(false);
                    setRejectionRemarks("");
                    // No need to manually update state
                },
                onError: () => {
                    toast.error("Failed to reject reservation.");
                },
            },
        );
    };

    // Check if the current user is the designated equipment owner for *this* equipment
    // Note: Backend enforces this, but frontend check improves UX
    const isCurrentUserEquipmentOwner = currentUser?.role === "EQUIPMENT_OWNER";
    // We don't have the equipment owner ID directly on the reservation DTO
    // The backend service logic handles checking if the *acting* user is the owner
    // So, for the UI, we just check if the user *has* the EQUIPMENT_OWNER role.

    const canApproveOrReject =
        isCurrentUserEquipmentOwner && reservation.status === "PENDING";

    return (
        <div className="bg-background">
            <div className="flex flex-col flex-1 overflow-hidden">
                <header className="flex items-center justify-between border-b px-6 py-3.5 sticky top-0 bg-background z-10 h-16">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onBack()}
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <h1 className="text-xl font-semibold truncate">
                            Equipment Reservation: {reservation.equipment.name}
                        </h1>
                        <Badge
                            className={getStatusBadgeClass(reservation.status)}
                        >
                            {reservation.status}
                        </Badge>
                    </div>

                    {/* Show Approve/Reject only if user is owner and status is PENDING */}
                    {canApproveOrReject && (
                        <div className="flex gap-2">
                            <Button
                                className="gap-1"
                                onClick={handleApproveReservation}
                                disabled={
                                    approveMutation.isPending ||
                                    rejectMutation.isPending
                                }
                            >
                                <CheckCircle2 className="h-4 w-4" />
                                Approve
                            </Button>
                            <Button
                                variant="outline"
                                className="gap-1 text-red-500 border-red-200 hover:bg-red-50"
                                onClick={() => setIsRejectionDialogOpen(true)}
                                disabled={
                                    approveMutation.isPending ||
                                    rejectMutation.isPending
                                }
                            >
                                <X className="h-4 w-4" />
                                Reject
                            </Button>
                        </div>
                    )}
                </header>

                <ScrollArea className="flex-1">
                    <div className="p-6 space-y-8">
                        {/* Reservation Details Section */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Reservation Details</CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4 text-sm">
                                <div>
                                    <h3 className="font-medium text-muted-foreground">
                                        Event
                                    </h3>
                                    <p>{reservation.event.eventName}</p>
                                </div>
                                <div>
                                    <h3 className="font-medium text-muted-foreground">
                                        Equipment
                                    </h3>
                                    <p>{reservation.equipment.name}</p>
                                </div>
                                <div>
                                    <h3 className="font-medium text-muted-foreground">
                                        Quantity
                                    </h3>
                                    <p>{reservation.quantity}</p>
                                </div>
                                <div>
                                    <h3 className="font-medium text-muted-foreground">
                                        Start Time
                                    </h3>
                                    <p>
                                        {formatDateTime(reservation.startTime)}
                                    </p>
                                </div>
                                <div>
                                    <h3 className="font-medium text-muted-foreground">
                                        End Time
                                    </h3>
                                    <p>{formatDateTime(reservation.endTime)}</p>
                                </div>
                                <div>
                                    <h3 className="font-medium text-muted-foreground">
                                        Status
                                    </h3>
                                    <Badge
                                        className={getStatusBadgeClass(
                                            reservation.status,
                                        )}
                                    >
                                        {reservation.status}
                                    </Badge>
                                </div>
                                <div>
                                    <h3 className="font-medium text-muted-foreground">
                                        Requester
                                    </h3>
                                    <p>
                                        {reservation.requestingUser?.firstName}{" "}
                                        {reservation.requestingUser?.lastName}
                                    </p>
                                </div>
                                <div>
                                    <h3 className="font-medium text-muted-foreground">
                                        Department
                                    </h3>
                                    <p>{reservation.department.name}</p>
                                </div>
                                <div>
                                    <h3 className="font-medium text-muted-foreground">
                                        Submitted On
                                    </h3>
                                    <p>
                                        {formatDateTime(reservation.createdAt)}
                                    </p>
                                </div>
                                {reservation.event.approvedLetterUrl && (
                                    <div className="md:col-span-3">
                                        <h3 className="font-medium text-muted-foreground">
                                            Reservation Letter
                                        </h3>
                                        <Button
                                            variant="link"
                                            asChild
                                            className="p-0 h-auto"
                                        >
                                            <a
                                                href={
                                                    reservation.event
                                                        .approvedLetterUrl
                                                }
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1"
                                            >
                                                <FileText className="h-4 w-4" />
                                                View Letter
                                            </a>
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Approval Status Section */}
                        <div>
                            <h2 className="text-xl font-semibold mb-4">
                                Approval Status
                            </h2>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Approval History</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {approvals && approvals.length > 0 ? (
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>
                                                        Approver
                                                    </TableHead>
                                                    <TableHead>Role</TableHead>
                                                    <TableHead>
                                                        Status
                                                    </TableHead>
                                                    <TableHead>Date</TableHead>
                                                    <TableHead>
                                                        Remarks
                                                    </TableHead>
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
                                                                    ?.firstName
                                                            }
                                                            {
                                                                approval
                                                                    .signedByUser
                                                                    ?.lastName
                                                            }
                                                        </TableCell>
                                                        <TableCell>
                                                            {formatRole(
                                                                approval.userRole,
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge
                                                                className={getStatusBadgeClass(
                                                                    approval.status,
                                                                )}
                                                            >
                                                                {
                                                                    approval.status
                                                                }
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            {formatDateTime(
                                                                approval.dateSigned,
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
                                        <p className="text-muted-foreground text-center py-4">
                                            No approval history yet.
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </ScrollArea>
            </div>

            {/* Rejection Dialog */}
            <Dialog
                open={isRejectionDialogOpen}
                onOpenChange={setIsRejectionDialogOpen}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Reservation</DialogTitle>
                        <DialogDescription>
                            Please provide a reason for rejection. This note
                            will be recorded.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <h3 className="text-sm font-medium">
                                Equipment: {reservation.equipment.name} (Qty:{" "}
                                {reservation.quantity})
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                Event: {reservation.event.eventName} |
                                Requester:{" "}
                                {reservation.requestingUser?.firstName}{" "}
                                {reservation.requestingUser?.lastName}
                            </p>
                        </div>
                        <Textarea
                            placeholder="Enter reason for rejection..."
                            value={rejectionRemarks}
                            onChange={(e) =>
                                setRejectionRemarks(e.target.value)
                            }
                            rows={5}
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
                            onClick={handleRejectReservation}
                            disabled={
                                !rejectionRemarks.trim() ||
                                rejectMutation.isPending
                            }
                        >
                            {rejectMutation.isPending
                                ? "Rejecting..."
                                : "Confirm Rejection"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
