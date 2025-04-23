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
import { Input } from "@/components/ui/input"; // Keep Input
import { Label } from "@/components/ui/label"; // Keep Label
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useEffect, useState } from "react"; // Removed useRef
import {
    equipmentDataSchema,
    ImageSchema, // Keep ImageSchema for validation if needed separately
    type EquipmentDTOInput,
} from "@/lib/schema";
import * as v from "valibot";
import { STATUS_EQUIPMENT, type Equipment } from "@/lib/types";
import { useForm } from "react-hook-form";
import { valibotResolver } from "@hookform/resolvers/valibot";
import {
    FileUpload,
    FileUploadDropzone,
    FileUploadItem,
    FileUploadItemDelete,
    FileUploadItemMetadata,
    FileUploadItemPreview,
    FileUploadList,
} from "../ui/file-upload"; // Import FileUpload components
import { UploadCloud, X } from "lucide-react"; // Import icons

// Default values based on EquipmentDTOInput
const defaultValues: EquipmentDTOInput = {
    name: "",
    brand: "",
    availability: true,
    quantity: 1,
    status: "NEW",
};

interface EquipmentFormDialogProps {
    isOpen: boolean;
    onClose: () => void;
    equipment?: Equipment;
    onSubmit: (data: EquipmentDTOInput, imageFile: File | null) => void;
    isMutating: boolean;
}

