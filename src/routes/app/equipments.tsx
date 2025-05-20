import ErrorPage from "@/components/ErrorPage";
import PendingPage from "@/components/PendingPage";
import { EquipmentDataTable } from "@/components/equipment-inventory/equipmentDataTable";
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
import type { Equipment, UserDTO, UserRole } from "@/lib/types";
import { useMutation, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import {
    createFileRoute,
    redirect,
    useRouteContext,
} from "@tanstack/react-router";
import {
    AlertTriangle,
    CheckCircle,
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
        const userRoles = context.authState?.roles || [];
        const isAuthorized = allowedRoles.some((role) =>
            userRoles.includes(role as UserRole),
        );

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
    },
});

function EquipmentInventory() {
    const { queryClient } = useRouteContext({
        from: "/app/equipments",
    });
    const { data: currentUser } = useCurrentUser();
    const role = currentUser?.roles;

    const isPrivilegedUser = useMemo(() => {
        if (!role) return false;
        return ["SUPER_ADMIN", "EQUIPMENT_OWNER", "MSDO", "OPC"].some((r) =>
            role.includes(r as UserRole),
        );
    }, [role]);

    const [isAddEquipmentOpen, setIsAddEquipmentOpen] = useState(false);
    const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(
        null,
    );
    const [equipmentToDelete, setEquipmentToDelete] = useState<string | null>(
        null,
    );
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [viewMode, setViewMode] = useState<"table" | "grid" | "reservations">(
        isPrivilegedUser ? "table" : "grid",
    );
    const [addDialogKey, setAddDialogKey] = useState(0);

    const { data: equipment = [] } = useSuspenseQuery(
        equipmentsQueryOptions(currentUser),
    );

    const { data: allUsers = [] } = useQuery({
        ...usersQueryOptions,
        enabled: role?.includes("SUPER_ADMIN"),
    });

    const equipmentOwners = useMemo(
        () =>
            role?.includes("SUPER_ADMIN")
                ? allUsers.filter((user: UserDTO) =>
                      user.roles.includes("EQUIPMENT_OWNER"),
                  )
                : [],
        [role, allUsers],
    );

    const addMutation = useMutation({
        mutationFn: addEquipment,
        onSuccess: () => {
            toast.success("Equipment added successfully.");
            queryClient.invalidateQueries({
                queryKey: equipmentsQueryOptions(currentUser).queryKey,
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
                queryKey: equipmentsQueryOptions(currentUser).queryKey,
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
            return Promise.resolve(undefined);
        },
        onSuccess: () => {
            toast.success("Equipment deleted successfully.");
            queryClient.invalidateQueries({
                queryKey: equipmentsQueryOptions(currentUser).queryKey,
            });
            setIsDeleteDialogOpen(false);
            setEquipmentToDelete(null);
        },
        onError: () => {
            toast.error("Failed to delete equipment");
            setIsDeleteDialogOpen(false);
            setEquipmentToDelete(null);
        },
    });

    const handleEditEquipment = useCallback((equipmentData: Equipment) => {
        setEditingEquipment(equipmentData);
        setIsAddEquipmentOpen(true);
    }, []);

    const confirmDelete = () => {
        if (!currentUser) return;

        if (equipmentToDelete) {
            deleteMutation.mutate({
                equipmentId: equipmentToDelete,
                userId: currentUser.publicId,
            });
        }
    };

    const handleFormSubmit = (data: EquipmentDTOInput) => {
        if (!currentUser) {
            toast.error("User not found. Cannot submit form.");
            return;
        }

        const imageFile = data.image instanceof File ? data.image : null;

        if (editingEquipment) {
            editMutation.mutate({
                equipmentId: editingEquipment.publicId,
                userId: currentUser.publicId,
                equipmentData: {
                    name: data.name,
                    brand: data.brand,
                    availability: data.availability,
                    quantity: data.quantity,
                    status: data.status,
                    serialNo: data.serialNo,
                    ownerId: data.ownerId,
                },
                imageFile: imageFile,
            });
        } else {
            if (!imageFile && !editingEquipment) {
                toast.error("Image file is required to add new equipment.");
                return;
            }
            addMutation.mutate({
                userId: currentUser.publicId,
                equipmentData: {
                    name: data.name,
                    brand: data.brand,
                    availability: data.availability,
                    quantity: data.quantity,
                    status: data.status,
                    serialNo: data.serialNo,
                    ownerId: data.ownerId,
                },
                imageFile: imageFile as File,
            });
        }
    };

    const filteredEquipment = useMemo(() => {
        return equipment;
    }, [equipment]);

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

    const isMutating =
        addMutation.isPending ||
        editMutation.isPending ||
        deleteMutation.isPending;

    return (
        <div className="bg-background">
            <div className="flex flex-col flex-1 overflow-hidden">
                <header className="flex items-center justify-between border-b px-6 py-3.5 h-16">
                    <h1 className="text-xl font-semibold">Equipments</h1>
                    <div className="flex items-center gap-2">
                        {isPrivilegedUser && (
                            <Button
                                onClick={() => {
                                    setEditingEquipment(null);
                                    setIsAddEquipmentOpen(true);
                                    setAddDialogKey((prevKey) => prevKey + 1);
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

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 p-6">
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

                <div className="flex items-center justify-between border-b px-6 py-2">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
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
                    </div>
                </div>

                <div className="flex-1 overflow-auto p-6">
                    {viewMode === "table" && isPrivilegedUser && (
                        <EquipmentDataTable
                            data={filteredEquipment}
                            isPrivilegedUser={isPrivilegedUser}
                            currentUser={currentUser}
                            handleEditEquipment={handleEditEquipment}
                            setEquipmentToDelete={setEquipmentToDelete}
                            setIsDeleteDialogOpen={setIsDeleteDialogOpen}
                            isEditMutating={editMutation.isPending}
                            isDeleteMutating={deleteMutation.isPending}
                            deleteMutationVariables={deleteMutation.variables}
                        />
                    )}

                    {viewMode === "grid" && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {filteredEquipment.map((item) => {
                                const imageUrl = item.imagePath;
                                const canManage =
                                    role?.includes("SUPER_ADMIN") ||
                                    (["EQUIPMENT_OWNER", "MSDO", "OPC"].some(
                                        (r) => role?.includes(r as UserRole),
                                    ) &&
                                        item.equipmentOwner?.publicId ===
                                            currentUser?.publicId);
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
                                                <Badge
                                                    className={`capitalize ${item.status === "NEW" ? "bg-green-500/10 text-green-500" : item.status === "MAINTENANCE" ? "bg-yellow-500/10 text-yellow-500" : "bg-red-500/10 text-red-500"}`}
                                                >
                                                    {item.status
                                                        .replace("_", " ")
                                                        .toLowerCase()}
                                                </Badge>
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
                                            {role?.includes("SUPER_ADMIN") &&
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

                    {viewMode === "reservations" &&
                        !role?.includes("SUPER_ADMIN") &&
                        !role?.includes("EQUIPMENT_OWNER") && (
                            <div>
                                <UserReservations />
                            </div>
                        )}
                </div>

                {isPrivilegedUser && role && (
                    <EquipmentFormDialog
                        key={
                            editingEquipment
                                ? editingEquipment.publicId
                                : `add-dialog-${addDialogKey}`
                        }
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
                        currentUserRoles={role}
                        equipmentOwners={equipmentOwners}
                    />
                )}

                {isPrivilegedUser && (
                    <DeleteConfirmDialog
                        isOpen={isDeleteDialogOpen}
                        onClose={() => {
                            setIsDeleteDialogOpen(false);
                            setEquipmentToDelete(null);
                        }}
                        onConfirm={confirmDelete}
                        isLoading={deleteMutation.isPending}
                        title={
                            equipmentToDelete
                                ? "Delete Equipment"
                                : "Delete Selected Equipment"
                        }
                        description={
                            equipmentToDelete
                                ? "Are you sure you want to permanently delete this equipment?"
                                : "Are you sure you want to permanently delete the selected equipment items?"
                        }
                    />
                )}
            </div>
        </div>
    );
}
