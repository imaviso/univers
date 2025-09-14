import { Package } from "lucide-react";
import { Fragment, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import type { Equipment, EquipmentCategoryDTO } from "@/lib/types";
import { cn } from "@/lib/utils";

// Helper function to compare two selection arrays (alternative for debugging)
const areSelectionsEqual = (
	sel1: { equipmentId: string; quantity: number }[],
	sel2: { equipmentId: string; quantity: number }[],
): boolean => {
	if (sel1.length !== sel2.length) return false;
	if (sel1.length === 0 && sel2.length === 0) return true; // Both empty, considered equal

	const serializeItem = (item: { equipmentId: string; quantity: number }) =>
		`${item.equipmentId}:${item.quantity}`;

	const sel1SortedSerialized = sel1.map(serializeItem).sort().join(",");
	const sel2SortedSerialized = sel2.map(serializeItem).sort().join(",");

	return sel1SortedSerialized === sel2SortedSerialized;
};

interface EquipmentListProps {
	equipment: Equipment[];
	value: { equipmentId: string; quantity: number }[];
	onChange: (newValue: { equipmentId: string; quantity: number }[]) => void;
}

interface GroupedEquipment {
	category: EquipmentCategoryDTO;
	equipmentItems: (Equipment & { uniqueFrontendId: string })[];
}

export default function EquipmentList({
	equipment,
	value = [],
	onChange,
}: EquipmentListProps) {
	// Create a new list where each equipment item has a truly unique frontend identifier
	const equipmentWithUniqueFrontendIds = useMemo(
		() =>
			equipment.map((e) => ({
				...e,
				uniqueFrontendId: `${e.publicId.toString()}_${typeof e.publicId}`,
			})),
		[equipment],
	);
	const groupedEquipment: GroupedEquipment[] = useMemo(() => {
		const groups: Map<
			string,
			{
				category: EquipmentCategoryDTO;
				equipmentItems: (Equipment & { uniqueFrontendId: string })[];
			}
		> = new Map();
		const uncategorizedGroupId = "___uncategorized___";
		const uncategorizedCategory: EquipmentCategoryDTO = {
			publicId: uncategorizedGroupId,
			name: "Uncategorized",
			description: "Items without a specific category",
			createdAt: new Date().toISOString(), // Or a fixed date
			updatedAt: null,
		};

		for (const equip of equipmentWithUniqueFrontendIds) {
			if (equip.categories && equip.categories.length > 0) {
				for (const category of equip.categories) {
					if (!groups.has(category.publicId)) {
						groups.set(category.publicId, {
							category,
							equipmentItems: [],
						});
					}
					const group = groups.get(category.publicId);
					if (group) {
						group.equipmentItems.push(equip);
					}
				}
			} else {
				// Add to Uncategorized group
				if (!groups.has(uncategorizedGroupId)) {
					groups.set(uncategorizedGroupId, {
						category: uncategorizedCategory,
						equipmentItems: [],
					});
				}
				const group = groups.get(uncategorizedGroupId);
				if (group) {
					group.equipmentItems.push(equip);
				}
			}
		}
		return Array.from(groups.values());
	}, [equipmentWithUniqueFrontendIds]);

	const handleCategoryCheckboxChange = (
		categoryId: string,
		newCheckedStatus: boolean, // This is the state the checkbox *will* go to (true or false)
	) => {
		let currentSelection = [...value];
		const categoryGroup = groupedEquipment.find(
			(group) => group.category.publicId === categoryId,
		);
		if (!categoryGroup) return;

		const availableItemsInThisCategory = categoryGroup.equipmentItems.filter(
			(item) => item.availability,
		);

		if (newCheckedStatus) {
			// Corresponds to 'select all available in this category'
			for (const equipToAdd of availableItemsInThisCategory) {
				if (
					!currentSelection.some(
						(item) => item.equipmentId === equipToAdd.uniqueFrontendId,
					)
				) {
					currentSelection.push({
						equipmentId: equipToAdd.uniqueFrontendId,
						quantity: 1,
					});
				}
			}
		} else {
			// Corresponds to 'deselect all available in this category'
			const uniqueIdsToDeselect = new Set(
				availableItemsInThisCategory.map((item) => item.uniqueFrontendId),
			);
			currentSelection = currentSelection.filter(
				(item) => !uniqueIdsToDeselect.has(item.equipmentId),
			);
		}
		if (!areSelectionsEqual(value, currentSelection)) {
			onChange(currentSelection);
		}
	};

	const handleCheckboxChange = (
		newCheckedState: boolean | "indeterminate", // from onCheckedChange
		uniqueEqId: string, // This is now the uniqueFrontendId
	) => {
		const currentSelection = [...value];
		// equipmentIdStr is now uniqueEqId
		const existingIndex = currentSelection.findIndex(
			(item) => item.equipmentId === uniqueEqId, // Compare with uniqueFrontendId stored in value
		);

		// For an individual checkbox, 'indeterminate' should not be a final state it resolves to.
		// It's either checked (true) or unchecked (false).
		// If newCheckedState is 'indeterminate', treat it as if it's being checked (true) for safety,
		// though individual item checkboxes shouldn't typically yield 'indeterminate' to onCheckedChange.
		const isEffectivelyChecked =
			newCheckedState === true || newCheckedState === "indeterminate";

		if (isEffectivelyChecked && existingIndex === -1) {
			currentSelection.push({ equipmentId: uniqueEqId, quantity: 1 }); // Store uniqueFrontendId
		} else if (!isEffectivelyChecked && existingIndex !== -1) {
			currentSelection.splice(existingIndex, 1);
		}

		// The uniqueness logic based on equipmentId (which is now uniqueFrontendId) should still hold.
		// The previous map-based uniqueness was a safeguard; if uniqueEqId is truly unique per item,
		// this step might be redundant but harmless.
		const uniqueSelectionMap = new Map<
			string,
			{ equipmentId: string; quantity: number }
		>();
		for (const item of currentSelection) {
			if (!uniqueSelectionMap.has(item.equipmentId)) {
				uniqueSelectionMap.set(item.equipmentId, item);
			}
		}
		const finalSelection = Array.from(uniqueSelectionMap.values());

		if (!areSelectionsEqual(value, finalSelection)) {
			onChange(finalSelection);
		}
	};

	const handleQuantityChange = (newQuantity: number, equipmentId: string) => {
		const currentSelection = [...value];
		const equipmentIdStr = equipmentId.toString();
		const existingIndex = currentSelection.findIndex(
			(item) => item.equipmentId === equipmentIdStr,
		);
		const equipmentItem = equipmentWithUniqueFrontendIds.find(
			(item) => item.uniqueFrontendId === equipmentIdStr,
		);
		const maxQuantity = equipmentItem?.quantity ?? 1;

		const validQuantity = Math.max(1, Math.min(newQuantity, maxQuantity));

		if (existingIndex !== -1) {
			if (currentSelection[existingIndex].quantity !== validQuantity) {
				currentSelection[existingIndex].quantity = validQuantity;
				onChange(currentSelection);
			}
		}
	};

	return (
		<div className="rounded-md border max-h-[400px] overflow-y-auto relative">
			<Table>
				<TableHeader className="sticky top-0 bg-background z-10">
					<TableRow>
						<TableHead className="w-[50px] px-3">
							<span className="sr-only">Select</span>
						</TableHead>
						<TableHead>Equipment</TableHead>
						<TableHead className="w-[100px] text-center">Available</TableHead>
						<TableHead className="w-[120px] text-center">Quantity</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{groupedEquipment.length === 0 && equipment.length > 0 && (
						<TableRow>
							<TableCell
								colSpan={4}
								className="h-24 text-center text-muted-foreground"
							>
								Equipment could not be grouped by category.
							</TableCell>
						</TableRow>
					)}
					{equipment.length === 0 && (
						<TableRow>
							<TableCell
								colSpan={4}
								className="h-24 text-center text-muted-foreground"
							>
								No available equipment found.
							</TableCell>
						</TableRow>
					)}
					{groupedEquipment.map((group) => {
						const itemsInCategory = group.equipmentItems;
						const itemsAvailableInCategory = itemsInCategory.filter(
							(item) => item.availability,
						);
						const selectedAvailableItemsInCategory =
							itemsAvailableInCategory.filter((item) =>
								value.some((sel) => sel.equipmentId === item.uniqueFrontendId),
							);

						let categoryCheckedState: boolean | "indeterminate" = false;
						if (itemsAvailableInCategory.length > 0) {
							if (
								selectedAvailableItemsInCategory.length ===
								itemsAvailableInCategory.length
							) {
								categoryCheckedState = true;
							} else if (selectedAvailableItemsInCategory.length > 0) {
								categoryCheckedState = "indeterminate";
							}
						}

						return (
							<Fragment key={group.category.publicId}>
								<TableRow className="bg-muted/50 hover:bg-muted/50">
									<TableCell className="px-3 py-2">
										<Checkbox
											id={`cat-select-${group.category.publicId}`}
											checked={categoryCheckedState}
											onCheckedChange={(newCheckedStatus) => {
												handleCategoryCheckboxChange(
													group.category.publicId,
													newCheckedStatus as boolean,
												);
											}}
											aria-label={`Select all equipment in ${group.category.name}`}
											disabled={itemsAvailableInCategory.length === 0} // Disable category checkbox if no items are available
										/>
									</TableCell>
									<TableCell colSpan={3} className="py-2 font-semibold">
										{group.category.name} (
										{selectedAvailableItemsInCategory.length}/
										{itemsAvailableInCategory.length} available selected)
									</TableCell>
								</TableRow>
								{group.equipmentItems.map((item) => {
									return (
										<TableRow
											key={item.uniqueFrontendId}
											className="hover:bg-muted/20"
										>
											<TableCell className="px-3">
												<Checkbox
													id={item.uniqueFrontendId}
													aria-label={`Select ${item.name}`}
													checked={value.some(
														(sel) => sel.equipmentId === item.uniqueFrontendId,
													)}
													onCheckedChange={(checked) =>
														handleCheckboxChange(checked, item.uniqueFrontendId)
													}
													disabled={!item.availability}
												/>
											</TableCell>
											<TableCell className="py-2">
												<div className="flex items-center gap-3">
													<div className="w-10 h-10 bg-muted rounded-sm flex items-center justify-center overflow-hidden">
														{item.imagePath ? (
															<img
																src={item.imagePath}
																alt={item.name}
																className="w-full h-full object-cover"
															/>
														) : (
															<Package className="h-4 w-4 text-muted-foreground" />
														)}
													</div>
													<div>
														<Label
															htmlFor={item.uniqueFrontendId}
															className={cn(
																item.availability
																	? "cursor-pointer"
																	: "cursor-not-allowed",
																"block",
															)}
														>
															{item.name}
														</Label>
														<p className="text-xs text-muted-foreground">
															{item.brand ?? "N/A"}
														</p>
													</div>
												</div>
											</TableCell>
											<TableCell className="text-center py-2">
												{item.availability ? (
													<Badge
														variant="outline"
														className="border-green-500 text-green-600 px-1.5 py-0.5 text-xs"
													>
														{item.quantity -
															(value.find(
																(v) => v.equipmentId === item.uniqueFrontendId,
															)?.quantity || 0)}
													</Badge>
												) : (
													<Badge
														variant="destructive"
														className="px-1.5 py-0.5 text-xs"
													>
														Unavailable
													</Badge>
												)}
											</TableCell>
											<TableCell className="text-center py-2">
												{value.some(
													(sel) => sel.equipmentId === item.uniqueFrontendId,
												) && item.availability ? (
													<Input
														id={`qty-${item.uniqueFrontendId}`}
														type="number"
														min="1"
														max={item.quantity}
														value={String(
															value.find(
																(v) => v.equipmentId === item.uniqueFrontendId,
															)?.quantity || 1,
														)}
														disabled={
															!value.some(
																(sel) =>
																	sel.equipmentId === item.uniqueFrontendId,
															) || !item.availability
														}
														className="h-8 w-20 text-center"
														aria-label={`Quantity for ${item.name}`}
														onChange={(e) =>
															handleQuantityChange(
																Number.parseInt(e.target.value, 10) || 1,
																item.uniqueFrontendId,
															)
														}
														onClick={(e: React.MouseEvent) =>
															e.stopPropagation()
														} // Prevent row click if clicking input
													/>
												) : (
													<div className="h-8 w-20" /> // Placeholder for alignment when input is not shown
												)}
											</TableCell>
										</TableRow>
									);
								})}{" "}
								{/* End of group.equipmentItems.map */}
							</Fragment>
						); // End of return for group
					})}{" "}
					{/* End of groupedEquipment.map */}
				</TableBody>
			</Table>
		</div>
	);
}
