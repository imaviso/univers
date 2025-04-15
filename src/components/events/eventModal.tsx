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
import { valibotResolver } from "@hookform/resolvers/valibot";
import {
    startOfDay,
} from "date-fns";
import { Check, ChevronsUpDown } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { SmartDatetimeInput } from "../ui/smart-date-picker";

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
    const form = useForm<EventInput>({
        resolver: valibotResolver(eventSchema), // Ensure eventSchema uses startDate, startTime, endDate, endTime
        defaultValues: {
            // Update default values according to the modified schema
            eventName: "",
            status: undefined,
            facility: undefined,
            description: "",
            startDateTime: undefined,
            endDateTime: undefined,
        },
    });

    function onSubmit(values: EventInput) {
        try {
            const submissionData = {
                ...values,
            };

            console.log("Form Values:", values);
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

                            <div>
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
                                                        date < startOfDay(new Date())
                                                    }
                                                    placeholder="Select start date and time"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div>
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
                                                        date < startOfDay(new Date())
                                                    }
                                                    placeholder="Select end date and time"
                                                />
                                            </FormControl>
                                            <FormMessage />
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
