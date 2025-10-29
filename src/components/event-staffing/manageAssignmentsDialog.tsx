import { useQuery } from "@tanstack/react-query";
import { useAtom } from "jotai";
import { Plus, Trash2, Users } from "lucide-react";
import { useId, useState } from "react";
import { toast } from "sonner";
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
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
	addPersonnelDialogAtom,
	manageAssignmentsDialogAtom,
	selectedEventForAssignmentAtom,
} from "@/lib/atoms";
import {
	searchEventsQueryOptions,
	useAddEventPersonnelMutation,
	useDeleteEventPersonnelMutation,
} from "@/lib/query";
import type { Event, EventPersonnelDTO } from "@/lib/types";
import { getInitials } from "@/lib/utils";

export function ManageAssignmentsDialog() {
	const [isOpen, setIsOpen] = useAtom(manageAssignmentsDialogAtom);
	const [selectedEventId, setSelectedEventId] = useAtom(
		selectedEventForAssignmentAtom,
	);
	const [, setAddPersonnelDialogOpen] = useAtom(addPersonnelDialogAtom);
	const [searchTerm, setSearchTerm] = useState("");
	const searchId = useId();

	const { data: eventsData = [] } = useQuery(
		searchEventsQueryOptions("ALL", "ALL", "startTime", undefined, undefined),
	);

	const addPersonnelMutation = useAddEventPersonnelMutation();
	const deletePersonnelMutation = useDeleteEventPersonnelMutation();

	const selectedEvent = eventsData.find(
		(event) => event.publicId === selectedEventId,
	) as Event | undefined;

	const allPersonnel: EventPersonnelDTO[] = eventsData.flatMap(
		(event) => event.assignedPersonnel || [],
	);

	const uniquePersonnel = allPersonnel.reduce(
		(acc: EventPersonnelDTO[], person) => {
			if (
				!acc.some(
					(p) => p.name === person.name && p.phoneNumber === person.phoneNumber,
				)
			) {
				acc.push(person);
			}
			return acc;
		},
		[],
	);

	const currentAssignedPersonnel = (
		selectedEvent?.assignedPersonnel || []
	).reduce((acc: EventPersonnelDTO[], person) => {
		if (
			!acc.some(
				(p) => p.name === person.name && p.phoneNumber === person.phoneNumber,
			)
		) {
			acc.push(person);
		}
		return acc;
	}, []);
	const availablePersonnel = uniquePersonnel.filter(
		(person) =>
			!currentAssignedPersonnel.some(
				(assigned) =>
					assigned.name === person.name &&
					assigned.phoneNumber === person.phoneNumber,
			),
	);

	const filteredAvailable = availablePersonnel.filter((person) =>
		person.name.toLowerCase().includes(searchTerm.toLowerCase()),
	);

	const handleAddExistingPersonnel = (person: EventPersonnelDTO) => {
		if (!selectedEventId) return;

		addPersonnelMutation.mutate(
			{
				eventId: selectedEventId,
				personnelData: {
					name: person.name,
					phoneNumber: person.phoneNumber,
				},
			},
			{
				onSuccess: () => {
					toast.success(`${person.name} added to event`);
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
					toast.success(`${person.name} removed from event`);
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

	const handleAddNewPersonnel = () => {
		setAddPersonnelDialogOpen(true);
	};

	const handleClose = () => {
		setIsOpen(false);
		setSelectedEventId(null);
		setSearchTerm("");
	};

	if (!selectedEvent) return null;

	return (
		<Dialog open={isOpen} onOpenChange={handleClose}>
			<DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Users className="h-5 w-5" />
						Manage Event Staff
					</DialogTitle>
					<DialogDescription>
						Manage staff assignments for "{selectedEvent.eventName}"
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-6 py-4">
					{/* Currently Assigned */}
					<div>
						<h3 className="text-sm font-semibold mb-3">
							Currently Assigned ({currentAssignedPersonnel.length})
						</h3>
						{currentAssignedPersonnel.length > 0 ? (
							<div className="space-y-2">
								{currentAssignedPersonnel.map((person) => (
									<div
										key={person.publicId}
										className="flex items-center justify-between p-2 border rounded-lg"
									>
										<div className="flex items-center space-x-3">
											<Avatar className="h-8 w-8">
												<AvatarFallback className="text-xs">
													{getInitials(person.name)}
												</AvatarFallback>
											</Avatar>
											<div>
												<div className="font-medium text-sm">{person.name}</div>
												<div className="text-xs text-muted-foreground">
													{person.phoneNumber}
												</div>
											</div>
										</div>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => handleRemovePersonnel(person)}
											disabled={deletePersonnelMutation.isPending}
											className="text-destructive hover:text-destructive"
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									</div>
								))}
							</div>
						) : (
							<div className="text-sm text-muted-foreground text-center py-4 border rounded-lg">
								No staff currently assigned
							</div>
						)}
					</div>

					<Separator />

					{/* Add Staff Section */}
					<div>
						<div className="flex items-center justify-between mb-3">
							<h3 className="text-sm font-semibold">Add Staff</h3>
							<Button size="sm" onClick={handleAddNewPersonnel}>
								<Plus className="h-4 w-4 mr-1" />
								Add New
							</Button>
						</div>

						{/* Search existing personnel */}
						<div className="space-y-3">
							<div>
								<Label
									htmlFor={searchId}
									className="text-xs text-muted-foreground"
								>
									Search existing personnel
								</Label>
								<Input
									id={searchId}
									placeholder="Search by name..."
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									className="mt-1"
								/>
							</div>

							{filteredAvailable.length > 0 ? (
								<div className="space-y-2 max-h-48 overflow-y-auto">
									{filteredAvailable.map((person) => (
										<div
											key={person.publicId}
											className="flex items-center justify-between p-2 border rounded-lg"
										>
											<div className="flex items-center space-x-3">
												<Avatar className="h-8 w-8">
													<AvatarFallback className="text-xs">
														{getInitials(person.name)}
													</AvatarFallback>
												</Avatar>
												<div>
													<div className="font-medium text-sm">
														{person.name}
													</div>
													<div className="text-xs text-muted-foreground">
														{person.phoneNumber}
													</div>
												</div>
											</div>
											<Button
												variant="outline"
												size="sm"
												onClick={() => handleAddExistingPersonnel(person)}
												disabled={addPersonnelMutation.isPending}
											>
												<Plus className="h-4 w-4 mr-1" />
												Add
											</Button>
										</div>
									))}
								</div>
							) : searchTerm ? (
								<div className="text-sm text-muted-foreground text-center py-4 border rounded-lg">
									No personnel found matching "{searchTerm}"
								</div>
							) : availablePersonnel.length === 0 ? (
								<div className="text-sm text-muted-foreground text-center py-4 border rounded-lg">
									All available personnel are already assigned
								</div>
							) : null}
						</div>
					</div>
				</div>

				<DialogFooter>
					<Button onClick={handleClose}>Done</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
