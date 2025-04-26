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
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { format } from "date-fns";
import { ArrowLeft, CheckCircle2, X } from "lucide-react";
import { useState } from "react";
import { initialReservations } from "../equipment-approval/approval";
type EquipmentItem = {
  id: string;
  name: string;
  owner: string; // Changed back to string
  quantity: number;
};

type Approver = {
  name: string;
  department: string;
  role: string;
  dateSigned: string | null; // Keep as string | null
  status: string;
};

// Define ReservationType explicitly
type ReservationType = {
  id: number;
  eventName: string;
  venue: string;
  venueId: number;
  department: string;
  contactNumber: string;
  userName: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  status: string;
  createdAt: string;
  equipment: EquipmentItem[];
  remarks: {
    MSDO: string;
    OPC: string;
  };
  approvers: Approver[];
  purpose?: string; // Keep optional
  disapprovalNote?: string; // Keep optional
};
export const Route = createFileRoute("/app/equipment-approval/$approvalId")({
    component: EquipmentReservationDetails,
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

export function EquipmentReservationDetails() {
    const navigate = useNavigate();
    const { reservation: initialReservation } = Route.useLoaderData();
    const [reservation, setReservation] = useState<ReservationType>(initialReservation);
    const [activeTab, setActiveTab] = useState("details");
    const [activeRemarksTab, setActiveRemarksTab] = useState("MSDO");

    // Dialog states
    const [isRemarksDialogOpen, setIsRemarksDialogOpen] = useState(false);
    const [isDisapprovalDialogOpen, setIsDisapprovalDialogOpen] =
        useState(false);
    const [disapprovalNote, setDisapprovalNote] = useState("");
    const [remarksText, setRemarksText] = useState("");
    const [currentApproverRole, setCurrentApproverRole] = useState("");

    if (!reservation) {
        return (
            <div className="flex h-screen bg-background">
                <div className="flex flex-col flex-1 items-center justify-center">
                    <p>Loading reservation details...</p>
                </div>
            </div>
        );
    }

    // Handle reservation operations
    const handleApproveReservation = (role: string) => {
        // In a real app, you would call an API to update the reservation status
        const updatedReservation = {
            ...reservation,
            approvers: reservation.approvers.map((approver: Approver) => {
                if (
                    approver.role.includes(role) &&
                    approver.status === "pending"
                ) {
                    return {
                        ...approver,
                        status: "approved",
                        dateSigned: new Date().toISOString(),
                    };
                }
                return approver;
            }),
        };

        // Check if all approvers have approved
        const allApproved = updatedReservation.approvers.every(
            (approver: Approver) => approver.status === "approved",
        );
        if (allApproved) {
            updatedReservation.status = "approved";
        }

        setReservation(updatedReservation);
        // In a real app, you would redirect to a success page or show a notification
    };

    const handleAddRemarks = (role: string) => {
        setCurrentApproverRole(role);
        setRemarksText(reservation.remarks[role as keyof typeof reservation.remarks] || ""); // Use type assertion for dynamic key
        setIsRemarksDialogOpen(true);
    };

    const handleSaveRemarks = () => {
        // In a real app, you would call an API to update the remarks
        const updatedReservation = {
            ...reservation,
            remarks: {
                ...reservation.remarks,
                [currentApproverRole]: remarksText,
            },
        };

        setReservation(updatedReservation);
        setIsRemarksDialogOpen(false);
    };

    const handleDisapproveReservation = () => {
        if (!disapprovalNote.trim()) return;

        // In a real app, you would call an API to update the reservation status
        const updatedReservation = {
            ...reservation,
            status: "disapproved",
            disapprovalNote: disapprovalNote,
            approvers: reservation.approvers.map((approver: Approver) => {
                if (approver.status === "pending") {
                    return {
                        ...approver,
                        status: "disapproved",
                        dateSigned: new Date().toISOString(),
                    };
                }
                return approver;
            }),
        };

        setReservation(updatedReservation);
        setIsDisapprovalDialogOpen(false);
        setDisapprovalNote("");
        // In a real app, you would redirect to a success page or show a notification
    };

    const handleNavigateToVenue = (venueId: number) => {
        // Navigate to venue details page
        navigate({ to: `/app/venues/${venueId}` });
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

    // Check if current user is an approver with pending status
    const isPendingMSDOApprover = reservation.approvers.some(
        (approver: Approver) =>
            approver.role.includes("MSDO") && approver.status === "pending",
    );

    const isPendingOPCApprover = reservation.approvers.some(
        (approver: Approver) =>
            approver.role.includes("OPC") && approver.status === "pending",
    );

    return (
        <div className="bg-background">
            <div className="flex flex-col flex-1 overflow-hidden">
                <header className="flex items-center justify-between border-b px-6 py-3.5 sticky top-0 bg-background z-10">
                    <div className="flex items-center gap-4">
                        <Link
                            from={Route.fullPath}
                            to="/app/equipment-approval/approval"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                        <h1 className="text-xl font-semibold">
                            Equipment Reservation Details
                        </h1>
                        {getStatusBadge(reservation.status)}
                    </div>

                    {reservation.status === "pending" && (
                        <div className="flex gap-2">
                            {isPendingMSDOApprover && (
                                <Button
                                    className="gap-1"
                                    onClick={() =>
                                        handleApproveReservation("MSDO")
                                    }
                                >
                                    <CheckCircle2 className="h-4 w-4" />
                                    Approve MSDO Equipment
                                </Button>
                            )}

                            {isPendingOPCApprover && (
                                <Button
                                    className="gap-1"
                                    onClick={() =>
                                        handleApproveReservation("OPC")
                                    }
                                >
                                    <CheckCircle2 className="h-4 w-4" />
                                    Approve OPC Equipment
                                </Button>
                            )}

                            {(isPendingMSDOApprover ||
                                isPendingOPCApprover) && (
                                <Button
                                    variant="outline"
                                    className="gap-1 text-red-500 border-red-200 hover:bg-red-50"
                                    onClick={() =>
                                        setIsDisapprovalDialogOpen(true)
                                    }
                                >
                                    <X className="h-4 w-4" />
                                    Disapprove Reservation
                                </Button>
                            )}
                        </div>
                    )}
                </header>

                <ScrollArea className="flex-1">
                    <div className="p-6 space-y-8">
                        {/* Event and Requester Information Section */}
                        <div>
                            <h2 className="text-xl font-semibold mb-4">
                                Reservation Information
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Event Information</CardTitle>
                                    </CardHeader>
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
                                                    {formatDate(
                                                        reservation.eventDate,
                                                    )}
                                                </p>
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-medium text-muted-foreground">
                                                    Time
                                                </h3>
                                                <p className="text-base">
                                                    {formatTime(
                                                        reservation.startTime,
                                                    )}{" "}
                                                    -{" "}
                                                    {formatTime(
                                                        reservation.endTime,
                                                    )}
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
                                                Purpose
                                            </h3>
                                            <p className="text-base mt-1">
                                                {reservation.purpose}
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>
                                            Requester Information
                                        </CardTitle>
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

                                        {reservation.status ===
                                            "disapproved" && (
                                            <div>
                                                <h3 className="text-sm font-medium text-muted-foreground">
                                                    Disapproval Note
                                                </h3>
                                                <div className="mt-2 p-3 rounded-md bg-red-50 border border-red-200 text-sm">
                                                    {
                                                        reservation.disapprovalNote
                                                    }
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </div>

                        {/* Equipment Section */}
                        <div>
                            <h2 className="text-xl font-semibold mb-4">
                                Requested Equipment
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between">
                                        <CardTitle>MSDO Equipment</CardTitle>
                                        {isPendingMSDOApprover && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    handleAddRemarks("MSDO")
                                                }
                                            >
                                                Add Remarks
                                            </Button>
                                        )}
                                    </CardHeader>
                                    <CardContent>
                                        <Table className="min-h-40">
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>
                                                        Equipment
                                                    </TableHead>
                                                    <TableHead>
                                                        Quantity
                                                    </TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {reservation.equipment
                                                    .filter(
                                                        (item: EquipmentItem) =>
                                                            item.owner ===
                                                            "MSDO",
                                                    )
                                                    .map(
                                                        (
                                                            item: EquipmentItem,
                                                            index: number,
                                                        ) => (
                                                            <TableRow
                                                                key={item.id}
                                                            >
                                                                <TableCell>
                                                                    {item.name}
                                                                </TableCell>
                                                                <TableCell>
                                                                    {
                                                                        item.quantity
                                                                    }
                                                                </TableCell>
                                                            </TableRow>
                                                        ),
                                                    )}
                                                {reservation.equipment.filter(
                                                    (item: EquipmentItem) =>
                                                        item.owner === "MSDO",
                                                ).length === 0 && (
                                                    <TableRow>
                                                        <TableCell
                                                            colSpan={2}
                                                            className="text-center py-4 text-muted-foreground"
                                                        >
                                                            No MSDO equipment
                                                            requested
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>

                                        {isPendingMSDOApprover && (
                                            <div className="mt-4">
                                                <Button
                                                    className="w-full"
                                                    onClick={() =>
                                                        handleApproveReservation(
                                                            "MSDO",
                                                        )
                                                    }
                                                >
                                                    Approve MSDO Equipment
                                                </Button>
                                            </div>
                                        )}

                                        {/* MSDO Remarks */}
                                        <div className="mt-4">
                                            <h3 className="text-sm font-medium mb-2">
                                                MSDO Remarks
                                            </h3>
                                            <div className="p-3 rounded-md bg-muted">
                                                {reservation.remarks.MSDO ? (
                                                    <p className="text-sm">
                                                        {
                                                            reservation.remarks
                                                                .MSDO
                                                        }
                                                    </p>
                                                ) : (
                                                    <p className="text-sm text-muted-foreground italic">
                                                        No remarks provided
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between">
                                        <CardTitle>OPC Equipment</CardTitle>
                                        {isPendingOPCApprover && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    handleAddRemarks("OPC")
                                                }
                                            >
                                                Add Remarks
                                            </Button>
                                        )}
                                    </CardHeader>
                                    <CardContent>
                                        <Table className="min-h-40">
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>
                                                        Equipment
                                                    </TableHead>
                                                    <TableHead>
                                                        Quantity
                                                    </TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {reservation.equipment
                                                    .filter(
                                                        (item: EquipmentItem) =>
                                                            item.owner ===
                                                            "OPC",
                                                    )
                                                    .map(
                                                        (
                                                            item: EquipmentItem,
                                                            index: number,
                                                        ) => (
                                                            <TableRow
                                                                key={item.id}
                                                            >
                                                                <TableCell>
                                                                    {item.name}
                                                                </TableCell>
                                                                <TableCell>
                                                                    {
                                                                        item.quantity
                                                                    }
                                                                </TableCell>
                                                            </TableRow>
                                                        ),
                                                    )}
                                                {reservation.equipment.filter(
                                                    (item: EquipmentItem) =>
                                                        item.owner === "OPC",
                                                ).length === 0 && (
                                                    <TableRow>
                                                        <TableCell
                                                            colSpan={2}
                                                            className="text-center py-4 text-muted-foreground"
                                                        >
                                                            No OPC equipment
                                                            requested
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>

                                        {isPendingOPCApprover && (
                                            <div className="mt-4">
                                                <Button
                                                    className="w-full"
                                                    onClick={() =>
                                                        handleApproveReservation(
                                                            "OPC",
                                                        )
                                                    }
                                                >
                                                    Approve OPC Equipment
                                                </Button>
                                            </div>
                                        )}

                                        {/* OPC Remarks */}
                                        <div className="mt-4">
                                            <h3 className="text-sm font-medium mb-2">
                                                OPC Remarks
                                            </h3>
                                            <div className="p-3 rounded-md bg-muted">
                                                {reservation.remarks.OPC ? (
                                                    <p className="text-sm">
                                                        {
                                                            reservation.remarks
                                                                .OPC
                                                        }
                                                    </p>
                                                ) : (
                                                    <p className="text-sm text-muted-foreground italic">
                                                        No remarks provided
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>

                        {/* Approval Status Section */}
                        <div>
                            <h2 className="text-xl font-semibold mb-4">
                                Approval Status
                            </h2>
                            <Card>
                                <CardHeader>
                                    <CardTitle>
                                        Recommending Approval Status
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Approver</TableHead>
                                                <TableHead>
                                                    Department/Office
                                                </TableHead>
                                                <TableHead>Role</TableHead>
                                                <TableHead>
                                                    Date Signed
                                                </TableHead>
                                                <TableHead>Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {reservation.approvers.map(
                                                (
                                                    approver: Approver,
                                                    index: number,
                                                ) => (
                                                    <TableRow key={`${approver.name}-${approver.role}`}>
                                                        <TableCell>
                                                            {approver.name}
                                                        </TableCell>
                                                        <TableCell>
                                                            {
                                                                approver.department
                                                            }
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
                        </div>
                    </div>
                </ScrollArea>
            </div>

            {/* Add/Edit Remarks Dialog */}
            <Dialog
                open={isRemarksDialogOpen}
                onOpenChange={setIsRemarksDialogOpen}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Remarks</DialogTitle>
                        <DialogDescription>
                            Add your remarks for the {currentApproverRole}{" "}
                            equipment reservation.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <Textarea
                            placeholder="Enter your remarks..."
                            value={remarksText}
                            onChange={(e) => setRemarksText(e.target.value)}
                            rows={5}
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsRemarksDialogOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleSaveRemarks}>
                            Save Remarks
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
