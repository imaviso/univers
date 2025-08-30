import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
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
import { type FileMetadata, useFileUpload } from "@/hooks/use-file-upload";
import {
	allEquipmentCategoriesQueryOptions,
	useCreateEquipmentCategoryMutation,
	useDeleteEquipmentCategoryMutation,
} from "@/lib/query"; // Import query and mutation for categories
import { type EquipmentDTOInput, equipmentDataSchema } from "@/lib/schema";
import { type Equipment, STATUS_EQUIPMENT, type UserDTO } from "@/lib/types";
import { cn } from "@/lib/utils";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { useQuery } from "@tanstack/react-query"; // Import useQuery
import {
	AlertCircleIcon,
	CheckIcon, // For selected items
	ChevronsUpDownIcon, // For combobox trigger button
	Edit,
	ImageUpIcon,
	Loader2,
	PlusCircleIcon, // Added for new category button
	XIcon as X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner"; // For toast notifications

const defaultValues: EquipmentDTOInput = {
	name: "",
	brand: "",
	availability: true,
	quantity: 1,
	status: "NEW",
	serialNo: "",
	ownerId: undefined,
	image: undefined,
	categoryIds: [], // Added categoryIds
};

interface EquipmentFormDialogProps {
	isOpen: boolean;
	onClose: () => void;
	equipment?: Equipment;
	onSubmit: (data: EquipmentDTOInput) => void;
	isMutating: boolean;
	currentUserRoles: UserDTO["roles"];
	equipmentOwners: UserDTO[];
}

export function EquipmentFormDialog({
	isOpen,
	onClose,
	equipment,
	onSubmit,
	isMutating,
	currentUserRoles,
	equipmentOwners,
}: EquipmentFormDialogProps) {
	const isSuperAdmin = currentUserRoles?.includes("SUPER_ADMIN");
	const isEditing = !!equipment;

	// Fetch equipment categories
	const {
		data: categories = [],
		isLoading: isLoadingCategories,
		refetch: refetchCategories,
	} = useQuery(allEquipmentCategoriesQueryOptions);
	const createCategoryMutation = useCreateEquipmentCategoryMutation();
	const deleteCategoryMutation = useDeleteEquipmentCategoryMutation();

	const [popoverOpen, setPopoverOpen] = useState(false);
	const [categorySearchTerm, setCategorySearchTerm] = useState("");

	const formDefaultValues = equipment
		? {
				name: equipment.name,
				brand: equipment.brand,
				availability: equipment.availability,
				quantity: equipment.quantity,
				status: equipment.status,
				serialNo: equipment.serialNo,
				ownerId: equipment.equipmentOwner?.publicId ?? undefined,
				image: undefined,
				categoryIds: equipment.categories?.map((cat) => cat.publicId) ?? [], // Added categoryIds
			}
		: defaultValues;

	const form = useForm<EquipmentDTOInput>({
		resolver: valibotResolver(equipmentDataSchema),
		defaultValues: formDefaultValues,
		mode: "onChange",
	});

	const watchedCategoryIds = form.watch("categoryIds") || [];

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
				if (uploadedFiles.length > 0 && uploadedFiles[0].file instanceof File) {
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

	const { files: uploadedFiles, isDragging, errors: uploadErrors } = hookState;
	const {
		handleDragEnter,
		handleDragLeave,
		handleDragOver,
		handleDrop,
		openFileDialog,
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
						serialNo: equipment.serialNo,
						ownerId: equipment.equipmentOwner?.publicId ?? undefined,
						image: undefined,
						categoryIds: equipment.categories?.map((cat) => cat.publicId) ?? [], // Added categoryIds
					}
				: defaultValues;
			form.reset(newDefaultValues);
			form.setValue("image", undefined, {
				shouldValidate: true,
				shouldDirty: false,
			});
			setCategorySearchTerm("");
		}
	}, [isOpen, equipment, form.reset, form.setValue]);

	const handleCreateCategory = (name: string) => {
		if (!name.trim()) {
			toast.error("Category name cannot be empty.");
			return;
		}
		createCategoryMutation.mutate(
			{ name: name.trim(), description: null },
			{
				onSuccess: (createdCategory) => {
					toast.success(
						`Category "${createdCategory.name}" created successfully.`,
					);
					setCategorySearchTerm("");
					refetchCategories(); // Refetch categories to include the new one
					const currentIds = form.getValues("categoryIds") || [];
					if (!currentIds.includes(createdCategory.publicId)) {
						form.setValue(
							"categoryIds",
							[...currentIds, createdCategory.publicId],
							{ shouldValidate: true, shouldDirty: true },
						);
					}
					// Consider keeping popover open or closing based on UX preference
					// setPopoverOpen(false);
				},
				onError: (error) => {
					toast.error(`Failed to create category: ${error.message}`);
				},
			},
		);
	};

	const handleDeleteCategory = (categoryId: string, categoryName: string) => {
		if (!isSuperAdmin) {
			toast.error("Only super admins can delete categories.");
			return;
		}

		// Check if category is in use
		const isCategoryInUse = watchedCategoryIds.includes(categoryId);
		if (isCategoryInUse) {
			toast.error(
				`Cannot delete category "${categoryName}" as it is currently in use.`,
			);
			return;
		}

		deleteCategoryMutation.mutate(categoryId, {
			onSuccess: () => {
				toast.success(`Category "${categoryName}" deleted successfully.`);
				refetchCategories();
			},
			onError: (error) => {
				toast.error(`Failed to delete category: ${error.message}`);
			},
		});
	};

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

		onSubmit(data); // categoryIds will be part of data due to schema and form handling
	};

	const currentPreviewUrl =
		uploadedFiles[0]?.preview ||
		(isEditing && equipment?.imagePath && !uploadedFiles[0]?.file
			? equipment.imagePath
			: null);

	const selectedCategoryNames = useMemo(() => {
		return watchedCategoryIds
			.map((id) => categories.find((cat) => cat.publicId === id)?.name)
			.filter((name) => !!name)
			.join(", ");
	}, [watchedCategoryIds, categories]);

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
											onValueChange={(value) => field.onChange(value)} // Ensure value is number
											value={String(field.value ?? "")}
											disabled={isMutating}
										>
											<FormControl>
												<SelectTrigger className="w-full">
													<SelectValue placeholder="Select the owner" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{equipmentOwners.length > 0 ? (
													equipmentOwners.map((owner) => (
														<SelectItem
															key={owner.publicId}
															value={owner.publicId}
														>
															{owner.firstName}
															{owner.lastName}({owner.email})
														</SelectItem>
													))
												) : (
													<SelectItem value="Empty" disabled>
														No equipment owners found
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
											value={String(field.value ?? "")}
											disabled={isMutating}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						{/* Category Multi-Select */}
						<FormField
							control={form.control}
							name="categoryIds"
							render={({ field }) => (
								<FormItem className="flex flex-col">
									<FormLabel>Categories</FormLabel>
									<Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
										<PopoverTrigger asChild>
											<FormControl>
												<Button
													variant="outline"
													// biome-ignore lint/a11y/useSemanticElements: <yes>
													role="combobox"
													aria-expanded={popoverOpen}
													className={cn(
														"w-full justify-between border-input",
														!field.value?.length &&
															"text-muted-foreground border-input",
													)}
													disabled={isMutating || isLoadingCategories}
												>
													<span className="truncate text-sm">
														{selectedCategoryNames || "Select categories..."}
													</span>
													<ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
												</Button>
											</FormControl>
										</PopoverTrigger>
										<PopoverContent className="w-[--radix-popover-trigger-width] max-h-[--radix-popover-content-available-height] p-0">
											<Command shouldFilter={false}>
												{" "}
												{/* Manual filtering for create option */}
												<CommandInput
													placeholder="Search or create category..."
													value={categorySearchTerm}
													onValueChange={setCategorySearchTerm}
													disabled={createCategoryMutation.isPending}
												/>
												<CommandList>
													<CommandGroup>
														{categories
															.filter((cat) =>
																cat.name
																	.toLowerCase()
																	.includes(categorySearchTerm.toLowerCase()),
															)
															.map((category) => (
																<CommandItem
																	value={category.publicId} // Use unique publicId for the value
																	key={category.publicId}
																	onSelect={() => {
																		const currentIds = [...watchedCategoryIds];
																		const index = currentIds.indexOf(
																			category.publicId,
																		);
																		if (index === -1) {
																			currentIds.push(category.publicId);
																		} else {
																			currentIds.splice(index, 1);
																		}
																		form.setValue("categoryIds", currentIds, {
																			shouldValidate: true,
																			shouldDirty: true,
																		});
																	}}
																	className="flex items-center justify-between group"
																>
																	<div className="flex items-center">
																		<CheckIcon
																			className={cn(
																				"mr-2 h-4 w-4",
																				watchedCategoryIds.includes(
																					category.publicId,
																				)
																					? "opacity-100"
																					: "opacity-0",
																			)}
																		/>
																		{category.name}
																	</div>
																	{isSuperAdmin && (
																		<Button
																			variant="ghost"
																			size="icon"
																			className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
																			onClick={(e) => {
																				e.stopPropagation();
																				handleDeleteCategory(
																					category.publicId,
																					category.name,
																				);
																			}}
																			disabled={
																				deleteCategoryMutation.isPending ||
																				watchedCategoryIds.includes(
																					category.publicId,
																				)
																			}
																		>
																			<X className="h-4 w-4" />
																		</Button>
																	)}
																</CommandItem>
															))}
													</CommandGroup>
													{/* Conditionally render 'Create new category' item */}
													{categorySearchTerm.trim() &&
														!isLoadingCategories &&
														!createCategoryMutation.isPending &&
														!categories.some(
															(cat) =>
																cat.name.toLowerCase() ===
																categorySearchTerm.trim().toLowerCase(),
														) && (
															<CommandItem
																key="__create_new_category_item__"
																value="__create_new_category_value__" // Static unique value
																onSelect={() =>
																	handleCreateCategory(categorySearchTerm)
																}
																className="text-sm cursor-pointer"
															>
																<PlusCircleIcon className="mr-2 h-4 w-4" />
																Create "{categorySearchTerm.trim()}"
															</CommandItem>
														)}
													<CommandEmpty>
														{
															isLoadingCategories
																? "Loading categories..."
																: !categories.some((cat) =>
																			cat.name
																				.toLowerCase()
																				.includes(
																					categorySearchTerm.toLowerCase(),
																				),
																		) &&
																		!(
																			categorySearchTerm.trim() &&
																			!categories.some(
																				(cat) =>
																					cat.name.toLowerCase() ===
																					categorySearchTerm
																						.trim()
																						.toLowerCase(),
																			)
																		)
																	? "No categories found."
																	: null /* Or a more specific message if needed */
														}
													</CommandEmpty>
													{createCategoryMutation.isPending && (
														<CommandItem
															disabled
															className="text-sm text-muted-foreground flex items-center justify-center"
														>
															<Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
															Creating...
														</CommandItem>
													)}
												</CommandList>
											</Command>
										</PopoverContent>
									</Popover>
									<FormMessage />
								</FormItem>
							)}
						/>

						{/* Brand */}
						<div className="grid grid-cols-2 gap-4">
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
												value={String(field.value ?? "")}
												disabled={isMutating}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="serialNo"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Serial Number</FormLabel>
										<FormControl>
											<Input
												placeholder="Enter Serial Number"
												{...field}
												value={String(field.value ?? "")}
												disabled={isMutating}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						{/* Quantity and Status */}

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
														Number.parseInt(e.target.value, 10) || 0,
													)
												}
												// Ensure value is treated as number for input type=number
												value={Number(field.value ?? 0)}
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
											value={String(field.value ?? "")}
											disabled={isMutating}
										>
											<FormControl>
												<SelectTrigger className="w-full">
													<SelectValue placeholder="Select status" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{STATUS_EQUIPMENT.map((statusOption) => (
													<SelectItem
														key={statusOption.value}
														value={statusOption.value}
													>
														{statusOption.label}
													</SelectItem>
												))}
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
											checked={Boolean(field.value)}
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
														if (e.key === "Enter" || e.key === " ")
															openFileDialog();
													}}
													onDragEnter={handleDragEnter}
													onDragLeave={handleDragLeave}
													onDragOver={handleDragOver}
													onDrop={handleDrop}
													data-dragging={isDragging || undefined}
													className={cn(
														"border-input hover:bg-accent/50 data-[dragging=true]:bg-accent/50 has-[input:focus]:border-ring has-[input:focus]:ring-ring/50",
														"relative flex min-h-52 flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed p-4 transition-colors",
														(isMutating || field.disabled) &&
															"pointer-events-none opacity-50",
														currentPreviewUrl && "has-[img]:border-none",
													)}
													aria-disabled={isMutating || field.disabled}
												>
													<input
														{...getInputProps({
															disabled: isMutating || field.disabled,
														})}
														className="sr-only"
														aria-label="Upload equipment image"
													/>
													{currentPreviewUrl ? (
														<div className="absolute inset-0">
															<img
																src={currentPreviewUrl}
																alt={
																	uploadedFiles[0]?.file?.name ||
																	"Uploaded image"
																}
																className="size-full object-cover"
																onError={(e) => {
																	e.currentTarget.src = "/placeholder.svg";
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
																Drop your image here or click to browse
															</p>
															<p className="text-muted-foreground text-xs">
																Max size: 5MB. Accepted: JPG, PNG, WEBP
															</p>
														</div>
													)}
												</div>
												{currentPreviewUrl && (
													<div className="absolute top-4 right-4">
														{isEditing &&
														equipment?.imagePath &&
														!uploadedFiles[0]?.file ? (
															<Button
																type="button"
																variant="secondary"
																size="icon"
																className="z-50 flex size-8 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white transition-[color,box-shadow] outline-none hover:bg-black/80 focus-visible:ring-[3px] hover:text-white"
																onClick={(e) => {
																	e.stopPropagation();
																	openFileDialog();
																}}
																aria-label="Replace image"
																disabled={isMutating || field.disabled}
															>
																<Edit className="size-4" aria-hidden="true" />
															</Button>
														) : uploadedFiles[0]?.file ? (
															<Button
																type="button"
																variant="destructive"
																size="icon"
																className="z-50 flex size-8 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white transition-[color,box-shadow] outline-none hover:bg-black/80 focus-visible:ring-[3px] hover:text-white"
																onClick={(e) => {
																	e.stopPropagation();
																	hookActions.removeFile(uploadedFiles[0]?.id);
																	form.setValue("image", undefined, {
																		shouldValidate: true,
																		shouldDirty: true,
																	});
																}}
																aria-label="Remove selected image"
																disabled={isMutating || field.disabled}
															>
																<X className="size-4" aria-hidden="true" />
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
													<span>{uploadErrors[0]}</span>
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
							isLoadingCategories ||
							createCategoryMutation.isPending
						} // Disable if categories are loading
					>
						{isMutating ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
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
