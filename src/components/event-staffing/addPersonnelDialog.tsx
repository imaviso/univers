import { valibotResolver } from "@hookform/resolvers/valibot";
import { useAtom } from "jotai";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
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
	addPersonnelDialogAtom,
	selectedEventForAssignmentAtom,
} from "@/lib/atoms";
import { useAddEventPersonnelMutation } from "@/lib/query";
import { type PersonnelInput, personnelSchema } from "@/lib/schema";

export function AddPersonnelDialog() {
	const [isOpen, setIsOpen] = useAtom(addPersonnelDialogAtom);
	const [selectedEventId] = useAtom(selectedEventForAssignmentAtom);
	const addPersonnelMutation = useAddEventPersonnelMutation();

	const form = useForm<PersonnelInput>({
		resolver: valibotResolver(personnelSchema),
		defaultValues: {
			name: "",
			phoneNumber: "",
		},
		mode: "onChange",
	});

	const handleFormSubmit = (values: PersonnelInput) => {
		if (!selectedEventId) {
			toast.error("No event selected");
			return;
		}

		addPersonnelMutation.mutate(
			{
				eventId: selectedEventId,
				personnelData: values,
			},
			{
				onSuccess: () => {
					toast.success("Personnel added successfully");
					setIsOpen(false);
					form.reset();
				},
				onError: (error) => {
					toast.error(
						error instanceof Error ? error.message : "Failed to add personnel",
					);
				},
			},
		);
	};

	const handleClose = () => {
		if (!addPersonnelMutation.isPending) {
			setIsOpen(false);
			form.reset();
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={handleClose}>
			<DialogContent className="sm:max-w-[400px]">
				<DialogHeader>
					<DialogTitle>Add Personnel</DialogTitle>
					<DialogDescription>
						Add a new staff member to the selected event.
					</DialogDescription>
				</DialogHeader>

				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(handleFormSubmit)}
						className="space-y-4 py-4"
					>
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Name</FormLabel>
									<FormControl>
										<Input placeholder="e.g., John Doe" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="phoneNumber"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Phone Number</FormLabel>
									<FormControl>
										<Input
											placeholder="e.g., 09123456789"
											{...field}
											maxLength={11}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={handleClose}
								disabled={addPersonnelMutation.isPending}
							>
								Cancel
							</Button>
							<Button type="submit" disabled={addPersonnelMutation.isPending}>
								{addPersonnelMutation.isPending ? "Adding..." : "Add Personnel"}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
