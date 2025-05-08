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
import { type VenueInput, venueSchema } from "@/lib/schema";
import type { UserDTO, VenueDTO } from "@/lib/types";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { Loader2, UploadCloud, X } from "lucide-react"; // Import icons
import { useEffect, useState } from "react"; // Import useState
import { useForm } from "react-hook-form";
import {
    FileUpload,
    FileUploadDropzone,
    FileUploadItem,
    FileUploadItemDelete,
    FileUploadItemMetadata,
    FileUploadItemPreview,
    FileUploadList,
} from "../ui/file-upload"; // Import FileUpload components

const defaultValues: VenueInput = {
    name: "",
    location: "",
    venueOwnerId: undefined, // Use venueOwnerId for form
    image: undefined, // Image is handled separately
};

interface VenueFormDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (venueData: VenueInput, imageFile: File | null) => void;
    venue?: VenueDTO | null;
    isLoading?: boolean;
    venueOwners: UserDTO[];
    currentUserRole?: string;
}

export function VenueFormDialog({
    isOpen,
    onClose,
    onSubmit,
    venue,
    isLoading,
    venueOwners,
    currentUserRole,
}: VenueFormDialogProps) {
    const [initialImageUrl, setInitialImageUrl] = useState<string | null>(null);
    const [imageFiles, setImageFiles] = useState<File[]>([]);

    const isEditing = !!venue;
    const formDefaultValues =
        isEditing && venue
            ? {
                  name: venue.name,
                  location: venue.location,
                  venueOwnerId: venue.venueOwner?.publicId ?? undefined,
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
            const resetValues =
                isEditing && venue
                    ? {
                          name: venue.name,
                          location: venue.location,
                          venueOwnerId: venue.venueOwner?.publicId ?? undefined,
                          image: undefined,
                      }
                    : defaultValues;
            form.reset(resetValues);

            const previewUrl = venue?.imagePath ?? null;
            setInitialImageUrl(previewUrl);
        }
    }, [isOpen, venue, form, isEditing]);

    const handleFileValueChange = (files: File[]) => {
        setImageFiles(files); // Update local state for FileUpload component
        // Set the value (File[] or empty array) in the form.
        // The resolver will validate this against the schema (which expects File[], transforms to File | undefined)
        form.setValue("image", files, { shouldValidate: true });
    };

    const processSubmit = (data: VenueInput) => {
        // Ensure venueOwnerId is correctly set to undefined if 'none' was selected
        const finalData = {
            ...data,
            venueOwnerId:
                data.venueOwnerId === undefined ? undefined : data.venueOwnerId,
        };
        onSubmit(finalData, imageFiles[0] ?? null);
    };

    // Use imageFiles state for FileUpload component value
    const currentFiles = imageFiles;

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

                        {currentUserRole === "SUPER_ADMIN" && (
                            <FormField
                                control={form.control}
                                name="venueOwnerId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Venue Owner</FormLabel>
                                        <Select
                                            // Handle 'none' value during change
                                            onValueChange={(value) => {
                                                if (value === "none") {
                                                    field.onChange(undefined); // Set form value to undefined for 'none'
                                                } else {
                                                    field.onChange(value);
                                                }
                                            }}
                                            disabled={isLoading}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Select the venue owner" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {venueOwners.length > 0 ? (
                                                    venueOwners.map((owner) => (
                                                        <SelectItem
                                                            key={owner.publicId}
                                                            value={
                                                                owner.publicId
                                                            }
                                                        >
                                                            {owner.firstName}{" "}
                                                            {owner.lastName} (
                                                            {owner.email})
                                                        </SelectItem>
                                                    ))
                                                ) : (
                                                    <SelectItem
                                                        value="Empty"
                                                        disabled
                                                    >
                                                        No venue owners found
                                                    </SelectItem>
                                                )}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        <FormField
                            control={form.control}
                            name="image"
                            render={() => (
                                <FormItem>
                                    <FormLabel>Image (Optional)</FormLabel>
                                    <FormControl>
                                        <FileUpload
                                            value={currentFiles} // Use local state for display
                                            onValueChange={
                                                handleFileValueChange
                                            } // Updates local state and form state
                                            maxFiles={1}
                                            maxSize={10 * 1024 * 1024} // 10MB (sync with schema)
                                            accept="image/jpeg, image/png, image/webp" // Sync with schema
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
                                                {/* Display initial image */}
                                                {currentFiles.length === 0 &&
                                                    initialImageUrl && (
                                                        <div className="relative flex items-center gap-2.5 rounded-md border p-2">
                                                            {/* ... initial image display ... */}
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
                                                                            "/placeholder.svg"; // Fallback image
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
                                                        <FileUploadItemPreview />
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
                                    {/* Display validation error from react-hook-form */}
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

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
                        disabled={isLoading || !form.formState.isValid}
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
