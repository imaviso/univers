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
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input"; // Keep Input
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { type FileMetadata, useFileUpload } from "@/hooks/use-file-upload";
import { type EquipmentDTOInput, equipmentDataSchema } from "@/lib/schema";
import { type Equipment, STATUS_EQUIPMENT, type UserDTO } from "@/lib/types";
import { cn } from "@/lib/utils";
import { valibotResolver } from "@hookform/resolvers/valibot";
import {
    AlertCircleIcon,
    Edit,
    ImageUpIcon,
    Loader2,
    XIcon as X,
} from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

const defaultValues: EquipmentDTOInput = {
    name: "",
    brand: "",
    availability: true,
    quantity: 1,
    status: "NEW",
    ownerId: undefined,
    image: undefined,
};

interface EquipmentFormDialogProps {
    isOpen: boolean;
    onClose: () => void;
    equipment?: Equipment;
    onSubmit: (data: EquipmentDTOInput) => void;
    isMutating: boolean;
    currentUserRole: UserDTO["role"];
    equipmentOwners: UserDTO[];
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
    const isSuperAdmin = currentUserRole === "SUPER_ADMIN";
    const isEditing = !!equipment;

    const formDefaultValues = equipment
        ? {
              name: equipment.name,
              brand: equipment.brand,
              availability: equipment.availability,
              quantity: equipment.quantity,
              status: equipment.status,
              ownerId: equipment.equipmentOwner?.publicId ?? undefined,
              image: undefined,
          }
        : defaultValues;

    const form = useForm<EquipmentDTOInput>({
        resolver: valibotResolver(equipmentDataSchema),
        defaultValues: formDefaultValues,
        mode: "onChange",
    });

    // Initialize useFileUpload hook
    const initialHookFiles: FileMetadata[] = [];
    if (isEditing && equipment?.imagePath && !form.getValues("image")) {
        initialHookFiles.push({
            id: `${equipment.publicId}-initial`,
            name: equipment.imagePath.split("/").pop() || "current_image.jpg",
            url: equipment.imagePath,
            type: "image/existing",
            size: 0,
        });
    }

    const [hookState, hookActions] = useFileUpload({
        accept: "image/jpeg, image/png, image/webp",
        maxSize: 5 * 1024 * 1024, // 5MB
        maxFiles: 1,
        multiple: false,
        initialFiles: initialHookFiles,
        onFilesChange: (uploadedFiles) => {
            setTimeout(() => {
                // setTimeout to avoid react batching issues with RHF
                if (
                    uploadedFiles.length > 0 &&
                    uploadedFiles[0].file instanceof File
                ) {
                    form.setValue("image", uploadedFiles[0].file as File, {
                        shouldValidate: true,
                        shouldDirty: true,
                    });
                } else {
                    form.setValue("image", undefined, {
                        shouldValidate: true,
                        shouldDirty: true,
                    });
                }
            }, 0);
        },
    });

    const {
        files: uploadedFiles,
        isDragging,
        errors: uploadErrors,
    } = hookState;
    const {
        handleDragEnter,
        handleDragLeave,
        handleDragOver,
        handleDrop,
        openFileDialog,
        removeFile,
        getInputProps,
    } = hookActions;

    useEffect(() => {
        if (isOpen) {
            const newDefaultValues = equipment
                ? {
                      name: equipment.name,
                      brand: equipment.brand,
                      availability: equipment.availability,
                      quantity: equipment.quantity,
                      status: equipment.status,
                      ownerId: equipment.equipmentOwner?.publicId ?? undefined,
                      image: undefined,
                  }
                : defaultValues;
            form.reset(newDefaultValues);
            form.setValue("image", undefined, {
                shouldValidate: true,
                shouldDirty: false,
            });
        }
    }, [isOpen, equipment, form.reset, form.setValue]);

    const processSubmit = (data: EquipmentDTOInput) => {
        // Validate image presence for new equipment
        if (!isEditing && !data.image) {
            form.setError("image", {
                message: "Image file is required for new equipment.",
            });
            return;
        }

        // Validate owner selection for SUPER_ADMIN adding new equipment
        if (isSuperAdmin && !isEditing && !data.ownerId) {
            form.setError("ownerId", {
                message: "Equipment Owner is required for Super Admin.",
            });
            return;
        }

        onSubmit(data);
    };

