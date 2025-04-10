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
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@radix-ui/react-select";
import { format } from "date-fns";
import { AlertCircle, Calendar, Clock, MapPin } from "lucide-react";
import { useState } from "react";

// Mock reservation data
const mockReservations = [
    {
        id: "1",
        eventName: "Annual Conference",
        venueName: "Main Auditorium",
        startDate: new Date(2025, 3, 15),
        endDate: new Date(2025, 3, 15),
        startTime: "09:00",
        endTime: "17:00",
        status: "approved",
        equipment: [
            { id: "msdo-camera", name: "Camera", owner: "MSDO" },
            { id: "msdo-speaker", name: "Speaker", owner: "MSDO" },
            { id: "opc-chairs", name: "Chairs", owner: "OPC" },
        ],
    },
    {
        id: "2",
        eventName: "Team Building Workshop",
        venueName: "Conference Room A",
        startDate: new Date(2025, 3, 20),
        endDate: new Date(2025, 3, 20),
        startTime: "13:00",
        endTime: "16:00",
        status: "pending",
        equipment: [
            { id: "msdo-microphone", name: "Microphone", owner: "MSDO" },
            { id: "opc-table", name: "Folding Table", owner: "OPC" },
        ],
    },
    {
        id: "3",
        eventName: "Product Launch",
        venueName: "Outdoor Pavilion",
        startDate: new Date(2025, 4, 5),
        endDate: new Date(2025, 4, 5),
        startTime: "10:00",
        endTime: "14:00",
        status: "rejected",
        equipment: [
            { id: "msdo-speaker", name: "Speaker", owner: "MSDO" },
            { id: "msdo-microphone", name: "Microphone", owner: "MSDO" },
            { id: "opc-tent", name: "Event Tent", owner: "OPC" },
        ],
        rejectionReason:
            "Equipment not available for the requested time period.",
    },
];

