import { Button } from "@/components/ui/button";
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
import {
    type EquipmentDTOInput,
    ImageSchema,
    equipmentDataSchema,
} from "@/lib/schema";
import { type Equipment, STATUS_EQUIPMENT, type UserType } from "@/lib/types";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { UploadCloud, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as v from "valibot";
import {
    FileUpload,
    FileUploadDropzone,
    FileUploadItem,
    FileUploadItemDelete,
    FileUploadItemMetadata,
    FileUploadItemPreview,
    FileUploadList,
} from "../ui/file-upload";

const defaultValues: EquipmentDTOInput = {
    name: "",
    brand: "",
    availability: true,
    quantity: 1,
    status: "NEW",
    ownerId: undefined,
};

interface EquipmentFormDialogProps {
    isOpen: boolean;
    onClose: () => void;
    equipment?: Equipment;
    onSubmit: (data: EquipmentDTOInput, imageFile: File | null) => void;
    isMutating: boolean;
    currentUserRole: UserType["role"];
    equipmentOwners: UserType[];
}

export function EquipmentFormDialog({
    isOpen,
    onClose,
    equipment,
    onSubmit,
    isMutating,
    currentUserRole,
    equipmentOwners,
}: EquipmentFormDialogProps) {
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imageError, setImageError] = useState<string | null>(null);
    const [initialImageUrl, setInitialImageUrl] = useState<string | null>(null);

    const isSuperAdmin = currentUserRole === "SUPER_ADMIN";
    const isEditing = !!equipment;
    const isEquipmentOwner = currentUserRole === "EQUIPMENT_OWNER";
    const formDefaultValues = equipment
        ? {
              name: equipment.name,
              brand: equipment.brand,
              availability: equipment.availability,
              quantity: equipment.quantity,
              status: equipment.status,
              ownerId: equipment.equipmentOwner?.id
                  ? Number(equipment.equipmentOwner.id)
                  : undefined,
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
                          ownerId: equipment.equipmentOwner?.id
                              ? Number(equipment.equipmentOwner.id)
                              : undefined,
                      }
                    : defaultValues,
            );
            // Reset image state
            setImageFile(null);
            setImageError(null);
            // Set initial image URL for preview if editing
            const previewUrl = equipment?.imagePath;
        }
    }, [isOpen, equipment, form]);

    const handleFileValueChange = (files: File[]) => {
        const file = files[0] || null;
        setImageError(null);

        if (file) {
            const validationResult = v.safeParse(ImageSchema, file);
            if (validationResult.success) {
                setImageFile(file);
            } else {
                setImageError(
                    v.flatten(validationResult.issues).root?.[0] ??
                        "Invalid image file.",
                );
                setImageFile(null);
            }
        } else {
            setImageFile(null);
        }
    };

    const processSubmit = (data: EquipmentDTOInput) => {
        setImageError(null); // Reset image error

        // Validate image presence for new equipment
        if (!isEditing && !imageFile) {
            setImageError("Image file is required.");
            return;
        }

        // Validate owner selection for SUPER_ADMIN adding new equipment
        if (isSuperAdmin && !isEditing && !data.ownerId) {
            form.setError("ownerId", {
                message: "Equipment Owner is required for Super Admin.",
            });
            return;
        }

        // Validate image file again (optional safeguard)
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

        // NOTE: The API call (`addEquipment`/`editEquipment`) now handles the ownerId nesting.
        // We pass the `data` object as is, which includes `ownerId` if set.
        onSubmit(data, imageFile);
    };

    // Determine the files array for FileUpload based on state
    const currentFiles = imageFile ? [imageFile] : [];
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] overflow-auto max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? "Edit Equipment" : "Add New Equipment"}
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form
                        id="equipment-form"
                        onSubmit={form.handleSubmit(processSubmit)}
                        className="space-y-4 py-4"
                    >
                        {/* Conditionally render Owner Select for SUPER_ADMIN on Add */}
                        {isSuperAdmin && !isEditing && (
                            <FormField
                                control={form.control}
                                name="ownerId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Equipment Owner *</FormLabel>
                                        <Select
                                            onValueChange={(value) =>
                                                field.onChange(Number(value))
                                            } // Ensure value is number
                                            value={field.value?.toString()} // Convert number to string for Select value
                                            disabled={isMutating}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Select the owner" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {equipmentOwners.length > 0 ? (
                                                    equipmentOwners.map(
                                                        (owner) => (
                                                            <SelectItem
                                                                // Ensure owner.id is string or number as needed by UserType
                                                                key={owner.id}
                                                                value={owner.id.toString()} // Value must be string
                                                            >
                                                                {
                                                                    owner.firstName
                                                                }{" "}
                                                                {owner.lastName}{" "}
                                                                ({owner.email})
                                                            </SelectItem>
                                                        ),
                                                    )
                                                ) : (
                                                    <SelectItem
                                                        value=""
                                                        disabled
                                                    >
                                                        No equipment owners
                                                        found
                                                    </SelectItem>
                                                )}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

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
                                                        // Use parseFloat for potential decimals if needed, else parseInt
                                                        Number.parseInt(
                                                            e.target.value,
                                                            10,
                                                        ) || 0,
                                                    )
                                                }
                                                // Ensure value is treated as number for input type=number
                                                value={Number(field.value) || 0}
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
                            <Label>
                                Image {isEditing ? "(Optional)" : "*"}
                            </Label>
                            <FileUpload
                                value={currentFiles}
                                onValueChange={handleFileValueChange}
                                maxFiles={1}
                                maxSize={5 * 1024 * 1024} // 5MB
                                accept="image/jpeg, image/png, image/webp"
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
                                                    disabled={isMutating}
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
                            !form.formState.isValid || // Check basic form validity
                            (!isEditing && !imageFile) || // Image required for new
                            !!imageError || // Disable if image validation error exists
                            // Disable if SUPER_ADMIN is adding and hasn't selected owner
                            (isSuperAdmin &&
                                !isEditing &&
                                !form.getValues("ownerId"))
                        }
                    >
                        {isMutating
                            ? "Saving..."
                            : isEditing
                              ? "Save Changes"
                              : "Add Equipment"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
