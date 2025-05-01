import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription, // Import DialogDescription
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    ownEquipmentReservationsQueryOptions,
    useCancelEquipmentReservationMutation,
} from "@/lib/query";
import type { EquipmentReservationDTO } from "@/lib/types";
import { formatDateTime, getStatusBadgeClass } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Calendar, Clock, MapPin, Package } from "lucide-react"; // Added Package icon
import { useMemo, useState } from "react";
import { toast } from "sonner";

export default function UserReservations() {
    const [activeTab, setActiveTab] = useState("all"); // Can be 'all', 'pending', 'approved', 'rejected', 'canceled'
    const [selectedReservation, setSelectedReservation] =
        useState<EquipmentReservationDTO | null>(null);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [showDetailsDialog, setShowDetailsDialog] = useState(false);

    // Fetch user's own reservations
    const {
        data: reservations = [],
        isLoading,
        error,
    } = useQuery(ownEquipmentReservationsQueryOptions);

    // Cancel mutation
    const cancelMutation = useCancelEquipmentReservationMutation();

    // Filter reservations based on the active tab
    const filteredReservations = useMemo(() => {
        if (activeTab === "all") {
            return reservations;
        }
        return reservations.filter(
            (res) => res.status.toLowerCase() === activeTab,
        );
    }, [reservations, activeTab]);

    const handleCancel = () => {
        if (!selectedReservation) return;

        cancelMutation.mutate(selectedReservation.id, {
            onSuccess: (message) => {
                toast.success(message || "Reservation cancelled successfully.");
                setShowCancelDialog(false);
                setSelectedReservation(null);
                // Query invalidation happens automatically via the mutation hook
            },
            onError: (error) => {
                toast.error(error.message || "Failed to cancel reservation.");
                setShowCancelDialog(false);
            },
        });
    };

    if (isLoading) {
        return (
            <p className="text-center text-muted-foreground">
                Loading your reservations...
            </p>
        );
    }

    if (error) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                    Failed to load reservations: {error.message}
                </AlertDescription>
            </Alert>
        );
    }

    // Define available tabs based on potential statuses
    const availableTabs = [
        "all",
        "pending",
        "approved",
        "rejected",
        "canceled",
    ];

    return (
        <div className="space-y-6">
            <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
            >
                <div className="flex items-center justify-between">
                    <TabsList>
                        {availableTabs.map((tab) => (
                            <TabsTrigger
                                key={tab}
                                value={tab}
                                className="capitalize"
                            >
                                {tab}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </div>
                <TabsContent value={activeTab} className="pt-4">
                    {filteredReservations.length > 0 ? (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {filteredReservations.map((reservation) => (
                                <Card
                                    key={reservation.id}
                                    className="overflow-hidden flex flex-col"
                                >
                                    <CardHeader>
                                        <div className="flex justify-between items-start">
                                            <CardTitle className="text-lg">
                                                {reservation.eventName}
                                            </CardTitle>
                                            <Badge
                                                className={getStatusBadgeClass(
                                                    reservation.status,
                                                )}
                                            >
                                                {reservation.status}
                                            </Badge>
                                        </div>
                                        {/* Venue name isn't directly in EquipmentReservationDTO, maybe add later if needed */}
                                        {/* <CardDescription className="flex items-center gap-1">
                                            <MapPin className="h-3.5 w-3.5" />
                                            {reservation.venueName}
                                        </CardDescription> */}
                                    </CardHeader>
                                    <CardContent className="flex-grow space-y-2 text-sm">
                                        <div className="flex items-center gap-1">
                                            <Package className="h-3.5 w-3.5 flex-shrink-0" />
                                            <span>
                                                {reservation.equipmentName}{" "}
                                                (Qty: {reservation.quantity})
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                                            <span>
                                                {formatDateTime(
                                                    reservation.startTime,
                                                )}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                                            <span>
                                                {formatDateTime(
                                                    reservation.endTime,
                                                )}
                                            </span>
                                        </div>
                                    </CardContent>
                                    <CardContent className="pt-4">
                                        {" "}
                                        {/* Separate content for buttons */}
                                        <div className="grid grid-cols-2 gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="w-full"
                                                onClick={() => {
                                                    setSelectedReservation(
                                                        reservation,
                                                    );
                                                    setShowDetailsDialog(true);
                                                }}
                                            >
                                                View Details
                                            </Button>
                                            {/* Allow cancellation if PENDING or APPROVED */}
                                            {(reservation.status ===
                                                "PENDING" ||
                                                reservation.status ===
                                                    "APPROVED") && (
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    className="w-full"
                                                    onClick={() => {
                                                        setSelectedReservation(
                                                            reservation,
                                                        );
                                                        setShowCancelDialog(
                                                            true,
                                                        );
                                                    }}
                                                    disabled={
                                                        cancelMutation.isPending &&
                                                        cancelMutation.variables ===
                                                            reservation.id
                                                    }
                                                >
                                                    Cancel
                                                </Button>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>No reservations found</AlertTitle>
                            <AlertDescription>
                                You don't have any{" "}
                                {activeTab !== "all" ? activeTab : ""} equipment
                                reservations.
                            </AlertDescription>
                        </Alert>
                    )}
                </TabsContent>
            </Tabs>

            {/* Reservation Details Dialog */}
            <Dialog
                open={showDetailsDialog}
                onOpenChange={setShowDetailsDialog}
            >
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Reservation Details</DialogTitle>
                    </DialogHeader>
                    {selectedReservation && (
                        <ScrollArea className="max-h-[70vh]">
                            <div className="space-y-4 p-1 pr-4">
                                {" "}
                                {/* Add padding for scrollbar */}
                                <div>
                                    <h4 className="font-medium text-muted-foreground">
                                        Event
                                    </h4>
                                    <p>{selectedReservation.eventName}</p>
                                </div>
                                <div>
                                    <h4 className="font-medium text-muted-foreground">
                                        Equipment
                                    </h4>
                                    <p>
                                        {selectedReservation.equipmentName}{" "}
                                        (Qty: {selectedReservation.quantity})
                                    </p>
                                </div>
                                <div>
                                    <h4 className="font-medium text-muted-foreground">
                                        Department
                                    </h4>
                                    <p>{selectedReservation.departmentName}</p>
                                </div>
                                <div>
                                    <h4 className="font-medium text-muted-foreground">
                                        Start Time
                                    </h4>
                                    <p>
                                        {formatDateTime(
                                            selectedReservation.startTime,
                                        )}
                                    </p>
                                </div>
                                <div>
                                    <h4 className="font-medium text-muted-foreground">
                                        End Time
                                    </h4>
                                    <p>
                                        {formatDateTime(
                                            selectedReservation.endTime,
                                        )}
                                    </p>
                                </div>
                                <div>
                                    <h4 className="font-medium text-muted-foreground">
                                        Status
                                    </h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Badge
                                            className={getStatusBadgeClass(
                                                selectedReservation.status,
                                            )}
                                        >
                                            {selectedReservation.status}
                                        </Badge>
                                        {/* Display rejection remarks if available */}
                                        {selectedReservation.status ===
                                            "REJECTED" &&
                                            selectedReservation.approvals?.find(
                                                (a) => a.status === "REJECTED",
                                            )?.remarks && (
                                                <span className="text-sm text-red-500">
                                                    Reason:{" "}
                                                    {
                                                        selectedReservation.approvals.find(
                                                            (a) =>
                                                                a.status ===
                                                                "REJECTED",
                                                        )?.remarks
                                                    }
                                                </span>
                                            )}
                                    </div>
                                </div>
                                {selectedReservation.reservationLetterUrl && (
                                    <div>
                                        <h4 className="font-medium text-muted-foreground">
                                            Reservation Letter
                                        </h4>
                                        <Button
                                            variant="link"
                                            asChild
                                            className="p-0 h-auto"
                                        >
                                            <a
                                                href={
                                                    selectedReservation.reservationLetterUrl
                                                }
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1"
                                            >
                                                View Letter
                                            </a>
                                        </Button>
                                    </div>
                                )}
                                {selectedReservation.approvals &&
                                    selectedReservation.approvals.length >
                                        0 && (
                                        <div>
                                            <h4 className="font-medium text-muted-foreground">
                                                Approval History
                                            </h4>
                                            <ul className="list-disc pl-5 space-y-1 mt-1 text-sm">
                                                {selectedReservation.approvals.map(
                                                    (approval) => (
                                                        <li key={approval.id}>
                                                            {approval.status} by{" "}
                                                            {approval.signedBy}{" "}
                                                            ({approval.userRole}
                                                            ) on{" "}
                                                            {formatDateTime(
                                                                approval.dateSigned,
                                                            )}
                                                            {approval.remarks && (
                                                                <span className="block text-xs text-muted-foreground">
                                                                    Remarks:{" "}
                                                                    {
                                                                        approval.remarks
                                                                    }
                                                                </span>
                                                            )}
                                                        </li>
                                                    ),
                                                )}
                                            </ul>
                                        </div>
                                    )}
                                <div>
                                    <h4 className="font-medium text-muted-foreground">
                                        Submitted On
                                    </h4>
                                    <p>
                                        {formatDateTime(
                                            selectedReservation.createdAt,
                                        )}
                                    </p>
                                </div>
                                {selectedReservation.updatedAt && (
                                    <div>
                                        <h4 className="font-medium text-muted-foreground">
                                            Last Updated
                                        </h4>
                                        <p>
                                            {formatDateTime(
                                                selectedReservation.updatedAt,
                                            )}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    )}
                    <DialogFooter>
                        <Button onClick={() => setShowDetailsDialog(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Cancel Reservation Dialog */}
            <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Cancel Reservation</DialogTitle>
                        <DialogDescription>
                            {" "}
                            {/* Use DialogDescription */}
                            Are you sure you want to cancel the reservation for
                            "{selectedReservation?.equipmentName}" for the event
                            "{selectedReservation?.eventName}"?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-sm text-muted-foreground">
                            This action cannot be undone. The equipment owner
                            may be notified.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowCancelDialog(false)}
                            disabled={cancelMutation.isPending}
                        >
                            No, Keep Reservation
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleCancel}
                            disabled={cancelMutation.isPending}
                        >
                            {cancelMutation.isPending
                                ? "Cancelling..."
                                : "Yes, Cancel Reservation"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
