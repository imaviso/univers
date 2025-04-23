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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    ImageSchema, // Import ImageSchema for validation
    type VenueInput,
    venueSchema,
} from "@/lib/schema";
import type { UserType, Venue } from "@/lib/types";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { Loader2, UploadCloud, X } from "lucide-react"; // Import icons
import { useEffect, useState } from "react"; // Import useState
import { useForm } from "react-hook-form";
import * as v from "valibot"; // Import valibot for safeParse
import {
    FileUpload,
    FileUploadDropzone,
    FileUploadItem,
    FileUploadItemDelete,
    FileUploadItemMetadata,
    FileUploadItemPreview,
    FileUploadList,
} from "../ui/file-upload"; // Import FileUpload components

interface VenueFormDialogProps {
    isOpen: boolean;
    onClose: () => void;
    // Update onSubmit to accept VenueOutput and optional File
    onSubmit: (venueData: VenueInput, imageFile: File | null) => void;
    venue?: Venue | null;
    isLoading?: boolean;
    venueOwners: UserType[];
}

export function VenueFormDialog({
    isOpen,
    onClose,
    onSubmit,
    venue,
    isLoading,
    venueOwners,
}: VenueFormDialogProps) {
    // State for the image file
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imageError, setImageError] = useState<string | null>(null);
    const [initialImageUrl, setInitialImageUrl] = useState<string | null>(null);

    const form = useForm<VenueInput>({
        resolver: valibotResolver(venueSchema),
        defaultValues: {
            name: "",
            location: "",
            image: [], // Default to empty array for FileUpload
            venueOwnerId: undefined,
        },
        mode: "onChange",
    });

    useEffect(() => {
        if (isOpen) {
            if (venue) {
                form.reset({
                    name: venue.name || "",
                    location: venue.location || "",
                    image: [], // Reset image field in form
                    venueOwnerId: venue.venueOwnerId ?? undefined,
                });
                // Set initial image URL for preview
                const previewUrl = venue.image
                    ? `/uploads/venues/${venue.image.substring(venue.image.lastIndexOf("/") + 1)}` // Adjust URL as needed
                    : null;
                setInitialImageUrl(previewUrl);
            } else {
                form.reset({
                    name: "",
                    location: "",
                    image: [],
                    venueOwnerId: undefined,
                });
                setInitialImageUrl(null); // Clear initial image for new venue
            }
            // Reset local file state
            setImageFile(null);
            setImageError(null);
        }
    }, [isOpen, venue, form]);

    // Handle file changes from FileUpload
    const handleFileValueChange = (files: File[]) => {
        const file = files[0] || null;
        setImageError(null);

        if (file) {
            // Validate using ImageSchema (or a specific venue image schema if different)
            const validationResult = v.safeParse(ImageSchema, file); // Assuming ImageSchema is suitable
            if (validationResult.success) {
                setImageFile(file);
                form.setValue("image", [file], { shouldValidate: true }); // Update form value for validation
            } else {
                setImageError(
                    v.flatten(validationResult.issues).root?.[0] ??
                        "Invalid image file.",
                );
                setImageFile(null);
                form.setValue("image", [], { shouldValidate: true }); // Clear form value
            }
        } else {
            setImageFile(null);
            form.setValue("image", [], { shouldValidate: true }); // Clear form value
        }
    };

    // Wrapper function to handle form submission
    const handleFormSubmit = (data: VenueInput) => {
        setImageError(null); // Clear error on submit attempt

        // Validate the current imageFile again (optional safeguard)
        if (imageFile) {
            const validationResult = v.safeParse(ImageSchema, imageFile);
            if (!validationResult.success) {
                setImageError(
                    v.flatten(validationResult.issues).root?.[0] ??
                        "Invalid image file.",
                );
                return; // Prevent submission
            }
        }

        // The schema transforms the input `data` (with image as File[])
        // into the output type (with image as File | undefined).
        // We pass the transformed data and the separate imageFile state.
        const outputData = data as unknown as VenueInput;
        onSubmit(outputData, imageFile);
    };

    // Determine files for FileUpload component
    const currentFiles = imageFile ? [imageFile] : [];

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>
                        {venue ? "Edit Venue" : "Add New Venue"}
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(handleFormSubmit)}
                        className="space-y-4 py-4"
                    >
                        {/* ... (Name, Location, Venue Owner fields remain the same) ... */}
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
                                            disabled={isLoading}
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
                                            disabled={isLoading}
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
                                    <FormLabel>Venue Owner</FormLabel>
                                    <FormControl>
                                        <Select
                                            onValueChange={(value) => {
                                                field.onChange(
                                                    value === "none" // Check for "none"
                                                        ? undefined
                                                        : Number.parseInt(
                                                              value,
                                                              10,
                                                          ),
                                                );
                                            }}
                                            value={
                                                field.value?.toString() ??
                                                "none" // Default to "none" if undefined
                                            }
                                            disabled={isLoading}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select a venue owner">
                                                    {field.value
                                                        ? `${
                                                              venueOwners.find(
                                                                  (user) =>
                                                                      Number(
                                                                          user.id,
                                                                      ) ===
                                                                      field.value,
                                                              )?.firstName
                                                          } ${
                                                              venueOwners.find(
                                                                  (user) =>
                                                                      Number(
                                                                          user.id,
                                                                      ) ===
                                                                      field.value,
                                                              )?.lastName
                                                          }`
                                                        : "None"}
                                                </SelectValue>
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">
                                                    None
                                                </SelectItem>
                                                {venueOwners.map((user) => (
                                                    <SelectItem
                                                        key={user.id}
                                                        value={String(user.id)} // Ensure value is string
                                                    >
                                                        {user.firstName}{" "}
                                                        {user.lastName} (
                                                        {user.email})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </FormControl>
                                    <FormDescription>
                                        Select a user to be the owner of this
                                        venue (optional)
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="image" // Keep this linked to the form state for validation trigger
                            render={(
                                { field }, // Destructure field to avoid passing onChange directly
                            ) => (
                                <FormItem>
                                    <FormLabel>Image (Optional)</FormLabel>
                                    <FormControl>
                                        <FileUpload
                                            value={currentFiles} // Use local state for display
                                            onValueChange={
                                                handleFileValueChange
                                            } // Use custom handler
                                            maxFiles={1}
                                            maxSize={10 * 1024 * 1024} // 10MB
                                            accept="image/jpeg, image/png, image/webp" // Match schema
                                            disabled={isLoading}
                                            className="relative rounded-lg border border-input bg-background"
                                        >
                                            <FileUploadDropzone className="border-dashed p-4">
                                                <UploadCloud className="mb-2 h-8 w-8 text-muted-foreground" />
                                                <p className="mb-1 text-sm text-muted-foreground">
                                                    <span className="font-semibold">
                                                        Click or drag image
                                                    </span>{" "}
                                                    to upload
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    JPG, PNG, WEBP (max 10MB)
                                                </p>
                                            </FileUploadDropzone>
                                            <FileUploadList className="p-3">
                                                {/* Display initial image if editing and no new file selected */}
                                                {!imageFile &&
                                                    initialImageUrl && (
                                                        <div className="relative flex items-center gap-2.5 rounded-md border p-2">
                                                            <div className="relative flex size-10 shrink-0 items-center justify-center rounded-md bg-muted">
                                                                <img
                                                                    src={
                                                                        initialImageUrl
                                                                    }
                                                                    alt="Current venue"
                                                                    className="size-full rounded object-cover"
                                                                    onError={(
                                                                        e,
                                                                    ) => {
                                                                        e.currentTarget.src =
                                                                            "/placeholder.svg";
                                                                    }}
                                                                />
                                                            </div>
                                                            <div className="flex min-w-0 flex-1 flex-col">
                                                                <span className="truncate text-sm font-medium text-muted-foreground">
                                                                    Current
                                                                    Image
                                                                </span>
                                                                <span className="text-xs text-muted-foreground">
                                                                    Will be
                                                                    replaced if
                                                                    new image is
                                                                    selected
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )}
                                                {/* Display selected file */}
                                                {currentFiles.map((file) => (
                                                    <FileUploadItem
                                                        key={file.name}
                                                        value={file}
                                                        className="p-2"
                                                    >
                                                        <FileUploadItemPreview>
                                                            {/* Default preview handles images */}
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
                                                                disabled={
                                                                    isLoading
                                                                }
                                                            >
                                                                <X className="size-4" />
                                                            </Button>
                                                        </FileUploadItemDelete>
                                                    </FileUploadItem>
                                                ))}
                                            </FileUploadList>
                                        </FileUpload>
                                    </FormControl>
                                    {/* Display validation error from local state */}
                                    {imageError && (
                                        <p className="text-sm text-destructive">
                                            {imageError}
                                        </p>
                                    )}
                                    {/* Display form message if needed (e.g., from schema validation) */}
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose}
                                disabled={isLoading}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={
                                    !form.formState.isValid ||
                                    isLoading ||
                                    !!imageError // Disable if image error exists
                                }
                            >
                                {isLoading && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
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
