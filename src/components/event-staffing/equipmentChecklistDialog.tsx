import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useId, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	assignedEquipmentQueryOptions,
	equipmentChecklistStatusDetailQueryOptions,
	useSubmitEquipmentChecklistMutation,
} from "@/lib/query";
import type { EventPersonnelDTO } from "@/lib/types";

interface EquipmentChecklistDialogProps {
	isOpen: boolean;
	onClose: () => void;
	personnel: EventPersonnelDTO;
	eventId: string;
	reservedEquipmentIds: string[];
	reservedEquipmentNames: Record<string, string>;
}

export function EquipmentChecklistDialog({
	isOpen,
	onClose,
	personnel,
	eventId,
	reservedEquipmentIds,
	reservedEquipmentNames,
}: EquipmentChecklistDialogProps) {
	const queryClient = useQueryClient();
	const selectAllId = useId();
	const [selectedEquipment, setSelectedEquipment] = useState<Set<string>>(
		new Set(),
	);

	// Fetch assigned equipment for this personnel
	const { data: assignedEquipmentIds, isLoading: isLoadingAssigned } = useQuery(
		assignedEquipmentQueryOptions(personnel.publicId),
	);

	// Fetch checklist status detail to see what's already been checked
	const { data: checklistStatus } = useQuery(
		equipmentChecklistStatusDetailQueryOptions(eventId, personnel.task),
	);

	// Submit mutation
	const submitMutation = useSubmitEquipmentChecklistMutation();

	// Build a map of equipment name to equipment ID
	const equipmentMap = useMemo(() => {
		const map = new Map<string, string>();
		for (const equipId of reservedEquipmentIds) {
			const name = reservedEquipmentNames[equipId] || equipId;
			map.set(equipId, name);
		}
		return map;
	}, [reservedEquipmentIds, reservedEquipmentNames]);

	// Determine which equipment should be shown in the checklist
	// This is the intersection of assigned equipment and reserved equipment
	const checklistEquipment = useMemo(() => {
		if (!assignedEquipmentIds) return [];

		return assignedEquipmentIds.filter((id) =>
			reservedEquipmentIds.includes(id),
		);
	}, [assignedEquipmentIds, reservedEquipmentIds]);

	// Check which items are already checked by anyone (from checklist status)
	const alreadyCheckedIds = useMemo(() => {
		const set = new Set<string>();
		if (checklistStatus) {
			for (const item of checklistStatus) {
				if (item.checked) {
					set.add(item.equipmentId);
				}
			}
		}
		return set;
	}, [checklistStatus]);

	// Get checked by personnel names for display
	const getCheckedByPersonnelNames = (equipmentId: string): string[] => {
		const item = checklistStatus?.find((s) => s.equipmentId === equipmentId);
		if (!item || !item.checkedByPersonnelIds.length) return [];
		return item.checkedByPersonnelIds;
	};

	const handleSelectEquipment = (equipmentId: string) => {
		const newSelected = new Set(selectedEquipment);
		if (newSelected.has(equipmentId)) {
			newSelected.delete(equipmentId);
		} else {
			newSelected.add(equipmentId);
		}
		setSelectedEquipment(newSelected);
	};

	const handleSelectAll = () => {
		if (selectedEquipment.size === checklistEquipment.length) {
			setSelectedEquipment(new Set());
		} else {
			setSelectedEquipment(new Set(checklistEquipment));
		}
	};

	const handleSubmit = () => {
		if (selectedEquipment.size === 0) {
			toast.error("Please select at least one equipment item.");
			return;
		}

		submitMutation.mutate(
			{
				eventPersonnelId: personnel.publicId,
				equipmentIds: Array.from(selectedEquipment),
			},
			{
				onSuccess: () => {
					toast.success("Equipment checklist submitted successfully.");
					// Invalidate checklist status queries
					queryClient.invalidateQueries({
						queryKey: ["equipmentChecklist", "status"],
					});
					queryClient.invalidateQueries({
						queryKey: ["equipmentChecklist", "statusDetail"],
					});
					setSelectedEquipment(new Set());
					onClose();
				},
				onError: (error) => {
					const message =
						error instanceof Error
							? error.message
							: "Failed to submit checklist";
					toast.error(message);
				},
			},
		);
	};

	if (!isOpen) return null;

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-[500px] md:max-w-[700px]">
				<DialogHeader>
					<DialogTitle>Equipment Checklist</DialogTitle>
					<DialogDescription>
						{personnel.task === "SETUP"
							? "Check off the equipment items as they are set up"
							: "Check off the equipment items as they are pulled out"}
						<br />
						<span className="text-xs">
							Personnel: {personnel.personnel.firstName}{" "}
							{personnel.personnel.lastName}
						</span>
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					{/* Select All Checkbox */}
					<div className="flex items-center gap-2 px-3 py-2 border rounded-lg bg-muted/30">
						<Checkbox
							id={selectAllId}
							checked={
								selectedEquipment.size === checklistEquipment.length &&
								checklistEquipment.length > 0
							}
							onCheckedChange={handleSelectAll}
							disabled={isLoadingAssigned || checklistEquipment.length === 0}
						/>
						<label
							htmlFor={selectAllId}
							className="text-sm font-medium cursor-pointer flex-1"
						>
							Select All ({selectedEquipment.size}/{checklistEquipment.length})
						</label>
					</div>

					{/* Equipment List */}
					<ScrollArea className="border rounded-lg p-3 h-[300px]">
						{isLoadingAssigned ? (
							<div className="flex items-center justify-center py-8">
								<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
							</div>
						) : checklistEquipment.length === 0 ? (
							<div className="text-center text-sm text-muted-foreground py-8">
								No equipment assigned for this personnel
							</div>
						) : (
							<div className="space-y-2">
								{checklistEquipment.map((equipmentId) => {
									const itemId = `equipment-${selectAllId}-${equipmentId}`;
									const equipmentName =
										equipmentMap.get(equipmentId) || equipmentId;
									const isChecked = selectedEquipment.has(equipmentId);
									const isAlreadyCheckedByOthers =
										alreadyCheckedIds.has(equipmentId);
									const checkedByPersonnelIds =
										getCheckedByPersonnelNames(equipmentId);

									return (
										<div
											key={equipmentId}
											className={`flex items-start gap-3 p-2 rounded-lg border transition-colors ${
												isChecked ? "bg-blue-200/10 border-blue-200" : ""
											} ${
												isAlreadyCheckedByOthers
													? "bg-green-200/10 border-green-200"
													: ""
											}`}
										>
											<Checkbox
												id={itemId}
												checked={isChecked}
												onCheckedChange={() =>
													handleSelectEquipment(equipmentId)
												}
												className="mt-1"
											/>
											<div className="flex-1 min-w-0">
												<label
													htmlFor={itemId}
													className="text-sm font-medium cursor-pointer block"
												>
													{equipmentName}
												</label>
												{isAlreadyCheckedByOthers && (
													<div className="text-xs text-green-600 mt-1 flex items-center gap-1">
														<CheckCircle2 className="h-3 w-3" />
														Checked by{" "}
														{checkedByPersonnelIds.length > 0
															? `${checkedByPersonnelIds.length} personnel`
															: "others"}
													</div>
												)}
											</div>
										</div>
									);
								})}
							</div>
						)}
					</ScrollArea>

					{/* Info message */}
					{/* <div className="text-xs text-muted-foreground bg-blue-50 p-2 rounded"> */}
					{/* 	{personnel.task === "SETUP" */}
					{/* 		? "Items marked with a checkmark have been set up by you. Items in green have been confirmed by other personnel." */}
					{/* 		: "Items marked with a checkmark have been pulled out by you. Items in green have been confirmed by other personnel."} */}
					{/* </div> */}
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={onClose}>
						Cancel
					</Button>
					<Button
						onClick={handleSubmit}
						disabled={
							submitMutation.isPending ||
							isLoadingAssigned ||
							selectedEquipment.size === 0
						}
						className="gap-2"
					>
						{submitMutation.isPending && (
							<Loader2 className="h-4 w-4 animate-spin" />
						)}
						Submit Checklist
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
