import ErrorPage from "@/components/ErrorPage";
import PendingPage from "@/components/PendingPage";
import { EquipmentFormDialog } from "@/components/equipment-inventory/equipmentFormDialog";
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
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DeleteConfirmDialog } from "@/components/user-management/deleteConfirmDialog";
import { addEquipment, deleteEquipment, editEquipment } from "@/lib/api";
import { allNavigation } from "@/lib/navigation";
import {
    equipmentsQueryOptions,
    useCurrentUser,
    usersQueryOptions,
} from "@/lib/query";
import type { EquipmentDTOInput } from "@/lib/schema";
import type { Equipment, UserDTO } from "@/lib/types";
import { useMutation, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import {
    createFileRoute,
    redirect,
    useNavigate,
    useRouteContext,
} from "@tanstack/react-router";
import type { ColumnDef, Row, RowSelectionState } from "@tanstack/react-table";
import {
    AlertTriangle,
    CheckCircle,
    Download,
    Edit,
    MoreHorizontal,
    Package,
    Plus,
    Trash2,
    Wrench,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
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
    loader: async ({ context }) => {
        context.queryClient.ensureQueryData(
            equipmentsQueryOptions(context.authState),
        );
        // context.queryClient.ensureQueryData(venuesQueryOptions);
        // context.queryClient.ensureQueryData(ownEventsQueryOptions);
    },
});

