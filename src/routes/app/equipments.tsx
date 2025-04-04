import { EquipmentFormDialog } from "@/components/equipment-inventory/equipmentFormDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTable } from "@/components/ui/data-table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DeleteConfirmDialog } from "@/components/user-management/deleteConfirmDialog";
import { isAuthenticated } from "@/lib/query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import {
    Download,
    Edit,
    MoreHorizontal,
    Plus,
    Trash2,
    Wrench,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/equipments")({
    component: EquipmentInventory,
    beforeLoad: async ({ location }) => {
        const auth = await isAuthenticated([
            "SUPER_ADMIN",
            "EQUIPMENT_OWNER",
            "VP_ADMIN",
        ]);
        if (!auth) {
            throw redirect({
                to: "/auth/login",
                search: {
                    redirect: location.href,
                },
            });
        }
    },
});

// Sample equipment data
const initialEquipment = [
    {
        id: 1,
        name: "Projector",
        idNumber: "EQ-001",
        category: "Audio/Visual",
        owner: "MSDO",
        location: "Main Conference Hall",
        totalQuantity: 10,
        availableQuantity: 7,
        status: "available",
        condition: "excellent",
        lastMaintenance: "2024-04-15",
        serialNumber: "PRJ-2024-001",
        image: "/placeholder.svg?height=80&width=80",
    },
    {
        id: 2,
        name: "Wireless Microphone",
        idNumber: "EQ-002",
        category: "Audio/Visual",
        owner: "MSDO",
        location: "Equipment Storage Room A",
        totalQuantity: 15,
        availableQuantity: 12,
        status: "available",
        condition: "good",
        lastMaintenance: "2024-04-10",
        serialNumber: "MIC-2024-002",
        image: "/placeholder.svg?height=80&width=80",
    },
    {
        id: 3,
        name: "Laptop",
        idNumber: "EQ-003",
        category: "Computing",
        owner: "MSDO",
        location: "IT Department",
        totalQuantity: 20,
        availableQuantity: 15,
        status: "available",
        condition: "good",
        lastMaintenance: "2024-03-25",
        serialNumber: "LPT-2024-003",
        image: "/placeholder.svg?height=80&width=80",
    },
    {
        id: 4,
        name: "Folding Chairs",
        idNumber: "EQ-101",
        category: "Furniture",
        owner: "OPC",
        location: "Equipment Storage Room B",
        totalQuantity: 200,
        availableQuantity: 150,
        status: "available",
        condition: "good",
        lastMaintenance: "2024-02-15",
        serialNumber: "CHR-2024-101",
        image: "/placeholder.svg?height=80&width=80",
    },
    {
        id: 5,
        name: "Folding Tables",
        idNumber: "EQ-102",
        category: "Furniture",
        owner: "OPC",
        location: "Equipment Storage Room B",
        totalQuantity: 50,
        availableQuantity: 35,
        status: "available",
        condition: "fair",
        lastMaintenance: "2024-02-15",
        serialNumber: "TBL-2024-102",
        image: "/placeholder.svg?height=80&width=80",
    },
    {
        id: 6,
        name: "Portable Stage",
        idNumber: "EQ-103",
        category: "Staging",
        owner: "OPC",
        location: "Equipment Storage Room A",
        totalQuantity: 5,
        availableQuantity: 2,
        status: "available",
        condition: "excellent",
        lastMaintenance: "2024-01-20",
        serialNumber: "STG-2024-103",
        image: "/placeholder.svg?height=80&width=80",
    },
    {
        id: 7,
        name: "Sound System",
        idNumber: "EQ-004",
        category: "Audio/Visual",
        owner: "MSDO",
        location: "Auditorium",
        totalQuantity: 3,
        availableQuantity: 0,
        status: "maintenance",
        condition: "fair",
        lastMaintenance: "2024-05-01",
        serialNumber: "SND-2024-004",
        image: "/placeholder.svg?height=80&width=80",
    },
];

// Available categories
const categories = [
    "Audio/Visual",
    "Computers",
    "Furniture",
    "Office Equipment",
    "Other",
];

// Available locations
const locations = [
    "Main Conference Hall",
    "Auditorium",
    "Workshop Room A",
    "Workshop Room B",
    "Equipment Storage Room A",
    "Equipment Storage Room B",
    "IT Department",
];

