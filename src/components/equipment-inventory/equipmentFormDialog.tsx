import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useState } from "react";

interface EquipmentFormDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (equipmentData: any) => void;
    equipment?: any;
    categories: string[];
    locations: string[];
}

export function EquipmentFormDialog({
    isOpen,
    onClose,
    onSubmit,
    equipment,
    categories,
    locations,
}: EquipmentFormDialogProps) {
    const [formData, setFormData] = useState({
        id: 0,
        name: "",
        category: "",
        location: "",
        status: "available",
        condition: "good",
        serialNumber: "",
        purchaseDate: "",
        lastMaintenance: "",
        nextMaintenance: "",
        notes: "",
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [activeTab, setActiveTab] = useState("basic");

    // Reset form when dialog opens/closes or equipment changes
    useEffect(() => {
        if (isOpen) {
            if (equipment) {
                setFormData({
                    id: equipment.id,
                    name: equipment.name,
                    category: equipment.category,
                    location: equipment.location,
                    status: equipment.status,
                    condition: equipment.condition,
                    serialNumber: equipment.serialNumber,
                    purchaseDate: equipment.purchaseDate,
                    lastMaintenance: equipment.lastMaintenance,
                    nextMaintenance: equipment.nextMaintenance,
                    notes: equipment.notes,
                });
            } else {
                // Default values for new equipment
                const today = new Date().toISOString().split("T")[0];
                const sixMonthsLater = new Date();
                sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);

                setFormData({
                    id: 0,
                    name: "",
                    category: "",
                    location: "",
                    status: "available",
                    condition: "good",
                    serialNumber: "",
                    purchaseDate: today,
                    lastMaintenance: today,
                    nextMaintenance: sixMonthsLater.toISOString().split("T")[0],
                    notes: "",
                });
            }
            setErrors({});
            setActiveTab("basic");
        }
    }, [isOpen, equipment]);

    const handleChange = (field: string, value: string) => {
        setFormData({ ...formData, [field]: value });

        // Clear error for this field if it exists
        if (errors[field]) {
            const newErrors = { ...errors };
            delete newErrors[field];
            setErrors(newErrors);
        }
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = "Name is required";
        }

        if (!formData.category) {
            newErrors.category = "Category is required";
        }

        if (!formData.location) {
            newErrors.location = "Location is required";
        }

        if (!formData.serialNumber.trim()) {
            newErrors.serialNumber = "Serial number is required";
        }

        if (!formData.purchaseDate) {
            newErrors.purchaseDate = "Purchase date is required";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (validateForm()) {
            onSubmit(formData);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>
                        {equipment ? "Edit Equipment" : "Add New Equipment"}
                    </DialogTitle>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="basic">
                            Basic Information
                        </TabsTrigger>
                        <TabsTrigger value="details">
                            Details & Maintenance
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="basic" className="space-y-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Equipment Name</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) =>
                                    handleChange("name", e.target.value)
                                }
                                placeholder="Enter equipment name"
                            />
                            {errors.name && (
                                <p className="text-sm text-destructive">
                                    {errors.name}
                                </p>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="category">Category</Label>
                                <Select
                                    value={formData.category}
                                    onValueChange={(value) =>
                                        handleChange("category", value)
                                    }
                                >
                                    <SelectTrigger
                                        className="w-full"
                                        id="category"
                                    >
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map((category) => (
                                            <SelectItem
                                                key={category}
                                                value={category}
                                            >
                                                {category}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.category && (
                                    <p className="text-sm text-destructive">
                                        {errors.category}
                                    </p>
                                )}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="location">Location</Label>
                                <Select
                                    value={formData.location}
                                    onValueChange={(value) =>
                                        handleChange("location", value)
                                    }
                                >
                                    <SelectTrigger
                                        className="w-full"
                                        id="location"
                                    >
                                        <SelectValue placeholder="Select location" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {locations.map((location) => (
                                            <SelectItem
                                                key={location}
                                                value={location}
                                            >
                                                {location}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.location && (
                                    <p className="text-sm text-destructive">
                                        {errors.location}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="status">Status</Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={(value) =>
                                        handleChange("status", value)
                                    }
                                >
                                    <SelectTrigger
                                        className="w-full"
                                        id="status"
                                    >
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="available">
                                            Available
                                        </SelectItem>
                                        <SelectItem value="in-use">
                                            In Use
                                        </SelectItem>
                                        <SelectItem value="maintenance">
                                            Maintenance
                                        </SelectItem>
                                        <SelectItem value="out-of-order">
                                            Out of Order
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="condition">Condition</Label>
                                <Select
                                    value={formData.condition}
                                    onValueChange={(value) =>
                                        handleChange("condition", value)
                                    }
                                >
                                    <SelectTrigger
                                        className="w-full"
                                        id="condition"
                                    >
                                        <SelectValue placeholder="Select condition" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="excellent">
                                            Excellent
                                        </SelectItem>
                                        <SelectItem value="good">
                                            Good
                                        </SelectItem>
                                        <SelectItem value="fair">
                                            Fair
                                        </SelectItem>
                                        <SelectItem value="poor">
                                            Poor
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="serialNumber">Serial Number</Label>
                            <Input
                                id="serialNumber"
                                value={formData.serialNumber}
                                onChange={(e) =>
                                    handleChange("serialNumber", e.target.value)
                                }
                                placeholder="Enter serial number"
                            />
                            {errors.serialNumber && (
                                <p className="text-sm text-destructive">
                                    {errors.serialNumber}
                                </p>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="details" className="space-y-4 py-4">
                        <div className="grid grid-cols-3 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="purchaseDate">
                                    Purchase Date
                                </Label>
                                <Input
                                    id="purchaseDate"
                                    type="date"
                                    value={formData.purchaseDate}
                                    onChange={(e) =>
                                        handleChange(
                                            "purchaseDate",
                                            e.target.value,
                                        )
                                    }
                                />
                                {errors.purchaseDate && (
                                    <p className="text-sm text-destructive">
                                        {errors.purchaseDate}
                                    </p>
                                )}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="lastMaintenance">
                                    Last Maintenance
                                </Label>
                                <Input
                                    id="lastMaintenance"
                                    type="date"
                                    value={formData.lastMaintenance}
                                    onChange={(e) =>
                                        handleChange(
                                            "lastMaintenance",
                                            e.target.value,
                                        )
                                    }
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="nextMaintenance">
                                    Next Maintenance
                                </Label>
                                <Input
                                    id="nextMaintenance"
                                    type="date"
                                    value={formData.nextMaintenance}
                                    onChange={(e) =>
                                        handleChange(
                                            "nextMaintenance",
                                            e.target.value,
                                        )
                                    }
                                />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="notes">Notes</Label>
                            <Textarea
                                id="notes"
                                value={formData.notes}
                                onChange={(e) =>
                                    handleChange("notes", e.target.value)
                                }
                                placeholder="Enter additional notes or specifications"
                                rows={4}
                            />
                        </div>
                    </TabsContent>
                </Tabs>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit}>
                        {equipment ? "Save Changes" : "Add Equipment"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
