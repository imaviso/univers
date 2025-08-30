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
import { type FileMetadata, useFileUpload } from "@/hooks/use-file-upload"; // Updated import
import { type VenueInput, venueSchema } from "@/lib/schema";
import type { UserDTO, UserRole, VenueDTO } from "@/lib/types";
import { cn } from "@/lib/utils";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { AlertCircleIcon, ImageUpIcon, Loader2, XIcon } from "lucide-react"; // Updated imports
import { useEffect } from "react"; // Added useEffect import
import { useForm } from "react-hook-form";

const defaultValues: VenueInput = {
	name: "",
	location: "",
	venueOwnerId: "",
	image: undefined,
};

interface VenueFormDialogProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (venueData: VenueInput, imageFile: File | null | undefined) => void; // imageFile can be File | null | undefined
	venue?: VenueDTO | null;
	isLoading?: boolean;
	venueOwners: UserDTO[];
	currentUserRole?: UserRole[];
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

	// Effect to reset form when dialog opens or venue changes
	useEffect(() => {
		if (isOpen) {
			const newDefaultValues =
				isEditing && venue
					? {
							name: venue.name,
							location: venue.location,
							venueOwnerId: venue.venueOwner?.publicId ?? undefined,
							image: undefined, // Image is handled by useFileUpload's initialFiles for display
							// and form.setValue by its onFilesChange for RHF state
						}
					: defaultValues; // Use the global defaultValues for a new venue
			form.reset(newDefaultValues);
		}
	}, [isOpen, venue, isEditing, form]); // Dependencies that trigger form reset

	const processSubmit = (data: VenueInput) => {
		const finalData = {
			...data,
		};
		onSubmit(finalData, data.image);
	};

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

						{currentUserRole?.includes("SUPER_ADMIN") && (
							<FormField
								control={form.control}
								name="venueOwnerId"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Venue Owner</FormLabel>
										<Select
											onValueChange={(value) => {
												if (value === "none") {
													field.onChange(undefined);
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
															value={owner.publicId}
														>
															{owner.firstName} {owner.lastName} ({owner.email})
														</SelectItem>
													))
												) : (
													<SelectItem value="Empty" disabled>
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
							render={({ field }) => {
								const maxSizeMB = 10;
								const maxSize = maxSizeMB * 1024 * 1024;

								const initialHookFiles: FileMetadata[] = [];
								if (isEditing && venue?.imagePath && !field.value) {
									initialHookFiles.push({
										id: `${venue.publicId}-initial`, // Fixed: Template literal
										name:
											venue.imagePath.split("/").pop() || "current_image.jpg",
										url: venue.imagePath,
										type: "image/existing", // Placeholder type
										size: 0, // Size unknown for existing remote images
									});
								}

								const [hookState, hookActions] = useFileUpload({
									accept: "image/*",
									maxSize,
									maxFiles: 1,
									multiple: false,
									initialFiles: initialHookFiles,
									onFilesChange: (uploadedFiles) => {
										setTimeout(() => {
											if (
												uploadedFiles.length > 0 &&
												uploadedFiles[0].file instanceof File
											) {
												field.onChange(uploadedFiles[0].file as File);
											} else {
												// If useFileUpload clears files (e.g. initial file removed),
												// or if no file is selected.
												field.onChange(undefined);
											}
										}, 0);
									},
								});

								const { files, isDragging, errors: uploadErrors } = hookState;
								const {
									handleDragEnter,
									handleDragLeave,
									handleDragOver,
									handleDrop,
									openFileDialog,
									removeFile,
									getInputProps,
								} = hookActions;

								const currentPreviewUrl = files[0]?.preview || null;

								return (
									<FormItem>
										<FormLabel>Image (Optional)</FormLabel>
										<FormControl>
											<div className="flex flex-col gap-2">
												<div className="relative">
													<div
														// biome-ignore lint/a11y/useSemanticElements: <explanation>
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
															(isLoading || field.disabled) &&
																"pointer-events-none opacity-50",
															currentPreviewUrl && "has-[img]:border-none",
														)}
														aria-disabled={isLoading || field.disabled}
													>
														<input
															{...getInputProps({
																disabled: isLoading || field.disabled,
															})}
															className="sr-only"
															aria-label="Upload venue image"
														/>
														{currentPreviewUrl ? (
															<div className="absolute inset-0">
																<img
																	src={currentPreviewUrl}
																	alt={files[0]?.file?.name || "Uploaded image"}
																	className="size-full object-cover"
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
																	Max size: {maxSizeMB}
																	MB. Accepted: image/*
																</p>
															</div>
														)}
													</div>
													{currentPreviewUrl && (
														<div className="absolute top-4 right-4">
															<Button
																type="button"
																variant="destructive"
																size="icon"
																className="z-50 flex size-8 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white transition-[color,box-shadow] outline-none hover:bg-black/80 focus-visible:ring-[3px] hover:text-white"
																onClick={(e) => {
																	e.stopPropagation();
																	removeFile(files[0]?.id);
																	// Also ensure RHF field is cleared
																	field.onChange(undefined);
																}}
																aria-label="Remove image"
																disabled={isLoading || field.disabled}
															>
																<XIcon className="size-4" aria-hidden="true" />
															</Button>
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
								);
							}}
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
						//disabled={isLoading || !form.formState.isValid}
					>
						{isLoading ? (
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						) : null}
						{isLoading ? "Saving..." : isEditing ? "Save Changes" : "Add Venue"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