export default function UserReservations() {
    const [activeTab, setActiveTab] = useState("all");
    const [selectedReservation, setSelectedReservation] = useState<
        (typeof mockReservations)[0] | null
    >(null);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [showDetailsDialog, setShowDetailsDialog] = useState(false);

    const filteredReservations =
        activeTab === "all"
            ? mockReservations
            : mockReservations.filter((res) => res.status === activeTab);

    const handleCancel = () => {
        // In a real app, you would call an API to cancel the reservation
        console.log("Cancelling reservation:", selectedReservation?.id);
        setShowCancelDialog(false);
        // Then refresh the reservations list
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "approved":
                return <Badge className="bg-green-500">Approved</Badge>;
            case "pending":
                return (
                    <Badge
                        variant="outline"
                        className="text-yellow-500 border-yellow-500"
                    >
                        Pending
                    </Badge>
                );
            case "rejected":
                return <Badge variant="destructive">Rejected</Badge>;
            default:
                return <Badge variant="outline">Unknown</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
            >
                <div className="flex items-center justify-between">
                    <TabsList className="flex w-full mb-3 h-auto -space-x-px bg-background p-0 shadow-sm shadow-black/5 rtl:space-x-reverse">
                        <TabsTrigger
                            value="all"
                            className="relative overflow-hidden rounded-none border border-border py-2 after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 first:rounded-s last:rounded-e data-[state=active]:bg-muted data-[state=active]:after:bg-primary"
                        >
                            All Reservations
                        </TabsTrigger>
                        <TabsTrigger
                            value="approved"
                            className="relative overflow-hidden rounded-none border border-border py-2 after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 first:rounded-s last:rounded-e data-[state=active]:bg-muted data-[state=active]:after:bg-primary"
                        >
                            Approved
                        </TabsTrigger>
                        <TabsTrigger
                            value="pending"
                            className="relative overflow-hidden rounded-none border border-border py-2 after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 first:rounded-s last:rounded-e data-[state=active]:bg-muted data-[state=active]:after:bg-primary"
                        >
                            Pending
                        </TabsTrigger>
                    </TabsList>
                </div>
                <TabsContent value={activeTab} className="pt-4">
                    {filteredReservations.length > 0 ? (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {filteredReservations.map((reservation) => (
                                <Card
                                    key={reservation.id}
                                    className="overflow-hidden"
                                >
                                    <CardHeader className="pb-2">
                                        <div className="flex justify-between items-start">
                                            <CardTitle className="text-lg">
                                                {reservation.eventName}
                                            </CardTitle>
                                            {getStatusBadge(reservation.status)}
                                        </div>
                                        <CardDescription className="flex items-center gap-1">
                                            <MapPin className="h-3.5 w-3.5" />
                                            {reservation.venueName}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="pb-2">
                                        <div className="space-y-2 text-sm">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="h-3.5 w-3.5" />
                                                <span>
                                                    {format(
                                                        reservation.startDate,
                                                        "MMM d, yyyy",
                                                    )}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Clock className="h-3.5 w-3.5" />
                                                <span>
                                                    {reservation.startTime} -{" "}
                                                    {reservation.endTime}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="font-medium">
                                                    Equipment:
                                                </span>{" "}
                                                {reservation.equipment.length}{" "}
                                                items
                                            </div>
                                        </div>
                                        <div className="mt-4 flex gap-2">
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
                                            {reservation.status !==
                                                "rejected" && (
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
                                reservations yet.
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
                        <div className="space-y-4">
                            <div>
                                <h4 className="font-medium">
                                    Event Information
                                </h4>
                                <p>Event: {selectedReservation.eventName}</p>
                            </div>

                            <div>
                                <h4 className="font-medium">
                                    Venue Information
                                </h4>
                                <p>Venue: {selectedReservation.venueName}</p>
                                <p>
                                    Date:{" "}
                                    {format(
                                        selectedReservation.startDate,
                                        "PPP",
                                    )}
                                </p>
                                <p>
                                    Time: {selectedReservation.startTime} to{" "}
                                    {selectedReservation.endTime}
                                </p>
                            </div>

                            <div>
                                <h4 className="font-medium">Status</h4>
                                <div className="flex items-center gap-2 mt-1">
                                    {getStatusBadge(selectedReservation.status)}
                                    {selectedReservation.status ===
                                        "rejected" && (
                                        <span className="text-sm text-red-500">
                                            {
                                                selectedReservation.rejectionReason
                                            }
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div>
                                <h4 className="font-medium">
                                    Reserved Equipment
                                </h4>
                                <ScrollArea className="h-[150px] w-full rounded-md border p-4 mt-2">
                                    <div className="space-y-4">
                                        <div>
                                            <h5 className="text-sm font-medium mb-2">
                                                MSDO Equipment
                                            </h5>
                                            <ul className="list-disc pl-5 space-y-1">
                                                {selectedReservation.equipment
                                                    .filter(
                                                        (item) =>
                                                            item.owner ===
                                                            "MSDO",
                                                    )
                                                    .map((item) => (
                                                        <li
                                                            key={item.id}
                                                            className="text-sm"
                                                        >
                                                            {item.name}
                                                        </li>
                                                    ))}
                                            </ul>
                                        </div>

                                        <div>
                                            <h5 className="text-sm font-medium mb-2">
                                                OPC Equipment
                                            </h5>
                                            <ul className="list-disc pl-5 space-y-1">
                                                {selectedReservation.equipment
                                                    .filter(
                                                        (item) =>
                                                            item.owner ===
                                                            "OPC",
                                                    )
                                                    .map((item) => (
                                                        <li
                                                            key={item.id}
                                                            className="text-sm"
                                                        >
                                                            {item.name}
                                                        </li>
                                                    ))}
                                            </ul>
                                        </div>
                                    </div>
                                </ScrollArea>
                            </div>
                        </div>
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
                    </DialogHeader>
                    <div className="py-4">
                        <p>
                            Are you sure you want to cancel this equipment
                            reservation for "{selectedReservation?.eventName}"?
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
                            This action cannot be undone.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowCancelDialog(false)}
                        >
                            No, Keep Reservation
                        </Button>
                        <Button variant="destructive" onClick={handleCancel}>
                            Yes, Cancel Reservation
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
