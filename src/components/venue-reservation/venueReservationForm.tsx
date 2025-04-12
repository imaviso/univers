import type React from "react";
import { format } from "date-fns";
import { CalendarIcon, Clock, Upload } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { cn } from "@/lib/utils";
import ReservationConfirmationModal from "./venueReservationModal";
import { valibotResolver } from "@hookform/resolvers/valibot";
import {
    venueReservationFormSchema,
    type VenueReservationInput,
} from "@/lib/schema";
// Mock data for venues and event types
const venues = [
    { id: "1", name: "Main Auditorium" },
    { id: "2", name: "Conference Room A" },
    { id: "3", name: "Conference Room B" },
    { id: "4", name: "Outdoor Pavilion" },
    { id: "5", name: "Lecture Hall" },
];

const eventTypes = [
    { id: "1", name: "Conference" },
    { id: "2", name: "Workshop" },
    { id: "3", name: "Seminar" },
    { id: "4", name: "Meeting" },
    { id: "5", name: "Social Event" },
    { id: "6", name: "Other" },
];

const departments = [
    { id: "1", name: "Marketing" },
    { id: "2", name: "Human Resources" },
    { id: "3", name: "Finance" },
    { id: "4", name: "IT" },
    { id: "5", name: "Operations" },
    { id: "6", name: "Research & Development" },
    { id: "7", name: "Customer Service" },
    { id: "8", name: "Sales" },
    { id: "9", name: "Legal" },
    { id: "10", name: "Executive" },
];

export default function VenueReservationForm() {
    const [approvalLetter, setApprovalLetter] = useState<File | null>(null);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [formData, setFormData] = useState<VenueReservationInput | null>(
        null,
    );

    const form = useForm<VenueReservationInput>({
        resolver: valibotResolver(venueReservationFormSchema),
        defaultValues: {
            email: "",
            phoneNumber: "",
            department: "",
            eventName: "",
            eventType: "",
            venue: "",
            startDateTime: "",
            endDateTime: "",
            approvedLetter: undefined,
        },
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setApprovalLetter(e.target.files[0]);
        }
    };

    const onSubmit = (data: VenueReservationInput) => {
        setFormData(data);
        setShowConfirmation(true);
    };

    const handleConfirm = () => {
        // Here you would typically send the data to your backend
        console.log("Form submitted:", formData);
        console.log("Approval letter:", approvalLetter);

        // Reset form and state
        form.reset();
        setApprovalLetter(null);
        setShowConfirmation(false);

        // Show success message or redirect
        alert("Venue reservation submitted successfully!");
    };

    return (
        <>
            <Card>
                <CardContent className="pt-6">
                    <Form {...form}>
                        <form
                            onSubmit={form.handleSubmit(onSubmit)}
                            className="space-y-8"
                        >
                            <div className="space-y-6">
                                <h2 className="text-xl font-semibold">
                                    User Information
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormField
                                        control={form.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Email</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="your.email@example.com"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="phoneNumber"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Phone</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="(123) 456-7890"
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
                                                <FormLabel>
                                                    Department
                                                </FormLabel>
                                                <Select
                                                    onValueChange={
                                                        field.onChange
                                                    }
                                                    defaultValue={field.value}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select department" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {departments.map(
                                                            (dept) => (
                                                                <SelectItem
                                                                    key={
                                                                        dept.id
                                                                    }
                                                                    value={
                                                                        dept.id
                                                                    }
                                                                >
                                                                    {dept.name}
                                                                </SelectItem>
                                                            ),
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

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
                                                        placeholder="Annual Conference 2025"
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
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select event type" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {eventTypes.map(
                                                            (type) => (
                                                                <SelectItem
                                                                    key={
                                                                        type.id
                                                                    }
                                                                    value={
                                                                        type.id
                                                                    }
                                                                >
                                                                    {type.name}
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
                            </div>

                            <div className="space-y-6">
                                <h2 className="text-xl font-semibold">
                                    Venue Information
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormField
                                        control={form.control}
                                        name="venue"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Venue</FormLabel>
                                                <Select
                                                    onValueChange={
                                                        field.onChange
                                                    }
                                                    defaultValue={field.value}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select venue" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {venues.map((venue) => (
                                                            <SelectItem
                                                                key={venue.id}
                                                                value={venue.id}
                                                            >
                                                                {venue.name}
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
                                        name="startDateTime"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                                <FormLabel>
                                                    Start Date Time
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
                                                            disabled={(date) =>
                                                                date <
                                                                new Date()
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
                                        name="endDateTime"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    End Date Time
                                                </FormLabel>
                                                <div className="flex items-center">
                                                    <FormControl>
                                                        <Input
                                                            type="time"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <Clock className="ml-2 h-4 w-4 text-muted-foreground" />
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h2 className="text-xl font-semibold">
                                    Approval Letter
                                </h2>
                                <div className="space-y-2">
                                    <Label htmlFor="approval-letter">
                                        Attach Approval Letter
                                    </Label>
                                    <div className="flex items-center gap-4">
                                        <Input
                                            id="approval-letter"
                                            type="file"
                                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                            onChange={handleFileChange}
                                            className="max-w-md"
                                        />
                                        {approvalLetter && (
                                            <div className="text-sm text-green-600 flex items-center">
                                                <Upload className="h-4 w-4 mr-1" />
                                                {approvalLetter.name}
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Please attach your approval letter in
                                        PDF, DOC, DOCX, JPG, or PNG format.
                                    </p>
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <Button
                                    type="submit"
                                    size="lg"
                                    disabled={!approvalLetter}
                                >
                                    Submit Reservation
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>

            {showConfirmation && formData && (
                <ReservationConfirmationModal
                    formData={formData}
                    approvalLetter={approvalLetter}
                    onConfirm={handleConfirm}
                    onCancel={() => setShowConfirmation(false)}
                />
            )}
        </>
    );
}
