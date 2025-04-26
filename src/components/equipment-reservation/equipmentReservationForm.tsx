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
    type EquipmentReservationFormInput,
    equipmentReservationFormSchema,
} from "@/lib/schema";
import type { Equipment, Event, Venue } from "@/lib/types";
import { cn, getEquipmentNameById } from "@/lib/utils";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { format, startOfDay } from "date-fns";
import { CalendarIcon, CloudUpload, Users, X } from "lucide-react";
import { useCallback, useState } from "react";
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
import EquipmentList from "./equipmentList";

// Define the props interface
interface EquipmentReservationFormDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: EquipmentReservationFormInput) => void;
    events: Event[];
    venues: Venue[];
    equipment: Equipment[];
    isLoading?: boolean;
}

export function EquipmentReservationFormDialog({
    isOpen,
    onClose,
    onSubmit,
    events,
    venues,
    equipment,
    isLoading = false,
}: EquipmentReservationFormDialogProps) {
    const [step, setStep] = useState(1);

    const form = useForm<EquipmentReservationFormInput>({
        resolver: valibotResolver(equipmentReservationFormSchema),
        defaultValues: {
            eventId: "",
            venueId: "",
            startDateTime: undefined,
            endDateTime: undefined,
            purpose: "",
            selectedEquipment: [],
            approvedLetter: [],
        },
        mode: "onChange",
    });

    const checkStep1Validity = () => {
        const { eventId, venueId, startDateTime, endDateTime } =
            form.getValues();
        // Check required fields and date logic per schema
        return (
            !!eventId &&
            !!venueId &&
            startDateTime instanceof Date &&
            !Number.isNaN(startDateTime.getTime()) &&
            endDateTime instanceof Date &&
            !Number.isNaN(endDateTime.getTime()) &&
            endDateTime > startDateTime // Schema enforces this via forward check
        );
    };

    const checkStep2Validity = () => {
        const { selectedEquipment, approvedLetter } = form.getValues();
        // Check required arrays have at least one item per schema
        return selectedEquipment.length > 0 && approvedLetter.length > 0;
    };

    const handleNext = async () => {
        console.log("handleNext called, current step:", step);
        let fieldsToValidate: (keyof EquipmentReservationFormInput)[] = [];
        let isValid = false;

        if (step === 1) {
            // Validate fields required by schema for Step 1
            fieldsToValidate = [
                "eventId",
                "venueId",
                "startDateTime",
                "endDateTime",
                // 'purpose' is optional, no need to trigger validation explicitly for 'next'
            ];
            isValid = await form.trigger(fieldsToValidate);
            // Check if validation passed for required fields
            if (isValid) {
                setStep(2);
            }
        } else if (step === 2) {
            // Validate fields required by schema for Step 2
            fieldsToValidate = ["selectedEquipment", "approvedLetter"];
            isValid = await form.trigger(fieldsToValidate);
            // Check if validation passed for required fields
            if (isValid) {
                setStep(3); // Proceed to Step 3 (Summary)
            }
        }
    };

    const handleBack = () => {
        setStep(Math.max(1, step - 1));
    };

    const handleSubmit = (values: EquipmentReservationFormInput) => {
        console.log("handleSubmit called"); // Add log
        onSubmit(values);
        form.reset();
        setStep(1);
        onClose();
    };

    const selectedEquipmentIds = form.watch("selectedEquipment") || [];
    const selectedVenueId = form.watch("venueId");
    const selectedVenue = venues.find(
        (v) => v.id === Number.parseInt(selectedVenueId, 10),
    );
    const selectedEventId = form.watch("eventId");
    const selectedEvent = events.find(
        (e) => e.id === Number.parseInt(selectedEventId, 10),
    );

    const handleDialogClose = () => {
        form.reset();
        setStep(1);
        onClose();
    };

    const isStep1ButtonDisabled = () => {
        const errors = form.formState.errors;
        return !!(
            errors.eventId ||
            errors.venueId ||
            errors.startDateTime ||
            errors.endDateTime
        );
    };

    const isStep2ButtonDisabled = () => {
        const errors = form.formState.errors;
        return !!(errors.selectedEquipment || errors.approvedLetter);
    };

    // Define the callback using useCallback
    const handleEquipmentListChange = useCallback(
        (equipmentIds: string[]) => {
            form.setValue("selectedEquipment", equipmentIds, {
                shouldValidate: true, // Keep validation for now
            });
        },
        [form], // Dependency array includes 'form' from useForm
    );

    return (
        <Dialog open={isOpen} onOpenChange={handleDialogClose}>
            <DialogContent className="sm:max-w-[700px] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Equipment Reservation</DialogTitle>
                </DialogHeader>

                {/* Progress indicator */}
                <div className="w-full mt-4">
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
                        // onSubmit={form.handleSubmit(handleSubmit)}
                        className="space-y-6 pt-4"
                    >
                        {step === 1 && (
                            <>
                                <FormField
                                    control={form.control}
                                    name="eventId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Event</FormLabel>
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

                                <FormField
                                    control={form.control}
                                    name="venueId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Venue</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                            >
                                                <FormControl>
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Select a venue" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {venues.map((venue) => (
                                                        <SelectItem
                                                            key={venue.id}
                                                            value={venue.id.toString()}
                                                        >
                                                            {venue.name}{" "}
                                                            {venue.location}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Start Date and Time */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="startDateTime"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Start Date & Time
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
                                                        placeholder="Select start date and time"
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
                                                    End Date & Time
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
                                                        placeholder="Select end date and time"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <FormField
                                    control={form.control}
                                    name="purpose"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Purpose</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Describe the purpose of the equipment reservation"
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
                                <FormField
                                    control={form.control}
                                    name="selectedEquipment" // This field now holds string[]
                                    render={() => (
                                        // No need for field object if using setValue
                                        <FormItem>
                                            <div className="mb-4">
                                                <FormLabel className="text-base">
                                                    Select Equipment
                                                </FormLabel>
                                                <FormDescription>
                                                    Select the equipment you
                                                    need for your event.
                                                    Unavailable equipment cannot
                                                    be selected.
                                                </FormDescription>
                                            </div>
                                            <FormMessage />

                                            <EquipmentList
                                                equipment={equipment}
                                                // Pass the watched string[] state
                                                selectedEquipment={
                                                    selectedEquipmentIds
                                                }
                                                // Pass the memoized callback
                                                onEquipmentChange={
                                                    handleEquipmentListChange
                                                }
                                            />
                                        </FormItem>
                                    )}
                                />
                                {/* Approved Letter Upload */}
                                <FormField
                                    control={form.control}
                                    name="approvedLetter"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Approved Letter *
                                            </FormLabel>
                                            <FormControl>
                                                <FileUpload
                                                    value={field.value}
                                                    onValueChange={
                                                        field.onChange
                                                    }
                                                    accept="application/pdf, image/*" // Accept PDF and images
                                                    maxFiles={1} // Limit to one file
                                                    maxSize={5 * 1024 * 1024} // 5MB limit
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
                                                            "approvedLetter",
                                                            {
                                                                message:
                                                                    reasons[0]
                                                                        ?.errors[0]
                                                                        ?.message ??
                                                                    "File rejected",
                                                            },
                                                        );
                                                    }}
                                                    multiple={false} // Ensure only one file can be selected at a time
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
                                                        to upload
                                                    </FileUploadDropzone>
                                                    <FileUploadList>
                                                        {field.value?.map(
                                                            (file, index) => (
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
                                                                            <X className="size-4" />{" "}
                                                                            {/* Adjusted icon size */}
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
                                                Upload one approved letter (PDF
                                                or image, max 5MB).
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </>
                        )}

                        {/* Step 4: Reservation Summary */}
                        {step === 3 && selectedVenue && selectedEvent && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium">
                                    Reservation Summary
                                </h3>
                                <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
                                    {/* Event Details */}
                                    <div className="pb-2 border-b">
                                        <h5 className="font-medium text-sm mb-1">
                                            Event
                                        </h5>
                                        <p className="text-sm">
                                            {selectedEvent.eventName}
                                        </p>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Purpose: {form.watch("purpose")}
                                        </p>
                                    </div>

                                    {/* Venue Details */}
                                    <div className="pt-2 pb-2 border-b">
                                        <h5 className="font-medium text-sm mb-1">
                                            Venue
                                        </h5>
                                        <p className="text-sm">
                                            {selectedVenue.name}
                                        </p>
                                        <div className="flex items-center text-sm text-muted-foreground mt-1">
                                            <Users className="h-3.5 w-3.5 mr-1" />
                                            <span>
                                                Location:{" "}
                                                {selectedVenue.location}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Time & Date */}
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

                                    {selectedEquipmentIds.length > 0 && (
                                        <div className="pt-2 pb-2 border-b">
                                            <h5 className="font-medium text-sm mb-1">
                                                Selected Equipment
                                            </h5>
                                            {/* Fetch equipment names based on IDs */}
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {selectedEquipmentIds.map(
                                                    (id) => {
                                                        const name =
                                                            getEquipmentNameById(
                                                                equipment,
                                                                Number(id),
                                                            );
                                                        return name ? (
                                                            <Badge
                                                                key={id}
                                                                variant="secondary"
                                                            >
                                                                {name}
                                                            </Badge>
                                                        ) : null;
                                                    },
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Approved Letter */}
                                    {form.watch("approvedLetter")?.length >
                                        0 && (
                                        <div className="pt-2">
                                            <h5 className="font-medium text-sm mb-1">
                                                Approved Letter
                                            </h5>
                                            <ul className="list-disc list-inside text-sm text-muted-foreground">
                                                {form
                                                    .watch("approvedLetter")
                                                    ?.map((file, index) => (
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

                        {/* Footer Buttons */}
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
                                                    isStep2ButtonDisabled())
                                            }
                                        >
                                            Next
                                        </Button>
                                    )}
                                    {step === 3 && (
                                        <Button
                                            type="button"
                                            onClick={() =>
                                                form.handleSubmit(
                                                    handleSubmit,
                                                )()
                                            }
                                            disabled={isLoading}
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
