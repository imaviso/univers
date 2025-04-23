import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
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
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { createEvent } from "@/lib/api";
import { eventsQueryOptions, useCurrentUser } from "@/lib/query"; // Import eventsQueryOptions
import { type EventInput, type EventOutput, eventSchema } from "@/lib/schema";
import type { EventDTOPayload, Venue } from "@/lib/types";
import { cn } from "@/lib/utils";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { useMutation } from "@tanstack/react-query"; // Import mutation hooks
import { useRouteContext } from "@tanstack/react-router";
import { startOfDay } from "date-fns";
import { Check, ChevronsUpDown, Loader2, UploadCloud, X } from "lucide-react";
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
} from "../ui/file-upload";
import { SmartDatetimeInput } from "../ui/smart-date-picker";

interface EventModalProps {
    isOpen: boolean;
    onClose: () => void;
    venues: Venue[];
}

const eventTypes = ["External", "Program-based", "Admin", "SSG/Advocay-based"];

export function EventModal({ isOpen, onClose, venues }: EventModalProps) {
    const { data: currentUser } = useCurrentUser();
    const context = useRouteContext({ from: "/app/events/timeline" });
    const queryClient = context.queryClient;

    // Remove local isSubmitting state, use mutation.isPending instead
    // const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<EventInput>({
        resolver: valibotResolver(eventSchema),
        defaultValues: {
            eventName: "",
            eventType: undefined,
            eventVenueId: undefined,
            startTime: undefined,
            endTime: undefined,
            approvedLetter: [],
        },
    });

    // --- Mutation ---
    const createEventMutation = useMutation({
        mutationFn: ({
            eventDTO,
            approvedLetter,
        }: {
            eventDTO: Parameters<typeof createEvent>[0]; // Get type from api function
            approvedLetter: Parameters<typeof createEvent>[1];
        }) => createEvent(eventDTO, approvedLetter), // Call the API function
        onSuccess: (createdEvent) => {
            // Invalidate the events query to refetch data
            queryClient.invalidateQueries({
                queryKey: eventsQueryOptions.queryKey,
            });
            toast.success("Event Created", {
                description: `Event ${createdEvent.eventName} created successfully.`,
            });
            onClose(); // Close modal on success
            form.reset(); // Reset form
        },
        onError: (error) => {
            console.error("Mutation error", error);
            toast.error(
                `Failed to create event: ${error instanceof Error ? error.message : "Please try again."}`,
            );
        },
    });
    // --- End Mutation ---

    // Updated onSubmit function
    async function onSubmit(values: EventInput) {
        if (!currentUser?.id) {
            toast.error("You must be logged in to create an event.");
            return;
        }

        // No need for manual try/catch or setIsSubmitting
        try {
            const outputValues = values as unknown as EventOutput;
            const eventDTO: EventDTOPayload = {
                eventName: outputValues.eventName,
                eventType: outputValues.eventType,
                eventVenueId: outputValues.eventVenueId,
                startTime: outputValues.startTime.toISOString(),
                endTime: outputValues.endTime.toISOString(),
                organizer: {
                    id: Number.parseInt(currentUser.id),
                },
            };

            // Trigger the mutation
            createEventMutation.mutate({
                eventDTO,
                approvedLetter: outputValues.approvedLetter,
            });
        } catch (validationError) {
            // This catch is primarily for potential issues *before* mutation.mutate
            // e.g., unexpected errors during DTO preparation, though unlikely here.
            console.error("Pre-mutation error:", validationError);
            toast.error("An unexpected error occurred before submitting.");
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle className="text-xl">
                        Create New Event
                    </DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <Form {...form}>
                        <form
                            onSubmit={form.handleSubmit(onSubmit)}
                            className="grid grid-cols-2 gap-4"
                        >
                            {/* Event Name */}
                            <div className="col-span-2">
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
                                                    // Use mutation pending state
                                                    disabled={
                                                        createEventMutation.isPending
                                                    }
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Event Type */}
                            <FormField
                                control={form.control}
                                name="eventType"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Event Type</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                            // Use mutation pending state
                                            disabled={
                                                createEventMutation.isPending
                                            }
                                        >
                                            <FormControl>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Select event type" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {eventTypes.map((type) => (
                                                    <SelectItem
                                                        key={type}
                                                        value={type}
                                                    >
                                                        {type}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Venue */}
                            <FormField
                                control={form.control}
                                name="eventVenueId"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Venue</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant="outline"
                                                        // role="combobox"
                                                        // Use mutation pending state
                                                        disabled={
                                                            createEventMutation.isPending
                                                        }
                                                        className={cn(
                                                            "w-full justify-between",
                                                            !field.value &&
                                                                "text-muted-foreground",
                                                        )}
                                                    >
                                                        {field.value
                                                            ? venues.find(
                                                                  (v) =>
                                                                      v.id ===
                                                                      field.value,
                                                              )?.name
                                                            : "Select venue"}
                                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                                {/* Command content remains the same */}
                                                <Command>
                                                    <CommandInput placeholder="Search venue..." />
                                                    <CommandList>
                                                        <CommandEmpty>
                                                            No venue found.
                                                        </CommandEmpty>
                                                        <CommandGroup>
                                                            {venues.map(
                                                                (venue) => (
                                                                    <CommandItem
                                                                        value={
                                                                            venue.name
                                                                        }
                                                                        key={
                                                                            venue.id
                                                                        }
                                                                        onSelect={() => {
                                                                            form.setValue(
                                                                                "eventVenueId",
                                                                                venue.id,
                                                                                {
                                                                                    shouldValidate: true,
                                                                                },
                                                                            );
                                                                        }}
                                                                    >
                                                                        <Check
                                                                            className={cn(
                                                                                "mr-2 h-4 w-4",
                                                                                venue.id ===
                                                                                    field.value
                                                                                    ? "opacity-100"
                                                                                    : "opacity-0",
                                                                            )}
                                                                        />
                                                                        {
                                                                            venue.name
                                                                        }
                                                                    </CommandItem>
                                                                ),
                                                            )}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Start Date & Time */}
                            <div>
                                <FormField
                                    control={form.control}
                                    name="startTime"
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
                                                            ) ||
                                                        // Use mutation pending state
                                                        createEventMutation.isPending
                                                    }
                                                    placeholder="Select start date and time"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* End Date & Time */}
                            <div>
                                <FormField
                                    control={form.control}
                                    name="endTime"
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
                                                            (form.getValues(
                                                                "startTime",
                                                            ) ||
                                                                startOfDay(
                                                                    new Date(),
                                                                )) ||
                                                        // Use mutation pending state
                                                        createEventMutation.isPending
                                                    }
                                                    placeholder="Select end date and time"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Approved Letter */}
                            <div className="col-span-2">
                                <FormField
                                    control={form.control}
                                    name="approvedLetter"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Approved Letter
                                            </FormLabel>
                                            <FormControl>
                                                <FileUpload
                                                    value={field.value} // Expects File[]
                                                    onValueChange={
                                                        field.onChange
                                                    } // Provides File[]
                                                    maxFiles={1}
                                                    maxSize={5 * 1024 * 1024} // 5MB
                                                    accept=".pdf, image/*"
                                                    disabled={
                                                        createEventMutation.isPending
                                                    }
                                                    className="relative rounded-lg border border-input bg-background"
                                                >
                                                    <FileUploadDropzone className="border-dashed p-4">
                                                        <UploadCloud className="mb-2 h-8 w-8 text-muted-foreground" />
                                                        <p className="mb-1 text-sm text-muted-foreground">
                                                            <span className="font-semibold">
                                                                Click or drag
                                                                file
                                                            </span>{" "}
                                                            to upload
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            PDF or Image (max
                                                            5MB)
                                                        </p>
                                                    </FileUploadDropzone>
                                                    <FileUploadList className="p-3">
                                                        {field.value?.map(
                                                            (file) => (
                                                                <FileUploadItem
                                                                    key={
                                                                        file.name
                                                                    }
                                                                    value={file}
                                                                    className="p-2"
                                                                >
                                                                    <FileUploadItemPreview>
                                                                        {/* Default preview handles images/file icons */}
                                                                    </FileUploadItemPreview>
                                                                    <FileUploadItemMetadata />
                                                                    <FileUploadItemDelete
                                                                        asChild
                                                                    >
                                                                        <Button
                                                                            type="button"
                                                                            size="icon"
                                                                            variant="ghost"
                                                                            className="size-7"
                                                                        >
                                                                            <X className="size-4" />
                                                                        </Button>
                                                                    </FileUploadItemDelete>
                                                                </FileUploadItem>
                                                            ),
                                                        )}
                                                    </FileUploadList>
                                                </FileUpload>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Footer */}
                            <DialogFooter className="col-span-2">
                                <Button
                                    variant="outline"
                                    type="button" // Ensure it doesn't submit form
                                    onClick={onClose}
                                    disabled={createEventMutation.isPending}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={
                                        createEventMutation.isPending ||
                                        !form.formState.isValid // Also disable if form is invalid
                                    }
                                >
                                    {createEventMutation.isPending && (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    )}
                                    Create Event
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
