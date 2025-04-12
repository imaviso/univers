import { format, parse } from "date-fns";
import { FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { VenueReservationInput } from "@/lib/schema";

// Mock data for mapping IDs to names
const venues = {
    "1": "Main Auditorium",
    "2": "Conference Room A",
    "3": "Conference Room B",
    "4": "Outdoor Pavilion",
    "5": "Lecture Hall",
};

const eventTypes = {
    "1": "Conference",
    "2": "Workshop",
    "3": "Seminar",
    "4": "Meeting",
    "5": "Social Event",
    "6": "Other",
};

const departments = {
    "1": "Marketing",
    "2": "Human Resources",
    "3": "Finance",
    "4": "IT",
    "5": "Operations",
    "6": "Research & Development",
    "7": "Customer Service",
    "8": "Sales",
    "9": "Legal",
    "10": "Executive",
};

interface ReservationConfirmationModalProps {
    formData: VenueReservationInput;
    approvalLetter: File | null;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function ReservationConfirmationModal({
    formData,
    approvalLetter,
    onConfirm,
    onCancel,
}: ReservationConfirmationModalProps) {
    return (
        <Dialog open={true} onOpenChange={onCancel}>
            <DialogContent className="sm:max-w-md md:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Confirm Venue Reservation</DialogTitle>
                    <DialogDescription>
                        Please review your reservation details before
                        confirming.
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="max-h-[60vh] pr-4">
                    <div className="space-y-6 py-4">
                        <div className="space-y-2">
                            <h3 className="text-sm font-medium text-muted-foreground">
                                User Information
                            </h3>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                <div className="font-medium">Email:</div>
                                <div>{formData.email}</div>

                                <div className="font-medium">Phone:</div>
                                <div>{formData.phoneNumber}</div>

                                <div className="font-medium">Department:</div>
                                <div>
                                    {departments[
                                        formData.department as keyof typeof departments
                                    ] || formData.department}
                                </div>

                                <div className="font-medium">Event Name:</div>
                                <div>{formData.eventName}</div>

                                <div className="font-medium">Event Type:</div>
                                <div>
                                    {eventTypes[
                                        formData.eventType as keyof typeof eventTypes
                                    ] || formData.eventType}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-sm font-medium text-muted-foreground">
                                Venue Information
                            </h3>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                <div className="font-medium">Venue:</div>
                                <div>
                                    {venues[
                                        formData.venue as keyof typeof venues
                                    ] || formData.venue}
                                </div>

                                <div className="font-medium">
                                    Start Date Time:
                                </div>
                                <div>
                                    {format(
                                        formData.startDateTime,
                                        "yyyy-mm-ddThh:mm",
                                    )}
                                </div>

                                <div className="font-medium">
                                    End Date Time:
                                </div>
                                <div>
                                    {format(
                                        formData.endDateTime,
                                        "yyyy-mm-ddThh:mm",
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-sm font-medium text-muted-foreground">
                                Approval Letter
                            </h3>
                            <div className="flex items-center gap-2 text-sm">
                                <FileText className="h-4 w-4" />
                                <span>{approvalLetter?.name}</span>
                            </div>
                        </div>
                    </div>
                </ScrollArea>

                <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-2">
                    <Button variant="outline" onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button onClick={onConfirm}>Confirm Reservation</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
