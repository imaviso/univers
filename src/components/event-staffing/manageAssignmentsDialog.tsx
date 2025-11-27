import { useQuery } from "@tanstack/react-query";
import { useAtom } from "jotai";
import { Plus, Trash2, Users } from "lucide-react";
import { useId, useState } from "react";
import { toast } from "sonner";
import * as v from "valibot";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
	manageAssignmentsDialogAtom,
	selectedEventForAssignmentAtom,
} from "@/lib/atoms";
import {
	searchEventsQueryOptions,
	useAddEventPersonnelMutation,
	useAllPersonnelQuery,
	useDeleteEventPersonnelMutation,
} from "@/lib/query";
import { eventPersonnelSchema } from "@/lib/schema";
import type { Event, EventPersonnelDTO } from "@/lib/types";
import { getInitials } from "@/lib/utils";

export function ManageAssignmentsDialog() {
	const [isOpen, setIsOpen] = useAtom(manageAssignmentsDialogAtom);
	const [selectedEventId, setSelectedEventId] = useAtom(
		selectedEventForAssignmentAtom,
	);
	const [selectedPersonnelId, setSelectedPersonnelId] = useState<string>("");
	const [selectedTask, setSelectedTask] = useState<"SETUP" | "PULLOUT">(
		"SETUP",
	);
	const [phoneNumber, setPhoneNumber] = useState<string>("");
	const phoneInputId = useId();

	const { data: eventsData = [] } = useQuery(
		searchEventsQueryOptions("ALL", "ALL", "startTime", undefined, undefined),
	);

	const { data: personnelList = [], isLoading: isPersonnelLoading } =
		useAllPersonnelQuery();

	const addPersonnelMutation = useAddEventPersonnelMutation();
	const deletePersonnelMutation = useDeleteEventPersonnelMutation();

	const selectedEvent = eventsData.find(
		(event) => event.publicId === selectedEventId,
	) as Event | undefined;

	const currentAssignedPersonnel =
		(selectedEvent?.assignedPersonnel as unknown as EventPersonnelDTO[]) || [];

	const currentAssignedPersonnelIds = new Set(
		currentAssignedPersonnel.map((p) => p.personnel.publicId),
	);

	const availablePersonnel = personnelList.filter(
		(person) => !currentAssignedPersonnelIds.has(person.publicId),
	);

	const handleAddPersonnelFromDropdown = () => {
		// Validate inputs
		const validationResult = v.safeParse(eventPersonnelSchema, {
			personnelId: selectedPersonnelId,
			phoneNumber: phoneNumber,
			task: selectedTask,
		});

		if (!validationResult.success) {
			const errors = validationResult.issues.map((issue) => issue.message);
			toast.error(errors.join(", "));
			return;
		}

		if (!selectedEventId || !selectedPersonnelId) {
			toast.error("Please select a personnel");
			return;
		}

		const selectedPersonnel = personnelList.find(
			(p) => p.publicId === selectedPersonnelId,
		);

		if (!selectedPersonnel) {
			toast.error("Personnel not found");
			return;
		}

		const fullName = `${selectedPersonnel.firstName} ${selectedPersonnel.lastName}`;
		const phone = phoneNumber || selectedPersonnel.phoneNumber || "";

		addPersonnelMutation.mutate(
			{
				eventId: selectedEventId,
				personnelData: {
					personnel: selectedPersonnel,
					phoneNumber: phone,
					task: selectedTask,
				},
			},
			{
				onSuccess: () => {
					toast.success(`${fullName} added to event as ${selectedTask}`);
					setSelectedPersonnelId("");
					setPhoneNumber("");
				},
				onError: (error) => {
					toast.error(
						error instanceof Error ? error.message : "Failed to add personnel",
					);
				},
			},
		);
	};

	const handleRemovePersonnel = (person: EventPersonnelDTO) => {
		if (!selectedEventId) return;

		deletePersonnelMutation.mutate(
			{
				eventId: selectedEventId,
				personnelPublicId: person.publicId,
			},
			{
				onSuccess: () => {
					toast.success(`${person.personnel.firstName} removed from event`);
				},
				onError: (error) => {
					toast.error(
						error instanceof Error
							? error.message
							: "Failed to remove personnel",
					);
				},
			},
		);
	};

	const handleClose = () => {
		setIsOpen(false);
		setSelectedEventId(null);
		setSelectedPersonnelId("");
		setPhoneNumber("");
		setSelectedTask("SETUP");
	};

	if (!selectedEvent) return null;

	return (
		<Dialog open={isOpen} onOpenChange={handleClose}>
			<DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Users className="h-5 w-5" />
						Manage Event Personnel
					</DialogTitle>
					<DialogDescription>
						Manage personnel assignments for "{selectedEvent.eventName}"
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-6 py-4">
					{/* Add Staff Section */}
					<div className="border rounded-lg p-4 bg-background-50">
						<div className="space-y-4">
							{/* Staff Selection */}
							<div>
								<p className="text-xs font-medium text-muted-foreground mb-2">
									Select Personnel
								</p>
								<Select
									value={selectedPersonnelId}
									onValueChange={setSelectedPersonnelId}
								>
									<SelectTrigger className="w-full">
										<SelectValue placeholder="Choose a personnel..." />
									</SelectTrigger>
									<SelectContent>
										{isPersonnelLoading ? (
											<div className="p-2 text-xs text-muted-foreground text-center">
												Loading personnel...
											</div>
										) : availablePersonnel.length > 0 ? (
											availablePersonnel.map((person) => (
												<SelectItem
													key={person.publicId}
													value={person.publicId}
												>
													{person.firstName} {person.lastName}
												</SelectItem>
											))
										) : (
											<div className="p-2 text-xs text-muted-foreground text-center">
												No available personnel
											</div>
										)}
									</SelectContent>
								</Select>
							</div>

							{/* Phone Number Input */}
							<div className="grid grid-cols-2 gap-2">
								<div>
									<label
										htmlFor={phoneInputId}
										className="text-xs font-medium text-muted-foreground mb-2 block"
									>
										Phone Number (Optional)
									</label>
									<Input
										id={phoneInputId}
										placeholder="e.g., 09123456789"
										value={phoneNumber}
										onChange={(e) => setPhoneNumber(e.target.value)}
										maxLength={11}
										disabled={!selectedPersonnelId}
									/>
								</div>

								{/* Task Selection */}
								<div>
									<p className="text-xs font-medium text-muted-foreground mb-2">
										Task Type
									</p>
									<Select
										value={selectedTask}
										disabled={!selectedPersonnelId}
										onValueChange={(value) =>
											setSelectedTask(value as "SETUP" | "PULLOUT")
										}
									>
										<SelectTrigger className="w-full">
											<SelectValue placeholder="Select task..." />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="SETUP">Setup</SelectItem>
											<SelectItem value="PULLOUT">Pullout</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>

							{/* Add Button */}
							<Button
								onClick={handleAddPersonnelFromDropdown}
								disabled={
									!selectedPersonnelId ||
									addPersonnelMutation.isPending ||
									isPersonnelLoading
								}
								className="w-full"
							>
								{addPersonnelMutation.isPending ? (
									"Adding..."
								) : (
									<>
										<Plus className="h-4 w-4 mr-2" />
										Add Personnel Event
									</>
								)}
							</Button>
						</div>
					</div>

					<Separator />

					{/* Currently Assigned Staff Section */}
					<div>
						<h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
							<Users className="h-4 w-4" />
							Currently Assigned Personnel ({currentAssignedPersonnel.length})
						</h3>

						{currentAssignedPersonnel.length > 0 ? (
							<div className="space-y-2">
								{currentAssignedPersonnel.map((person) => (
									<div
										key={person.publicId}
										className="flex items-center justify-between p-3 border rounded-lg hover:bg-background-50 transition-colors"
									>
										<div className="flex items-center space-x-3 flex-1 min-w-0">
											<Avatar className="h-10 w-10 flex-shrink-0">
												<AvatarFallback className="text-sm font-medium">
													{getInitials(
														`${person.personnel.firstName} ${person.personnel.lastName}`,
													)}
												</AvatarFallback>
											</Avatar>
											<div className="min-w-0 flex-1">
												<div className="font-medium text-sm">
													{person.personnel.firstName}{" "}
													{person.personnel.lastName}
												</div>
												<div className="text-xs text-muted-foreground">
													{person.phoneNumber}
												</div>
												<div className="mt-2 flex items-center gap-2">
													<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-500">
														{person.task}
													</span>
												</div>
											</div>
										</div>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => handleRemovePersonnel(person)}
											disabled={deletePersonnelMutation.isPending}
											className="text-destructive hover:text-destructive ml-2 flex-shrink-0"
											title="Remove personnel"
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									</div>
								))}
							</div>
						) : (
							<div className="text-sm text-muted-foreground text-center py-8 border rounded-lg bg-background-50">
								<Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
								<p>No personnel currently assigned</p>
								<p className="text-xs mt-1">
									Add personnel above to get started
								</p>
							</div>
						)}
					</div>
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={handleClose}>
						Done
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
