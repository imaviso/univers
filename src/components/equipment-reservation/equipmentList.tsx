import { Badge } from "@/components/ui/badge"; // Keep Badge import
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Equipment } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Package } from "lucide-react";
// Removed: import Image from "next/image";

interface EquipmentListProps {
    equipment: Equipment[];
    // Renamed prop to 'value' and updated type
    value: { equipmentId: string; quantity: number }[];
    // Updated onChange prop type
    onChange: (newValue: { equipmentId: string; quantity: number }[]) => void;
}

export default function EquipmentList({
    equipment,
    value = [], // Default to empty array
    onChange,
}: EquipmentListProps) {
    const handleCheckboxChange = (
        checked: boolean | string,
        equipmentId: number,
    ) => {
        const currentSelection = [...value];
        const equipmentIdStr = equipmentId.toString();
        const existingIndex = currentSelection.findIndex(
            (item) => item.equipmentId === equipmentIdStr,
        );

        if (checked && existingIndex === -1) {
            // Add item with default quantity 1 if checked and not present
            currentSelection.push({ equipmentId: equipmentIdStr, quantity: 1 });
        } else if (!checked && existingIndex !== -1) {
            // Remove item if unchecked and present
            currentSelection.splice(existingIndex, 1);
        }
        onChange(currentSelection); // Call onChange with the updated array of objects
    };

    const handleQuantityChange = (newQuantity: number, equipmentId: number) => {
        const currentSelection = [...value];
        const equipmentIdStr = equipmentId.toString();
        const existingIndex = currentSelection.findIndex(
            (item) => item.equipmentId === equipmentIdStr,
        );
        const equipmentItem = equipment.find((item) => item.id === equipmentId);
        const maxQuantity = equipmentItem?.quantity ?? 1; // Get max available quantity

        // Ensure quantity is within valid range (1 to max available)
        const validQuantity = Math.max(1, Math.min(newQuantity, maxQuantity));

        if (existingIndex !== -1) {
            // Update quantity if item is already selected
            currentSelection[existingIndex].quantity = validQuantity;
            onChange(currentSelection); // Call onChange with the updated array of objects
        }
    };

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto p-1">
            {equipment.map((item) => {
                const isSelected = value.some(
                    (selected) => selected.equipmentId === item.id.toString(),
                );
                const selectedItem = value.find(
                    (selected) => selected.equipmentId === item.id.toString(),
                );
                const currentQuantity = selectedItem?.quantity ?? 1;

                return (
                    <Card
                        key={item.id}
                        className={cn(
                            "overflow-hidden transition-all duration-150",
                            isSelected
                                ? "ring-2 ring-primary"
                                : "hover:shadow-md",
                            !item.availability
                                ? "opacity-60 cursor-not-allowed"
                                : "",
                        )}
                    >
                        <CardContent className="p-3 space-y-2">
                            <div className="flex items-start gap-3">
                                <Checkbox
                                    id={`equip-${item.id}`}
                                    checked={isSelected}
                                    onCheckedChange={(checked) =>
                                        handleCheckboxChange(!!checked, item.id)
                                    }
                                    className="mt-1"
                                    disabled={!item.availability}
                                />
                                <div className="flex-grow space-y-1">
                                    <Label
                                        htmlFor={`equip-${item.id}`}
                                        className={cn(
                                            "font-medium",
                                            item.availability
                                                ? "cursor-pointer"
                                                : "cursor-not-allowed",
                                        )}
                                    >
                                        {item.name}
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        Brand: {item.brand ?? "N/A"} | Available
                                        Qty: {item.quantity}
                                    </p>
                                    {isSelected && item.availability && (
                                        <div className="flex items-center gap-2 pt-1">
                                            <Label
                                                htmlFor={`qty-${item.id}`}
                                                className="text-sm"
                                            >
                                                Quantity:
                                            </Label>
                                            <Input
                                                id={`qty-${item.id}`}
                                                type="number"
                                                min="1"
                                                max={item.quantity}
                                                value={currentQuantity}
                                                onChange={(e) =>
                                                    handleQuantityChange(
                                                        Number.parseInt(
                                                            e.target.value,
                                                            10,
                                                        ) || 1,
                                                        item.id,
                                                    )
                                                }
                                                className="h-8 w-20"
                                                onClick={(e) =>
                                                    e.stopPropagation()
                                                }
                                            />
                                        </div>
                                    )}
                                </div>
                                {/* Use standard img tag */}
                                <div className="relative h-12 w-12 flex-shrink-0 bg-muted rounded overflow-hidden flex items-center justify-center">
                                    {item.imagePath ? (
                                        <img // Changed from next/image Image
                                            src={item.imagePath}
                                            alt={item.name}
                                            className="h-full w-full object-cover" // Added basic styling
                                        />
                                    ) : (
                                        <Package className="h-6 w-6 text-muted-foreground" />
                                    )}
                                </div>
                            </div>
                            <div className="pt-1">
                                {item.availability ? (
                                    <Badge
                                        variant="outline"
                                        className="border-green-500 text-green-600"
                                    >
                                        Available
                                    </Badge>
                                ) : (
                                    <Badge variant="destructive">
                                        Unavailable
                                    </Badge>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
            {equipment.length === 0 && (
                <p className="col-span-full text-center text-muted-foreground py-4">
                    No available equipment found.
                </p>
            )}
        </div>
    );
}
