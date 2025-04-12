import { describe } from "node:test";
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
import { SmartDatetimeInput } from "@/components/ui/smart-datetime-input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { type EventInput, eventSchema } from "@/lib/schema";
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
    const [date, setDate] = useState<Date>();

    const form = useForm<EventInput>({
        resolver: valibotResolver(eventSchema),
        defaultValues: {
            startTime: new Date(),
            endTime: new Date(),
        },
    });

    function onSubmit(values: EventInput) {
        try {
            console.log(values);
            toast("Event Created", {
                description: `Event ${values.eventName} has been created successfully.`,
            });
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
                            <div className="grid col-span-2 gap-2">
                                <FormField
                                    control={form.control}
                                    name="eventName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Event Name</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Enter event name"
                                                    type=""
                                                    {...field}
                                                />
                                            </FormControl>

                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid gap-2">
                                <FormField
                                    control={form.control}
                                    name="status"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Status</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
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
                            </div>

                            <div className="col-span-1">
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
                                                                      (
                                                                          facility,
                                                                      ) =>
                                                                          facility.value ===
                                                                          field.value,
                                                                  )?.label
                                                                : "Select facility"}
                                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent>
                                                    <Command>
                                                        <CommandInput placeholder="Search facility..." />
                                                        <CommandList>
                                                            <CommandEmpty>
                                                                No facility
                                                                found.
                                                            </CommandEmpty>
                                                            <CommandGroup>
                                                                {facilities.map(
                                                                    (
                                                                        facility,
                                                                    ) => (
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
                            </div>

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
                            <div className="col-span-1">
                                <FormField
                                    control={form.control}
                                    name="startTime"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Start Time</FormLabel>
                                            <FormControl>
                                                <SmartDatetimeInput
                                                    value={field.value}
                                                    onValueChange={
                                                        field.onChange
                                                    }
                                                    placeholder="e.g. Tomorrow morning 9am"
                                                />
                                            </FormControl>

                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="col-span-1">
                                <FormField
                                    control={form.control}
                                    name="endTime"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>End Time</FormLabel>
                                            <FormControl>
                                                <SmartDatetimeInput
                                                    value={field.value}
                                                    onValueChange={
                                                        field.onChange
                                                    }
                                                    placeholder="e.g. Tomorrow morning 9am"
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

                                                <FormMessage />
                                            </div>
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <DialogFooter className="col-span-2">
                                {/* <Button variant="outline" onClick={onClose}>
									Cancel
								</Button> */}
                                <Button type="submit">Create Event</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
