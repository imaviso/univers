import { valibotResolver } from "@hookform/resolvers/valibot";
import { parseISO } from "date-fns";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner"; // Added import for toast notifications
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
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { useCreateEquipmentReservationMutation } from "@/lib/query"; // Added import
import {
	type EquipmentReservationFormInput,
	equipmentReservationFormSchema,
} from "@/lib/schema";
import type {
	CreateEquipmentReservationInput,
	Equipment,
	EquipmentReservationDTO,
	EventDTO,
} from "@/lib/types"; // Added CreateEquipmentReservationInput, EquipmentReservationDTO
import EquipmentList from "./equipmentList";

interface EquipmentReservationFormDialogProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmissionComplete?: (
		success: boolean,
		reservations?: EquipmentReservationDTO[],
	) => void; // Modified prop
	event: EventDTO;
	equipment: Equipment[];
	// isLoading prop is removed, will use mutation.isPending
}

export function EquipmentReservationFormDialog({
	isOpen,
	onClose,
	onSubmissionComplete,
	event,
	equipment,
}: EquipmentReservationFormDialogProps) {
	const memoizedEquipment = useMemo(() => equipment, [equipment]);
	const mutation = useCreateEquipmentReservationMutation(); // Added mutation hook
	let initialStartTime: Date | undefined;
	let initialEndTime: Date | undefined;
	try {
		initialStartTime = parseISO(event.startTime);
		initialEndTime = parseISO(event.endTime);
		if (Number.isNaN(initialStartTime.getTime())) initialStartTime = undefined;
		if (Number.isNaN(initialEndTime.getTime())) initialEndTime = undefined;
	} catch (error) {
		console.error("Error parsing event dates:", error);
	}

	const form = useForm<
		Pick<EquipmentReservationFormInput, "selectedEquipment">
	>({
		resolver: valibotResolver(equipmentReservationFormSchema),
		defaultValues: {
			selectedEquipment: [],
		},
		mode: "onChange",
	});

	const handleSubmit = (
		values: Pick<EquipmentReservationFormInput, "selectedEquipment">,
	) => {
		if (!event.publicId || !event.startTime || !event.endTime) {
			toast.error("Event details are incomplete.");
			return;
		}

		const reservationInputs: CreateEquipmentReservationInput[] = (
			values.selectedEquipment || []
		).map((item) => ({
			event: { publicId: event.publicId },
			equipment: { publicId: item.equipmentId.split("_")[0] },
			department: { publicId: event.department.publicId },
			quantity: item.quantity,
			// Ensure startTime and endTime are in ISO string format if required by backend
			// The DTO on backend expects String, so direct pass-through should be fine if they are already ISO strings
			startTime: event.startTime,
			endTime: event.endTime,
		}));

		if (reservationInputs.length === 0) {
			toast.info("No equipment selected.");
			return;
		}

		mutation.mutate(reservationInputs, {
			onSuccess: (createdReservations) => {
				toast.success("Equipment reservations created successfully!");
				handleDialogClose(); // Close dialog and reset form
				onSubmissionComplete?.(true, createdReservations);
			},
			onError: (error) => {
				console.error("Error creating reservations:", error);
				const errorMessage =
					error instanceof Error
						? error.message
						: "An unexpected error occurred.";
				toast.error(`Failed to create reservations: ${errorMessage}`);
				onSubmissionComplete?.(false);
			},
		});
	};

	const handleDialogClose = () => {
		form.reset({
			selectedEquipment: [],
		});
		onClose();
	};

	const isSubmitDisabled = () => {
		const errors = form.formState.errors;
		return (
			mutation.isPending || // Use mutation.isPending
			!!errors.selectedEquipment ||
			(form.watch("selectedEquipment")?.length ?? 0) === 0
		);
	};

	return (
		<Dialog open={isOpen} onOpenChange={handleDialogClose}>
			<DialogContent className="sm:max-w-[600px] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Select Equipment for Event</DialogTitle>
					<p className="text-sm text-muted-foreground pt-1">
						Event: {event.eventName}
					</p>
				</DialogHeader>

				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(handleSubmit)}
						className="space-y-6 pt-4"
					>
						<FormField
							control={form.control}
							name="selectedEquipment"
							render={({ field }) => (
								<FormItem>
									<div className="mb-4">
										<FormLabel className="text-base">
											Select Equipment *
										</FormLabel>
										<FormDescription>
											Select the equipment and specify the quantity needed for
											the event duration.
										</FormDescription>
									</div>
									<EquipmentList
										equipment={memoizedEquipment}
										value={field.value ?? []}
										onChange={field.onChange}
									/>
									<FormMessage />
								</FormItem>
							)}
						/>

						<DialogFooter>
							<div className="flex w-full justify-between items-center">
								<Button
									type="button"
									variant="outline"
									onClick={handleDialogClose}
								>
									Cancel
								</Button>
								<Button type="submit" disabled={isSubmitDisabled()}>
									{mutation.isPending // Use mutation.isPending
										? "Submitting..."
										: "Confirm Selection"}
								</Button>
							</div>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
