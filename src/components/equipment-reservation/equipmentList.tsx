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
import type { Equipment } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Package } from "lucide-react";

interface EquipmentListProps {
    equipment: Equipment[];
    value: { equipmentId: string; quantity: number }[];
    onChange: (newValue: { equipmentId: string; quantity: number }[]) => void;
}

export default function EquipmentList({
    equipment,
    value = [],
    onChange,
}: EquipmentListProps) {
    const handleCheckboxChange = (
        checked: boolean | string,
        equipmentId: string,
    ) => {
        const currentSelection = [...value];
        const equipmentIdStr = equipmentId.toString();
        const existingIndex = currentSelection.findIndex(
            (item) => item.equipmentId === equipmentIdStr,
        );

        if (checked && existingIndex === -1) {
            currentSelection.push({ equipmentId: equipmentIdStr, quantity: 1 });
        } else if (!checked && existingIndex !== -1) {
            currentSelection.splice(existingIndex, 1);
        }
        onChange(currentSelection);
    };

    const handleQuantityChange = (newQuantity: number, equipmentId: string) => {
        const currentSelection = [...value];
        const equipmentIdStr = equipmentId.toString();
        const existingIndex = currentSelection.findIndex(
            (item) => item.equipmentId === equipmentIdStr,
        );
        const equipmentItem = equipment.find(
            (item) => item.publicId === equipmentIdStr,
        );
        const maxQuantity = equipmentItem?.quantity ?? 1;

        const validQuantity = Math.max(1, Math.min(newQuantity, maxQuantity));

        if (existingIndex !== -1) {
            currentSelection[existingIndex].quantity = validQuantity;
            onChange(currentSelection);
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
                        <TableHead className="w-[100px] text-center">
                            Available
                        </TableHead>
                        <TableHead className="w-[120px] text-center">
                            Quantity
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
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
                    {equipment.map((item) => {
                        const isSelected = value.some(
                            (selected) =>
                                selected.equipmentId === item.publicId,
                        );
                        const selectedItem = value.find(
                            (selected) =>
                                selected.equipmentId === item.publicId,
                        );
                        const currentQuantity = selectedItem?.quantity ?? 1;

                        return (
                            <TableRow
                                key={item.publicId}
                                className={cn(
                                    "transition-colors duration-150",
                                    !item.availability
                                        ? "opacity-60 cursor-not-allowed bg-muted/30"
                                        : "hover:bg-muted/50",
                                    isSelected && item.availability
                                        ? "bg-primary/10"
                                        : "",
                                )}
                                aria-disabled={!item.availability}
                            >
                                <TableCell className="px-3">
                                    <Checkbox
                                        id={`equip-${item.publicId}`}
                                        checked={isSelected}
                                        onCheckedChange={(checked) =>
                                            handleCheckboxChange(
                                                !!checked,
                                                item.publicId,
                                            )
                                        }
                                        disabled={!item.availability}
                                        aria-label={`Select ${item.name}`}
                                    />
                                </TableCell>

                                <TableCell className="font-medium py-2">
                                    <div className="flex items-center gap-2">
                                        <div className="relative h-8 w-8 flex-shrink-0 bg-muted rounded overflow-hidden flex items-center justify-center">
                                            {item.imagePath ? (
                                                <img
                                                    src={item.imagePath}
                                                    alt={item.name}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <Package className="h-4 w-4 text-muted-foreground" />
                                            )}
                                        </div>
                                        <div>
                                            <Label
                                                htmlFor={`equip-${item.publicId}`}
                                                className={cn(
                                                    item.availability
                                                        ? "cursor-pointer"
                                                        : "cursor-not-allowed",
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
                                            {item.quantity}
                                        </Badge>
                                    ) : (
                                        <Badge
                                            variant="destructive"
                                            className="px-1.5 py-0.5 text-xs"
                                        >
                                            0
                                        </Badge>
                                    )}
                                </TableCell>

                                <TableCell className="text-center py-2">
                                    {isSelected && item.availability ? (
                                        <Input
                                            id={`qty-${item.publicId}`}
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
                                                    item.publicId,
                                                )
                                            }
                                            className="h-8 w-20 mx-auto"
                                            onClick={(e) => e.stopPropagation()}
                                            aria-label={`Quantity for ${item.name}`}
                                        />
                                    ) : (
                                        <span className="text-muted-foreground">
                                            -
                                        </span>
                                    )}
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}
