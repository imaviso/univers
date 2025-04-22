import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
    type VenueReservationFormDialogInput,
    venueReservationFormDialogSchema,
} from "@/lib/schema";
import type { Venue as VenueType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { format, startOfDay } from "date-fns";
import { CalendarIcon, CloudUpload, MapPin, Users, X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
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
    onSubmit: (data: VenueReservationFormDialogInput) => void;
    venues: VenueType[];
    departments: string[];
    isLoading?: boolean;
}

export function VenueReservationFormDialog({
    isOpen,
    onClose,
    onSubmit,
    venues,
    departments,
    isLoading = false,
}: VenueReservationFormDialogProps) {
    const [step, setStep] = useState(1);

    const form = useForm<VenueReservationFormDialogInput>({
        resolver: valibotResolver(venueReservationFormDialogSchema),
        defaultValues: {
            eventName: "",
            department: "",
            description: "",
            startDateTime: undefined,
            endDateTime: undefined,
            venue: "",
            equipment: [],
            approvedLetter: [],
        },
        mode: "onChange",
    });

    const handleSubmitForm = (data: VenueReservationFormDialogInput) => {
        onSubmit(data);
        form.reset();
        setStep(1);
        onClose();
    };

    const selectedVenue = venues.find(
        (v) => v.id === Number(form.watch("venue")),
    );

    const handleNext = async () => {
        console.log("handleNext called, current step:", step);
        let fieldsToValidate: (keyof VenueReservationFormDialogInput)[] = [];
        let isValid = false;

        if (step === 1) {
            // Validate fields required by schema for Step 1
            fieldsToValidate = [
                "eventName",
                "department",
                // 'description' is optional
            ];
            isValid = await form.trigger(fieldsToValidate);
            if (isValid) {
                setStep(2);
            }
        } else if (step === 2) {
            // Validate fields required by schema for Step 2
            fieldsToValidate = ["venue"];
            isValid = await form.trigger(fieldsToValidate);
            if (isValid) {
                setStep(3);
            }
        } else if (step === 3) {
            // Validate fields required by schema for Step 3
            fieldsToValidate = [
                "startDateTime",
                "endDateTime",
                "equipment",
                "approvedLetter",
            ];
            isValid = await form.trigger(fieldsToValidate);
            if (isValid) {
                setStep(4); // Proceed to Step 4 (Summary)
            }
        }
    };

    const handleBack = () => {
        setStep(step - 1);
    };

    const handleDialogClose = () => {
        form.reset();
        setStep(1);
        onClose();
    };

    const isStep1ButtonDisabled = () => {
        const errors = form.formState.errors;
        return !!(errors.eventName || errors.department);
    };

    const isStep2ButtonDisabled = () => {
        const errors = form.formState.errors;
        return !!errors.venue;
    };

    const isStep3ButtonDisabled = () => {
        const errors = form.formState.errors;
        return !!(
            errors.startDateTime ||
            errors.endDateTime ||
            errors.equipment ||
            errors.approvedLetter
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleDialogClose}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Reserve a Venue</DialogTitle>
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
                            Venue Selection
                        </div>
                        <div
                            className={cn(
                                "transition-colors duration-200",
                                step === 3
                                    ? "text-primary font-semibold"
                                    : step > 3
                                      ? "text-muted-foreground"
                                      : "text-muted",
                            )}
                        >
                            Time & Equipment
                        </div>
                        <div
                            className={cn(
                                "transition-colors duration-200",
                                step === 4
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
                                width: `${Math.max(0, step - 1) * 33.33}%`,
                            }}
                        />
                    </div>
                </div>

                <Form {...form}>
                    <form
                        // onSubmit={form.handleSubmit(handleSubmitForm)}
                        className="space-y-4"
                    >
                        {step === 1 && (
                            <div className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="eventName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Event Name</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Enter event name"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="department"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Department</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                            >
                                                <FormControl>
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Select department" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {departments.map((dept) => (
                                                        <SelectItem
                                                            key={dept}
                                                            value={dept}
                                                        >
                                                            {dept}
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
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem className="md:col-span-2">
                                            <FormLabel>
                                                Event Description
                                            </FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Describe your event"
                                                    className="resize-none"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-6">
                                <FormField
                                    control={form.control}
                                    name="venue"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-lg font-medium mb-4 block">
                                                Available Venues
                                            </FormLabel>
                                            <FormControl>
                                                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                                                    {venues.length > 0 ? (
                                                        venues.map((venue) => (
                                                            <div
                                                                key={venue.id}
                                                                className={cn(
                                                                    "border rounded-lg p-3 cursor-pointer transition-all",
                                                                    field.value ===
                                                                        String(
                                                                            venue.id,
                                                                        )
                                                                        ? "border-primary bg-primary/5"
                                                                        : "hover:border-primary/50",
                                                                )}
                                                                onClick={() =>
                                                                    field.onChange(
                                                                        String(
                                                                            venue.id,
                                                                        ),
                                                                    )
                                                                }
                                                            >
                                                                {/* Venue details */}
                                                                <div className="flex items-start gap-3">
                                                                    <div className="w-20 h-14 rounded overflow-hidden bg-muted">
                                                                        <img
                                                                            src={
                                                                                venue.image ||
                                                                                "/placeholder.svg"
                                                                            }
                                                                            alt={
                                                                                venue.name
                                                                            }
                                                                            className="w-full h-full object-cover"
                                                                        />
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <h4 className="font-medium">
                                                                            {
                                                                                venue.name
                                                                            }
                                                                        </h4>
                                                                        <div className="flex items-center text-sm text-muted-foreground mt-1">
                                                                            <MapPin className="h-3.5 w-3.5 mr-1" />
                                                                            <span>
                                                                                {
                                                                                    venue.location
                                                                                }
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="text-center py-8 text-muted-foreground">
                                                            No venues available.
                                                        </div>
                                                    )}
                                                </div>
                                            </FormControl>
                                            <FormMessage />{" "}
                                            {/* Show error if venue not selected */}
                                        </FormItem>
                                    )}
                                />
                            </div>
                        )}

                        {/* Step 3 Content */}
                        {step === 3 && selectedVenue && (
                            <div className="space-y-6">
                                {/* Date/Time Pickers */}
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

                                {/* Equipment Selection */}
                                <FormField
                                    control={form.control}
                                    name="equipment"
                                    render={() => (
                                        <FormItem>
                                            <FormLabel>
                                                Equipment Needed (Select at
                                                least one)
                                            </FormLabel>
                                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2">
                                                {[
                                                    "Projector",
                                                    "Microphone",
                                                    "Laptop",
                                                    "Sound System",
                                                    "Whiteboard",
                                                    // Add more equipment options if needed
                                                ].map((item) => (
                                                    <FormField
                                                        key={item}
                                                        control={form.control}
                                                        name="equipment"
                                                        render={({ field }) => {
                                                            return (
                                                                <FormItem
                                                                    key={item}
                                                                    className="flex flex-row items-center space-x-3 space-y-0"
                                                                >
                                                                    <FormControl>
                                                                        <Checkbox
                                                                            checked={field.value?.includes(
                                                                                item,
                                                                            )}
                                                                            onCheckedChange={(
                                                                                checked,
                                                                            ) => {
                                                                                return checked
                                                                                    ? field.onChange(
                                                                                          [
                                                                                              ...field.value,
                                                                                              item,
                                                                                          ],
                                                                                      )
                                                                                    : field.onChange(
                                                                                          field.value?.filter(
                                                                                              (
                                                                                                  value,
                                                                                              ) =>
                                                                                                  value !==
                                                                                                  item,
                                                                                          ),
                                                                                      );
                                                                            }}
                                                                        />
                                                                    </FormControl>
                                                                    <FormLabel className="font-normal text-sm">
                                                                        {item}
                                                                    </FormLabel>
                                                                </FormItem>
                                                            );
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                            <FormMessage />{" "}
                                            {/* Shows minLength error */}
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
                                                Approved Letter (Upload at least
                                                one)
                                            </FormLabel>
                                            <FormControl>
                                                <FileUpload
                                                    value={field.value}
                                                    onValueChange={
                                                        field.onChange
                                                    }
                                                    // Match schema: JPG/PNG, max 10MB
                                                    accept="image/jpeg, image/png"
                                                    maxFiles={1} // Schema implies 1 file based on array(file()) structure
                                                    maxSize={10 * 1024 * 1024} // 10MB
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
                                                                        ?.reason ??
                                                                    "File rejected",
                                                            },
                                                        );
                                                    }}
                                                    multiple={false} // Ensure only one file selection
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
                                                                    key={index}
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
                                                Upload one approved letter
                                                (JPG/PNG, max 10MB).
                                            </FormDescription>
                                            <FormMessage />{" "}
                                            {/* Shows file errors */}
                                        </FormItem>
                                    )}
                                />
                            </div>
                        )}
                        {/* Step 4: Reservation Summary */}
                        {step === 4 && selectedVenue && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium">
                                    Reservation Summary
                                </h3>
                                <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
                                    {/* Venue Details */}
                                    <div className="pb-2 border-b">
                                        <h5 className="font-medium text-sm mb-1">
                                            Venue
                                        </h5>
                                        <p className="text-sm font-semibold">
                                            {selectedVenue.name}
                                        </p>
                                        <div className="flex items-center text-sm text-muted-foreground mt-1">
                                            <MapPin className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                                            <span>
                                                {selectedVenue.location}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Event Details */}
                                    <div className="pt-2 pb-2 border-b">
                                        <h5 className="font-medium text-sm mb-1">
                                            Event Details
                                        </h5>

                                        <p className="text-sm text-muted-foreground">
                                            Department:{" "}
                                            {form.watch("department")}
                                        </p>
                                        {form.watch("description") && (
                                            <p className="text-sm text-muted-foreground mt-1">
                                                Description:{" "}
                                                {form.watch("description")}
                                            </p>
                                        )}
                                    </div>

                                    {/* Time & Date */}
                                    <div className="pt-2 pb-2 border-b">
                                        <h5 className="font-medium text-sm mb-1">
                                            Schedule
                                        </h5>
                                        <div className="flex items-center text-sm">
                                            <CalendarIcon className="h-3.5 w-3.5 mr-1.5 text-muted-foreground flex-shrink-0" />
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

                                    {/* Equipment */}
                                    {form.watch("equipment").length > 0 && (
                                        <div className="pt-2 pb-2 border-b">
                                            <h5 className="font-medium text-sm mb-1">
                                                Selected Equipment
                                            </h5>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {form
                                                    .watch("equipment")
                                                    .map((item) => (
                                                        <Badge
                                                            key={item}
                                                            variant="secondary"
                                                            className="text-xs"
                                                        >
                                                            {item}
                                                        </Badge>
                                                    ))}
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
                                                        <li
                                                            key={index}
                                                            className="break-words"
                                                        >
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
                                {/* Cancel Button */}
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleDialogClose}
                                >
                                    Cancel
                                </Button>

                                <div className="flex gap-2">
                                    {/* Back Button */}
                                    {step > 1 && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={handleBack}
                                        >
                                            Back
                                        </Button>
                                    )}

                                    {/* Next Button - Show only before Step 4 */}
                                    {step < 4 && (
                                        <Button
                                            type="button"
                                            onClick={handleNext}
                                            // Disable based on schema errors for the current step's fields
                                            disabled={
                                                (step === 1 &&
                                                    isStep1ButtonDisabled()) ||
                                                (step === 2 &&
                                                    isStep2ButtonDisabled()) ||
                                                (step === 3 &&
                                                    isStep3ButtonDisabled())
                                            }
                                        >
                                            Next
                                        </Button>
                                    )}

                                    {/* Submit Button - Show only on Step 4 */}
                                    {step === 4 && (
                                        <Button
                                            // Trigger final validation and submission
                                            onClick={form.handleSubmit(
                                                handleSubmitForm,
                                            )}
                                            // Disable if overall form is invalid (based on schema) or loading
                                            disabled={
                                                !form.formState.isValid ||
                                                isLoading
                                            }
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
