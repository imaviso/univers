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
    const [activeTab, setActiveTab] = useState("msdo");

    const msdoEquipment = useMemo(
        () =>
            equipment.filter(
                (item) => item.equipmentOwner?.roles === "MSDO", // Example filter
            ),
        [equipment],
    );

    const opcEquipment = useMemo(
        () =>
            equipment.filter(
                (item) => item.equipmentOwner?.roles === "OPC", // Example filter
            ),
        [equipment],
    );

    useState(() => {
        if (msdoEquipment.length === 0 && opcEquipment.length > 0) {
            setActiveTab("opc");
        }
    });

    const handleEquipmentToggle = (
        equipmentId: number,
        isAvailable: boolean,
    ) => {
        if (!isAvailable) return;

        if (selectedEquipment.includes(equipmentId)) {
            onEquipmentChange(
                selectedEquipment.filter((id) => id !== equipmentId),
            );
        } else {
            onEquipmentChange([...selectedEquipment, equipmentId]);
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex items-center justify-between border-b py-2">
                <TabsList className="flex item-center gap-2">
                    {/* Conditionally render tabs based on data availability */}
                    {msdoEquipment.length > 0 && (
                        <TabsTrigger value="msdo">MSDO Equipment</TabsTrigger>
                    )}
                    {opcEquipment.length > 0 && (
                        <TabsTrigger value="opc">OPC Equipment</TabsTrigger>
                    )}
                    {msdoEquipment.length === 0 &&
                        opcEquipment.length === 0 && (
                            <span className="px-3 py-1.5 text-sm text-muted-foreground">
                                No equipment available
                            </span>
                        )}
                </TabsList>
            </div>

            {msdoEquipment.length > 0 && (
                <TabsContent value="msdo" className="pt-4">
                    <ScrollArea className="h-[300px]">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {msdoEquipment.map(
                                (
                                    item, // Use 'item' instead of 'equipment' to avoid conflict
                                ) => (
                                    <Card
                                        key={item.id}
                                        className={`overflow-hidden ${!item.availability ? "opacity-60" : ""}`}
                                    >
                                        <CardContent className="p-3">
                                            {" "}
                                            {/* Adjust padding if needed */}
                                            <div className="flex items-start gap-3">
                                                <Checkbox
                                                    checked={selectedEquipment.includes(
                                                        item.id.toString(),
                                                    )}
                                                    onCheckedChange={() =>
                                                        handleEquipmentToggle(
                                                            item.id,
                                                            item.availability,
                                                        )
                                                    }
                                                    disabled={
                                                        !item.availability
                                                    }
                                                    className="mt-1"
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
                                                        {/* Display total quantity. API needs update for available quantity */}
                                                        Quantity:{" "}
                                                        {item.quantity}
                                                    </div>
                                                    {/* Optionally display brand */}
                                                    <div className="text-xs text-muted-foreground">
                                                        Brand: {item.brand}
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ),
                            )}
                        </div>
                    </ScrollArea>
                </TabsContent>
            )}

            {opcEquipment.length > 0 && (
                <TabsContent value="opc" className="pt-4">
                    <ScrollArea className="h-[300px]">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {opcEquipment.map(
                                (
                                    item, // Use 'item' instead of 'equipment' to avoid conflict
                                ) => (
                                    <Card
                                        key={item.id}
                                        className={`overflow-hidden ${!item.availability ? "opacity-60" : ""}`}
                                    >
                                        <CardContent className="p-3">
                                            {" "}
                                            {/* Adjust padding if needed */}
                                            <div className="flex items-start gap-3">
                                                <Checkbox
                                                    checked={selectedEquipment.includes(
                                                        item.id.toString(),
                                                    )}
                                                    onCheckedChange={() =>
                                                        handleEquipmentToggle(
                                                            item.id,
                                                            item.availability,
                                                        )
                                                    }
                                                    disabled={
                                                        !item.availability
                                                    }
                                                    className="mt-1"
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
                                                        Quantity:{" "}
                                                        {item.quantity}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        Brand: {item.brand}
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ),
                            )}
                        </div>
                    </ScrollArea>
                </TabsContent>
            )}
        </Tabs>
    );
}
