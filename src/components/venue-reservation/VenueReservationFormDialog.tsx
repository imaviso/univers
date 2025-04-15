import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
import { cn, timeOptions } from "@/lib/utils";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { format, isBefore, isSameDay } from "date-fns"; // Added date-fns functions
import { CalendarIcon, Clock, MapPin, Users } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

export interface VenueType {
    id: number;
    name: string;
    capacity: number;
    location: string;
    amenities: string[];
    image: string;
    availableTimes: string[];
}

interface VenueReservationFormDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: VenueReservationFormDialogInput) => void;
    venues: VenueType[];
    eventTypes: string[];
    departments: string[];
    isLoading?: boolean;
}

export function VenueReservationFormDialog({
    isOpen,
    onClose,
    onSubmit,
    venues,
    eventTypes,
    departments,
    isLoading = false,
}: VenueReservationFormDialogProps) {
    const [step, setStep] = useState(1);
    const [filteredVenues, setFilteredVenues] = useState<VenueType[]>(venues);
    const [startDateOpen, setStartDateOpen] = useState(false);
    const [endDateOpen, setEndDateOpen] = useState(false);

    const form = useForm<VenueReservationFormDialogInput>({
        resolver: valibotResolver(venueReservationFormDialogSchema),
        defaultValues: {
            eventName: "",
            eventType: "",
            department: "",
            contactPerson: "",
            contactEmail: "",
            contactPhone: "",
            attendees: "",
            description: "",
            startDate: new Date(),
            endDate: new Date(),
            startTime: "",
            endTime: "",
            venue: "",
            equipment: [],
        },
        mode: "onChange",
    });

    const allDay = form.watch("allDay");
    const handleSubmitForm = (data: VenueReservationFormDialogInput) => {
        onSubmit(data);
        form.reset();
        setStep(1);
        onClose();
    };

    const selectedVenue = venues.find(
        (v) => v.id === Number(form.watch("venue")),
    );

    const handleNext = () => {
        if (step === 1) {
            // Filter venues based on attendees
            const attendees = Number.parseInt(form.getValues("attendees")) || 0;
            setFilteredVenues(
                venues.filter((venue) => venue.capacity >= attendees),
            );
        }
        setStep(step + 1);
    };

    const handleBack = () => {
        setStep(step - 1);
    };

    const handleDialogClose = () => {
        form.reset();
        setStep(1);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleDialogClose}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Reserve a Venue</DialogTitle>
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
                            Venue Selection
                        </div>
                        <div
                            className={`text-sm font-medium ${step === 3 ? "text-primary" : "text-muted"}`}
                        >
                            Time & Equipment
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
                        onSubmit={form.handleSubmit(handleSubmitForm)}
                        className="space-y-4"
                    >
                        {step === 1 && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="eventName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Event Name
                                                </FormLabel>
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
                                        name="eventType"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Event Type
                                                </FormLabel>
                                                <Select
                                                    onValueChange={
                                                        field.onChange
                                                    }
                                                    defaultValue={field.value}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger className="w-full">
                                                            <SelectValue placeholder="Select event type" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {eventTypes.map(
                                                            (type) => (
                                                                <SelectItem
                                                                    key={type}
                                                                    value={type}
                                                                >
                                                                    {type}
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

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="attendees"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Expected Attendees
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="Enter number of attendees"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="contactPerson"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Contact Person
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="Enter contact person name"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="contactEmail"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Contact Email
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="Enter contact email"
                                                        type="email"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="contactPhone"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Contact Phone
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="Enter contact phone"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
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
                                <div className="grid gap-6">
                                    <div>
                                        <h3 className="text-lg font-medium mb-4">
                                            Available Venues
                                        </h3>
                                        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                                            {filteredVenues.length > 0 ? (
                                                filteredVenues.map((venue) => (
                                                    <div
                                                        key={venue.id}
                                                        className={`border rounded-lg p-3 cursor-pointer transition-all ${
                                                            form.watch(
                                                                "venue",
                                                            ) ===
                                                            String(venue.id)
                                                                ? "border-primary bg-primary/5"
                                                                : "hover:border-primary/50"
                                                        }`}
                                                        onClick={() =>
                                                            form.setValue(
                                                                "venue",
                                                                String(
                                                                    venue.id,
                                                                ),
                                                            )
                                                        }
                                                    >
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
                                                                    {venue.name}
                                                                </h4>
                                                                <div className="flex items-center text-sm text-muted-foreground mt-1">
                                                                    <Users className="h-3.5 w-3.5 mr-1" />
                                                                    <span>
                                                                        Capacity:{" "}
                                                                        {
                                                                            venue.capacity
                                                                        }
                                                                    </span>
                                                                </div>
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
                                                        <div className="flex flex-wrap gap-1 mt-2">
                                                            {venue.amenities
                                                                .slice(0, 3)
                                                                .map(
                                                                    (
                                                                        amenity,
                                                                        index,
                                                                    ) => (
                                                                        <Badge
                                                                            key={
                                                                                index
                                                                            }
                                                                            variant="outline"
                                                                            className="text-xs"
                                                                        >
                                                                            {
                                                                                amenity
                                                                            }
                                                                        </Badge>
                                                                    ),
                                                                )}
                                                            {venue.amenities
                                                                .length > 3 && (
                                                                <Badge
                                                                    variant="outline"
                                                                    className="text-xs"
                                                                >
                                                                    +
                                                                    {venue
                                                                        .amenities
                                                                        .length -
                                                                        3}{" "}
                                                                    more
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-center py-8 text-muted-foreground">
                                                    No venues available for the
                                                    specified number of
                                                    attendees.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 3 && selectedVenue && (
                            <div>
                                <div className="max-w-[700px grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <h3 className="text-lg font-medium mb-4">
                                            Select Date
                                        </h3>
                                        {/* Start Date and Time */}
                                        <div className="col-span-2 grid grid-cols-2 gap-2 p-2 ">
                                            <FormField
                                                control={form.control}
                                                name="startDate"
                                                render={({ field }) => (
                                                    <FormItem className="flex flex-col col-span-1">
                                                        <FormLabel>
                                                            Start Date
                                                        </FormLabel>
                                                        <Popover
                                                            open={startDateOpen}
                                                            onOpenChange={
                                                                setStartDateOpen
                                                            }
                                                        >
                                                            <PopoverTrigger
                                                                asChild
                                                            >
                                                                <FormControl>
                                                                    <Button
                                                                        variant={
                                                                            "outline"
                                                                        }
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
                                                                                Pick
                                                                                a
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
                                                                    onSelect={(
                                                                        date,
                                                                    ) => {
                                                                        if (
                                                                            !date
                                                                        )
                                                                            return; // Handle null date selection if necessary
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
                                                                        form.clearErrors(
                                                                            [
                                                                                "endDate",
                                                                                "endTime",
                                                                            ],
                                                                        );
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
                                                        <FormLabel>
                                                            Start Time
                                                        </FormLabel>
                                                        <Select
                                                            onValueChange={(
                                                                value,
                                                            ) => {
                                                                field.onChange(
                                                                    value,
                                                                );
                                                                // Clear potential errors when time changes
                                                                form.clearErrors(
                                                                    [
                                                                        "endDate",
                                                                        "endTime",
                                                                    ],
                                                                );
                                                            }}
                                                            defaultValue={
                                                                field.value
                                                            }
                                                            disabled={allDay} // Disable if allDay is checked
                                                        >
                                                            <FormControl>
                                                                <SelectTrigger
                                                                    className="w-full"
                                                                    disabled={
                                                                        allDay
                                                                    }
                                                                >
                                                                    <SelectValue placeholder="Select time" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                {timeOptions.map(
                                                                    (
                                                                        option,
                                                                    ) => (
                                                                        <SelectItem
                                                                            key={
                                                                                option.value
                                                                            }
                                                                            value={
                                                                                option.value
                                                                            }
                                                                        >
                                                                            {
                                                                                option.label
                                                                            }
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
                                        <div className="col-span-2 grid grid-cols-2 gap-2 p-2">
                                            <FormField
                                                control={form.control}
                                                name="endDate"
                                                render={({ field }) => (
                                                    <FormItem className="flex flex-col col-span-1">
                                                        <FormLabel>
                                                            End Date
                                                        </FormLabel>
                                                        <Popover
                                                            open={endDateOpen}
                                                            onOpenChange={
                                                                setEndDateOpen
                                                            }
                                                        >
                                                            <PopoverTrigger
                                                                asChild
                                                            >
                                                                <FormControl>
                                                                    <Button
                                                                        variant={
                                                                            "outline"
                                                                        }
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
                                                                                Pick
                                                                                a
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
                                                                    onSelect={(
                                                                        date,
                                                                    ) => {
                                                                        if (
                                                                            !date
                                                                        )
                                                                            return; // Handle null date selection
                                                                        field.onChange(
                                                                            date,
                                                                        );
                                                                        // Clear potential errors when date changes
                                                                        form.clearErrors(
                                                                            [
                                                                                "endDate",
                                                                                "endTime",
                                                                            ],
                                                                        );
                                                                        setEndDateOpen(
                                                                            false,
                                                                        ); // Close popover on selection
                                                                    }}
                                                                    // Prevent selecting end date strictly before start date
                                                                    disabled={(
                                                                        date,
                                                                    ) => {
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
                                                        <FormLabel>
                                                            End Time
                                                        </FormLabel>
                                                        <Select
                                                            onValueChange={(
                                                                value,
                                                            ) => {
                                                                field.onChange(
                                                                    value,
                                                                );
                                                                // Clear potential errors when time changes
                                                                form.clearErrors(
                                                                    [
                                                                        "endDate",
                                                                        "endTime",
                                                                    ],
                                                                );
                                                            }}
                                                            defaultValue={
                                                                field.value
                                                            }
                                                            disabled={allDay} // Disable if allDay is checked
                                                        >
                                                            <FormControl>
                                                                <SelectTrigger
                                                                    className="w-full"
                                                                    disabled={
                                                                        allDay
                                                                    }
                                                                >
                                                                    <SelectValue placeholder="Select time" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                {timeOptions.map(
                                                                    (
                                                                        option,
                                                                    ) => (
                                                                        <SelectItem
                                                                            key={
                                                                                option.value
                                                                            }
                                                                            value={
                                                                                option.value
                                                                            }
                                                                        >
                                                                            {
                                                                                option.label
                                                                            }
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
                                        <div className="col-span-2 p-2">
                                            <FormField
                                                control={form.control}
                                                name="allDay"
                                                render={({ field }) => (
                                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                                        <FormControl>
                                                            <Checkbox
                                                                checked={
                                                                    field.value
                                                                }
                                                                onCheckedChange={
                                                                    field.onChange
                                                                }
                                                            />
                                                        </FormControl>
                                                        <div className="space-y-1 leading-none">
                                                            <FormLabel>
                                                                All day
                                                            </FormLabel>
                                                            <FormMessage />
                                                        </div>
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <div className="space-y-4 p-2">
                                            <div>
                                                <FormField
                                                    control={form.control}
                                                    name="equipment"
                                                    render={() => (
                                                        <FormItem>
                                                            <FormLabel className="text-base">
                                                                Equipment Needed
                                                            </FormLabel>
                                                            <div className="space-y-2 mt-2">
                                                                {[
                                                                    "Projector",
                                                                    "Microphone",
                                                                    "Laptop",
                                                                    "Sound System",
                                                                    "Whiteboard",
                                                                ].map(
                                                                    (item) => (
                                                                        <FormField
                                                                            key={
                                                                                item
                                                                            }
                                                                            control={
                                                                                form.control
                                                                            }
                                                                            name="equipment"
                                                                            render={({
                                                                                field,
                                                                            }) => {
                                                                                return (
                                                                                    <FormItem
                                                                                        key={
                                                                                            item
                                                                                        }
                                                                                        className="flex flex-row items-start space-x-3 space-y-0 py-1"
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
                                                                                        <FormLabel className="font-normal">
                                                                                            {
                                                                                                item
                                                                                            }
                                                                                        </FormLabel>
                                                                                    </FormItem>
                                                                                );
                                                                            }}
                                                                        />
                                                                    ),
                                                                )}
                                                            </div>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-medium mb-4">
                                            Reservation Summary
                                        </h3>
                                        <div className="border rounded-lg p-4 space-y-3">
                                            <div>
                                                <h4 className="font-medium">
                                                    {selectedVenue.name}
                                                </h4>
                                                <div className="flex items-center text-sm text-muted-foreground mt-1">
                                                    <MapPin className="h-3.5 w-3.5 mr-1" />
                                                    <span>
                                                        {selectedVenue.location}
                                                    </span>
                                                </div>
                                                <div className="flex items-center text-sm text-muted-foreground mt-1">
                                                    <Users className="h-3.5 w-3.5 mr-1" />
                                                    <span>
                                                        Capacity:{" "}
                                                        {selectedVenue.capacity}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="pt-2 border-t">
                                                <h5 className="font-medium text-sm mb-1">
                                                    Event Details
                                                </h5>
                                                <p className="text-sm">
                                                    {form.watch("eventName")}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {form.watch("eventType")} •{" "}
                                                    {form.watch("attendees")}{" "}
                                                    attendees
                                                </p>
                                            </div>

                                            <div className="pt-2 border-t">
                                                <h5 className="font-medium text-sm mb-1">
                                                    Time & Date
                                                </h5>
                                                <div className="flex items-center text-sm mb-1">
                                                    <CalendarIcon className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                                                    <span>
                                                        {(() => {
                                                            const startDate =
                                                                form.watch(
                                                                    "startDate",
                                                                );
                                                            const endDate =
                                                                form.watch(
                                                                    "endDate",
                                                                );

                                                            if (!startDate) {
                                                                return "No date selected";
                                                            }

                                                            const formattedStartDate =
                                                                format(
                                                                    startDate,
                                                                    "MMMM d, yyyy",
                                                                );

                                                            if (
                                                                !endDate ||
                                                                isSameDay(
                                                                    startDate,
                                                                    endDate,
                                                                )
                                                            ) {
                                                                return formattedStartDate;
                                                            }

                                                            const formattedEndDate =
                                                                format(
                                                                    endDate,
                                                                    "MMMM d, yyyy",
                                                                );
                                                            return `${formattedStartDate} - ${formattedEndDate}`;
                                                        })()}
                                                    </span>
                                                </div>
                                                {/* Conditionally render time only if not allDay */}
                                                {!form.watch("allDay") &&
                                                    form.watch("startTime") &&
                                                    form.watch("endTime") && (
                                                        <div className="flex items-center text-sm">
                                                            <Clock className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                                                            <span>
                                                                {form.watch(
                                                                    "startTime",
                                                                )}{" "}
                                                                -{" "}
                                                                {form.watch(
                                                                    "endTime",
                                                                )}
                                                            </span>
                                                        </div>
                                                    )}
                                                {/* Display 'All Day' if checked */}
                                                {form.watch("allDay") && (
                                                    <div className="flex items-center text-sm">
                                                        <Clock className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                                                        <span>All Day</span>
                                                    </div>
                                                )}
                                            </div>

                                            {form.watch("equipment").length >
                                                0 && (
                                                <div className="pt-2 border-t">
                                                    <h5 className="font-medium text-sm mb-1">
                                                        Equipment
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
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </form>
                </Form>

                <DialogFooter>
                    {step > 1 && (
                        <Button
                            variant="outline"
                            onClick={handleBack}
                            type="button"
                        >
                            Back
                        </Button>
                    )}

                    {step < 3 && (
                        <Button
                            onClick={handleNext}
                            disabled={
                                (step === 1 &&
                                    (!form.watch("eventName") ||
                                        !form.watch("eventType") ||
                                        !form.watch("department") ||
                                        !form.watch("contactPerson") || // Added missing required fields check if necessary
                                        !form.watch("contactEmail") ||
                                        !form.watch("contactPhone") ||
                                        !form.watch("attendees"))) ||
                                (step === 2 && !form.watch("venue"))
                            }
                        >
                            Next
                        </Button>
                    )}

                    {step === 3 && (
                        <Button
                            onClick={form.handleSubmit(handleSubmitForm)}
                            disabled={
                                isLoading || // Check loading state first
                                // Disable only if NOT allDay AND either startTime or endTime is missing
                                (!form.watch("allDay") &&
                                    (!form.watch("startTime") ||
                                        !form.watch("endTime")))
                            }
                        >
                            {isLoading ? "Submitting..." : "Submit Reservation"}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