    const currentPreviewUrl =
        uploadedFiles[0]?.preview ||
        (isEditing && equipment?.imagePath && !uploadedFiles[0]?.file
            ? equipment.imagePath
            : null);

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
                                        <FormLabel>Equipment Owner</FormLabel>
                                        <Select
                                            onValueChange={(value) =>
                                                field.onChange(value)
                                            } // Ensure value is number
                                            value={field.value}
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
                                                                key={
                                                                    owner.publicId
                                                                }
                                                                value={
                                                                    owner.publicId
                                                                }
                                                            >
                                                                {
                                                                    owner.firstName
                                                                }
                                                                {owner.lastName}
                                                                ({owner.email})
                                                            </SelectItem>
                                                        ),
                                                    )
                                                ) : (
                                                    <SelectItem
                                                        value="Empty"
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

                        {/* Image Upload using useFileUpload */}
                        <FormField
                            control={form.control}
                            name="image"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Image</FormLabel>
                                    <FormControl>
                                        <div className="flex flex-col gap-2">
                                            <div className="relative">
                                                <div
                                                    // biome-ignore lint/a11y/useSemanticElements: <yes>
                                                    role="button"
                                                    tabIndex={0}
                                                    onClick={openFileDialog}
                                                    onKeyDown={(e) => {
                                                        if (
                                                            e.key === "Enter" ||
                                                            e.key === " "
                                                        )
                                                            openFileDialog();
                                                    }}
                                                    onDragEnter={
                                                        handleDragEnter
                                                    }
                                                    onDragLeave={
                                                        handleDragLeave
                                                    }
                                                    onDragOver={handleDragOver}
                                                    onDrop={handleDrop}
                                                    data-dragging={
                                                        isDragging || undefined
                                                    }
                                                    className={cn(
                                                        "border-input hover:bg-accent/50 data-[dragging=true]:bg-accent/50 has-[input:focus]:border-ring has-[input:focus]:ring-ring/50",
                                                        "relative flex min-h-52 flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed p-4 transition-colors",
                                                        (isMutating ||
                                                            field.disabled) &&
                                                            "pointer-events-none opacity-50",
                                                        currentPreviewUrl &&
                                                            "has-[img]:border-none",
                                                    )}
                                                    aria-disabled={
                                                        isMutating ||
                                                        field.disabled
                                                    }
                                                >
                                                    <input
                                                        {...getInputProps({
                                                            disabled:
                                                                isMutating ||
                                                                field.disabled,
                                                        })}
                                                        className="sr-only"
                                                        aria-label="Upload equipment image"
                                                    />
                                                    {currentPreviewUrl ? (
                                                        <div className="absolute inset-0">
                                                            <img
                                                                src={
                                                                    currentPreviewUrl
                                                                }
                                                                alt={
                                                                    uploadedFiles[0]
                                                                        ?.file
                                                                        ?.name ||
                                                                    "Uploaded image"
                                                                }
                                                                className="size-full object-cover"
                                                                onError={(
                                                                    e,
                                                                ) => {
                                                                    e.currentTarget.src =
                                                                        "/placeholder.svg";
                                                                }}
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col items-center justify-center px-4 py-3 text-center">
                                                            <div
                                                                className="bg-background mb-2 flex size-11 shrink-0 items-center justify-center rounded-full border"
                                                                aria-hidden="true"
                                                            >
                                                                <ImageUpIcon className="size-4 opacity-60" />
                                                            </div>
                                                            <p className="mb-1.5 text-sm font-medium">
                                                                Drop your image
                                                                here or click to
                                                                browse
                                                            </p>
                                                            <p className="text-muted-foreground text-xs">
                                                                Max size: 5MB.
                                                                Accepted: JPG,
                                                                PNG, WEBP
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                                {currentPreviewUrl && (
                                                    <div className="absolute top-4 right-4">
                                                        {isEditing &&
                                                        equipment?.imagePath &&
                                                        !uploadedFiles[0]
                                                            ?.file ? (
                                                            <Button
                                                                type="button"
                                                                variant="secondary"
                                                                size="icon"
                                                                className="z-50 flex size-8 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white transition-[color,box-shadow] outline-none hover:bg-black/80 focus-visible:ring-[3px] hover:text-white"
                                                                onClick={(
                                                                    e,
                                                                ) => {
                                                                    e.stopPropagation();
                                                                    openFileDialog();
                                                                }}
                                                                aria-label="Replace image"
                                                                disabled={
                                                                    isMutating ||
                                                                    field.disabled
                                                                }
                                                            >
                                                                <Edit
                                                                    className="size-4"
                                                                    aria-hidden="true"
                                                                />
                                                            </Button>
                                                        ) : uploadedFiles[0]
                                                              ?.file ? (
                                                            <Button
                                                                type="button"
                                                                variant="destructive"
                                                                size="icon"
                                                                className="z-50 flex size-8 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white transition-[color,box-shadow] outline-none hover:bg-black/80 focus-visible:ring-[3px] hover:text-white"
                                                                onClick={(
                                                                    e,
                                                                ) => {
                                                                    e.stopPropagation();
                                                                    hookActions.removeFile(
                                                                        uploadedFiles[0]
                                                                            ?.id,
                                                                    );
                                                                    form.setValue(
                                                                        "image",
                                                                        undefined,
                                                                        {
                                                                            shouldValidate: true,
                                                                            shouldDirty: true,
                                                                        },
                                                                    );
                                                                }}
                                                                aria-label="Remove selected image"
                                                                disabled={
                                                                    isMutating ||
                                                                    field.disabled
                                                                }
                                                            >
                                                                <X
                                                                    className="size-4"
                                                                    aria-hidden="true"
                                                                />
                                                            </Button>
                                                        ) : null}
                                                    </div>
                                                )}
                                            </div>
                                            {uploadErrors.length > 0 && (
                                                <div
                                                    className="text-destructive flex items-center gap-1 text-xs"
                                                    role="alert"
                                                >
                                                    <AlertCircleIcon className="size-3 shrink-0" />
                                                    <span>
                                                        {uploadErrors[0]}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

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
                            (!isEditing && !form.getValues("image")) ||
                            uploadErrors.length > 0 ||
                            (isSuperAdmin &&
                                !isEditing &&
                                !form.getValues("ownerId"))
                        }
                    >
                        {isMutating ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                                Saving...
                            </>
                        ) : isEditing ? (
                            "Save Changes"
                        ) : (
                            "Add Equipment"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
