import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Textarea } from "@/components/ui/textarea";
import { type EventInput, eventSchema } from "@/lib/schema";
import { cn } from "@/lib/utils";
import { combineDateTime, timeOptions } from "@/lib/utils";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { format, isBefore, setHours, setMinutes } from "date-fns"; // Added date-fns functions
import { CalendarIcon, Check, ChevronsUpDown } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Calendar } from "../ui/calendar";
interface EventModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const facilities = [
    {
        label: "Main Hall",
        value: "main-hall",
    },
    {
        label: "Conference Room A",
        value: "conf-room-a",
    },
    {
        label: "Conference Room B",
        value: "conf-room-b",
    },
    {
        label: "Auditorium",
        value: "auditorium",
    },
    {
        label: "Meeting Room 1",
        value: "meeting-room-1",
    },
    {
        label: "Meeting Room 2",
        value: "meeting-room-2",
    },
] as const;

export function EventModal({ isOpen, onClose }: EventModalProps) {
    const [startDateOpen, setStartDateOpen] = useState(false);
    const [endDateOpen, setEndDateOpen] = useState(false);

    const form = useForm<EventInput>({
        resolver: valibotResolver(eventSchema), // Ensure eventSchema uses startDate, startTime, endDate, endTime
        defaultValues: {
            // Update default values according to the modified schema
            eventName: "",
            status: undefined,
            facility: undefined,
            description: "",
            startDate: new Date(),
            startTime: "09:00", // Default start time
            endDate: new Date(),
            endTime: "17:00", // Default end time
            allDay: false,
        },
    });

    // Watch allDay field to conditionally disable time inputs
    const allDay = form.watch("allDay");

    function onSubmit(values: EventInput) {
        try {
            // Combine date and time before submission if your backend expects Date objects
            const combinedStart = combineDateTime(
                values.startDate,
                values.startTime,
            );
            const combinedEnd = combineDateTime(values.endDate, values.endTime);

            // Prepare the final data payload (adjust as needed for your API)
            const submissionData = {
                ...values,
                // Replace separate date/time with combined Date objects if needed
                startTime: combinedStart,
                endTime: combinedEnd,
                // Remove startDate, startTime, endDate, endTime if not needed in final payload
                // startDate: undefined,
                // startTime: undefined,
                // endDate: undefined,
                // endTime: undefined,
            };

            console.log("Form Values:", values);
            console.log("Combined Start:", combinedStart);
            console.log("Combined End:", combinedEnd);
            console.log("Submission Data:", submissionData);

            // Replace console.log with your actual API call
            toast("Event Created", {
                description: `Event ${values.eventName} has been created successfully.`,
            });
            onClose(); // Close modal on success
            form.reset(); // Reset form
        } catch (error) {
            console.error("Form submission error", error);
            toast.error("Failed to submit the form. Please try again.");
        }
    }

    // Reset time fields when allDay is checked
    useEffect(() => {
        if (allDay) {
            form.setValue("startTime", "00:00");
            form.setValue("endTime", "23:59"); // Or adjust as needed for all-day logic
        }
    }, [allDay, form]);

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
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Status */}
                            <FormField
                                control={form.control}
                                name="status"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Status</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Select Status" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="Pending">
                                                    Pending
                                                </SelectItem>
                                                <SelectItem value="Confirmed">
                                                    Confirmed
                                                </SelectItem>
                                                <SelectItem value="Completed">
                                                    Completed
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Facility */}
                            <FormField
                                control={form.control}
                                name="facility"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Facility</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        className={cn(
                                                            "justify-between",
                                                            !field.value &&
                                                                "text-muted-foreground",
                                                        )}
                                                    >
                                                        {field.value
                                                            ? facilities.find(
                                                                  (facility) =>
                                                                      facility.value ===
                                                                      field.value,
                                                              )?.label
                                                            : "Select facility"}
                                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                                <Command>
                                                    <CommandInput placeholder="Search facility..." />
                                                    <CommandList>
                                                        <CommandEmpty>
                                                            No facility found.
                                                        </CommandEmpty>
                                                        <CommandGroup>
                                                            {facilities.map(
                                                                (facility) => (
                                                                    <CommandItem
                                                                        value={
                                                                            facility.label
                                                                        }
                                                                        key={
                                                                            facility.value
                                                                        }
                                                                        onSelect={() => {
                                                                            form.setValue(
                                                                                "facility",
                                                                                facility.value,
                                                                            );
                                                                        }}
                                                                    >
                                                                        <Check
                                                                            className={cn(
                                                                                "mr-2 h-4 w-4",
                                                                                facility.value ===
                                                                                    field.value
                                                                                    ? "opacity-100"
                                                                                    : "opacity-0",
                                                                            )}
                                                                        />
                                                                        {
                                                                            facility.label
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

                            {/* Start Date and Time */}
                            <div className="col-span-2 grid grid-cols-2 gap-2">
                                <FormField
                                    control={form.control}
                                    name="startDate"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col col-span-1">
                                            <FormLabel>Start Date</FormLabel>
                                            <Popover
                                                open={startDateOpen}
                                                onOpenChange={setStartDateOpen}
                                            >
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant={"outline"}
                                                            className={cn(
                                                                "pl-3 text-left font-normal",
                                                                !field.value &&
                                                                    "text-muted-foreground",
                                                            )}
                                                        >
                                                            {field.value ? (
                                                                format(
                                                                    field.value,
                                                                    "PPP",
                                                                )
                                                            ) : (
                                                                <span>
                                                                    Pick a date
                                                                </span>
                                                            )}
                                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent
                                                    className="w-auto p-0"
                                                    align="start"
                                                >
                                                    <Calendar
                                                        mode="single"
                                                        selected={field.value}
                                                        onSelect={(date) => {
                                                            if (!date) return; // Handle null date selection if necessary
                                                            field.onChange(
                                                                date,
                                                            );
                                                            // Auto-update end date if it's before new start date
                                                            const endDate =
                                                                form.getValues(
                                                                    "endDate",
                                                                );
                                                            if (
                                                                endDate &&
                                                                isBefore(
                                                                    endDate,
                                                                    date,
                                                                )
                                                            ) {
                                                                form.setValue(
                                                                    "endDate",
                                                                    date,
                                                                );
                                                            }
                                                            // Clear potential errors when date changes
                                                            form.clearErrors([
                                                                "endDate",
                                                                "endTime",
                                                            ]);
                                                            setStartDateOpen(
                                                                false,
                                                            ); // Close popover on selection
                                                        }}
                                                        initialFocus
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="startTime"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col col-span-1">
                                            <FormLabel>Start Time</FormLabel>
                                            <Select
                                                onValueChange={(value) => {
                                                    field.onChange(value);
                                                    // Clear potential errors when time changes
                                                    form.clearErrors([
                                                        "endDate",
                                                        "endTime",
                                                    ]);
                                                }}
                                                defaultValue={field.value}
                                                disabled={allDay} // Disable if allDay is checked
                                            >
                                                <FormControl>
                                                    <SelectTrigger
                                                        className="w-full"
                                                        disabled={allDay}
                                                    >
                                                        <SelectValue placeholder="Select time" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {timeOptions.map(
                                                        (option) => (
                                                            <SelectItem
                                                                key={
                                                                    option.value
                                                                }
                                                                value={
                                                                    option.value
                                                                }
                                                            >
                                                                {option.label}
                                                            </SelectItem>
                                                        ),
                                                    )}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* End Date and Time */}
                            <div className="col-span-2 grid grid-cols-2 gap-2">
                                <FormField
                                    control={form.control}
                                    name="endDate"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col col-span-1">
                                            <FormLabel>End Date</FormLabel>
                                            <Popover
                                                open={endDateOpen}
                                                onOpenChange={setEndDateOpen}
                                            >
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant={"outline"}
                                                            className={cn(
                                                                "pl-3 text-left font-normal",
                                                                !field.value &&
                                                                    "text-muted-foreground",
                                                            )}
                                                        >
                                                            {field.value ? (
                                                                format(
                                                                    field.value,
                                                                    "PPP",
                                                                )
                                                            ) : (
                                                                <span>
                                                                    Pick a date
                                                                </span>
                                                            )}
                                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent
                                                    className="w-auto p-0"
                                                    align="start"
                                                >
                                                    <Calendar
                                                        mode="single"
                                                        selected={field.value}
                                                        onSelect={(date) => {
                                                            if (!date) return; // Handle null date selection
                                                            field.onChange(
                                                                date,
                                                            );
                                                            // Clear potential errors when date changes
                                                            form.clearErrors([
                                                                "endDate",
                                                                "endTime",
                                                            ]);
                                                            setEndDateOpen(
                                                                false,
                                                            ); // Close popover on selection
                                                        }}
                                                        // Prevent selecting end date strictly before start date
                                                        disabled={(date) => {
                                                            const startDate =
                                                                form.getValues(
                                                                    "startDate",
                                                                );
                                                            // Disable if startDate exists and the current date is strictly before startDate
                                                            return startDate
                                                                ? isBefore(
                                                                      date,
                                                                      startDate,
                                                                  )
                                                                : false;
                                                        }}
                                                        initialFocus
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="endTime"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col col-span-1">
                                            <FormLabel>End Time</FormLabel>
                                            <Select
                                                onValueChange={(value) => {
                                                    field.onChange(value);
                                                    // Clear potential errors when time changes
                                                    form.clearErrors([
                                                        "endDate",
                                                        "endTime",
                                                    ]);
                                                }}
                                                defaultValue={field.value}
                                                disabled={allDay} // Disable if allDay is checked
                                            >
                                                <FormControl>
                                                    <SelectTrigger
                                                        className="w-full"
                                                        disabled={allDay}
                                                    >
                                                        <SelectValue placeholder="Select time" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {timeOptions.map(
                                                        (option) => (
                                                            <SelectItem
                                                                key={
                                                                    option.value
                                                                }
                                                                value={
                                                                    option.value
                                                                }
                                                            >
                                                                {option.label}
                                                            </SelectItem>
                                                        ),
                                                    )}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* All Day Checkbox */}
                            <div className="col-span-2">
                                <FormField
                                    control={form.control}
                                    name="allDay"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value}
                                                    onCheckedChange={
                                                        field.onChange
                                                    }
                                                />
                                            </FormControl>
                                            <div className="space-y-1 leading-none">
                                                <FormLabel>All day</FormLabel>
                                                <FormDescription>
                                                    Does this event last the
                                                    entire day?
                                                </FormDescription>
                                                <FormMessage />
                                            </div>
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Description */}
                            <div className="col-span-2">
                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Description</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Enter event description"
                                                    className="resize-none"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            {/* Footer */}
                            <DialogFooter className="col-span-2">
                                <Button variant="outline" onClick={onClose}>
                                    Cancel
                                </Button>
                                <Button type="submit">Create Event</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
