import { valibotResolver } from "@hookform/resolvers/valibot";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";
import { startOfDay } from "date-fns";
import {
	AlertCircleIcon,
	Check,
	ChevronsUpDown,
	FileTextIcon,
	ImageUpIcon,
	Loader2,
	XIcon,
} from "lucide-react";
import { useEffect } from "react";
import { type Control, useController, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
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
import { useFileUpload } from "@/hooks/use-file-upload";
import { createEvent } from "@/lib/api";
import {
	departmentsQueryOptions,
	eventsQueryKeys,
	useCurrentUser,
} from "@/lib/query";
import { type EventInput, type EventOutput, eventSchema } from "@/lib/schema";
import type { DepartmentDTO, EventDTOPayload, VenueDTO } from "@/lib/types";
import { cn } from "@/lib/utils";
import { SmartDatetimeInput } from "../ui/smart-date-picker";

interface EventModalProps {
	isOpen: boolean;
	onClose: () => void;
	venues: VenueDTO[];
}

export const eventTypes = [
	"External",
	"Program-based",
	"Admin",
	"SSG/Advocacy-based",
];

// Extracted component to keep hooks at the top level.
// This fixes the lint rule: hooks must not be called inside a nested render callback.
function ApprovedLetterUploadField({
	control,
	disabled,
}: {
	control: Control<EventInput>;
	disabled: boolean;
}) {
	const {
		field,
		fieldState: { error },
	} = useController({
		name: "approvedLetter",
		control,
	});

	const maxSizeMB = 5;
	const maxSize = maxSizeMB * 1024 * 1024;

	const [hookState, hookActions] = useFileUpload({
		accept:
			"image/jpeg, image/png, image/webp, application/pdf, .docx, application/vnd.openxmlformats-officedocument.wordprocessingml.document",
		maxSize,
		maxFiles: 1,
		multiple: false,
		onFilesChange: (uploadedFiles) => {
			if (uploadedFiles.length > 0 && uploadedFiles[0].file instanceof File) {
				field.onChange(uploadedFiles[0].file as File);
			} else {
				field.onChange(undefined);
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
		clearFiles,
	} = hookActions;

	const currentFileObject = files[0]?.file;
	const previewUrl = files[0]?.preview;

	// When the RHF field value is cleared externally (e.g., form.reset()),
	// ensure the internal upload state is also cleared.
	useEffect(() => {
		if (!field.value && files.length > 0) {
			clearFiles();
		}
	}, [field.value, files.length, clearFiles]);

	return (
		<FormItem>
			<FormLabel>Approved Letter</FormLabel>
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
								disabled && "pointer-events-none opacity-50",
								previewUrl && "has-[img]:border-none",
							)}
							aria-disabled={disabled}
						>
							<input
								{...getInputProps({ disabled })}
								className="sr-only"
								aria-label="Upload approved letter"
							/>
							{previewUrl && currentFileObject?.type?.startsWith("image/") ? (
								<div className="absolute inset-0">
									<img
										src={previewUrl}
										alt={currentFileObject?.name || "Uploaded image"}
										className="size-full object-cover"
									/>
								</div>
							) : currentFileObject ? (
								<div className="flex flex-col items-center justify-center text-center p-4">
									<FileTextIcon className="size-12 text-muted-foreground mb-2" />
									<p className="text-sm font-medium truncate max-w-full">
										{currentFileObject.name}
									</p>
									{currentFileObject instanceof File && (
										<p className="text-xs text-muted-foreground">
											{Math.round(currentFileObject.size / 1024)} KB
										</p>
									)}
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
										Drop your file here or click to browse
									</p>
									<p className="text-muted-foreground text-xs">
										Max size: {maxSizeMB}MB. Accepted: Images, PDF, DOCX
									</p>
								</div>
							)}
						</button>
						{previewUrl && (
							<div className="absolute top-4 right-4">
								<Button
									type="button"
									variant="destructive"
									size="icon"
									className="z-50 flex size-8 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white transition-[color,box-shadow] outline-none hover:bg-black/80 focus-visible:ring-[3px] hover:text-white"
									onClick={(e) => {
										e.stopPropagation();
										removeFile(files[0]?.id);
										field.onChange(undefined);
									}}
									aria-label="Remove file"
									disabled={disabled}
								>
									<XIcon className="size-4" aria-hidden="true" />
								</Button>
							</div>
						)}
					</div>

					{(uploadErrors.length > 0 || error) && (
						<div
							className="text-destructive flex items-center gap-1 text-xs"
							role="alert"
						>
							<AlertCircleIcon className="size-3 shrink-0" />
							<span>{uploadErrors[0] ?? error?.message}</span>
						</div>
					)}
				</div>
			</FormControl>
			<FormMessage />
		</FormItem>
	);
}

export function EventModal({ isOpen, onClose, venues }: EventModalProps) {
	const { data: currentUser } = useCurrentUser();
	const context = useRouteContext({ from: "/app/events/timeline" });
	const queryClient = context.queryClient;

	const { data: departments, isLoading: isLoadingDepartments } =
		useSuspenseQuery(departmentsQueryOptions);

	const form = useForm<EventInput>({
		resolver: valibotResolver(eventSchema),
		defaultValues: {
			eventName: "",
			eventType: undefined,
			venuePublicId: undefined,
			departmentPublicId: undefined,
			startTime: undefined,
			endTime: undefined,
			approvedLetter: undefined,
		},
	});

	useEffect(() => {
		if (!isOpen) {
			form.reset();
		}
	}, [isOpen, form]);

	const createEventMutation = useMutation({
		mutationFn: ({
			eventDTO,
			approvedLetter,
		}: {
			eventDTO: EventDTOPayload;
			approvedLetter: File;
		}) => createEvent(eventDTO, approvedLetter),

		onMutate: async ({ eventDTO, approvedLetter }) => {
			const ownEventsKey = eventsQueryKeys.own();

			await queryClient.cancelQueries({ queryKey: ownEventsKey });

			const previousOwnEvents =
				queryClient.getQueryData<EventOutput[]>(ownEventsKey);

			const optimisticEvent: EventOutput & { id: number; status: string } = {
				id: Date.now(),
				eventName: eventDTO.eventName,
				eventType: eventDTO.eventType,
				venuePublicId: eventDTO.venuePublicId,
				departmentPublicId: eventDTO.departmentPublicId,
				startTime: new Date(eventDTO.startTime),
				endTime: new Date(eventDTO.endTime),
				approvedLetter: approvedLetter,
				status: "PENDING",
			};

			queryClient.setQueryData<EventOutput[]>(ownEventsKey, (old) => [
				...(old ?? []),
				optimisticEvent,
			]);

			return { previousOwnEvents };
		},

		onError: (err, _variables, context) => {
			console.error("Mutation error", err);
			toast.error(
				`Failed to create event: ${
					err instanceof Error ? err.message : "Please try again."
				}`,
			);
			if (context?.previousOwnEvents) {
				queryClient.setQueryData(
					eventsQueryKeys.own(),
					context.previousOwnEvents,
				);
			}
		},

		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: eventsQueryKeys.own() });
			queryClient.invalidateQueries({ queryKey: eventsQueryKeys.approved() });
			queryClient.invalidateQueries({ queryKey: eventsQueryKeys.lists() });
			queryClient.invalidateQueries({ queryKey: eventsQueryKeys.pending() });
			queryClient.invalidateQueries({
				queryKey: eventsQueryKeys.pendingVenueOwner(),
			});
			queryClient.invalidateQueries({
				queryKey: eventsQueryKeys.pendingDeptHead(),
			});
		},

		onSuccess: (createdEvent) => {
			toast.success("Event Created", {
				description: `Event ${createdEvent.eventName} created successfully.`,
			});
			onClose();
		},
	});

	async function onSubmit(values: EventInput) {
		if (!currentUser?.publicId) {
			toast.error("You must be logged in to create an event.");
			return;
		}

		try {
			const outputValues = values as unknown as EventOutput;
			const eventDTO: EventDTOPayload = {
				eventName: outputValues.eventName,
				eventType: outputValues.eventType,
				venuePublicId: outputValues.venuePublicId,
				departmentPublicId: outputValues.departmentPublicId,
				startTime: outputValues.startTime.toISOString(),
				endTime: outputValues.endTime.toISOString(),
			};

			createEventMutation.mutate({
				eventDTO,
				approvedLetter: outputValues.approvedLetter as File,
			});
		} catch (validationError) {
			console.error("Pre-mutation error:", validationError);
			toast.error("An unexpected error occurred before submitting.");
		}
	}

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-[600px]">
				<DialogHeader>
					<DialogTitle className="text-xl">Create New Event</DialogTitle>
				</DialogHeader>
				<div className="grid gap-4 py-4">
					<Form {...form}>
						<form
							onSubmit={form.handleSubmit(onSubmit)}
							className="grid grid-cols-2 gap-4"
						>
							{/* Event Name */}
							<div className="col-span-2">
								<FormField
									control={form.control}
									name="eventName"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Event Name</FormLabel>
											<FormControl>
												<Input
													placeholder="Enter event name"
													{...field}
													disabled={createEventMutation.isPending}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							{/* Event Type */}
							<FormField
								control={form.control}
								name="eventType"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Event Type</FormLabel>
										<Select
											onValueChange={field.onChange}
											defaultValue={field.value}
											disabled={createEventMutation.isPending}
										>
											<FormControl>
												<SelectTrigger className="w-full">
													<SelectValue placeholder="Select event type" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{eventTypes.map((type) => (
													<SelectItem key={type} value={type}>
														{type}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>

							{/* Venue */}
							<FormField
								control={form.control}
								name="venuePublicId"
								render={({ field }) => (
									<FormItem className="flex flex-col">
										<FormLabel>Venue</FormLabel>
										<Popover modal>
											<PopoverTrigger asChild>
												<FormControl>
													<Button
														variant="outline"
														disabled={createEventMutation.isPending}
														className={cn(
															"w-full justify-between",
															!field.value && "text-muted-foreground",
														)}
													>
														{field.value
															? venues.find((v) => v.publicId === field.value)
																	?.name
															: "Select venue"}
														<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
													</Button>
												</FormControl>
											</PopoverTrigger>
											<PopoverContent className="w-[--radix-popover-trigger-width] p-0">
												<Command>
													<CommandInput placeholder="Search venue..." />
													<CommandList>
														<CommandEmpty>No venue found.</CommandEmpty>
														<CommandGroup>
															{venues.map((venue) => (
																<CommandItem
																	value={venue.name}
																	key={venue.publicId}
																	onSelect={() => {
																		form.setValue(
																			"venuePublicId",
																			venue.publicId,
																			{ shouldValidate: true },
																		);
																	}}
																>
																	<Check
																		className={cn(
																			"mr-2 h-4 w-4",
																			venue.publicId === field.value
																				? "opacity-100"
																				: "opacity-0",
																		)}
																	/>
																	{venue.name}
																</CommandItem>
															))}
														</CommandGroup>
													</CommandList>
												</Command>
											</PopoverContent>
										</Popover>
										<FormMessage />
									</FormItem>
								)}
							/>

							{/* Department */}
							<div className="col-span-2">
								<FormField
									control={form.control}
									name="departmentPublicId"
									render={({ field }) => (
										<FormItem className="flex flex-col">
											<FormLabel>Department</FormLabel>
											<Popover modal>
												<PopoverTrigger asChild>
													<FormControl>
														<Button
															variant="outline"
															disabled={
																createEventMutation.isPending ||
																isLoadingDepartments
															}
															className={cn(
																"w-full justify-between",
																!field.value && "text-muted-foreground",
															)}
														>
															{field.value
																? departments?.find(
																		(dept: DepartmentDTO) =>
																			dept.publicId === field.value,
																	)?.name
																: "Select department"}
															<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
														</Button>
													</FormControl>
												</PopoverTrigger>
												<PopoverContent className="w-[--radix-popover-trigger-width] p-0">
													<Command>
														<CommandInput placeholder="Search department..." />
														<CommandList>
															{isLoadingDepartments && (
																<div className="p-2 text-center text-sm text-muted-foreground">
																	Loading departments...
																</div>
															)}
															<CommandEmpty>No department found.</CommandEmpty>
															<CommandGroup>
																{departments?.map((dept: DepartmentDTO) => (
																	<CommandItem
																		value={dept.name}
																		key={dept.publicId}
																		onSelect={() => {
																			form.setValue(
																				"departmentPublicId",
																				dept.publicId,
																				{ shouldValidate: true },
																			);
																		}}
																	>
																		<Check
																			className={cn(
																				"mr-2 h-4 w-4",
																				dept.publicId === field.value
																					? "opacity-100"
																					: "opacity-0",
																			)}
																		/>
																		{dept.name}
																	</CommandItem>
																))}
															</CommandGroup>
														</CommandList>
													</Command>
												</PopoverContent>
											</Popover>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							{/* Start Date & Time */}
							<div>
								<FormField
									control={form.control}
									name="startTime"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Start Date & Time</FormLabel>
											<FormControl>
												<SmartDatetimeInput
													value={field.value}
													onValueChange={field.onChange}
													disabled={(date) =>
														date < startOfDay(new Date()) ||
														createEventMutation.isPending
													}
													placeholder="Select start date and time"
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							{/* End Date & Time */}
							<div>
								<FormField
									control={form.control}
									name="endTime"
									render={({ field }) => (
										<FormItem>
											<FormLabel>End Date & Time</FormLabel>
											<FormControl>
												<SmartDatetimeInput
													value={field.value}
													onValueChange={field.onChange}
													disabled={(date) =>
														date < startOfDay(new Date()) ||
														createEventMutation.isPending
													}
													placeholder="Select end date and time"
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							{/* Approved Letter Upload */}
							<div className="col-span-2">
								<ApprovedLetterUploadField
									control={form.control}
									disabled={createEventMutation.isPending}
								/>
							</div>

							{/* Footer */}
							<DialogFooter className="col-span-2">
								<Button
									variant="outline"
									type="button"
									onClick={onClose}
									disabled={createEventMutation.isPending}
								>
									Cancel
								</Button>
								<Button type="submit" disabled={createEventMutation.isPending}>
									{createEventMutation.isPending && (
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									)}
									Create Event
								</Button>
							</DialogFooter>
						</form>
					</Form>
				</div>
			</DialogContent>
		</Dialog>
	);
}