export function EquipmentFormDialog({
    isOpen,
    onClose,
    equipment,
    onSubmit,
    isMutating,
}: EquipmentFormDialogProps) {
    // State specifically for the image file, managed by FileUpload's onValueChange
    const [imageFile, setImageFile] = useState<File | null>(null);
    // State for validation errors specific to the image
    const [imageError, setImageError] = useState<string | null>(null);
    // State to hold the initial image URL for edit mode preview
    const [initialImageUrl, setInitialImageUrl] = useState<string | null>(null);

    const formDefaultValues = equipment
        ? {
              name: equipment.name,
              brand: equipment.brand,
              availability: equipment.availability,
              quantity: equipment.quantity,
              status: equipment.status,
          }
        : defaultValues;

    const form = useForm<EquipmentDTOInput>({
        resolver: valibotResolver(equipmentDataSchema),
        defaultValues: formDefaultValues,
        mode: "onChange",
    });

    useEffect(() => {
        if (isOpen) {
            form.reset(
                equipment
                    ? {
                          name: equipment.name,
                          brand: equipment.brand,
                          availability: equipment.availability,
                          quantity: equipment.quantity,
                          status: equipment.status,
                      }
                    : defaultValues,
            );
            // Reset image state
            setImageFile(null);
            setImageError(null);
            // Set initial image URL for preview if editing
            const previewUrl = equipment?.imagePath
                ? `/uploads/equipment/${equipment.imagePath.substring(equipment.imagePath.lastIndexOf("/") + 1)}`
                : null;
            setInitialImageUrl(previewUrl);
        }
    }, [isOpen, equipment, form]);

    // Handle file changes from FileUpload component
    const handleFileValueChange = (files: File[]) => {
        const file = files[0] || null; // Get the first file or null
        setImageError(null); // Clear previous errors

        if (file) {
            // Validate the selected file using ImageSchema
            const validationResult = v.safeParse(ImageSchema, file);
            if (validationResult.success) {
                setImageFile(file); // Set the valid file
            } else {
                // Set error message and clear the file
                setImageError(
                    v.flatten(validationResult.issues).root?.[0] ??
                        "Invalid image file.",
                );
                setImageFile(null); // Ensure invalid file isn't kept
                // Optionally, trigger re-render of FileUpload to clear its internal state if needed
                // This might require passing a key that changes or using FileUpload's clear mechanism
            }
        } else {
            setImageFile(null); // Clear file if array is empty
        }
    };

    const processSubmit = (data: EquipmentDTOInput) => {
        // Reset image error before submit validation
        setImageError(null);

        // Validate image presence for new equipment
        if (!equipment && !imageFile) {
            setImageError("Image file is required.");
            return;
        }

        // Validate the current imageFile again just before submit (optional safeguard)
        if (imageFile) {
            const validationResult = v.safeParse(ImageSchema, imageFile);
            if (!validationResult.success) {
                setImageError(
                    v.flatten(validationResult.issues).root?.[0] ??
                        "Invalid image file.",
                );
                return; // Prevent submission with invalid file
            }
        }

        // Call the onSubmit passed from the parent component
        onSubmit(data, imageFile);
    };

    // Determine the files array for FileUpload based on state
    const currentFiles = imageFile ? [imageFile] : [];

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] overflow-auto max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle>
                        {equipment ? "Edit Equipment" : "Add New Equipment"}
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form
                        id="equipment-form"
                        onSubmit={form.handleSubmit(processSubmit)}
                        className="space-y-4 py-4"
                    >
                        {/* ... (Name, Brand, Quantity, Status, Availability FormFields remain the same) ... */}
                        {/* Name */}
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Equipment Name</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="e.g., Projector Screen"
                                            {...field}
                                            disabled={isMutating}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Brand */}
                        <FormField
                            control={form.control}
                            name="brand"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Brand</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="e.g., Epson, Dell"
                                            {...field}
                                            disabled={isMutating}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            {/* Quantity */}
                            <FormField
                                control={form.control}
                                name="quantity"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Quantity</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min="0"
                                                {...field}
                                                onChange={(e) =>
                                                    field.onChange(
                                                        Number.parseInt(
                                                            e.target.value,
                                                            10,
                                                        ) || 0,
                                                    )
                                                }
                                                value={field.value || 0}
                                                disabled={isMutating}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Status */}
                            <FormField
                                control={form.control}
                                name="status"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Status</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value}
                                            disabled={isMutating}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Select status" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {STATUS_EQUIPMENT.map(
                                                    (statusOption) => (
                                                        <SelectItem
                                                            key={
                                                                statusOption.value
                                                            }
                                                            value={
                                                                statusOption.value
                                                            }
                                                        >
                                                            {statusOption.label}
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

                        {/* Availability */}
                        <FormField
                            control={form.control}
                            name="availability"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                            disabled={isMutating}
                                        />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>Is Available?</FormLabel>
                                    </div>
                                    <FormMessage className="pl-4" />
                                </FormItem>
                            )}
                        />

                        {/* Image Upload using FileUpload */}
                        <div className="grid gap-2">
                            <Label>Image</Label>
                            <FileUpload
                                value={currentFiles} // Pass the managed file state
                                onValueChange={handleFileValueChange} // Handle changes and validation
                                maxFiles={1}
                                maxSize={5 * 1024 * 1024} // 5MB
                                accept="image/jpeg, image/png, image/webp" // Match schema
                                disabled={isMutating}
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
                                                    alt="Current equipment"
                                                    className="size-full rounded object-cover"
                                                    onError={(e) => {
                                                        e.currentTarget.src =
                                                            "/placeholder.svg";
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
                                            <FileUploadItemPreview>
                                                {/* Default preview handles images */}
                                            </FileUploadItemPreview>
                                            <FileUploadItemMetadata />
                                            <FileUploadItemDelete asChild>
                                                <Button
                                                    type="button"
                                                    size="icon"
                                                    variant="ghost"
                                                    className="size-7"
                                                    disabled={isMutating}
                                                >
                                                    <X className="size-4" />
                                                </Button>
                                            </FileUploadItemDelete>
                                        </FileUploadItem>
                                    ))}
                                </FileUploadList>
                            </FileUpload>
                            {/* Display validation error */}
                            {imageError && (
                                <p className="text-sm text-destructive">
                                    {imageError}
                                </p>
                            )}
                        </div>

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
                        disabled={isMutating}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        form="equipment-form"
                        disabled={
                            isMutating ||
                            !form.formState.isValid ||
                            (!equipment && !imageFile) || // Image required for new
                            !!imageError // Disable if image error exists
                        }
                    >
                        {isMutating
                            ? "Saving..."
                            : equipment
                              ? "Save Changes"
                              : "Add Equipment"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
