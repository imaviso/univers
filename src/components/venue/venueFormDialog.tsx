import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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

interface VenueFormDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (venueData: any) => void;
    venue?: any;
    venueTypes: string[];
    amenities: string[];
}

export function VenueFormDialog({
    isOpen,
    onClose,
    onSubmit,
    venue,
    venueTypes,
    amenities,
}: VenueFormDialogProps) {
    const [formData, setFormData] = useState({
        id: 0,
        name: "",
        address: "",
        type: "",
        capacity: 0,
        status: "available",
        amenities: [] as string[],
        contactPerson: "",
        contactEmail: "",
        contactPhone: "",
        description: "",
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [activeTab, setActiveTab] = useState("basic");

    // Reset form when dialog opens/closes or venue changes
    useEffect(() => {
        if (isOpen) {
            if (venue) {
                setFormData({
                    id: venue.id,
                    name: venue.name,
                    address: venue.address,
                    type: venue.type,
                    capacity: venue.capacity,
                    status: venue.status,
                    amenities: venue.amenities,
                    contactPerson: venue.contactPerson,
                    contactEmail: venue.contactEmail,
                    contactPhone: venue.contactPhone,
                    description: venue.description,
                });
            } else {
                // Default values for new venue
                setFormData({
                    id: 0,
                    name: "",
                    address: "",
                    type: "",
                    capacity: 0,
                    status: "available",
                    amenities: [],
                    contactPerson: "",
                    contactEmail: "",
                    contactPhone: "",
                    description: "",
                });
            }
            setErrors({});
            setActiveTab("basic");
        }
    }, [isOpen, venue]);

    const handleChange = (field: string, value: any) => {
        setFormData({ ...formData, [field]: value });

        // Clear error for this field if it exists
        if (errors[field]) {
            const newErrors = { ...errors };
            delete newErrors[field];
            setErrors(newErrors);
        }
    };

    const handleAmenityToggle = (amenity: string) => {
        if (formData.amenities.includes(amenity)) {
            handleChange(
                "amenities",
                formData.amenities.filter((a) => a !== amenity),
            );
        } else {
            handleChange("amenities", [...formData.amenities, amenity]);
        }
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = "Name is required";
        }

        if (!formData.address.trim()) {
            newErrors.address = "Address is required";
        }

        if (!formData.type) {
            newErrors.type = "Venue type is required";
        }

        if (!formData.capacity || formData.capacity <= 0) {
            newErrors.capacity = "Valid capacity is required";
        }

        if (!formData.contactPerson.trim()) {
            newErrors.contactPerson = "Contact person is required";
        }

        if (!formData.contactEmail.trim()) {
            newErrors.contactEmail = "Contact email is required";
        } else if (!/\S+@\S+\.\S+/.test(formData.contactEmail)) {
            newErrors.contactEmail = "Email is invalid";
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
            <DialogContent className="sm:max-w-[700px]">
                <DialogHeader>
                    <DialogTitle>
                        {venue ? "Edit Venue" : "Add New Venue"}
                    </DialogTitle>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="basic">
                            Basic Information
                        </TabsTrigger>
                        <TabsTrigger value="amenities">Amenities</TabsTrigger>
                        <TabsTrigger value="contact">
                            Contact & Details
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="basic" className="space-y-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Venue Name</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) =>
                                    handleChange("name", e.target.value)
                                }
                                placeholder="Enter venue name"
                            />
                            {errors.name && (
                                <p className="text-sm text-destructive">
                                    {errors.name}
                                </p>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="address">Address</Label>
                            <Input
                                id="address"
                                value={formData.address}
                                onChange={(e) =>
                                    handleChange("address", e.target.value)
                                }
                                placeholder="Enter full address"
                            />
                            {errors.address && (
                                <p className="text-sm text-destructive">
                                    {errors.address}
                                </p>
                            )}
                        </div>

                        <div className="grid grid-cols gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="type">Venue Type</Label>
                                <Select
                                    value={formData.type}
                                    onValueChange={(value) =>
                                        handleChange("type", value)
                                    }
                                >
                                    <SelectTrigger className="w-full" id="type">
                                        <SelectValue placeholder="Select venue type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {venueTypes.map((type) => (
                                            <SelectItem key={type} value={type}>
                                                {type}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.type && (
                                    <p className="text-sm text-destructive">
                                        {errors.type}
                                    </p>
                                )}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="status">Status</Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={(value) =>
                                        handleChange("status", value)
                                    }
                                >
                                    <SelectTrigger className="w-full" id="status">
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="available">
                                            Available
                                        </SelectItem>
                                        <SelectItem value="booked">
                                            Booked
                                        </SelectItem>
                                        <SelectItem value="maintenance">
                                            Maintenance
                                        </SelectItem>
                                        <SelectItem value="unavailable">
                                            Unavailable
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="capacity">
                                    Capacity (people)
                                </Label>
                                <Input
                                    id="capacity"
                                    type="number"
                                    value={formData.capacity || ""}
                                    onChange={(e) =>
                                        handleChange(
                                            "capacity",
                                            Number.parseInt(e.target.value) ||
                                                0,
                                        )
                                    }
                                    placeholder="Enter maximum capacity"
                                />
                                {errors.capacity && (
                                    <p className="text-sm text-destructive">
                                        {errors.capacity}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) =>
                                    handleChange("description", e.target.value)
                                }
                                placeholder="Enter venue description"
                                rows={4}
                            />
                        </div>
                    </TabsContent>

                    <TabsContent value="amenities" className="py-4">
                        <div className="grid gap-2">
                            <Label className="mb-2">Available Amenities</Label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {amenities.map((amenity) => (
                                    <div
                                        key={amenity}
                                        className="flex items-center space-x-2"
                                    >
                                        <Checkbox
                                            id={`amenity-${amenity}`}
                                            checked={formData.amenities.includes(
                                                amenity,
                                            )}
                                            onCheckedChange={() =>
                                                handleAmenityToggle(amenity)
                                            }
                                        />
                                        <Label
                                            htmlFor={`amenity-${amenity}`}
                                            className="text-sm font-normal"
                                        >
                                            {amenity}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="contact" className="space-y-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="contactPerson">
                                Contact Person
                            </Label>
                            <Input
                                id="contactPerson"
                                value={formData.contactPerson}
                                onChange={(e) =>
                                    handleChange(
                                        "contactPerson",
                                        e.target.value,
                                    )
                                }
                                placeholder="Enter contact person name"
                            />
                            {errors.contactPerson && (
                                <p className="text-sm text-destructive">
                                    {errors.contactPerson}
                                </p>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="contactEmail">Email</Label>
                                <Input
                                    id="contactEmail"
                                    type="email"
                                    value={formData.contactEmail}
                                    onChange={(e) =>
                                        handleChange(
                                            "contactEmail",
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Enter contact email"
                                />
                                {errors.contactEmail && (
                                    <p className="text-sm text-destructive">
                                        {errors.contactEmail}
                                    </p>
                                )}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="contactPhone">Phone</Label>
                                <Input
                                    id="contactPhone"
                                    value={formData.contactPhone}
                                    onChange={(e) =>
                                        handleChange(
                                            "contactPhone",
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Enter contact phone"
                                />
                                {errors.contactPhone && (
                                    <p className="text-sm text-destructive">
                                        {errors.contactPhone}
                                    </p>
                                )}
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit}>
                        {venue ? "Save Changes" : "Add Venue"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
