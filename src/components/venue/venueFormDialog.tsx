import { Button } from "@/components/ui/button";
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
import { type VenueInput, venueSchema } from "@/lib/schema"; // Import schema and type
import { valibotResolver } from "@hookform/resolvers/valibot"; // Import resolver
import { useEffect } from "react";
import { useForm } from "react-hook-form"; // Import useForm

// Define the Venue type based on previous context (adjust if needed)
type Venue = {
    id: number;
    name: string;
    location: string;
    venueOwnerId?: number | null; // Make optional/nullable
    image?: File | null; // Make optional/nullable
    createdAt: string;
    updatedAt: string;
};

interface VenueFormDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (venueData: VenueInput) => void; // Use VenueInput type
    venue?: Venue | null; // Use Venue type, allow null for clarity
    isLoading?: boolean;
}

export function VenueFormDialog({
    isOpen,
    onClose,
    onSubmit,
    venue,
    isLoading,
}: VenueFormDialogProps) {
    const form = useForm<VenueInput>({
        resolver: valibotResolver(venueSchema),
        defaultValues: {
            name: "",
            location: "",
            image: "", // Default to empty string for optional file/string union
            venueOwnerId: undefined, // Default for optional number
        },
        mode: "onChange", // Validate on change
    });

    // Reset form when dialog opens/closes or venue changes
    useEffect(() => {
        if (isOpen) {
            if (venue) {
                // Reset form with existing venue data
                form.reset({
                    name: venue.name || "",
                    location: venue.location || "",
                    // Image handling: If image is a URL (string), keep it.
                    // If it's meant to be a File object for upload, reset to empty string or handle file preview.
                    // For simplicity, assuming image might be a URL string or empty for new upload.
                    image: venue.image || "",
                    venueOwnerId: venue.venueOwnerId ?? undefined, // Handle null/undefined
                });
            } else {
                // Reset to default values for new venue
                form.reset({
                    name: "",
                    location: "",
                    image: "",
                    venueOwnerId: undefined,
                });
            }
        }
    }, [isOpen, venue, form]);

    // Wrapper function to handle form submission
    const handleFormSubmit = (data: VenueInput) => {
        // Potentially transform data before submitting if needed
        // e.g., handle image upload and get URL
        console.log("Form Data Submitted:", data);
        onSubmit(data);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>
                        {venue ? "Edit Venue" : "Add New Venue"}
                    </DialogTitle>
                </DialogHeader>

                {/* Use React Hook Form's Form component */}
                <Form {...form}>
                    {/* Use form.handleSubmit */}
                    <form
                        onSubmit={form.handleSubmit(handleFormSubmit)}
                        className="space-y-4 py-4"
                    >
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Venue Name</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Enter venue name"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="location"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Location</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Enter full address"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="venueOwnerId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        Venue Owner ID (Optional)
                                    </FormLabel>
                                    <FormControl>
                                        {/* Use text input and parse, or number input */}
                                        <Input
                                            type="number"
                                            placeholder="Enter owner's user ID"
                                            {...field}
                                            // Handle potential string value from input type="number"
                                            value={field.value ?? ""}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                field.onChange(
                                                    value === ""
                                                        ? undefined
                                                        : Number.parseInt(
                                                              value,
                                                              10,
                                                          ),
                                                );
                                            }}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="image"
                            render={({
                                field: { value, onChange, ...fieldProps },
                            }) => (
                                <FormItem>
                                    <FormLabel>Image (Optional)</FormLabel>
                                    <FormControl>
                                        {/* Basic file input - needs refinement for preview/upload handling */}
                                        <Input
                                            type="file"
                                            accept="image/jpeg, image/png"
                                            onChange={(event) => {
                                                onChange(
                                                    event.target.files?.[0] ??
                                                        null,
                                                );
                                            }}
                                            {...fieldProps} // Pass rest of props like name, ref, etc.
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Select a JPEG or PNG file (max 10MB).
                                        {typeof value === "string" && value && (
                                            <span className="block mt-1 text-xs">
                                                Current image: {value}
                                            </span>
                                        )}
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Removed Tabs and fields not present in venueSchema */}

                        <DialogFooter>
                            <Button
                                type="button" // Prevent default form submission
                                variant="outline"
                                onClick={onClose}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit" // Submit the form
                                disabled={!form.formState.isValid || isLoading}
                            >
                                {isLoading
                                    ? "Saving..."
                                    : venue
                                      ? "Save Changes"
                                      : "Add Venue"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
