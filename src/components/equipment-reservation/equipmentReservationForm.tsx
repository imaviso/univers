import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
import { cn } from "@/lib/utils";
import EquipmentList from "./equipmentList";

// Form schema
const formSchema = z.object({
    eventId: z.string({
        required_error: "Please select an event.",
    }),
    venueId: z.string({
        required_error: "Please select a venue.",
    }),
    startDate: z.date({
        required_error: "Please select a start date.",
    }),
    endDate: z.date({
        required_error: "Please select an end date.",
    }),
    startTime: z.string({
        required_error: "Please enter a start time.",
    }),
    endTime: z.string({
        required_error: "Please enter an end time.",
    }),
    purpose: z.string().optional(),
    selectedEquipment: z.array(z.string()).min(1, {
        message: "Please select at least one equipment.",
    }),
});

// Define the props interface
interface EquipmentReservationFormDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: z.infer<typeof formSchema>) => void;
    events: { id: string; name: string }[];
    venues: { id: string; name: string; capacity: number }[];
    isLoading?: boolean;
}

export function EquipmentReservationFormDialog({
    isOpen,
    onClose,
    onSubmit,
    events,
    venues,
    isLoading = false,
}: EquipmentReservationFormDialogProps) {
    const [step, setStep] = useState(1);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            purpose: "",
            selectedEquipment: [],
        },
        mode: "onChange",
    });

    // Step validation logic
    const isStep1Valid = () => {
        const { eventId } = form.getValues();
        return !!eventId; 
    };

    const isStep2Valid = () => {
        const { venueId, startDate, endDate, startTime, endTime } =
            form.getValues();

        // Validate that venueId is not empty and that date and time values are valid
        return (
            !!venueId &&
            startDate instanceof Date &&
            !isNaN(startDate.getTime()) && // Ensure startDate is a valid Date object
            endDate instanceof Date &&
            !isNaN(endDate.getTime()) && // Ensure endDate is a valid Date object
            !!startTime &&
            !!endTime
        );
    };

    const handleNext = async () => {
        if (step === 1 && isStep1Valid()) {
            setStep(2);
        } else if (step === 2 && isStep2Valid()) {
            setStep(3);
        }
    };

    const handleBack = () => {
        setStep(Math.max(1, step - 1));
    };

    const handleSubmit = (values: z.infer<typeof formSchema>) => {
        onSubmit(values);
        form.reset();
        setStep(1);
        onClose();
    };

    const selectedEquipment = form.watch("selectedEquipment") || [];

    const handleDialogClose = () => {
        form.reset();
        setStep(1);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleDialogClose}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Equipment Reservation</DialogTitle>
                </DialogHeader>

                {/* Progress indicator */}
                <div className="w-full mt-4">
                    <div className="flex justify-between mb-2">
                        <div
                            className={`text-sm font-medium ${step === 1 ? "text-primary" : step > 1 ? "text-muted-foreground" : "text-muted"}`}
                        >
                            Event Details
                        </div>
                        <div
                            className={`text-sm font-medium ${step === 2 ? "text-primary" : step > 2 ? "text-muted-foreground" : "text-muted"}`}
                        >
                            Venue & Schedule
                        </div>
                        <div
                            className={`text-sm font-medium ${step === 3 ? "text-primary" : "text-muted"}`}
                        >
                            Equipment Selection
                        </div>
                    </div>
                    <div className="w-full bg-muted h-2 rounded-full">
                        <div
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${(step - 1) * 50}%` }}
                        />
                    </div>
                </div>

                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(handleSubmit)}
                        className="space-y-6"
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
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select an event" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {events.map((event) => (
                                                        <SelectItem
                                                            key={event.id}
                                                            value={event.id}
                                                        >
                                                            {event.name}
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
                                    name="venueId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Venue</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select a venue" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {venues.map((venue) => (
                                                        <SelectItem
                                                            key={venue.id}
                                                            value={venue.id}
                                                        >
                                                            {venue.name}{" "}
                                                            (Capacity:{" "}
                                                            {venue.capacity})
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="startDate"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                                <FormLabel>
                                                    Start Date
                                                </FormLabel>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <FormControl>
                                                            <Button
                                                                variant={
                                                                    "outline"
                                                                }
                                                                className={cn(
                                                                    "w-full pl-3 text-left font-normal",
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
                                                                        Pick a
                                                                        date
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
                                                            selected={
                                                                field.value
                                                            }
                                                            onSelect={
                                                                field.onChange
                                                            }
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
                                        name="endDate"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                                <FormLabel>End Date</FormLabel>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <FormControl>
                                                            <Button
                                                                variant={
                                                                    "outline"
                                                                }
                                                                className={cn(
                                                                    "w-full pl-3 text-left font-normal",
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
                                                                        Pick a
                                                                        date
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
                                                            selected={
                                                                field.value
                                                            }
                                                            onSelect={
                                                                field.onChange
                                                            }
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
                                            <FormItem>
                                                <FormLabel>
                                                    Start Time
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="time"
                                                        {...field}
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
                                                <FormLabel>End Time</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="time"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </>
                        )}

                        {step === 3 && (
                            <FormField
                                control={form.control}
                                name="selectedEquipment"
                                render={() => (
                                    <FormItem>
                                        <div className="mb-4">
                                            <FormLabel className="text-base">
                                                Select Equipment
                                            </FormLabel>
                                            <FormDescription>
                                                Select the equipment you need
                                                for your event. Unavailable
                                                equipment cannot be selected.
                                            </FormDescription>
                                        </div>
                                        <FormMessage />

                                        <EquipmentList
                                            selectedEquipment={
                                                selectedEquipment
                                            }
                                            onEquipmentChange={(
                                                equipmentIds,
                                            ) => {
                                                form.setValue(
                                                    "selectedEquipment",
                                                    equipmentIds,
                                                    {
                                                        shouldValidate: true,
                                                    },
                                                );
                                            }}
                                        />
                                    </FormItem>
                                )}
                            />
                        )}

                        <DialogFooter>
                            <div className="flex w-full justify-between">
                                <div>
                                    {step > 1 && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={handleBack}
                                        >
                                            Back
                                        </Button>
                                    )}
                                </div>
                                <div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleDialogClose}
                                        className="mr-2"
                                    >
                                        Cancel
                                    </Button>
                                    {step < 3 ? (
                                        <Button
                                            type="button"
                                            onClick={handleNext}
                                            // disabled={
                                            //     (step === 1 &&
                                            //         !isStep1Valid()) ||
                                            //     (step === 2 && !isStep2Valid())
                                            // }
                                        >
                                            Next
                                        </Button>
                                    ) : (
                                        <Button
                                            type="submit"
                                            disabled={
                                                !form.formState.isValid ||
                                                isLoading
                                            }
                                        >
                                            Submit Reservation
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
