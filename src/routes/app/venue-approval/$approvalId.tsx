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
import { Separator } from "@/components/ui/separator";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import type { EventApprovalDTO } from "@/lib/types";
import { Link, createFileRoute, useRouter } from "@tanstack/react-router";
import { format } from "date-fns";
import { ArrowLeft, CheckCircle2, Download, FileText, X } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/venue-approval/$approvalId")({
    component: ReservationDetails,
    loader: async ({ params: { approvalId } }) => {
        const reservation = initialReservations.find(
            (r) => r.id.toString() === approvalId,
        );

        if (!reservation) {
            throw new Error("Reservation not found");
        }

        return {
            reservation,
        };
    },
});
import { initialReservations } from "./approval";

function ReservationDetails() {
    // const { approvalId } = Route.useLoaderData();
    const { reservation: initialReservation } = Route.useLoaderData();
    const [reservation, setReservation] = useState(initialReservation);
    const [activeTab, setActiveTab] = useState("details");
    const [activeRemarksTab, setActiveRemarksTab] = useState("OPC");
    const router = useRouter();

    // Dialog states
    const [isApprovalLetterDialogOpen, setIsApprovalLetterDialogOpen] =
        useState(false);
    const [isRemarksDialogOpen, setIsRemarksDialogOpen] = useState(false);
    const [isDisapprovalDialogOpen, setIsDisapprovalDialogOpen] =
        useState(false);
    const [disapprovalNote, setDisapprovalNote] = useState("");

    // Error handling for non-existent reservation
    if (!reservation) {
        return (
            <div className="flex h-screen bg-background">
                <div className="flex flex-col flex-1 items-center justify-center">
                    <h2 className="text-xl font-semibold mb-2">
                        Reservation Not Found
                    </h2>
                    <p className="text-muted-foreground mb-4">
                        The requested reservation could not be found.
                    </p>
                    <Button
                        onClick={() =>
                            router.navigate({
                                to: "/app/venue-approval/approval",
                            })
                        }
                    >
                        Back to Approvals
                    </Button>
                </div>
            </div>
        );
    }
    // Handle reservation operations
    const handleApproveReservation = () => {
        // In a real app, you would call an API to update the reservation status
        const updatedReservation = {
            ...reservation,
            status: "approved",
            approvers: reservation.approvers.map(
                (approver: {
                    name: string;
                    idNumber: string;
                    department: string;
                    role: string;
                    dateSigned: string | null;
                    status: string;
                }) => {
                    if (approver.status === "pending") {
                        return {
                            ...approver,
                            status: "approved",
                            dateSigned: new Date().toISOString(),
                        };
                    }
                    return approver;
                },
            ),
        };

        setReservation(updatedReservation);
        // In a real app, you would redirect to a success page or show a notification
    };

    const handleDisapproveReservation = () => {
        if (!disapprovalNote.trim()) return;

        // In a real app, you would call an API to update the reservation status
        const updatedReservation = {
            ...reservation,
            status: "disapproved",
            disapprovalNote: disapprovalNote,
            approvers: reservation.approvers.map(
                (approver: {
                    name: string;
                    idNumber: string;
                    department: string;
                    role: string;
                    dateSigned: string | null;
                    status: string;
                }) => {
                    if (approver.status === "pending") {
                        return {
                            ...approver,
                            status: "disapproved",
                            dateSigned: new Date().toISOString(),
                        };
                    }
                    return approver;
                },
            ),
        };

        setReservation(updatedReservation);
        setIsDisapprovalDialogOpen(false);
        setDisapprovalNote("");
        // In a real app, you would redirect to a success page or show a notification
    };

    const handleNavigateToVenue = (venueId: number) => {
        // Navigate to venue details page
        router.navigate({ to: `/app/venues/${venueId}` });
    };

    // Status badge styling
    const getStatusBadge = (status: string) => {
        switch (status) {
            case "pending":
                return (
                    <Badge className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20">
                        Pending
                    </Badge>
                );
            case "approved":
                return (
                    <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
                        Approved
                    </Badge>
                );
            case "disapproved":
                return (
                    <Badge className="bg-red-500/10 text-red-500 hover:bg-red-500/20">
                        Disapproved
                    </Badge>
                );
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getApproverStatusBadge = (status: string) => {
        switch (status) {
            case "approved":
                return (
                    <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
                        Approved
                    </Badge>
                );
            case "disapproved":
                return (
                    <Badge className="bg-red-500/10 text-red-500 hover:bg-red-500/20">
                        Disapproved
                    </Badge>
                );
            case "pending":
                return (
                    <Badge className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20">
                        Pending
                    </Badge>
                );
            case "not_required":
                return (
                    <Badge className="bg-gray-500/10 text-gray-500 hover:bg-gray-500/20">
                        Not Required
                    </Badge>
                );
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    // Format date and time
    const formatDate = (dateString: string) => {
        return format(new Date(dateString), "MMM d, yyyy");
    };

    const formatDateTime = (dateString: string | null) => {
        if (!dateString) return "—";
        return format(new Date(dateString), "MMM d, yyyy h:mm a");
    };

    const formatTime = (timeString: string) => {
        const [hours, minutes] = timeString.split(":");
        const date = new Date();
        date.setHours(Number.parseInt(hours, 10));
        date.setMinutes(Number.parseInt(minutes, 10));
        return format(date, "h:mm a");
    };

    // Calculate duration
    const calculateDuration = (startTime: string, endTime: string) => {
        const start = new Date(`2000-01-01T${startTime}:00`);
        const end = new Date(`2000-01-01T${endTime}:00`);
        const diffMs = end.getTime() - start.getTime();
        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        return `${diffHrs} hour${diffHrs !== 1 ? "s" : ""} ${diffMins > 0 ? `${diffMins} minute${diffMins !== 1 ? "s" : ""}` : ""}`;
    };

    return (
        <div className="bg-background">
            <div className="flex flex-col flex-1 overflow-hidden">
                <header className="flex items-center justify-between border-b px-6 py-4 sticky top-0 bg-background z-10">
                    <div className="flex items-center gap-4">
                        <Link
                            from={Route.fullPath}
                            to="/app/venue-approval/approval"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                        <h1 className="text-xl font-semibold h-8">
                            Reservation Details
                        </h1>
                        {getStatusBadge(reservation.status)}
                    </div>

                    {reservation.status === "pending" && (
                        <div className="flex gap-2">
                            <Button
                                className="gap-1"
                                size="sm"
                                onClick={handleApproveReservation}
                            >
                                <CheckCircle2 className="h-4 w-4" />
                                Approve
                            </Button>
                            <Button
                                variant="destructive"
                                size="sm"
                                className="gap-1"
                                onClick={() => setIsDisapprovalDialogOpen(true)}
                            >
                                <X className="h-4 w-4" />
                                Disapprove
                            </Button>
                        </div>
                    )}
                </header>

                <div className="p-6 space-y-6 overflow-auto">
                    {/* Event and Requester Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Event Information</CardTitle>
                            </CardHeader>
                            {/* Event Information Content - Same as before */}
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <h3 className="text-sm font-medium text-muted-foreground">
                                            Event Name
                                        </h3>
                                        <p className="text-base">
                                            {reservation.eventName}
                                        </p>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-medium text-muted-foreground">
                                            Department
                                        </h3>
                                        <p className="text-base">
                                            {reservation.department}
                                        </p>
                                    </div>
                                </div>

                                <Separator />

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <h3 className="text-sm font-medium text-muted-foreground">
                                            Date
                                        </h3>
                                        <p className="text-base">
                                            {formatDate(reservation.eventDate)}
                                        </p>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-medium text-muted-foreground">
                                            Time
                                        </h3>
                                        <p className="text-base">
                                            {formatTime(reservation.startTime)}{" "}
                                            - {formatTime(reservation.endTime)}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <h3 className="text-sm font-medium text-muted-foreground">
                                            Duration
                                        </h3>
                                        <p className="text-base">
                                            {calculateDuration(
                                                reservation.startTime,
                                                reservation.endTime,
                                            )}
                                        </p>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-medium text-muted-foreground">
                                            Venue
                                        </h3>
                                        <Button
                                            variant="link"
                                            className="p-0 h-auto text-base"
                                            onClick={() =>
                                                handleNavigateToVenue(
                                                    reservation.venueId,
                                                )
                                            }
                                        >
                                            {reservation.venue}
                                        </Button>
                                    </div>
                                </div>

                                <Separator />

                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground">
                                        Approval Letter
                                    </h3>
                                    <div className="mt-2">
                                        <Button
                                            variant="outline"
                                            className="gap-1"
                                            onClick={() =>
                                                setIsApprovalLetterDialogOpen(
                                                    true,
                                                )
                                            }
                                        >
                                            <FileText className="h-4 w-4" />
                                            View Approval Letter
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Requester Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <h3 className="text-sm font-medium text-muted-foreground">
                                            Name
                                        </h3>
                                        <p className="text-base">
                                            {reservation.userName}
                                        </p>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-medium text-muted-foreground">
                                            Department
                                        </h3>
                                        <p className="text-base">
                                            {reservation.department}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <h3 className="text-sm font-medium text-muted-foreground">
                                            Contact Number
                                        </h3>
                                        <p className="text-base">
                                            {reservation.contactNumber}
                                        </p>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-medium text-muted-foreground">
                                            Submitted On
                                        </h3>
                                        <p className="text-base">
                                            {formatDateTime(
                                                reservation.createdAt,
                                            )}
                                        </p>
                                    </div>
                                </div>

                                <Separator />

                                {reservation.status === "disapproved" && (
                                    <div>
                                        <h3 className="text-sm font-medium text-muted-foreground">
                                            Disapproval Note
                                        </h3>
                                        <div className="mt-2 p-3 rounded-md border bg-destructive/2 border-destructive/20 text-destructive text-sm">
                                            {reservation.disapprovalNote}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Recommending Approval Status</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Approver</TableHead>
                                        <TableHead>Department/Office</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Date Signed</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {reservation.approvers.map(
                                        (
                                            approver: {
                                                name: string;
                                                idNumber: string;
                                                department: string;
                                                role: string;
                                                dateSigned: string | null;
                                                status: string;
                                            },
                                            index: number,
                                        ) => (
                                            <TableRow key={approver.idNumber}>
                                                {" "}
                                                {/* Use idNumber as key */}
                                                <TableCell>
                                                    {approver.name}
                                                </TableCell>
                                                <TableCell>
                                                    {approver.department}
                                                </TableCell>
                                                <TableCell>
                                                    {approver.role}
                                                </TableCell>
                                                <TableCell>
                                                    {approver.dateSigned
                                                        ? formatDateTime(
                                                              approver.dateSigned,
                                                          )
                                                        : "—"}
                                                </TableCell>
                                                <TableCell>
                                                    {getApproverStatusBadge(
                                                        approver.status,
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ),
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Remarks from Approvers</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {Object.entries(reservation.remarks).map(
                                    ([key, value]) => (
                                        <div key={key}>
                                            <h3 className="font-medium mb-2">
                                                {key}
                                            </h3>
                                            <div className="p-4 rounded-md bg-muted">
                                                {value ? (
                                                    <p className="text-base">
                                                        {value}
                                                    </p>
                                                ) : (
                                                    <p className="text-base text-muted-foreground italic">
                                                        No remarks provided
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ),
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Approval Letter Dialog */}
            <Dialog
                open={isApprovalLetterDialogOpen}
                onOpenChange={setIsApprovalLetterDialogOpen}
            >
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Approval Letter</DialogTitle>
                        <DialogDescription>
                            Event: {reservation.eventName}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-center">
                        <img
                            src={
                                reservation.approvalLetter || "/placeholder.svg"
                            }
                            alt="Approval Letter"
                            className="max-h-[70vh] object-contain border rounded-md"
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsApprovalLetterDialogOpen(false)}
                        >
                            Close
                        </Button>
                        <Button>
                            <Download className="mr-2 h-4 w-4" />
                            Download
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Disapproval Dialog */}
            <Dialog
                open={isDisapprovalDialogOpen}
                onOpenChange={setIsDisapprovalDialogOpen}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Disapprove Reservation</DialogTitle>
                        <DialogDescription>
                            Please provide a reason for disapproval. This note
                            will be sent to the requester.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <h3 className="text-sm font-medium">
                                Event: {reservation.eventName}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                Venue: {reservation.venue} | Date:{" "}
                                {formatDate(reservation.eventDate)}
                            </p>
                        </div>
                        <Textarea
                            placeholder="Enter reason for disapproval..."
                            value={disapprovalNote}
                            onChange={(e) => setDisapprovalNote(e.target.value)}
                            rows={5}
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsDisapprovalDialogOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDisapproveReservation}
                            disabled={!disapprovalNote.trim()}
                        >
                            Confirm Disapproval
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