export function EquipmentInventory() {
    const [equipment, setEquipment] = useState(initialEquipment);
    const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const [selectedItems, setSelectedItems] = useState<number[]>([]);
    const [isAddEquipmentOpen, setIsAddEquipmentOpen] = useState(false);
    const [editingEquipment, setEditingEquipment] = useState<any>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [equipmentToDelete, setEquipmentToDelete] = useState<number | null>(
        null,
    );
    const [viewMode, setViewMode] = useState<"table" | "grid">("table");

    // Filter equipment based on filters
    const filteredEquipment = equipment.filter((item) => {
        const matchesCategory = categoryFilter
            ? item.category === categoryFilter
            : true;
        const matchesStatus = statusFilter
            ? item.status === statusFilter
            : true;
        return matchesCategory && matchesStatus;
    });

    // Equipment statistics
    const stats = {
        total: equipment.length,
        available: equipment.filter((item) => item.status === "available")
            .length,
        inUse: equipment.filter((item) => item.status === "in-use").length,
        maintenance: equipment.filter((item) => item.status === "maintenance")
            .length,
        outOfOrder: equipment.filter((item) => item.status === "out-of-order")
            .length,
    };

    // Handle equipment operations
    const handleAddEquipment = (equipmentData: any) => {
        const newEquipment = {
            id: equipment.length + 1,
            ...equipmentData,
            image: "/placeholder.svg?height=80&width=80",
        };
        setEquipment([...equipment, newEquipment]);
        setIsAddEquipmentOpen(false);
    };

    const handleEditEquipment = (equipmentData: any) => {
        setEquipment(
            equipment.map((item) =>
                item.id === equipmentData.id
                    ? { ...item, ...equipmentData }
                    : item,
            ),
        );
        setEditingEquipment(null);
    };

    const handleDeleteEquipment = (itemId: number) => {
        setEquipment(equipment.filter((item) => item.id !== itemId));
        setEquipmentToDelete(null);
        setIsDeleteDialogOpen(false);
    };

    const handleBulkDelete = () => {
        setEquipment(
            equipment.filter((item) => !selectedItems.includes(item.id)),
        );
        setSelectedItems([]);
        setIsDeleteDialogOpen(false);
    };

    // Status badge styling
    const getStatusBadge = (status: string) => {
        switch (status) {
            case "available":
                return (
                    <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
                        Available
                    </Badge>
                );
            case "in-use":
                return (
                    <Badge className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20">
                        In Use
                    </Badge>
                );
            case "maintenance":
                return (
                    <Badge className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20">
                        Maintenance
                    </Badge>
                );
            case "out-of-order":
                return (
                    <Badge className="bg-red-500/10 text-red-500 hover:bg-red-500/20">
                        Out of Order
                    </Badge>
                );
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    // Condition badge styling
    const getConditionBadge = (condition: string) => {
        switch (condition) {
            case "excellent":
                return (
                    <Badge
                        variant="outline"
                        className="bg-green-500/10 text-green-500 hover:bg-green-500/20"
                    >
                        Excellent
                    </Badge>
                );
            case "good":
                return (
                    <Badge
                        variant="outline"
                        className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20"
                    >
                        Good
                    </Badge>
                );
            case "fair":
                return (
                    <Badge
                        variant="outline"
                        className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20"
                    >
                        Fair
                    </Badge>
                );
            case "poor":
                return (
                    <Badge
                        variant="outline"
                        className="bg-red-500/10 text-red-500 hover:bg-red-500/20"
                    >
                        Poor
                    </Badge>
                );
            default:
                return <Badge variant="outline">{condition}</Badge>;
        }
    };

    // Define columns for DataTable
    const columns: ColumnDef<(typeof equipment)[0]>[] = [
        {
            id: "select",
            header: ({ table }) => (
                <Checkbox
                    checked={
                        table.getIsAllPageRowsSelected() ||
                        (table.getIsSomePageRowsSelected() && "indeterminate")
                    }
                    onCheckedChange={(value) =>
                        table.toggleAllPageRowsSelected(!!value)
                    }
                    aria-label="Select all"
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                    aria-label="Select row"
                />
            ),
            enableSorting: false,
            enableHiding: false,
        },
        {
            accessorKey: "name",
            header: "Equipment",
            cell: ({ row }) => {
                const item = row.original;
                return (
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-md overflow-hidden bg-muted">
                            <img
                                src={item.image || "/placeholder.svg"}
                                alt={item.name}
                                className="h-full w-full object-cover"
                            />
                        </div>
                        <div>
                            <div className="font-medium">{item.name}</div>
                            <div className="text-xs text-muted-foreground">
                                Last maintenance: {item.lastMaintenance}
                            </div>
                        </div>
                    </div>
                );
            },
        },
        {
            accessorKey: "idNumber",
            header: "ID Number",
        },
        {
            accessorKey: "category",
            header: "Category",
        },
        {
            accessorKey: "location",
            header: "Location",
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => getStatusBadge(row.original.status),
        },
        {
            accessorKey: "condition",
            header: "Condition",
            cell: ({ row }) => getConditionBadge(row.original.condition),
        },
        {
            accessorKey: "serialNumber",
            header: "Serial Number",
        },
        {
            id: "actions",
            cell: ({ row }) => {
                const item = row.original;
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                            >
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                                onClick={() => setEditingEquipment(item)}
                            >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                            </DropdownMenuItem>
                            {item.status !== "maintenance" && (
                                <DropdownMenuItem
                                    onClick={() => {
                                        handleEditEquipment({
                                            ...item,
                                            status: "maintenance",
                                            lastMaintenance: new Date()
                                                .toISOString()
                                                .split("T")[0],
                                        });
                                    }}
                                >
                                    <Wrench className="mr-2 h-4 w-4" />
                                    Mark for Maintenance
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => {
                                    setEquipmentToDelete(item.id);
                                    setIsDeleteDialogOpen(true);
                                }}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ];

    return (
        <div className="bg-background">
            <div className="flex flex-col flex-1 overflow-hidden">
                <header className="flex items-center justify-between border-b px-6 py-3.5 h-16">
                    <h1 className="text-xl font-semibold">
                        Equipment Inventory
                    </h1>
                    <div className="flex items-center gap-2">
                        <Button
                            onClick={() => setIsAddEquipmentOpen(true)}
                            size="sm"
                            className="gap-1"
                        >
                            <Plus className="h-4 w-4" />
                            Add Equipment
                        </Button>
                    </div>
                </header>

                {/* Stats Cards */}
                <div className="grid grid-cols-5 gap-4 p-6 pb-0">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">
                                Total Equipment
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats.total}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">
                                Available
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-500">
                                {stats.available}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">
                                In Use
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-500">
                                {stats.inUse}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">
                                Maintenance
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-yellow-500">
                                {stats.maintenance}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">
                                Out of Order
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-500">
                                {stats.outOfOrder}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="flex items-center justify-between border-b px-6 py-2">
                    <div className="flex items-center gap-2">
                        {selectedItems.length > 0 ? (
                            <>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="gap-1 text-destructive"
                                    onClick={() => setIsDeleteDialogOpen(true)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Delete Selected
                                </Button>
                                <span className="text-sm text-muted-foreground">
                                    {selectedItems.length} item
                                    {selectedItems.length > 1 ? "s" : ""}{" "}
                                    selected
                                </span>
                            </>
                        ) : (
                            <span className="text-sm text-muted-foreground">
                                {filteredEquipment.length} item
                                {filteredEquipment.length !== 1 ? "s" : ""}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <Tabs
                            value={viewMode}
                            onValueChange={(value) =>
                                setViewMode(value as "table" | "grid")
                            }
                        >
                            <TabsList>
                                <TabsTrigger value="table">Table</TabsTrigger>
                                <TabsTrigger value="grid">Grid</TabsTrigger>
                            </TabsList>
                        </Tabs>

                        <Select
                            value={categoryFilter || "all"}
                            onValueChange={(value) =>
                                setCategoryFilter(value || null)
                            }
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filter by category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">
                                    All Categories
                                </SelectItem>
                                {categories.map((category) => (
                                    <SelectItem key={category} value={category}>
                                        {category}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select
                            value={statusFilter || "all"}
                            onValueChange={(value) =>
                                setStatusFilter(value || null)
                            }
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">
                                    All Statuses
                                </SelectItem>
                                <SelectItem value="available">
                                    Available
                                </SelectItem>
                                <SelectItem value="in-use">In Use</SelectItem>
                                <SelectItem value="maintenance">
                                    Maintenance
                                </SelectItem>
                                <SelectItem value="out-of-order">
                                    Out of Order
                                </SelectItem>
                            </SelectContent>
                        </Select>

                        <Button variant="outline" size="sm" className="gap-1">
                            <Download className="h-4 w-4" />
                            Export
                        </Button>
                    </div>
                </div>

                <div className="flex-1 overflow-auto p-6">
                    {viewMode === "table" ? (
                        <DataTable
                            columns={columns}
                            data={filteredEquipment}
                            searchColumn="name"
                            searchPlaceholder="Search equipment..."
                        />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredEquipment.map((item) => (
                                <Card key={item.id} className="overflow-hidden">
                                    <CardHeader className="p-4 pb-2">
                                        <div className="flex justify-between">
                                            <div className="flex items-start gap-2">
                                                <Checkbox
                                                    checked={selectedItems.includes(
                                                        item.id,
                                                    )}
                                                    onCheckedChange={() => {
                                                        if (
                                                            selectedItems.includes(
                                                                item.id,
                                                            )
                                                        ) {
                                                            setSelectedItems(
                                                                selectedItems.filter(
                                                                    (id) =>
                                                                        id !==
                                                                        item.id,
                                                                ),
                                                            );
                                                        } else {
                                                            setSelectedItems([
                                                                ...selectedItems,
                                                                item.id,
                                                            ]);
                                                        }
                                                    }}
                                                />
                                                <CardTitle className="text-base">
                                                    {item.name}
                                                </CardTitle>
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                    >
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        onClick={() =>
                                                            setEditingEquipment(
                                                                item,
                                                            )
                                                        }
                                                    >
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    {item.status !==
                                                        "maintenance" && (
                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                handleEditEquipment(
                                                                    {
                                                                        ...item,
                                                                        status: "maintenance",
                                                                        lastMaintenance:
                                                                            new Date()
                                                                                .toISOString()
                                                                                .split(
                                                                                    "T",
                                                                                )[0],
                                                                    },
                                                                );
                                                            }}
                                                        >
                                                            <Wrench className="mr-2 h-4 w-4" />
                                                            Mark for Maintenance
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        className="text-destructive"
                                                        onClick={() => {
                                                            setEquipmentToDelete(
                                                                item.id,
                                                            );
                                                            setIsDeleteDialogOpen(
                                                                true,
                                                            );
                                                        }}
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                        <CardDescription className="text-xs">
                                            {item.idNumber}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-4 pt-0">
                                        <div className="flex items-start gap-3 mb-3">
                                            <div className="h-16 w-16 rounded-md overflow-hidden bg-muted flex-shrink-0">
                                                <img
                                                    src={
                                                        item.image ||
                                                        "/placeholder.svg"
                                                    }
                                                    alt={item.name}
                                                    className="h-full w-full object-cover"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex flex-wrap gap-1">
                                                    {getStatusBadge(
                                                        item.status,
                                                    )}
                                                    {getConditionBadge(
                                                        item.condition,
                                                    )}
                                                </div>
                                                <div className="text-sm">
                                                    Category: {item.category}
                                                </div>
                                                <div className="text-sm">
                                                    Location: {item.location}
                                                </div>
                                                <div className="text-sm">
                                                    Serial: {item.serialNumber}
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                            {filteredEquipment.length === 0 && (
                                <div className="col-span-full text-center py-8 text-muted-foreground">
                                    No equipment found. Try adjusting your
                                    filters.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Add/Edit Equipment Dialog */}
            <EquipmentFormDialog
                isOpen={isAddEquipmentOpen || !!editingEquipment}
                onClose={() => {
                    setIsAddEquipmentOpen(false);
                    setEditingEquipment(null);
                }}
                onSubmit={
                    editingEquipment ? handleEditEquipment : handleAddEquipment
                }
                equipment={editingEquipment}
                categories={categories}
                locations={locations}
            />

            {/* Delete Confirmation Dialog */}
            <DeleteConfirmDialog
                isOpen={isDeleteDialogOpen}
                onClose={() => {
                    setIsDeleteDialogOpen(false);
                    setEquipmentToDelete(null);
                }}
                onConfirm={() => {
                    if (equipmentToDelete) {
                        handleDeleteEquipment(equipmentToDelete);
                    } else if (selectedItems.length > 0) {
                        handleBulkDelete();
                    }
                }}
                title={
                    equipmentToDelete
                        ? "Delete Equipment"
                        : "Delete Selected Equipment"
                }
                description={
                    equipmentToDelete
                        ? "Are you sure you want to delete this equipment? This action cannot be undone."
                        : `Are you sure you want to delete ${selectedItems.length} selected items? This action cannot be undone.`
                }
            />
        </div>
    );
}
