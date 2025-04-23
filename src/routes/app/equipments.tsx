import ErrorPage from "@/components/ErrorPage";
import PendingPage from "@/components/PendingPage";
import { EquipmentFormDialog } from "@/components/equipment-inventory/equipmentFormDialog";
import { EquipmentReservationFormDialog } from "@/components/equipment-reservation/equipmentReservationForm";
import UserReservations from "@/components/equipment-reservation/userReservation";
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
import {
    addEquipment,
    bulkDeleteEquipment,
    deleteEquipment,
    editEquipment,
} from "@/lib/api";
import { allNavigation } from "@/lib/navigation";
import {
    equipmentsQueryOptions,
    useCurrentUser,
    usersQueryOptions,
} from "@/lib/query"; // Import query options and user hook
import type { EquipmentDTOInput } from "@/lib/schema";
import { type Equipment, STATUS_EQUIPMENT } from "@/lib/types"; // Import updated Equipment type
import { useMutation, useQuery, useSuspenseQuery } from "@tanstack/react-query"; // Import useQuery
import {
    createFileRoute,
    redirect,
    useRouteContext,
} from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table"; // Import ColumnDef
import {
    Download,
    Edit,
    MoreHorizontal,
    Plus,
    Trash2,
    Wrench, // Keep if needed for Mark for Maintenance action
} from "lucide-react"; // Import icons
import { useMemo, useState } from "react"; // Added useMemo
import { toast } from "sonner";

// Sample data removed, will fetch from API

// Categories and Locations might need to be fetched or managed differently
// For now, keep them if filtering is still desired, but they aren't part of the Equipment DTO
const categories = [
    "Audio/Visual",
    "Computers",
    "Furniture",
    "Office Equipment",
    "Other",
];
const locations = [
    "Main Conference Hall",
    "Auditorium",
    "Workshop Room A",
    "Workshop Room B",
    "Equipment Storage Room A",
    "Equipment Storage Room B",
    "IT Department",
];

// Sample events/venues for reservation dialog (keep as is for now)
const events = [
    { id: "1", name: "Annual Conference" },
    { id: "2", name: "Team Building Workshop" },
    { id: "3", name: "Product Launch" },
];
const venues = [
    { id: "1", name: "Main Auditorium", capacity: 500 },
    { id: "2", name: "Conference Room A", capacity: 100 },
    { id: "3", name: "Outdoor Pavilion", capacity: 300 },
];

export const Route = createFileRoute("/app/equipments")({
    beforeLoad: async ({ location, context }) => {
        const navigationItem = allNavigation.find((item) => {
            return (
                location.pathname === item.href ||
                location.pathname.startsWith(`${item.href}/`)
            );
        });
        const allowedRoles: string[] = navigationItem
            ? navigationItem.roles
            : [];

        if (context.authState == null) {
            throw redirect({
                to: "/login",
                search: {
                    redirect: location.href,
                },
            });
        }
        const isAuthorized = allowedRoles.includes(context.authState.role);

        if (!isAuthorized) {
            throw redirect({
                to: "/login",
                search: {
                    redirect: location.href,
                },
            });
        }
    },
    component: EquipmentInventory,
    errorComponent: () => <ErrorPage />,
    pendingComponent: () => <PendingPage />,
    // loader: async ({ context }) => {
    //     context.queryClient.ensureQueryData(equipmentsQueryOptions(context.userId));
    //     if ("role" in context && context.role === "SUPER_ADMIN") {
    //         context.queryClient.ensureQueryData(usersQueryOptions);
    //     }
    // },
});

