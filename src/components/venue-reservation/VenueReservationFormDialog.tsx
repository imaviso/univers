import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
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
import {
    type CreateVenueReservationFormInput,
    type CreateVenueReservationFormOutput,
    CreateVenueReservationFormSchema,
} from "@/lib/schema";
import type {
    Event as AppEvent,
    Department,
    Venue as VenueType,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { parseISO, startOfDay } from "date-fns";
import { CloudUpload, MapPin, X } from "lucide-react";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
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

interface VenueReservationFormDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateVenueReservationFormOutput) => void;
    venues: Pick<VenueType, "id" | "name" | "location" | "imagePath">[];
    events: Pick<AppEvent, "id" | "eventName" | "startTime" | "endTime">[];
    departments: Pick<Department, "id" | "name">[];
    isLoading?: boolean;
    initialVenueId?: string;
}

export function VenueReservationFormDialog({
    isOpen,
    onClose,
    onSubmit,
    venues,
    events,
    departments,
    isLoading = false,
    initialVenueId,
}: VenueReservationFormDialogProps) {
    const form = useForm<CreateVenueReservationFormInput>({
        resolver: valibotResolver(CreateVenueReservationFormSchema),
        defaultValues: {
            eventId: undefined,
            departmentId: undefined,
            venueId: initialVenueId ? Number(initialVenueId) : undefined,
            startTime: undefined,
            endTime: undefined,
            // Default for the input (File[]) should be empty array for FileUpload component
            reservationLetterFile: [],
        },
        mode: "onChange",
    });

    const watchedEventId = form.watch("eventId");
    const selectedEvent = events.find((e) => e.id === watchedEventId);

    // Effect to update date fields when event selection changes
    useEffect(() => {
        if (selectedEvent) {
            try {
                const startTime = parseISO(selectedEvent.startTime);
                const endTime = parseISO(selectedEvent.endTime);
                form.setValue("startTime", startTime, { shouldValidate: true });
                form.setValue("endTime", endTime, { shouldValidate: true });
            } catch (error) {
                console.error("Error parsing event dates:", error);
                form.setValue("startTime", undefined, { shouldValidate: true });
                form.setValue("endTime", undefined, { shouldValidate: true });
            }
        } else {
            // Only clear dates if they were previously set by an event
            const currentStartTime = form.getValues("startTime");
            const currentEndTime = form.getValues("endTime");
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
                form.setValue("startTime", undefined, { shouldValidate: true });
                form.setValue("endTime", undefined, { shouldValidate: true });
            }
        }
    }, [selectedEvent, form.setValue, form.getValues, events]);

    const handleSubmitForm = (data: CreateVenueReservationFormOutput) => {
        // Log the data *after* schema validation/transformation
        // This 'data' should have reservationLetterFile as File | undefined
        console.log(
            "[Dialog] Submitting reservation with validated data:",
            data,
        );
        onSubmit(data);
        // Consider moving reset/close to parent component after successful API call
        // form.reset();
        // onClose();
    };

    const handleDialogClose = () => {
        form.reset();
        onClose();
    };

    const watchedVenueId = form.watch("venueId");
    const selectedVenue = venues.find((v) => v.id === watchedVenueId);

    const isDateTimeReadOnly = !!selectedEvent;

    return (
        <Dialog open={isOpen} onOpenChange={handleDialogClose}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Reserve a Venue</DialogTitle>
                    <DialogDescription>
                        Select the event, department, venue, and specify the
                        date and time for your reservation.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(handleSubmitForm)}
                        className="space-y-5 py-4"
                    >
                        {/* Event Selection */}
                        <FormField
                            control={form.control}
                            name="eventId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Event</FormLabel>
                                    <Select
                                        onValueChange={(value) => {
                                            console.log(
                                                "[Dialog] Event Select changed:",
                                                value,
                                            ); // Log raw value
                                            // Ensure conversion handles empty string correctly
                                            const numValue = value
                                                ? Number(value)
                                                : undefined;
                                            console.log(
                                                "[Dialog] Event ID to set:",
                                                numValue,
                                            ); // Log value being set
                                            field.onChange(numValue); // Set to number or undefined
                                        }}
                                        value={
                                            field.value
                                                ? String(field.value)
                                                : ""
                                        }
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
                                                    value={String(event.id)}
                                                >
                                                    {event.eventName}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormDescription>
                                        Selecting an event will automatically
                                        set the start/end times.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Department Selection */}
                        <FormField
                            control={form.control}
                            name="departmentId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Department</FormLabel>
                                    <Select
                                        onValueChange={(value) => {
                                            console.log(
                                                "[Dialog] Department Select changed:",
                                                value,
                                            ); // Log raw value
                                            // Ensure conversion handles empty string correctly
                                            const numValue = value
                                                ? Number(value)
                                                : undefined;
                                            console.log(
                                                "[Dialog] Department ID to set:",
                                                numValue,
                                            ); // Log value being set
                                            field.onChange(numValue); // Set to number or undefined
                                        }}
                                        value={
                                            field.value
                                                ? String(field.value)
                                                : ""
                                        }
                                    >
                                        <FormControl>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select a department" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {departments.map((dept) => (
                                                <SelectItem
                                                    key={dept.id}
                                                    value={String(dept.id)}
                                                >
                                                    {dept.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Venue Selection */}
                        <FormField
                            control={form.control}
                            name="venueId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Venue</FormLabel>
                                    <Select
                                        onValueChange={(value) => {
                                            const numValue = value
                                                ? Number(value)
                                                : undefined;
                                            field.onChange(numValue);
                                        }}
                                        value={
                                            field.value
                                                ? String(field.value)
                                                : ""
                                        }
                                        disabled={!!initialVenueId}
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
                                                    value={String(venue.id)}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <img
                                                            src={
                                                                venue.imagePath ||
                                                                "/placeholder.svg"
                                                            }
                                                            alt={venue.name}
                                                            className="h-5 w-7 rounded-sm object-cover"
                                                        />
                                                        <span>
                                                            {venue.name}
                                                        </span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {selectedVenue && (
                                        <FormDescription className="flex items-center text-xs pt-1">
                                            <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                                            {selectedVenue.location}
                                        </FormDescription>
                                    )}
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Date/Time Pickers */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="startTime"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Start Date & Time</FormLabel>
                                        <FormControl>
                                            <SmartDatetimeInput
                                                value={field.value}
                                                onValueChange={field.onChange}
                                                disabled={(date) =>
                                                    date <
                                                    startOfDay(new Date())
                                                }
                                                readOnly={isDateTimeReadOnly}
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
                                name="endTime"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>End Date & Time</FormLabel>
                                        <FormControl>
                                            <SmartDatetimeInput
                                                value={field.value}
                                                onValueChange={field.onChange}
                                                disabled={(date) =>
                                                    date <
                                                        startOfDay(
                                                            new Date(),
                                                        ) ||
                                                    (form.getValues(
                                                        "startTime",
                                                    ) &&
                                                        date <
                                                            form.getValues(
                                                                "startTime",
                                                            ))
                                                }
                                                readOnly={isDateTimeReadOnly}
                                                placeholder={
                                                    isDateTimeReadOnly
                                                        ? ""
                                                        : "Select end date and time"
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

                        {/* Reservation Letter Upload */}
                        <FormField
                            control={form.control}
                            name="reservationLetterFile" // Input type is File[]
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        Approved Letter (Optional)
                                    </FormLabel>
                                    <FormControl>
                                        <FileUpload
                                            value={field.value} // Expects File[]
                                            onValueChange={field.onChange} // Provides File[]
                                            maxFiles={1}
                                            maxSize={5 * 1024 * 1024} // 5MB
                                            accept="application/pdf, image/*"
                                            className="relative rounded-lg border border-input bg-background"
                                        >
                                            <FileUploadDropzone className="border-dashed p-4">
                                                <CloudUpload className="mb-2 h-8 w-8 text-muted-foreground" />
                                                <p className="mb-1 text-sm text-muted-foreground">
                                                    <span className="font-semibold">
                                                        Click or drag file
                                                    </span>{" "}
                                                    to upload
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    PDF or Image (max 5MB)
                                                </p>
                                            </FileUploadDropzone>
                                            <FileUploadList className="p-3">
                                                {/* field.value is File[] here */}
                                                {field.value?.map((file) => (
                                                    <FileUploadItem
                                                        key={file.name}
                                                        value={file}
                                                        className="p-2"
                                                    >
                                                        <FileUploadItemPreview />
                                                        <FileUploadItemMetadata />
                                                        <FileUploadItemDelete
                                                            asChild
                                                        >
                                                            <Button
                                                                type="button"
                                                                size="icon"
                                                                variant="ghost"
                                                                className="size-7"
                                                                // onClick needs to remove the file from the array
                                                                onClick={() =>
                                                                    field.onChange(
                                                                        [],
                                                                    )
                                                                } // Clear the array
                                                            >
                                                                <X className="size-4" />
                                                            </Button>
                                                        </FileUploadItemDelete>
                                                    </FileUploadItem>
                                                ))}
                                            </FileUploadList>
                                        </FileUpload>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleDialogClose}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={!form.formState.isValid || isLoading}
                            >
                                {isLoading
                                    ? "Submitting..."
                                    : "Submit Reservation"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
