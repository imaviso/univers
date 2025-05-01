import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
    type EquipmentReservationFormInput, // Use updated type
    equipmentReservationFormSchema, // Use updated schema
} from "@/lib/schema";
import type { Equipment, Event } from "@/lib/types"; // Removed Venue
import { cn, getEquipmentNameById } from "@/lib/utils";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { format, parseISO, startOfDay } from "date-fns";
import { CalendarIcon, CloudUpload, Users, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Badge } from "../ui/badge";
import {
    FileUpload,
    FileUploadDropzone,
    FileUploadItem,
    FileUploadItemDelete,
    FileUploadItemMetadata,
    FileUploadItemPreview,
    FileUploadList,
    FileUploadTrigger,
} from "../ui/file-upload";
import { SmartDatetimeInput } from "../ui/smart-date-picker";
import EquipmentList from "./equipmentList"; // Assuming this is updated

// Define the props interface
interface EquipmentReservationFormDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: EquipmentReservationFormInput) => void; // Use updated type
    events: Event[];
    // venues prop removed
    equipment: Equipment[];
    isLoading?: boolean;
}

export function EquipmentReservationFormDialog({
    isOpen,
    onClose,
    onSubmit,
    events,
    equipment,
    isLoading = false,
}: EquipmentReservationFormDialogProps) {
    const [step, setStep] = useState(1);

    const form = useForm<EquipmentReservationFormInput>({
        resolver: valibotResolver(equipmentReservationFormSchema),
        defaultValues: {
            eventId: "",
            startDateTime: undefined,
            endDateTime: undefined,
            purpose: "",
            selectedEquipment: [],
            reservationLetterFile: [],
        },
        mode: "onChange",
    });

    const watchedEventId = form.watch("eventId");
    // Find selected event based on string ID from select input
    const selectedEvent = events.find((e) => String(e.id) === watchedEventId);

    useEffect(() => {
        if (selectedEvent) {
            try {
                const startTime = parseISO(selectedEvent.startTime);
                const endTime = parseISO(selectedEvent.endTime);
                form.setValue("startDateTime", startTime, {
                    shouldValidate: true,
                });
                form.setValue("endDateTime", endTime, { shouldValidate: true });
            } catch (error) {
                console.error("Error parsing event dates:", error);
                form.setValue("startDateTime", undefined, {
                    shouldValidate: true,
                });
                form.setValue("endDateTime", undefined, {
                    shouldValidate: true,
                });
            }
        } else {
            // Logic to clear dates only if they were previously set by an event
            const currentStartTime = form.getValues("startDateTime");
            const currentEndTime = form.getValues("endDateTime");
            const wasSetByEvent = events.some(
                (event) =>
                    currentStartTime &&
                    parseISO(event.startTime).getTime() ===
                        currentStartTime.getTime() &&
                    currentEndTime &&
                    parseISO(event.endTime).getTime() ===
                        currentEndTime.getTime(),
            );
            if (wasSetByEvent) {
                form.setValue("startDateTime", undefined, {
                    shouldValidate: true,
                });
                form.setValue("endDateTime", undefined, {
                    shouldValidate: true,
                });
            }
        }
    }, [selectedEvent, form.setValue, form.getValues, events]);

    // Validation checks remain similar but target new schema fields
    const checkStep1Validity = () => {
        const { eventId, startDateTime, endDateTime } = form.getValues();
        return (
            !!eventId &&
            startDateTime instanceof Date &&
            !Number.isNaN(startDateTime.getTime()) &&
            endDateTime instanceof Date &&
            !Number.isNaN(endDateTime.getTime()) &&
            endDateTime > startDateTime
        );
    };

    const checkStep2Validity = () => {
        const { selectedEquipment } = form.getValues();
        // reservationLetterFile is optional, only check selectedEquipment
        return selectedEquipment.length > 0;
    };

    const handleNext = async () => {
        console.log("handleNext called, current step:", step);
        let fieldsToValidate: (keyof EquipmentReservationFormInput)[] = [];
        let isValid = false;

        if (step === 1) {
            fieldsToValidate = ["eventId", "startDateTime", "endDateTime"];
            isValid = await form.trigger(fieldsToValidate);
            if (isValid) {
                setStep(2);
            }
        } else if (step === 2) {
            // Only selectedEquipment is strictly required for step 2 logic
            fieldsToValidate = ["selectedEquipment", "reservationLetterFile"];
            isValid = await form.trigger(fieldsToValidate);
            if (isValid) {
                setStep(3); // Proceed to Step 3 (Summary)
            }
        }
    };

    const handleBack = () => {
        setStep(Math.max(1, step - 1));
    };

    // handleSubmit passes the validated form data
    const handleSubmit = (values: EquipmentReservationFormInput) => {
        console.log("Submitting reservation form data:", values);
        onSubmit(values); // Parent component handles API call(s)
        // Resetting form handled in handleDialogClose or onSuccess in parent
    };

    const selectedEquipmentWithQuantities =
        form.watch("selectedEquipment") || [];
    // selectedVenueId and selectedVenue removed
    const selectedEventId = form.watch("eventId");

    const handleDialogClose = () => {
        form.reset(); // Reset form on close
        setStep(1);
        onClose();
    };

    // Disable logic updated for new schema
    const isStep1ButtonDisabled = () => {
        const errors = form.formState.errors;
        return !!(errors.eventId || errors.startDateTime || errors.endDateTime);
    };

    const isStep2ButtonDisabled = () => {
        const errors = form.formState.errors;
        // Only selectedEquipment is required for 'Next' from step 2
        return !!errors.selectedEquipment;
    };

    const isDateTimeReadOnly = !!selectedEvent;

    return (
        <Dialog open={isOpen} onOpenChange={handleDialogClose}>
            <DialogContent className="sm:max-w-[700px] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Equipment Reservation</DialogTitle>
                </DialogHeader>

                {/* Progress indicator - unchanged */}
                <div className="w-full mt-4">
                    {/* ... progress indicator divs ... */}
                    <div className="flex justify-between mb-2 text-sm">
                        <div
                            className={cn(
                                "transition-colors duration-200",
                                step === 1
                                    ? "text-primary font-semibold"
                                    : step > 1
                                      ? "text-muted-foreground"
                                      : "text-muted",
                            )}
                        >
                            Event Details
                        </div>
                        <div
                            className={cn(
                                "transition-colors duration-200",
                                step === 2
                                    ? "text-primary font-semibold"
                                    : step > 2
                                      ? "text-muted-foreground"
                                      : "text-muted",
                            )}
                        >
                            Time & Equipment
                        </div>
                        <div
                            className={cn(
                                "transition-colors duration-200",
                                step === 3
                                    ? "text-primary font-semibold"
                                    : "text-muted",
                            )}
                        >
                            Reservation Summary
                        </div>
                    </div>
                    <div className="w-full bg-muted/50 h-2 rounded-full overflow-hidden">
                        <div
                            className="bg-primary h-full rounded-full transition-all duration-300 ease-in-out"
                            style={{
                                width: `${(step - 1) * 50}%`,
                            }}
                        />
                    </div>
                </div>

                <Form {...form}>
                    <form
                        // onSubmit removed - triggered by button onClick
                        onSubmit={form.handleSubmit(handleSubmit)}
                        className="space-y-6 pt-4"
                    >
                        {step === 1 && (
                            <>
                                {/* Event Select - unchanged */}
                                <FormField
                                    control={form.control}
                                    name="eventId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Event *</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                            >
                                                <FormControl>
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Select an event" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {events.map((event) => (
                                                        <SelectItem
                                                            key={event.id}
                                                            value={event.id.toString()}
                                                        >
                                                            {event.eventName}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Venue Select - REMOVED */}

                                {/* Start/End Date Time - unchanged */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="startDateTime"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Start Date & Time *
                                                </FormLabel>
                                                <FormControl>
                                                    <SmartDatetimeInput
                                                        value={field.value}
                                                        onValueChange={
                                                            field.onChange
                                                        }
                                                        disabled={(date) =>
                                                            date <
                                                            startOfDay(
                                                                new Date(),
                                                            )
                                                        }
                                                        readOnly={
                                                            isDateTimeReadOnly
                                                        } // Apply readOnly
                                                        placeholder={
                                                            isDateTimeReadOnly
                                                                ? ""
                                                                : "Select start date and time"
                                                        }
                                                        className={cn(
                                                            isDateTimeReadOnly &&
                                                                "cursor-not-allowed bg-muted/50",
                                                        )}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="endDateTime"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    End Date & Time *
                                                </FormLabel>
                                                <FormControl>
                                                    <SmartDatetimeInput
                                                        value={field.value}
                                                        onValueChange={
                                                            field.onChange
                                                        }
                                                        disabled={(date) =>
                                                            date <
                                                            startOfDay(
                                                                new Date(),
                                                            )
                                                        }
                                                        readOnly={
                                                            isDateTimeReadOnly
                                                        } // Apply readOnly
                                                        placeholder={
                                                            isDateTimeReadOnly
                                                                ? ""
                                                                : "Select start date and time"
                                                        }
                                                        className={cn(
                                                            isDateTimeReadOnly &&
                                                                "cursor-not-allowed bg-muted/50",
                                                        )}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {/* Purpose - unchanged */}
                                <FormField
                                    control={form.control}
                                    name="purpose"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Purpose</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Describe the purpose of the equipment reservation (optional)"
                                                    className="resize-none"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </>
                        )}
                        {step === 2 && (
                            <>
                                {/* Updated Equipment List Usage */}
                                <FormField
                                    control={form.control}
                                    name="selectedEquipment"
                                    // Use the field object provided by render
                                    render={({ field }) => (
                                        <FormItem>
                                            <div className="mb-4">
                                                <FormLabel className="text-base">
                                                    Select Equipment *{" "}
                                                    {/* Added asterisk */}
                                                </FormLabel>
                                                <FormDescription>
                                                    Select the equipment and
                                                    specify the quantity needed.
                                                </FormDescription>
                                            </div>
                                            {/* Pass field props directly to EquipmentList */}
                                            <EquipmentList
                                                equipment={equipment}
                                                value={field.value ?? []} // Use field.value
                                                onChange={field.onChange} // Use field.onChange
                                            />
                                            {/* FormMessage will display validation errors */}
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Updated File Upload */}
                                <FormField
                                    control={form.control}
                                    name="reservationLetterFile" // Renamed field
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Reservation Letter
                                            </FormLabel>
                                            <FormControl>
                                                <FileUpload
                                                    value={field.value ?? []} // Handle potential undefined value
                                                    onValueChange={
                                                        field.onChange
                                                    }
                                                    accept="application/pdf, image/*"
                                                    maxFiles={1}
                                                    maxSize={5 * 1024 * 1024}
                                                    onFileReject={(
                                                        reasons,
                                                        files,
                                                    ) => {
                                                        console.log(
                                                            "File rejected:",
                                                            reasons,
                                                            files,
                                                        );
                                                        form.setError(
                                                            "reservationLetterFile",
                                                            {
                                                                message:
                                                                    reasons[0]
                                                                        ?.errors[0]
                                                                        ?.message ??
                                                                    "File rejected",
                                                            },
                                                        );
                                                    }}
                                                    multiple={false}
                                                >
                                                    <FileUploadDropzone className="flex-row border-dotted">
                                                        <CloudUpload className="size-4" />
                                                        Drag and drop or
                                                        <FileUploadTrigger
                                                            asChild
                                                        >
                                                            <Button
                                                                variant="link"
                                                                size="sm"
                                                                className="p-0"
                                                            >
                                                                choose file
                                                            </Button>
                                                        </FileUploadTrigger>
                                                    </FileUploadDropzone>
                                                    <FileUploadList>
                                                        {(
                                                            field.value ?? []
                                                        ).map(
                                                            (
                                                                file, // Handle potential undefined value
                                                            ) => (
                                                                <FileUploadItem
                                                                    key={
                                                                        file.name
                                                                    }
                                                                    value={file}
                                                                >
                                                                    <FileUploadItemPreview />
                                                                    <FileUploadItemMetadata />
                                                                    <FileUploadItemDelete
                                                                        asChild
                                                                    >
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="size-7"
                                                                        >
                                                                            <X className="size-4" />
                                                                            <span className="sr-only">
                                                                                Delete
                                                                            </span>
                                                                        </Button>
                                                                    </FileUploadItemDelete>
                                                                </FileUploadItem>
                                                            ),
                                                        )}
                                                    </FileUploadList>
                                                </FileUpload>
                                            </FormControl>
                                            <FormDescription>
                                                Upload one reservation letter
                                                (PDF or image, max 5MB).
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </>
                        )}

                        {/* Step 3: Reservation Summary - Updated */}
                        {step === 3 && selectedEvent && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium">
                                    Reservation Summary
                                </h3>
                                <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
                                    {/* Event Details - unchanged */}
                                    <div className="pb-2 border-b">
                                        <h5 className="font-medium text-sm mb-1">
                                            Event
                                        </h5>
                                        <p className="text-sm">
                                            {selectedEvent.eventName}
                                        </p>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Purpose:{" "}
                                            {form.watch("purpose") || "N/A"}
                                        </p>
                                    </div>

                                    {/* Venue Details - REMOVED */}

                                    {/* Time & Date - unchanged */}
                                    <div className="pt-2 pb-2 border-b">
                                        <h5 className="font-medium text-sm mb-1">
                                            Schedule
                                        </h5>
                                        <div className="flex items-center text-sm">
                                            <CalendarIcon className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                                            <span>
                                                {(() => {
                                                    const startDate =
                                                        form.watch(
                                                            "startDateTime",
                                                        );
                                                    const endDate =
                                                        form.watch(
                                                            "endDateTime",
                                                        );
                                                    if (!startDate || !endDate)
                                                        return "N/A";
                                                    return `${format(startDate, "MMM d, yyyy h:mm a")} - ${format(endDate, "MMM d, yyyy h:mm a")}`;
                                                })()}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Updated Selected Equipment Display */}
                                    {selectedEquipmentWithQuantities.length >
                                        0 && (
                                        <div className="pt-2 pb-2 border-b">
                                            <h5 className="font-medium text-sm mb-1">
                                                Selected Equipment
                                            </h5>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {selectedEquipmentWithQuantities.map(
                                                    ({
                                                        equipmentId,
                                                        quantity,
                                                    }) => {
                                                        const name =
                                                            getEquipmentNameById(
                                                                equipment,
                                                                Number(
                                                                    equipmentId,
                                                                ),
                                                            );
                                                        return name ? (
                                                            <Badge
                                                                key={
                                                                    equipmentId
                                                                }
                                                                variant="secondary"
                                                            >
                                                                {name} (Qty:{" "}
                                                                {quantity})
                                                            </Badge>
                                                        ) : null;
                                                    },
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Updated Approved Letter Display */}
                                    {form.watch("reservationLetterFile")
                                        ?.length > 0 && (
                                        <div className="pt-2">
                                            <h5 className="font-medium text-sm mb-1">
                                                Reservation Letter
                                            </h5>
                                            <ul className="list-disc list-inside text-sm text-muted-foreground">
                                                {form
                                                    .watch(
                                                        "reservationLetterFile",
                                                    )
                                                    ?.map((file) => (
                                                        <li key={file.name}>
                                                            {file.name}
                                                        </li>
                                                    ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Footer Buttons - unchanged */}
                        <DialogFooter>
                            <div className="flex w-full justify-between items-center">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleDialogClose}
                                >
                                    Cancel
                                </Button>
                                <div className="flex gap-2">
                                    {step > 1 && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={handleBack}
                                        >
                                            Back
                                        </Button>
                                    )}
                                    {step < 3 && (
                                        <Button
                                            type="button"
                                            onClick={handleNext}
                                            disabled={
                                                (step === 1 &&
                                                    isStep1ButtonDisabled()) ||
                                                (step === 2 &&
                                                    isStep2ButtonDisabled()) // Updated disable logic
                                            }
                                        >
                                            Next
                                        </Button>
                                    )}
                                    {step === 3 && (
                                        <Button
                                            type="submit" // Changed to submit
                                            disabled={
                                                isLoading ||
                                                !form.formState.isValid
                                            } // Also check isValid for final submit
                                        >
                                            {isLoading
                                                ? "Submitting..."
                                                : "Submit Reservation"}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