function EquipmentInventory() {
    const context = useRouteContext({ from: "/app/equipments" });
    const role = context.authState?.role;
    const { data: currentUser } = useCurrentUser();
    const queryClient = context.queryClient;

    // Fetch equipment data
    const {
        data: equipment = [],
        isLoading,
        isError,
        error,
    } = useSuspenseQuery(equipmentsQueryOptions(currentUser?.id));

    // State
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const [selectedItems, setSelectedItems] = useState<number[]>([]);
    const [isAddEquipmentOpen, setIsAddEquipmentOpen] = useState(false);
    const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(
        null,
    );
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [equipmentToDelete, setEquipmentToDelete] = useState<number | null>(
        null,
    );
    const [viewMode, setViewMode] = useState<"table" | "grid" | "reservations">(
        role === "SUPER_ADMIN" || role === "EQUIPMENT_OWNER" ? "table" : "grid",
    );
    const [isReservationDialogOpen, setIsReservationDialogOpen] =
        useState(false);

    // --- Mutations ---

    const addMutation = useMutation({
        mutationFn: addEquipment,
        onSuccess: () => {
            toast.success("Equipment added successfully.");
            queryClient.invalidateQueries({
                queryKey: ["equipments", currentUser?.id],
            });
            setIsAddEquipmentOpen(false); // Close dialog on success
        },
        onError: (error) => {
            toast.error(`Failed to add equipment: ${error.message}`);
            // Optionally update form error state if passed back up
        },
    });

    const editMutation = useMutation({
        mutationFn: editEquipment,
        onSuccess: (data) => {
            toast.success(`Equipment "${data.name}" updated successfully.`);
            queryClient.invalidateQueries({
                queryKey: ["equipments", currentUser?.id],
            });
            setIsAddEquipmentOpen(false); // Close dialog on success
            setEditingEquipment(null);
        },
        onError: (error) => {
            toast.error(`Failed to update equipment: ${error.message}`);
            // Optionally update form error state
        },
    });

    const deleteMutation = useMutation({
        mutationFn: deleteEquipment,
        onSuccess: (_, deletedId) => {
            toast.success("Equipment deleted successfully.");
            queryClient.invalidateQueries({
                queryKey: ["equipments", currentUser?.id],
            });
            setIsDeleteDialogOpen(false);
            setEquipmentToDelete(null);
        },
        onError: (error) => {
            toast.error(`Failed to delete equipment: ${error.message}`);
            setIsDeleteDialogOpen(false);
            setEquipmentToDelete(null);
        },
    });

    const bulkDeleteMutation = useMutation({
        mutationFn: bulkDeleteEquipment,
        onSuccess: () => {
            toast.success("Selected equipment deleted successfully.");
            queryClient.invalidateQueries({
                queryKey: ["equipments", currentUser?.id],
            });
            setSelectedItems([]); // Clear selection
            setIsDeleteDialogOpen(false);
        },
        onError: (error) => {
            toast.error(
                `Failed to delete selected equipment: ${error.message}`,
            );
            setIsDeleteDialogOpen(false);
        },
    });

    // --- Event Handlers ---

    const handleReserveEquipment = (data: any) => {
        console.log("Reservation data:", data);
        setIsReservationDialogOpen(false);
    };

    const handleEditEquipment = (equipmentData: Equipment) => {
        setEditingEquipment(equipmentData);
        setIsAddEquipmentOpen(true);
    };

    // Called from DeleteConfirmDialog
    const confirmDelete = () => {
        if (equipmentToDelete) {
            deleteMutation.mutate(equipmentToDelete);
        } else if (selectedItems.length > 0) {
            bulkDeleteMutation.mutate(selectedItems);
        }
    };

    // Called from EquipmentFormDialog submit
    const handleFormSubmit = (
        data: EquipmentDTOInput,
        imageFile: File | null,
    ) => {
        if (!currentUser?.id) {
            toast.error("Authentication error. Cannot save equipment.");
            return;
        }

        if (editingEquipment) {
            // Edit existing equipment
            editMutation.mutate({
                equipmentId: editingEquipment.id,
                userId: currentUser.id,
                equipmentData: data,
                imageFile: imageFile, // Pass null if not changed, API needs to handle this
            });
        } else {
            // Add new equipment
            if (!imageFile) {
                // This should ideally be caught by form validation, but double-check
                toast.error("Image file is required to add new equipment.");
                return;
            }
            addMutation.mutate({
                userId: currentUser.id,
                equipmentData: data,
                imageFile: imageFile,
            });
        }
    };

    // Filtered equipment (memoized)
    const filteredEquipment = useMemo(() => {
        // ... (filtering logic remains the same) ...
        return equipment.filter((item) => {
            const matchesStatus = statusFilter
                ? item.status === statusFilter
                : true;
            return matchesStatus;
        });
    }, [equipment, statusFilter]);

    // Stats (memoized)
    const stats = useMemo(() => {
        // ... (stats calculation remains the same) ...
        const counts = equipment.reduce(
            (acc, item) => {
                acc.total++;
                if (item.status === "APPROVED" && item.availability)
                    acc.available++;
                if (item.status === "PENDING") acc.pending++;
                if (item.status === "MAINTENANCE") acc.maintenance++;
                if (item.status === "DEFECT") acc.defect++;
                if (item.status === "NEED_REPLACEMENT") acc.needReplacement++;
                return acc;
            },
            {
                total: 0,
                available: 0,
                pending: 0,
                maintenance: 0,
                defect: 0,
                needReplacement: 0,
            },
        );
        return counts;
    }, [equipment]);

    // Status badge styling
    const getStatusBadge = (status: Equipment["status"]) => {
        // ... (getStatusBadge remains the same) ...
        switch (status) {
            case "APPROVED":
            case "NEW":
                return (
                    <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20 capitalize">
                        {status.toLowerCase()}
                    </Badge>
                );
            case "PENDING":
                return (
                    <Badge className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 capitalize">
                        {status.toLowerCase()}
                    </Badge>
                );
            case "MAINTENANCE":
                return (
                    <Badge className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 capitalize">
                        {status.toLowerCase()}
                    </Badge>
                );
            case "DEFECT":
            case "NEED_REPLACEMENT":
            case "CANCELED":
                return (
                    <Badge className="bg-red-500/10 text-red-500 hover:bg-red-500/20 capitalize">
                        {status.replace("_", " ").toLowerCase()}
                    </Badge>
                );
            default:
                return (
                    <Badge variant="outline" className="capitalize">
                        {status.toLowerCase()}
                    </Badge>
                );
        }
    };

    // DataTable columns definition
    const columns: ColumnDef<Equipment>[] = [
        // ... (select column remains the same) ...
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
                    onClick={(e) => e.stopPropagation()}
                />
            ),
            enableSorting: false,
            enableHiding: false,
        },
        // ... (name, brand, quantity, availability, status columns remain the same) ...
        {
            accessorKey: "name",
            header: "Equipment",
            cell: ({ row }) => {
                const item = row.original;
                const imageUrl = item.imagePath
                    ? `/uploads/equipment/${item.imagePath.substring(item.imagePath.lastIndexOf("/") + 1)}`
                    : "/placeholder.svg";
                return (
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-md overflow-hidden bg-muted flex-shrink-0">
                            <img
                                src={imageUrl}
                                alt={item.name}
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                    e.currentTarget.src = "/placeholder.svg";
                                }}
                            />
                        </div>
                        <div>
                            <div className="font-medium">{item.name}</div>
                            <div className="text-xs text-muted-foreground">
                                Brand: {item.brand}
                            </div>
                        </div>
                    </div>
                );
            },
        },
        {
            accessorKey: "brand",
            header: "Brand",
        },
        {
            accessorKey: "quantity",
            header: "Quantity",
        },
        {
            accessorKey: "availability",
            header: "Available",
            cell: ({ row }) => (row.original.availability ? "Yes" : "No"),
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => getStatusBadge(row.original.status),
        },
        {
            id: "actions",
            cell: ({ row }) => {
                const item = row.original;
                if (role !== "SUPER_ADMIN" && role !== "EQUIPMENT_OWNER") {
                    return null;
                }
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                disabled={
                                    editMutation.isPending ||
                                    deleteMutation.isPending ||
                                    bulkDeleteMutation.isPending
                                } // Disable actions while mutating
                            >
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                                onClick={() => handleEditEquipment(item)}
                                disabled={editMutation.isPending} // Disable specific action
                            >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                            </DropdownMenuItem>
                            {/* Maintenance action - requires separate mutation */}
                            {item.status !== "MAINTENANCE" && (
                                <DropdownMenuItem
                                    onClick={() => {
                                        console.warn(
                                            "Mark for Maintenance mutation not implemented.",
                                        );
                                        // Example: updateStatusMutation.mutate({ id: item.id, status: 'MAINTENANCE' })
                                    }}
                                    // disabled={updateStatusMutation.isPending}
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
                                disabled={deleteMutation.isPending} // Disable specific action
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

    // Loading/Error states
    if (isLoading) return <div>Loading equipment...</div>;
    if (isError)
        return (
            <div>
                Error loading equipment: {error?.message || "Unknown error"}
            </div>
        );

    // Determine if any mutation is pending
    const isMutating =
        addMutation.isPending ||
        editMutation.isPending ||
        deleteMutation.isPending ||
        bulkDeleteMutation.isPending;

    // --- Render JSX ---
    return (
        <div className="bg-background">
            <div className="flex flex-col flex-1 overflow-hidden">
                {/* Header */}
                <header className="flex items-center justify-between border-b px-6 py-3.5 h-16">
                    {/* ... (header content remains the same) ... */}
                    <h1 className="text-xl font-semibold">
                        Equipment Inventory
                    </h1>
                    <div className="flex items-center gap-2">
                        {(role === "SUPER_ADMIN" ||
                            role === "EQUIPMENT_OWNER") && (
                            <Button
                                onClick={() => {
                                    setEditingEquipment(null);
                                    setIsAddEquipmentOpen(true);
                                }}
                                size="sm"
                                className="gap-1"
                                disabled={isMutating} // Disable if any mutation is running
                            >
                                <Plus className="h-4 w-4" />
                                Add Equipment
                            </Button>
                        )}
                        {role !== "SUPER_ADMIN" &&
                            role !== "EQUIPMENT_OWNER" && (
                                <Button
                                    onClick={() =>
                                        setIsReservationDialogOpen(true)
                                    }
                                    size="sm"
                                    className="gap-1"
                                >
                                    <Plus className="h-4 w-4" />
                                    Reserve Equipment
                                </Button>
                            )}
                    </div>
                </header>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 p-6 pb-0">
                    {/* ... (stats cards remain the same) ... */}
                    <Card>
                        <CardHeader>
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
                        <CardHeader>
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
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">
                                Pending
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-500">
                                {stats.pending}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
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
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">
                                Defect/Needs Replace
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-500">
                                {stats.defect + stats.needReplacement}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters and Actions Bar */}
                <div className="flex items-center justify-between border-b px-6 py-2">
                    {/* Bulk Actions */}
                    <div className="flex items-center gap-2">
                        {(role === "SUPER_ADMIN" ||
                            role === "EQUIPMENT_OWNER") &&
                        selectedItems.length > 0 ? (
                            <>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="gap-1 text-destructive"
                                    onClick={() => {
                                        setEquipmentToDelete(null);
                                        setIsDeleteDialogOpen(true);
                                    }}
                                    disabled={isMutating} // Disable if mutating
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Delete Selected ({selectedItems.length})
                                </Button>
                            </>
                        ) : (
                            <span className="text-sm text-muted-foreground">
                                {filteredEquipment.length} item
                                {filteredEquipment.length !== 1 ? "s" : ""}
                            </span>
                        )}
                    </div>

                    {/* View Mode Tabs & Filters */}
                    <div className="flex items-center gap-2">
                        {/* ... (Tabs, Status Filter, Export Button remain the same, disable filters/export if mutating?) ... */}
                        <Tabs
                            value={viewMode}
                            onValueChange={(value) =>
                                setViewMode(
                                    value as "table" | "grid" | "reservations",
                                )
                            }
                        >
                            <TabsList>
                                {(role === "SUPER_ADMIN" ||
                                    role === "EQUIPMENT_OWNER") && (
                                    <TabsTrigger value="table">
                                        Table
                                    </TabsTrigger>
                                )}
                                <TabsTrigger value="grid">
                                    {role === "SUPER_ADMIN" ||
                                    role === "EQUIPMENT_OWNER"
                                        ? "Grid"
                                        : "Equipments"}
                                </TabsTrigger>
                                {role !== "SUPER_ADMIN" &&
                                    role !== "EQUIPMENT_OWNER" && (
                                        <TabsTrigger value="reservations">
                                            My Reservations
                                        </TabsTrigger>
                                    )}
                            </TabsList>
                        </Tabs>
                        {(role === "SUPER_ADMIN" ||
                            role === "EQUIPMENT_OWNER") && (
                            <>
                                <Select
                                    value={statusFilter || "all"}
                                    onValueChange={(value) =>
                                        setStatusFilter(
                                            value === "all" ? null : value,
                                        )
                                    }
                                    disabled={isMutating} // Optionally disable filters
                                >
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Filter by status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            All Statuses
                                        </SelectItem>
                                        {STATUS_EQUIPMENT.map((s) => (
                                            <SelectItem
                                                key={s.value}
                                                value={s.value}
                                            >
                                                {s.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-1"
                                    onClick={() =>
                                        console.warn("Export not implemented")
                                    }
                                    disabled={isMutating} // Optionally disable export
                                >
                                    <Download className="h-4 w-4" />
                                    Export
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                {/* Main Content Area (Table/Grid/Reservations) */}
                <div className="flex-1 overflow-auto p-6">
                    {/* Table View */}
                    {viewMode === "table" &&
                        (role === "SUPER_ADMIN" ||
                            role === "EQUIPMENT_OWNER") && (
                            <DataTable
                                columns={columns}
                                data={filteredEquipment}
                                searchColumn="name"
                                searchPlaceholder="Search equipment..."
                                onRowSelectionChange={(updater) => {
                                    const currentSelection =
                                        typeof updater === "function"
                                            ? updater(
                                                  selectedItems.reduce(
                                                      (acc, id) => {
                                                          acc[id] = true;
                                                          return acc;
                                                      },
                                                      {} as Record<
                                                          number,
                                                          boolean
                                                      >,
                                                  ),
                                              ) // Convert to expected format if needed
                                            : updater;
                                    // Extract selected IDs from the result
                                    const selectedIds = Object.entries(
                                        currentSelection as Record<
                                            number,
                                            boolean
                                        >,
                                    )
                                        .filter(([, isSelected]) => isSelected)
                                        .map(([id]) => Number(id));
                                    setSelectedItems(selectedIds);
                                }}
                                state={{
                                    // Pass selection state to DataTable
                                    rowSelection: selectedItems.reduce(
                                        (acc, id) => {
                                            acc[id] = true;
                                            return acc;
                                        },
                                        {} as Record<number, boolean>,
                                    ),
                                }}
                            />
                        )}
                    {/* Grid View */}
                    {viewMode === "grid" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredEquipment.map((item) => {
                                // ... (Grid item rendering remains the same, ensure Checkbox/DropdownMenu actions are disabled based on isMutating) ...
                                const imageUrl = item.imagePath
                                    ? `/uploads/equipment/${item.imagePath.substring(item.imagePath.lastIndexOf("/") + 1)}`
                                    : "/placeholder.svg";
                                return (
                                    <Card
                                        key={item.id}
                                        className="overflow-hidden"
                                    >
                                        <CardHeader>
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-start gap-2">
                                                    {(role === "SUPER_ADMIN" ||
                                                        role ===
                                                            "EQUIPMENT_OWNER") && (
                                                        <Checkbox
                                                            checked={selectedItems.includes(
                                                                item.id,
                                                            )}
                                                            onCheckedChange={(
                                                                checked,
                                                            ) => {
                                                                setSelectedItems(
                                                                    (prev) =>
                                                                        checked
                                                                            ? [
                                                                                  ...prev,
                                                                                  item.id,
                                                                              ]
                                                                            : prev.filter(
                                                                                  (
                                                                                      id,
                                                                                  ) =>
                                                                                      id !==
                                                                                      item.id,
                                                                              ),
                                                                );
                                                            }}
                                                            className="mt-1"
                                                            disabled={
                                                                isMutating
                                                            } // Disable checkbox
                                                        />
                                                    )}
                                                    <CardTitle className="text-base">
                                                        {item.name}
                                                    </CardTitle>
                                                </div>
                                                {(role === "SUPER_ADMIN" ||
                                                    role ===
                                                        "EQUIPMENT_OWNER") && (
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger
                                                            asChild
                                                        >
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 flex-shrink-0"
                                                                disabled={
                                                                    isMutating
                                                                } // Disable trigger
                                                            >
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem
                                                                onClick={() =>
                                                                    handleEditEquipment(
                                                                        item,
                                                                    )
                                                                }
                                                                disabled={
                                                                    editMutation.isPending
                                                                }
                                                            >
                                                                <Edit className="mr-2 h-4 w-4" />
                                                                Edit
                                                            </DropdownMenuItem>
                                                            {item.status !==
                                                                "MAINTENANCE" && (
                                                                <DropdownMenuItem
                                                                    onClick={() => {
                                                                        console.warn(
                                                                            "Mark for Maintenance mutation not implemented.",
                                                                        );
                                                                    }}
                                                                    // disabled={updateStatusMutation.isPending}
                                                                >
                                                                    <Wrench className="mr-2 h-4 w-4" />
                                                                    Mark for
                                                                    Maintenance
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
                                                                disabled={
                                                                    deleteMutation.isPending
                                                                }
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Delete
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                )}
                                            </div>
                                            <CardDescription className="text-xs pt-1">
                                                Brand: {item.brand} | Qty:{" "}
                                                {item.quantity}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex items-start gap-3 mb-3">
                                                <div className="h-20 w-20 rounded-md overflow-hidden bg-muted flex-shrink-0">
                                                    <img
                                                        src={imageUrl}
                                                        alt={item.name}
                                                        className="h-full w-full object-cover"
                                                        onError={(e) => {
                                                            e.currentTarget.src =
                                                                "/placeholder.svg";
                                                        }}
                                                    />
                                                </div>
                                                <div className="space-y-1 text-sm">
                                                    <div className="flex flex-wrap gap-1">
                                                        {getStatusBadge(
                                                            item.status,
                                                        )}
                                                        <Badge
                                                            variant={
                                                                item.availability
                                                                    ? "default"
                                                                    : "outline"
                                                            }
                                                            className={
                                                                item.availability
                                                                    ? "bg-green-100 text-green-800"
                                                                    : ""
                                                            }
                                                        >
                                                            {item.availability
                                                                ? "Available"
                                                                : "Not Available"}
                                                        </Badge>
                                                    </div>
                                                    <div>
                                                        Added:{" "}
                                                        {new Date(
                                                            item.createdAt,
                                                        ).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </div>
                                            {role !== "SUPER_ADMIN" &&
                                                role !== "EQUIPMENT_OWNER" &&
                                                item.availability &&
                                                item.status === "APPROVED" && (
                                                    <Button
                                                        size="sm"
                                                        className="w-full mt-2"
                                                        onClick={() =>
                                                            setIsReservationDialogOpen(
                                                                true,
                                                            )
                                                        }
                                                    >
                                                        Reserve
                                                    </Button>
                                                )}
                                        </CardContent>
                                    </Card>
                                );
                            })}
                            {filteredEquipment.length === 0 && (
                                <div className="col-span-full text-center py-8 text-muted-foreground">
                                    No equipment found.
                                </div>
                            )}
                        </div>
                    )}
                    {/* Reservations View */}
                    {viewMode === "reservations" && <UserReservations />}
                </div>
            </div>

            {/* Dialogs */}
            <EquipmentReservationFormDialog
                isOpen={isReservationDialogOpen}
                onClose={() => setIsReservationDialogOpen(false)}
                onSubmit={handleReserveEquipment}
                events={events}
                venues={venues}
            />

            {(role === "SUPER_ADMIN" || role === "EQUIPMENT_OWNER") && (
                <>
                    <EquipmentFormDialog
                        isOpen={isAddEquipmentOpen}
                        onClose={() => {
                            setIsAddEquipmentOpen(false);
                            setEditingEquipment(null);
                        }}
                        equipment={editingEquipment || undefined}
                        // Pass the submit handler and mutation states
                        onSubmit={handleFormSubmit}
                        isMutating={
                            addMutation.isPending || editMutation.isPending
                        }
                    />

                    <DeleteConfirmDialog
                        isOpen={isDeleteDialogOpen}
                        onClose={() => {
                            setIsDeleteDialogOpen(false);
                            setEquipmentToDelete(null);
                        }}
                        onConfirm={confirmDelete} // Use the combined delete handler
                        isDeleting={
                            deleteMutation.isPending ||
                            bulkDeleteMutation.isPending
                        } // Pass loading state
                        title={
                            equipmentToDelete
                                ? "Delete Equipment"
                                : "Delete Selected Equipment"
                        }
                        description={
                            equipmentToDelete
                                ? `Are you sure you want to delete the equipment "${equipment.find((e) => e.id === equipmentToDelete)?.name || "this item"}"? This action cannot be undone.`
                                : `Are you sure you want to delete ${selectedItems.length} selected items? This action cannot be undone.`
                        }
                    />
                </>
            )}
        </div>
    );
}
