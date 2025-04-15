import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";

// Mock equipment data
const msdoEquipment = [
    {
        id: "msdo-camera",
        name: "Camera",
        available: true,
        quantity: 5,
        availableQuantity: 3,
    },
    {
        id: "msdo-speaker",
        name: "Speaker",
        available: true,
        quantity: 10,
        availableQuantity: 8,
    },
    {
        id: "msdo-microphone",
        name: "Wireless Microphone",
        available: true,
        quantity: 15,
        availableQuantity: 10,
    },
    {
        id: "msdo-projector",
        name: "Projector",
        available: true,
        quantity: 3,
        availableQuantity: 2,
    },
    {
        id: "msdo-laptop",
        name: "Laptop",
        available: true,
        quantity: 8,
        availableQuantity: 3,
    },
    {
        id: "msdo-extension",
        name: "Extension Wire",
        available: true,
        quantity: 20,
        availableQuantity: 15,
    },
    {
        id: "msdo-screen",
        name: "Projection Screen",
        available: true,
        quantity: 3,
        availableQuantity: 1,
    },
    {
        id: "msdo-mixer",
        name: "Audio Mixer",
        available: false,
        quantity: 2,
        availableQuantity: 0,
    },
    {
        id: "msdo-spotlight",
        name: "Spotlight",
        available: false,
        quantity: 4,
        availableQuantity: 0,
    },
];

const opcEquipment = [
    {
        id: "opc-chairs",
        name: "Chairs",
        available: true,
        quantity: 200,
        availableQuantity: 150,
    },
    {
        id: "opc-table",
        name: "Folding Table",
        available: true,
        quantity: 50,
        availableQuantity: 30,
    },
    {
        id: "opc-extension",
        name: "Extension Wire",
        available: true,
        quantity: 15,
        availableQuantity: 10,
    },
    {
        id: "opc-podium",
        name: "Podium",
        available: true,
        quantity: 3,
        availableQuantity: 2,
    },
    {
        id: "opc-whiteboard",
        name: "Whiteboard",
        available: true,
        quantity: 5,
        availableQuantity: 3,
    },
    {
        id: "opc-tent",
        name: "Event Tent",
        available: false,
        quantity: 2,
        availableQuantity: 0,
    },
    {
        id: "opc-barrier",
        name: "Crowd Barrier",
        available: true,
        quantity: 20,
        availableQuantity: 15,
    },
    {
        id: "opc-stage",
        name: "Portable Stage",
        available: false,
        quantity: 1,
        availableQuantity: 0,
    },
    {
        id: "opc-backdrop",
        name: "Event Backdrop",
        available: true,
        quantity: 2,
        availableQuantity: 1,
    },
];

interface EquipmentListProps {
    selectedEquipment: string[];
    onEquipmentChange: (equipmentIds: string[]) => void;
}

export default function EquipmentList({
    selectedEquipment,
    onEquipmentChange,
}: EquipmentListProps) {
    const [activeTab, setActiveTab] = useState("msdo");

    const handleEquipmentToggle = (
        equipmentId: string,
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
                    <TabsTrigger value="msdo">MSDO Equipment</TabsTrigger>
                    <TabsTrigger value="opc">OPC Equipment</TabsTrigger>
                </TabsList>
            </div>

            <TabsContent value="msdo" className="pt-4">
                <ScrollArea className="h-[300px]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {msdoEquipment.map((equipment) => (
                            <Card
                                key={equipment.id}
                                className={`overflow-hidden ${!equipment.available ? "opacity-60" : ""}`}
                            >
                                <CardContent>
                                    <div className="flex items-start gap-3">
                                        <Checkbox
                                            checked={selectedEquipment.includes(
                                                equipment.id,
                                            )}
                                            onCheckedChange={() =>
                                                handleEquipmentToggle(
                                                    equipment.id,
                                                    equipment.available,
                                                )
                                            }
                                            disabled={!equipment.available}
                                            className="mt-1"
                                        />
                                        <div className="space-y-1 flex-1">
                                            <div className="flex justify-between">
                                                <div className="font-medium">
                                                    {equipment.name}
                                                </div>
                                                {getAvailabilityBadge(
                                                    equipment.available,
                                                )}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                Available:{" "}
                                                {equipment.availableQuantity} /{" "}
                                                {equipment.quantity}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </ScrollArea>
            </TabsContent>

            <TabsContent value="opc" className="pt-4">
                <ScrollArea className="h-[300px]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {opcEquipment.map((equipment) => (
                            <Card
                                key={equipment.id}
                                className={`overflow-hidden ${!equipment.available ? "opacity-60" : ""}`}
                            >
                                <CardContent>
                                    <div className="flex items-start gap-3">
                                        <Checkbox
                                            checked={selectedEquipment.includes(
                                                equipment.id,
                                            )}
                                            onCheckedChange={() =>
                                                handleEquipmentToggle(
                                                    equipment.id,
                                                    equipment.available,
                                                )
                                            }
                                            disabled={!equipment.available}
                                            className="mt-1"
                                        />
                                        <div className="space-y-1 flex-1">
                                            <div className="flex justify-between">
                                                <div className="font-medium">
                                                    {equipment.name}
                                                </div>
                                                {getAvailabilityBadge(
                                                    equipment.available,
                                                )}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                Available:{" "}
                                                {equipment.availableQuantity} /{" "}
                                                {equipment.quantity}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </ScrollArea>
            </TabsContent>
        </Tabs>
    );
}