function EquipmentInventory() {
    const { queryClient } = useRouteContext({
        from: "/app/equipments",
    });
    const { data: currentUser } = useCurrentUser();
    const role = currentUser?.role;
    const navigate = useNavigate();

    const isPrivilegedUser = useMemo(() => {
        if (!role) return false;
        return ["SUPER_ADMIN", "EQUIPMENT_OWNER", "MSDO", "OPC"].includes(role);
    }, [role]);

    const [isAddEquipmentOpen, setIsAddEquipmentOpen] = useState(false);
    const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(
        null,
    );
    const [equipmentToDelete, setEquipmentToDelete] = useState<string | null>(
        null,
    );
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
    const [viewMode, setViewMode] = useState<"table" | "grid" | "reservations">(
        isPrivilegedUser ? "table" : "grid",
    );
    const [isReservationDialogOpen, setIsReservationDialogOpen] =
        useState(false);

    // --- Queries ---
    const { data: equipment = [] } = useSuspenseQuery(
        equipmentsQueryOptions(currentUser),
    );

    /*    const { data: venues = [] } = useSuspenseQuery(venuesQueryOptions);
    const { data: events = [] } = useSuspenseQuery(ownEventsQueryOptions); */

    const { data: allUsers = [] } = useQuery({
        ...usersQueryOptions,
        enabled: role === "SUPER_ADMIN",
    });

    const equipmentOwners = useMemo(
        () =>
            role === "SUPER_ADMIN"
                ? allUsers.filter(
                      (user: UserDTO) => user.role === "EQUIPMENT_OWNER",
                  )
                : [],
        [role, allUsers],
    );
    // --- End Queries ---

    // --- Mutations ---
    const addMutation = useMutation({
        mutationFn: addEquipment,
        onSuccess: () => {
            toast.success("Equipment added successfully.");
            queryClient.invalidateQueries({
                queryKey: equipmentsQueryOptions(currentUser).queryKey, // Invalidate based on user
            });
            setIsAddEquipmentOpen(false);
        },
        onError: (error) => {
            toast.error(`Failed to add equipment: ${error.message}`);
        },
    });

    const editMutation = useMutation({
        mutationFn: editEquipment,
        onSuccess: (data) => {
            toast.success(`Equipment "${data.name}" updated successfully.`);
            queryClient.invalidateQueries({
                queryKey: equipmentsQueryOptions(currentUser).queryKey, // Invalidate based on user
            });
            setIsAddEquipmentOpen(false);
            setEditingEquipment(null);
        },
        onError: (error) => {
            toast.error(`Failed to update equipment: ${error.message}`);
        },
    });

    const deleteMutation = useMutation<
        void,
        Error,
        { equipmentId: string; userId: string }
    >({
        mutationFn: async ({ equipmentId, userId }) => {
            await deleteEquipment(equipmentId, userId);
            return Promise.resolve(undefined); // Explicitly map to Promise<void>
        },
        onSuccess: (_, variables) => {
            toast.success("Equipment deleted successfully.");
            queryClient.invalidateQueries({
                queryKey: equipmentsQueryOptions(currentUser).queryKey, // Invalidate based on user
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

    // Bulk delete endpoint not available on backend
    // const bulkDeleteMutation = useMutation({ ... });

    const handleEditEquipment = useCallback(
        (equipmentData: Equipment) => {
            setEditingEquipment(equipmentData);
            setIsAddEquipmentOpen(true);
        },
        [], // State setters are stable, no need to include them
    );

    const confirmDelete = () => {
        if (!currentUser) return; // Should not happen if page loaded

        if (equipmentToDelete) {
            // Single delete
            deleteMutation.mutate({
                equipmentId: equipmentToDelete,
                userId: currentUser.publicId,
            });
        }
        // Bulk delete logic removed as backend doesn't support it
        // else if (Object.keys(rowSelection).length > 0) {
        //     // Handle bulk delete based on rowSelection keys if needed in future
        //     // const idsToDelete = Object.keys(rowSelection).map(Number);
        //     // bulkDeleteMutation.mutate({ equipmentIds: idsToDelete, userId: Number(currentUser.id) });
        // }
        setRowSelection({}); // Clear selection after attempting delete
    };

    // Updated submit handler from dialog
    const handleFormSubmit = (data: EquipmentDTOInput) => {
        if (!currentUser) {
            toast.error("User not found. Cannot submit form.");
            return;
        }

        const imageFile = data.image instanceof File ? data.image : null;

        if (editingEquipment) {
            // Edit existing equipment
            editMutation.mutate({
                equipmentId: editingEquipment.publicId,
                userId: currentUser.publicId,
                equipmentData: {
                    // Pass data excluding the image, if API expects it separately
                    name: data.name,
                    brand: data.brand,
                    availability: data.availability,
                    quantity: data.quantity,
                    status: data.status,
                    ownerId: data.ownerId,
                },
                imageFile: imageFile,
            });
        } else {
            // Add new equipment
            // The check for image presence for new items is now handled inside EquipmentFormDialog or by schema.
            // However, it's good to ensure it here before API call if needed,
            // or rely on the API to handle it if data.image is undefined.
            // Forcing a check here as per original logic for add:
            if (!imageFile) {
                toast.error("Image file is required to add new equipment.");
                // Optionally, set form error back if possible, though toast is immediate.
                // Form.setError("image", {message: "Image file is required"}) // This would need access to form instance
                return;
            }
            addMutation.mutate({
                userId: currentUser.publicId,
                equipmentData: {
                    // Pass data excluding the image, if API expects it separately
                    name: data.name,
                    brand: data.brand,
                    availability: data.availability,
                    quantity: data.quantity,
                    status: data.status,
                    ownerId: data.ownerId,
                },
                imageFile: imageFile,
            });
        }
    };

    // Filtered equipment (memoized) - Add search/filter logic here if needed
    const filteredEquipment = useMemo(() => {
        return equipment;
    }, [equipment]);

    // Calculate stats (memoized)
    const stats = useMemo(() => {
        if (!Array.isArray(equipment)) {
            return {
                total: 0,
                available: 0,
                maintenance: 0,
                defect: 0,
                needReplacement: 0,
            };
        }

        const counts = equipment.reduce(
            (acc, item) => {
                acc.total++;
                switch (item.status) {
                    case "NEW":
                        if (item.availability) acc.available++;
                        break;
                    case "MAINTENANCE":
                        acc.maintenance++;
                        break;
                    case "DEFECT":
                        acc.defect++;
                        break;
                    case "NEED_REPLACEMENT":
                        acc.needReplacement++;
                        break;
                }
                return acc;
            },
            {
                total: 0,
                available: 0,
                maintenance: 0,
                defect: 0,
                needReplacement: 0,
            },
        );
        return counts;
    }, [equipment]);

    // Status badge styling
    const getStatusBadge = useCallback((status: Equipment["status"]) => {
        switch (status) {
            case "NEW":
                return (
                    <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20 capitalize">
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
                return (
                    <Badge className="bg-red-500/10 text-red-500 hover:bg-red-500/20 capitalize">
                        {status.replace("_", " ").toLowerCase()}
                    </Badge>
                );
            default: {
                const exhaustiveCheck: never = status;
                return (
                    <Badge variant="outline" className="capitalize">
                        {exhaustiveCheck}
                    </Badge>
                );
            }
        }
    }, []);

    // DataTable columns definition
    const columns: ColumnDef<Equipment>[] = useMemo(
        () => [
            // Select column (only for roles that can manage)
            ...(isPrivilegedUser
                ? [
                      {
                          id: "select",
                          header: ({ table }) => (
                              <Checkbox
                                  checked={
                                      table.getIsAllPageRowsSelected() ||
                                      (table.getIsSomePageRowsSelected() &&
                                          "indeterminate")
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
                                  onCheckedChange={(value) =>
                                      row.toggleSelected(!!value)
                                  }
                                  aria-label="Select row"
                                  // Disable selection if user cannot manage this specific item
                                  disabled={
                                      !(
                                          role === "SUPER_ADMIN" ||
                                          ([
                                              "EQUIPMENT_OWNER",
                                              "MSDO",
                                              "OPC",
                                          ].includes(role ?? "") &&
                                              row.original.equipmentOwner
                                                  ?.publicId ===
                                                  currentUser?.publicId)
                                      )
                                  }
                              />
                          ),
                          enableSorting: false,
                          enableHiding: false,
                      } as ColumnDef<Equipment>,
                  ]
                : []), // Type assertion
            {
                accessorKey: "name",
                header: "Name",
                cell: ({ row }) => {
                    const item = row.original;
                    // Construct image URL - Assuming imagePath is just the filename
                    const imageUrl = item.imagePath;

                    return (
                        <div className="flex items-center gap-3">
                            <img
                                src={imageUrl}
                                alt={item.name}
                                className="h-10 w-10 rounded object-cover"
                                loading="lazy"
                            />
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
            // Owner column (visible only for SUPER_ADMIN)
            ...(role === "SUPER_ADMIN"
                ? [
                      {
                          // Access nested owner data
                          accessorFn: (row: Equipment) =>
                              row.equipmentOwner?.email ?? "N/A",
                          id: "ownerEmail",
                          header: "Owner",
                          cell: ({ row }: { row: Row<Equipment> }) => {
                              const owner = row.original.equipmentOwner; // Access nested owner object
                              return owner ? (
                                  <div>
                                      {owner.firstName} {owner.lastName}
                                      <div className="text-xs text-muted-foreground">
                                          {owner.email}
                                      </div>
                                  </div>
                              ) : (
                                  <span className="text-muted-foreground">
                                      N/A
                                  </span>
                              );
                          },
                      } as ColumnDef<Equipment>, // Type assertion
                  ]
                : []),
            // Actions column (only for roles that can manage)
            ...(isPrivilegedUser
                ? [
                      {
                          id: "actions",
                          cell: ({ row }) => {
                              const item = row.original;
                              // Check if the current user can manage this specific item
                              const canManage =
                                  role === "SUPER_ADMIN" ||
                                  (["EQUIPMENT_OWNER", "MSDO", "OPC"].includes(
                                      role ?? "",
                                  ) &&
                                      item.equipmentOwner?.publicId ===
                                          currentUser?.publicId);

                              if (!canManage) {
                                  return null; // No actions if user cannot manage
                              }

                              const isMutatingItem =
                                  deleteMutation.isPending &&
                                  deleteMutation.variables?.equipmentId ===
                                      item.publicId;

                              return (
                                  <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                          <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-8 w-8"
                                              disabled={isMutatingItem} // Disable only if this item is being mutated
                                          >
                                              <MoreHorizontal className="h-4 w-4" />
                                          </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                          <DropdownMenuItem
                                              onClick={() =>
                                                  handleEditEquipment(item)
                                              }
                                              disabled={editMutation.isPending} // Disable if any edit is pending
                                          >
                                              <Edit className="mr-2 h-4 w-4" />
                                              Edit
                                          </DropdownMenuItem>
                                          {/* Add Maintenance action if needed */}
                                          {/* <DropdownMenuItem ... > Mark for Maintenance </DropdownMenuItem> */}
                                          <DropdownMenuSeparator />
                                          <DropdownMenuItem
                                              className="text-destructive"
                                              onClick={() => {
                                                  setEquipmentToDelete(
                                                      item.publicId,
                                                  );
                                                  setIsDeleteDialogOpen(true);
                                              }}
                                              disabled={isMutatingItem} // Disable if this item is being deleted
                                          >
                                              <Trash2 className="mr-2 h-4 w-4" />
                                              Delete
                                          </DropdownMenuItem>
                                      </DropdownMenuContent>
                                  </DropdownMenu>
                              );
                          },
                      } as ColumnDef<Equipment>,
                  ]
                : []), // Type assertion
        ],
        [
            role,
            currentUser?.publicId,
            editMutation.isPending,
            deleteMutation.isPending,
            deleteMutation.variables,
            getStatusBadge, // Added dependency
            handleEditEquipment, // Added dependency
            isPrivilegedUser, // Added dependency
        ],
    ); // Add mutation states/variables

    // --- Render JSX ---
    const isMutating =
        addMutation.isPending ||
        editMutation.isPending ||
        deleteMutation.isPending; // Removed bulkDeleteMutation

    const selectedRowCount = Object.keys(rowSelection).length;

    return (
        <div className="bg-background">
            <div className="flex flex-col flex-1 overflow-hidden">
                {/* Header */}
                <header className="flex items-center justify-between border-b px-6 py-3.5 h-16">
                    <h1 className="text-xl font-semibold">Equipments</h1>
                    <div className="flex items-center gap-2">
                        {isPrivilegedUser && (
                            <Button
                                onClick={() => {
                                    setEditingEquipment(null);
                                    setIsAddEquipmentOpen(true);
                                }}
                                size="sm"
                                className="gap-1"
                                disabled={isMutating}
                            >
                                <Plus className="h-4 w-4" />
                                Add Equipment
                            </Button>
                        )}
                    </div>
                </header>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 p-6">
                    {/* ... (Stats cards remain the same) ... */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Total Equipment
                            </CardTitle>
                            <Package className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats.total}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Available
                            </CardTitle>
                            <CheckCircle className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-500">
                                {stats.available}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Under Maintenance
                            </CardTitle>
                            <Wrench className="h-4 w-4 text-yellow-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-yellow-500">
                                {stats.maintenance}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Defect/Replacement
                            </CardTitle>
                            <AlertTriangle className="h-4 w-4 text-red-500" />
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
                    {/* Bulk Actions Removed */}
                    <div className="flex items-center gap-2">
                        {/* {(role === "SUPER_ADMIN" || role === "EQUIPMENT_OWNER") && selectedItems.length > 0 ? (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="gap-1 text-destructive"
                                onClick={() => {
                                    setEquipmentToDelete(null);
                                    setIsDeleteDialogOpen(true);
                                }}
                                disabled={isMutating}
                            >
                                <Trash2 className="h-4 w-4" />
                                Delete Selected ({selectedItems.length})
                            </Button>
                        ) : ( */}
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                                {selectedRowCount > 0
                                    ? `${selectedRowCount} selected | `
                                    : ""}
                                {/* Add check for Array.isArray */}
                                {Array.isArray(filteredEquipment)
                                    ? filteredEquipment.length
                                    : 0}{" "}
                                item
                                {Array.isArray(filteredEquipment) &&
                                filteredEquipment.length !== 1
                                    ? "s"
                                    : ""}
                            </span>
                        </div>
                    </div>

                    {/* View Mode Tabs & Filters */}
                    <div className="flex items-center gap-2">
                        <Tabs
                            value={viewMode}
                            onValueChange={(value) =>
                                setViewMode(
                                    value as "table" | "grid" | "reservations",
                                )
                            }
                        >
                            <TabsList>
                                {isPrivilegedUser && (
                                    <TabsTrigger value="table">
                                        Table
                                    </TabsTrigger>
                                )}
                                <TabsTrigger value="grid">
                                    {isPrivilegedUser ? "Grid" : "Equipments"}
                                </TabsTrigger>
                                {!isPrivilegedUser && (
                                    <TabsTrigger value="reservations">
                                        My Reservations
                                    </TabsTrigger>
                                )}
                            </TabsList>
                        </Tabs>
                        {/* Add Filters Dropdown if needed */}
                        {isPrivilegedUser && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-1"
                                onClick={() =>
                                    console.warn("Export not implemented")
                                }
                                disabled={isMutating}
                            >
                                <Download className="h-4 w-4" />
                                Export
                            </Button>
                        )}
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-auto p-6">
                    {/* Table View */}
                    {viewMode === "table" && isPrivilegedUser && (
                        <DataTable
                            columns={columns}
                            data={filteredEquipment}
                            searchColumn="name"
                            searchPlaceholder="Search equipment..."
                            // Pass the state object directly
                            rowSelection={rowSelection}
                            // Pass the state setter directly
                            onRowSelectionChange={setRowSelection}
                            // Enable row selection (managed by DataTable)
                        />
                    )}

                    {/* Grid View */}
                    {viewMode === "grid" && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {filteredEquipment.map((item) => {
                                const imageUrl = item.imagePath;
                                const canManage =
                                    role === "SUPER_ADMIN" ||
                                    ([
                                        "EQUIPMENT_OWNER",
                                        "MSDO",
                                        "OPC",
                                    ].includes(role ?? "") &&
                                        item.equipmentOwner?.publicId ===
                                            currentUser?.publicId); // Compare numbers
                                const isMutatingItem =
                                    deleteMutation.isPending &&
                                    deleteMutation.variables?.equipmentId ===
                                        item.publicId;
                                return (
                                    <Card
                                        key={item.publicId}
                                        className="overflow-hidden"
                                    >
                                        <CardHeader className="p-0 relative">
                                            <img
                                                src={imageUrl}
                                                alt={item.name}
                                                className="aspect-video w-full object-cover"
                                                loading="lazy"
                                            />
                                            <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
                                                {getStatusBadge(item.status)}
                                                {item.availability ? (
                                                    <Badge
                                                        variant="secondary"
                                                        className="bg-green-100 text-green-700"
                                                    >
                                                        Available
                                                    </Badge>
                                                ) : (
                                                    <Badge
                                                        variant="secondary"
                                                        className="bg-gray-100 text-gray-600"
                                                    >
                                                        Unavailable
                                                    </Badge>
                                                )}
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-4">
                                            <div className="flex justify-between items-start mb-1">
                                                <CardTitle className="text-base leading-tight">
                                                    {item.name}
                                                </CardTitle>
                                                {canManage && (
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger
                                                            asChild
                                                        >
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7 flex-shrink-0 -mt-1 -mr-2"
                                                                disabled={
                                                                    isMutatingItem
                                                                }
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
                                                                <Edit className="mr-2 h-4 w-4" />{" "}
                                                                Edit
                                                            </DropdownMenuItem>
                                                            {/* Add Maintenance action if needed */}
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                className="text-destructive"
                                                                onClick={() => {
                                                                    setEquipmentToDelete(
                                                                        item.publicId,
                                                                    );
                                                                    setIsDeleteDialogOpen(
                                                                        true,
                                                                    );
                                                                }}
                                                                disabled={
                                                                    isMutatingItem
                                                                }
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" />{" "}
                                                                Delete
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                )}
                                            </div>
                                            <CardDescription className="text-xs">
                                                Brand: {item.brand} | Qty:{" "}
                                                {item.quantity}
                                            </CardDescription>
                                            {/* Display owner for SUPER_ADMIN in grid view */}
                                            {role === "SUPER_ADMIN" &&
                                                item.equipmentOwner && (
                                                    <CardDescription className="text-xs mt-1">
                                                        Owner:{" "}
                                                        {
                                                            item.equipmentOwner
                                                                .firstName
                                                        }{" "}
                                                        {
                                                            item.equipmentOwner
                                                                .lastName
                                                        }
                                                    </CardDescription>
                                                )}
                                        </CardContent>
                                        {/* Add Reserve button for non-admins/owners in grid view */}
                                        {/* {role !== "SUPER_ADMIN" &&
                                            role !== "EQUIPMENT_OWNER" &&
                                            item.availability && (
                                                <CardFooter className="p-4 pt-0">
                                                    <Button
                                                        size="sm"
                                                        className="w-full"
                                                        onClick={() => {
                                                            console.log(
                                                                "Reserve item:",
                                                                item.id,
                                                            );
                                                            // setReservingItem(item); // Need state for this
                                                            // setIsReservationDialogOpen(true);
                                                        }}
                                                    >
                                                        Reserve
                                                    </Button>
                                                </CardFooter>
                                            )} */}
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
                    {viewMode === "reservations" &&
                        role !== "SUPER_ADMIN" &&
                        role !== "EQUIPMENT_OWNER" && (
                            <div>
                                <UserReservations />
                            </div>
                        )}
                </div>

                {/* Dialogs */}
                {/* Add/Edit Dialog */}
                {isPrivilegedUser && role && (
                    <EquipmentFormDialog
                        isOpen={isAddEquipmentOpen}
                        onClose={() => {
                            setIsAddEquipmentOpen(false);
                            setEditingEquipment(null);
                        }}
                        equipment={editingEquipment || undefined}
                        onSubmit={handleFormSubmit}
                        isMutating={
                            addMutation.isPending || editMutation.isPending
                        }
                        currentUserRole={role}
                        equipmentOwners={equipmentOwners}
                    />
                )}

                {/* Delete Confirmation Dialog */}
                {isPrivilegedUser && (
                    <DeleteConfirmDialog
                        isOpen={isDeleteDialogOpen}
                        onClose={() => {
                            setIsDeleteDialogOpen(false);
                            setEquipmentToDelete(null);
                        }}
                        onConfirm={confirmDelete}
                        isLoading={
                            // Renamed prop
                            deleteMutation.isPending /* || bulkDeleteMutation.isPending */
                        }
                        title={
                            equipmentToDelete
                                ? "Delete Equipment"
                                : "Delete Selected Equipment" // This part is now unused
                        }
                        description={
                            equipmentToDelete
                                ? "Are you sure you want to permanently delete this equipment?"
                                : "Are you sure you want to permanently delete the selected equipment items?" // This part is now unused
                        }
                    />
                )}
            </div>
        </div>
    );
}
