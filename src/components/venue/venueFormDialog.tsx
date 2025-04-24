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
import { API_BASE_URL } from "@/lib/auth";
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
import { Label } from "../ui/label";

const defaultValues: VenueInput = {
    name: "",
    location: "",
    venueOwnerId: undefined, // Use venueOwnerId for form
    image: undefined, // Image is handled separately
};

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

    const isEditing = !!venue;
    const formDefaultValues =
        isEditing && venue
            ? {
                  name: venue.name,
                  location: venue.location,
                  venueOwnerId: venue.venueOwner?.id
                      ? Number(venue.venueOwner.id)
                      : undefined,
                  image: undefined,
              }
            : defaultValues;

    const form = useForm<VenueInput>({
        resolver: valibotResolver(venueSchema),
        defaultValues: formDefaultValues,
        mode: "onChange",
    });

    useEffect(() => {
        if (isOpen) {
            // Reset form with appropriate defaults when dialog opens or venue changes
            const resetValues =
                isEditing && venue
                    ? {
                          name: venue.name,
                          location: venue.location,
                          venueOwnerId: venue.venueOwner?.id
                              ? Number(venue.venueOwner.id)
                              : undefined,
                          image: undefined,
                      }
                    : defaultValues;
            form.reset(resetValues);

            setImageFile(null);
            setImageError(null);
            const previewUrl = `${venue?.imagePath}`;
            setInitialImageUrl(previewUrl);
        }
    }, [isOpen, venue, form, isEditing]); // Add isEditing dependency

    const handleFileValueChange = (files: File[]) => {
        const file = files[0] || null;
        setImageError(null); // Reset error on new selection

        if (file) {
            const validationResult = v.safeParse(ImageSchema, file);
            if (validationResult.success) {
                setImageFile(file);
                form.setValue("image", file, { shouldValidate: true });
            } else {
                setImageError(
                    v.flatten(validationResult.issues).root?.[0] ??
                        "Invalid image file.",
                );
                setImageFile(null);
                form.setValue("image", undefined, { shouldValidate: true });
            }
        } else {
            setImageFile(null);
            form.setValue("image", undefined, { shouldValidate: true });
        }
    };

    const processSubmit = (data: VenueInput) => {
        setImageError(null); // Reset image error

        if (imageFile) {
            const validationResult = v.safeParse(ImageSchema, imageFile);
            if (!validationResult.success) {
                setImageError(
                    v.flatten(validationResult.issues).root?.[0] ??
                        "Invalid image file.",
                );
                return;
            }
        }

        onSubmit(data, imageFile);
    };

    const currentFiles = imageFile ? [imageFile] : [];

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] overflow-auto max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? "Edit Venue" : "Add New Venue"}
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form
                        id="venue-form"
                        onSubmit={form.handleSubmit(processSubmit)}
                        className="space-y-4 py-4"
                    >
                        {/* Name */}
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Venue Name</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="e.g., Main Conference Hall"
                                            {...field}
                                            disabled={isLoading}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Location */}
                        <FormField
                            control={form.control}
                            name="location"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Location</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="e.g., Building A, 2nd Floor"
                                            {...field}
                                            disabled={isLoading}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Venue Owner Select */}
                        <FormField
                            control={form.control}
                            name="venueOwnerId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Venue Owner</FormLabel>
                                    <Select
                                        onValueChange={(value) => {
                                            // Handle the special "none" value for clearing the selection
                                            if (value === "none") {
                                                field.onChange(undefined);
                                            } else {
                                                field.onChange(Number(value));
                                            }
                                        }}
                                        // If field.value is undefined/null, use "none", otherwise convert ID to string
                                        value={
                                            field.value
                                                ? field.value.toString()
                                                : "none"
                                        }
                                        disabled={isLoading}
                                    >
                                        <FormControl>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select the owner" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {/* Use "none" as the value for the placeholder/clear option */}
                                            <SelectItem value="none">
                                                -
                                            </SelectItem>
                                            {/* Only map owners if the list is not empty */}
                                            {venueOwners.map((owner) => (
                                                <SelectItem
                                                    key={owner.id}
                                                    value={owner.id.toString()} // Value must be string
                                                >
                                                    {owner.firstName}{" "}
                                                    {owner.lastName} (
                                                    {owner.email})
                                                </SelectItem>
                                            ))}
                                            {/* Remove the conditional disabled item for empty list */}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Image Upload */}
                        <div className="grid gap-2">
                            <Label>Image (Optional)</Label>
                            <FileUpload
                                value={currentFiles}
                                onValueChange={handleFileValueChange}
                                maxFiles={1}
                                maxSize={5 * 1024 * 1024} // 5MB
                                accept="image/jpeg, image/png, image/webp"
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
                                        JPG, PNG, WEBP (max 5MB)
                                    </p>
                                </FileUploadDropzone>
                                <FileUploadList className="p-3">
                                    {/* Display initial image if editing and no new file selected */}
                                    {!imageFile && initialImageUrl && (
                                        <div className="relative flex items-center gap-2.5 rounded-md border p-2">
                                            <div className="relative flex size-10 shrink-0 items-center justify-center rounded-md bg-muted">
                                                <img
                                                    src={initialImageUrl}
                                                    alt="Current venue"
                                                    className="size-full rounded object-cover"
                                                    onError={(e) => {
                                                        e.currentTarget.src =
                                                            "/placeholder.svg"; // Fallback image
                                                    }}
                                                />
                                            </div>
                                            <div className="flex min-w-0 flex-1 flex-col">
                                                <span className="truncate text-sm font-medium text-muted-foreground">
                                                    Current Image
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    Will be replaced if new
                                                    image is selected
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
                                            <FileUploadItemPreview />
                                            <FileUploadItemMetadata />
                                            <FileUploadItemDelete asChild>
                                                <Button
                                                    type="button"
                                                    size="icon"
                                                    variant="ghost"
                                                    className="size-7"
                                                    disabled={isLoading}
                                                >
                                                    <X className="size-4" />
                                                </Button>
                                            </FileUploadItemDelete>
                                        </FileUploadItem>
                                    ))}
                                </FileUploadList>
                            </FileUpload>
                            {imageError && (
                                <p className="text-sm text-destructive">
                                    {imageError}
                                </p>
                            )}
                        </div>

                        {/* Display general form error from backend */}
                        {form.formState.errors.root?.serverError && (
                            <p className="text-sm text-destructive text-center">
                                {form.formState.errors.root.serverError.message}
                            </p>
                        )}
                    </form>
                </Form>

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
                        form="venue-form"
                        disabled={
                            isLoading ||
                            !form.formState.isValid || // Check basic form validity
                            !!imageError // Disable if image validation error exists
                        }
                    >
                        {isLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        {isLoading
                            ? "Saving..."
                            : isEditing
                              ? "Save Changes"
                              : "Add Venue"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
