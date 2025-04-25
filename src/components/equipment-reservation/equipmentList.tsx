import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Equipment } from "@/lib/types";
import { useMemo, useState } from "react";
interface EquipmentListProps {
    equipment: Equipment[];
    selectedEquipment: string[];
    onEquipmentChange: (equipmentIds: string[]) => void;
}

export default function EquipmentList({
    equipment,
    selectedEquipment,
    onEquipmentChange,
}: EquipmentListProps) {
    const handleEquipmentToggle = (
        equipmentId: number, // Keep receiving number from item.id
        isAvailable: boolean,
    ) => {
        if (!isAvailable) return;

        const equipmentIdString = String(equipmentId); // Convert to string for comparison/storage

        if (selectedEquipment.includes(equipmentIdString)) {
            onEquipmentChange(
                selectedEquipment.filter((id) => id !== equipmentIdString),
            );
        } else {
            onEquipmentChange([...selectedEquipment, equipmentIdString]);
        }
    };

    const getAvailabilityBadge = (available: boolean) => {
        return available ? (
            <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
                Available
            </Badge>
        ) : (
            <Badge className="bg-red-500/10 text-red-500 hover:bg-red-500/20">
                Unavailable
            </Badge>
        );
    };

    return (
        <div className="w-full space-y-4">
            {/* ... (empty state logic remains the same) ... */}
            {equipment.length === 0 ? (
                <div className="flex items-center justify-center h-[300px] border rounded-md">
                    <span className="text-sm text-muted-foreground">
                        No equipment available
                    </span>
                </div>
            ) : (
                <ScrollArea className="h-[300px] border rounded-md p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {equipment.map((item) => (
                            <Card
                                key={item.id}
                                className={`overflow-hidden ${!item.availability ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:border-primary"}`}
                                // Use the Card's onClick as the primary toggle mechanism
                                onClick={() =>
                                    handleEquipmentToggle(
                                        item.id,
                                        item.availability,
                                    )
                                }
                            >
                                <CardContent className="p-3">
                                    <div className="flex items-start gap-3">
                                        <Checkbox
                                            // Checked state reflects the selection
                                            checked={selectedEquipment.includes(
                                                String(item.id),
                                            )}
                                            disabled={!item.availability}
                                            className="mt-1"
                                            // Remove the onCheckedChange handler
                                            // Remove onClick propagation stop, Card handles it
                                            // The checkbox is now purely visual based on 'checked'
                                            aria-hidden="true" // Hide from accessibility tree as Card handles interaction
                                            tabIndex={-1} // Remove from tab order
                                        />
                                        <div className="space-y-1 flex-1">
                                            <div className="flex justify-between">
                                                <div className="font-medium">
                                                    {item.name}
                                                </div>
                                                {getAvailabilityBadge(
                                                    item.availability,
                                                )}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                Quantity: {item.quantity}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                Brand: {item.brand}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </ScrollArea>
            )}
        </div>
    );
}
