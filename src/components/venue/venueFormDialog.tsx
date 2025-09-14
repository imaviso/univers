import { valibotResolver } from "@hookform/resolvers/valibot";
import { AlertCircleIcon, ImageUpIcon, Loader2, XIcon } from "lucide-react";
import { useEffect, useId, useMemo } from "react";
import { useForm } from "react-hook-form";
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
import { type FileMetadata, useFileUpload } from "@/hooks/use-file-upload";
import { type VenueInput, venueSchema } from "@/lib/schema";
import type { UserDTO, UserRole, VenueDTO } from "@/lib/types";
import { cn } from "@/lib/utils";

const defaultValues: VenueInput = {
	name: "",
	location: "",
	venueOwnerId: "",
	image: undefined,
};

interface VenueFormDialogProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (venueData: VenueInput, imageFile: File | null | undefined) => void;
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

	// Reset form when dialog opens or venue changes
	useEffect(() => {
		if (isOpen) {
			const newDefaults =
				isEditing && venue
					? {
							name: venue.name,
							location: venue.location,
							venueOwnerId: venue.venueOwner?.publicId ?? undefined,
							image: undefined,
						}
					: defaultValues;
			form.reset(newDefaults);
		}
	}, [isOpen, venue, isEditing, form]);

	const processSubmit = (data: VenueInput) => {
		onSubmit({ ...data }, data.image);
	};

	const id = useId();

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
						id={`${id}venue-form`}
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
												if (value === "none") field.onChange(undefined);
												else field.onChange(value);
											}}
											disabled={isLoading}
											value={field.value || undefined}
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
													<SelectItem value="empty" disabled>
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

						{/* Image Upload Field */}
						<ImageUploadField
							form={form}
							venue={venue}
							isEditing={isEditing}
							isLoading={!!isLoading}
						/>

						{/* General backend error */}
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
					{/* Ensure id uses template literal per lint rule */}
					<Button type="submit" disabled={isLoading} form={`${id}venue-form`}>
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

interface ImageUploadFieldProps {
	form: ReturnType<typeof useForm<VenueInput>>;
	venue?: VenueDTO | null;
	isEditing: boolean;
	isLoading: boolean;
}

function ImageUploadField({
	form,
	venue,
	isEditing,
	isLoading,
}: ImageUploadFieldProps) {
	// Compute initial files for edit mode
	const initialFiles: FileMetadata[] = useMemo(() => {
		if (isEditing && venue?.imagePath) {
			return [
				{
					id: `${venue.publicId}-initial`,
					// safer fallback name extraction
					name: venue.imagePath.split("/").pop() || "current_image.jpg",
					url: venue.imagePath,
					type: "image/existing",
					size: 0,
				},
			];
		}
		return [];
	}, [isEditing, venue]);

	const maxSizeMB = 10;
	const maxSize = maxSizeMB * 1024 * 1024;

	// Hook at top-level of component (valid)
	const [hookState, hookActions] = useFileUpload({
		accept: "image/*",
		maxSize,
		maxFiles: 1,
		multiple: false,
		initialFiles,
		onFilesChange: (uploadedFiles) => {
			// Sync with RHF field
			if (uploadedFiles.length > 0 && uploadedFiles[0].file instanceof File) {
				form.setValue("image", uploadedFiles[0].file as File, {
					shouldDirty: true,
					shouldTouch: true,
				});
			} else {
				form.setValue("image", undefined, {
					shouldDirty: true,
					shouldTouch: true,
				});
			}
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
		<FormField
			control={form.control}
			name="image"
			render={({ field }) => (
				<FormItem>
					<FormLabel>Image (Optional)</FormLabel>
					<FormControl>
						<div className="flex flex-col gap-2">
							<div className="relative">
								<button
									type="button"
									tabIndex={0}
									onClick={openFileDialog}
									onKeyDown={(e) => {
										if (e.key === "Enter" || e.key === " ") openFileDialog();
									}}
									onDragEnter={handleDragEnter}
									onDragLeave={handleDragLeave}
									onDragOver={handleDragOver}
									onDrop={handleDrop}
									data-dragging={isDragging || undefined}
									className={cn(
										"w-full border-input hover:bg-accent/50 data-[dragging=true]:bg-accent/50 has-[input:focus]:border-ring has-[input:focus]:ring-ring/50",
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
								</button>
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
												form.setValue("image", undefined, {
													shouldDirty: true,
													shouldTouch: true,
												});
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
			)}
		/>
	);
}
