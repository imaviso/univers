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
import { updateEvent } from "@/lib/api";
import { allEventsQueryOptions, eventByIdQueryOptions } from "@/lib/query";
import {
    type EditEventInput,
    type EditEventOutput,
    editEventSchema,
} from "@/lib/schema";
import type {
    DepartmentDTO,
    Event,
    EventDTOPayload,
    VenueDTO,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { startOfDay } from "date-fns";
import { Check, ChevronsUpDown, Loader2, UploadCloud, X } from "lucide-react";
import { useEffect, useState } from "react";
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

interface EditEventModalProps {
    isOpen: boolean;
    onClose: () => void;
    event: Event;
    venues: VenueDTO[];
    departments: DepartmentDTO[];
}

const eventTypes = ["External", "Program-based", "Admin", "SSG/Advocay-based"];

export function EditEventModal({
    isOpen,
    onClose,
    event,
    venues,
    departments,
}: EditEventModalProps) {
    const queryClient = useQueryClient();
    const [, setCurrentLetterFilename] = useState<string | null>(null);

    const form = useForm<EditEventInput>({
        resolver: valibotResolver(editEventSchema),
        defaultValues: {
            eventName: "",
            eventType: undefined,
            venuePublicId: undefined,
            departmentPublicId: undefined,
            startTime: undefined,
            endTime: undefined,
            approvedLetter: undefined,
        },
        mode: "onChange",
    });

    useEffect(() => {
        if (isOpen && event) {
            const parseAndValidateDate = (
                dateString: string | null | undefined,
            ): Date | undefined => {
                if (!dateString) return undefined;
                const date = new Date(`${dateString}Z`);
                return date instanceof Date && !Number.isNaN(date.getTime())
                    ? date
                    : undefined;
            };

            const startDate = parseAndValidateDate(event.startTime);
            const endDate = parseAndValidateDate(event.endTime);

            form.reset({
                eventName: event.eventName,
                eventType: event.eventType,
                venuePublicId: event.eventVenue.publicId,
                departmentPublicId: event.department.publicId,
                startTime: startDate,
                endTime: endDate,
                approvedLetter: undefined,
            });
        } else if (!isOpen) {
            form.reset({
                eventName: "",
                eventType: undefined,
                venuePublicId: undefined,
                departmentPublicId: undefined,
                startTime: undefined,
                endTime: undefined,
                approvedLetter: undefined,
            });
            setCurrentLetterFilename(null);
        }
    }, [isOpen, event, form]);

    const updateEventMutation = useMutation({
        mutationFn: updateEvent,
        onSuccess: () => {
            toast.success("Event updated successfully.");
            // Invalidate relevant queries
            queryClient.refetchQueries({
                queryKey: eventByIdQueryOptions(event.publicId).queryKey,
            });
            queryClient.invalidateQueries({
                queryKey: allEventsQueryOptions.queryKey,
            });
            onClose(); // Close modal on success
        },
        onError: (error) => {
            console.error("Update Mutation error", error);
            toast.error(
                `Failed to update event: ${error instanceof Error ? error.message : "Please try again."}`,
            );
            // Optionally reset form state or specific fields on error
            // form.setError("root.serverError", { message: error.message });
        },
    });
    // --- End Mutation ---

    // --- Submit Handler ---
    async function onSubmit(values: EditEventInput) {
        // The schema transforms approvedLetter: File[] to approvedLetter: File
        const outputValues = values as unknown as EditEventOutput;

        // Check if the file in the form is the placeholder or a new file
        const letterFileToSend =
            outputValues.approvedLetter && outputValues.approvedLetter.size > 0 // Real file has size > 0
                ? outputValues.approvedLetter
                : undefined; // Don't send placeholder or if no file

        const eventData: Partial<EventDTOPayload> = {
            eventName: outputValues.eventName,
            eventType: outputValues.eventType,
            venuePublicId: outputValues.venuePublicId,
            departmentPublicId: outputValues.departmentPublicId,
            startTime: outputValues.startTime?.toISOString(),
            endTime: outputValues.endTime?.toISOString(),
        };

        updateEventMutation.mutate({
            eventId: event.publicId,
            eventData,
            approvedLetter: letterFileToSend, // Send the actual file or undefined
        });
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle className="text-xl">Edit Event</DialogTitle>
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
                                                    disabled={
                                                        updateEventMutation.isPending
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
                                            value={field.value} // Use value for controlled component
                                            disabled={
                                                updateEventMutation.isPending
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
                                name="venuePublicId"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Venue</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant="outline"
                                                        disabled={
                                                            updateEventMutation.isPending
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
                                                                      v.publicId ===
                                                                      field.value,
                                                              )?.name
                                                            : "Select venue"}
                                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
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
                                                                            venue.publicId
                                                                        }
                                                                        onSelect={() => {
                                                                            form.setValue(
                                                                                "venuePublicId",
                                                                                venue.publicId,
                                                                                {
                                                                                    shouldValidate: true,
                                                                                },
                                                                            );
                                                                        }}
                                                                    >
                                                                        <Check
                                                                            className={cn(
                                                                                "mr-2 h-4 w-4",
                                                                                venue.publicId ===
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

                            <div className="col-span-2">
                                <FormField
                                    control={form.control}
                                    name="departmentPublicId"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>Department</FormLabel>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant="outline"
                                                            disabled={
                                                                updateEventMutation.isPending
                                                                // || isLoadingDepartments
                                                            }
                                                            className={cn(
                                                                "w-full justify-between",
                                                                !field.value &&
                                                                    "text-muted-foreground",
                                                            )}
                                                        >
                                                            {field.value
                                                                ? departments.find(
                                                                      // Use depts if fetching inside
                                                                      (dept) =>
                                                                          dept.publicId ===
                                                                          field.value,
                                                                  )?.name
                                                                : "Select department"}
                                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                                    <Command>
                                                        <CommandInput placeholder="Search department..." />
                                                        <CommandList>
                                                            {/* {isLoadingDepartments && (
                                                            <div className="p-2 text-center text-sm text-muted-foreground">
                                                                Loading departments...
                                                            </div>
                                                        )} */}
                                                            <CommandEmpty>
                                                                No department
                                                                found.
                                                            </CommandEmpty>
                                                            <CommandGroup>
                                                                {departments.map(
                                                                    // Use depts if fetching inside
                                                                    (dept) => (
                                                                        <CommandItem
                                                                            value={
                                                                                dept.name
                                                                            }
                                                                            key={
                                                                                dept.publicId
                                                                            }
                                                                            onSelect={() => {
                                                                                form.setValue(
                                                                                    "departmentPublicId",
                                                                                    dept.publicId,
                                                                                    {
                                                                                        shouldValidate: true,
                                                                                    },
                                                                                );
                                                                            }}
                                                                        >
                                                                            <Check
                                                                                className={cn(
                                                                                    "mr-2 h-4 w-4",
                                                                                    dept.publicId ===
                                                                                        field.value
                                                                                        ? "opacity-100"
                                                                                        : "opacity-0",
                                                                                )}
                                                                            />
                                                                            {
                                                                                dept.name
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
                            </div>
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
                                                    onValueChange={(date) => {
                                                        if (
                                                            date instanceof
                                                                Date &&
                                                            Number.isNaN(
                                                                date.getTime(),
                                                            )
                                                        ) {
                                                            field.onChange(
                                                                undefined,
                                                            );
                                                        } else {
                                                            field.onChange(
                                                                date,
                                                            );
                                                        }
                                                    }}
                                                    disabled={(date) =>
                                                        date <
                                                            startOfDay(
                                                                new Date(),
                                                            ) ||
                                                        updateEventMutation.isPending
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
                                                    onValueChange={(date) => {
                                                        if (
                                                            date instanceof
                                                                Date &&
                                                            Number.isNaN(
                                                                date.getTime(),
                                                            )
                                                        ) {
                                                            field.onChange(
                                                                undefined,
                                                            );
                                                        } else {
                                                            field.onChange(
                                                                date,
                                                            );
                                                        }
                                                    }}
                                                    disabled={(date) =>
                                                        date <
                                                            startOfDay(
                                                                new Date(),
                                                            ) ||
                                                        updateEventMutation.isPending
                                                    }
                                                    placeholder="Select end date and time"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

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
                                                    value={
                                                        field.value
                                                            ? [field.value]
                                                            : []
                                                    }
                                                    onValueChange={(
                                                        files: File[],
                                                    ) => {
                                                        field.onChange(
                                                            files[0] ||
                                                                undefined,
                                                        );
                                                    }}
                                                    maxFiles={1}
                                                    maxSize={5 * 1024 * 1024}
                                                    accept=".pdf, image/*, .docx, .doc"
                                                    disabled={
                                                        updateEventMutation.isPending
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
                                                            PDF, Image, DOCX,
                                                            DOC (max 5MB)
                                                        </p>
                                                    </FileUploadDropzone>
                                                    <FileUploadList className="p-3">
                                                        {(field.value
                                                            ? [field.value]
                                                            : []
                                                        ).map((file) => (
                                                            <FileUploadItem
                                                                key={file.name}
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
                                                        ))}
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
                                    type="button"
                                    onClick={onClose}
                                    disabled={updateEventMutation.isPending}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={updateEventMutation.isPending}
                                >
                                    {updateEventMutation.isPending && (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    )}
                                    Save Changes
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
