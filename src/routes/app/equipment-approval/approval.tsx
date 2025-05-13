import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { allNavigation } from "@/lib/navigation";
import {
    allEquipmentOwnerReservationsQueryOptions,
    useApproveEquipmentReservationMutation,
    useRejectEquipmentReservationMutation,
} from "@/lib/query";
import type { EquipmentReservationDTO, UserRole } from "@/lib/types";
import { formatDateTime, getStatusBadgeClass } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import {
    createFileRoute,
    redirect,
    useNavigate,
    useRouteContext,
} from "@tanstack/react-router";
import {
    type ColumnDef,
    type RowSelectionState,
    type SortingState,
    type VisibilityState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table";
import {
    ArrowUpDown,
    Check,
    ChevronDown,
    Eye,
    MoreHorizontal,
    Search,
    X,
    XCircle,
} from "lucide-react";
import React, { useMemo, useState, useEffect } from "react";
import { toast } from "sonner";

// Custom hook for persistent state
function usePersistentState<T>(
    key: string,
    initialValue: T,
): [T, (value: T | ((prevState: T) => T)) => void] {
    const [state, setState] = useState<T>(() => {
        try {
            const storedValue = localStorage.getItem(key);
            if (storedValue) {
                return JSON.parse(storedValue);
            }
            return initialValue;
        } catch (error) {
            console.error(
                "Error reading from localStorage for key:",
                key,
                error,
            );
            return initialValue;
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem(key, JSON.stringify(state));
        } catch (error) {
            console.error("Error writing to localStorage for key:", key, error);
        }
    }, [key, state]);

    return [state, setState];
}

export const Route = createFileRoute("/app/equipment-approval/approval")({
    component: EquipmentReservationApproval,
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
            toast.error("You are not authorized to view this page.");
            throw redirect({
                to: "/app",
            });
        }
    },
    loader: ({ context }) => {
        context.queryClient.ensureQueryData(
            allEquipmentOwnerReservationsQueryOptions,
        );
    },
});

type ViewMode = "all" | "pending" | "approved" | "rejected";

type SingleActionInfo = {
    id: string | null;
    type: "approve" | "reject" | null;
};

export function EquipmentReservationApproval() {
    const navigate = useNavigate();
    const { authState } = useRouteContext({ from: "/app" });
    const currentUserRole = authState?.role as UserRole | undefined;
    const currentUserId = authState?.publicId;

    const [viewMode, setViewMode] = usePersistentState<ViewMode>(
        "equipmentApprovalViewMode_v1",
        "pending",
    );

    const [sorting, setSorting] = usePersistentState<SortingState>(
        "equipmentApprovalTableSorting_v1",
        [],
    );
    const [columnVisibility, setColumnVisibility] =
        usePersistentState<VisibilityState>(
            "equipmentApprovalTableColumnVisibility_v1",
            {},
        );
    const [rowSelection, setRowSelection] = React.useState<RowSelectionState>(
        {},
    );
    const [globalFilter, setGlobalFilter] = usePersistentState<string>(
        "equipmentApprovalGlobalFilter_v1",
        "",
    );

    // Persistent pagination state for the table
    const [pageSize, setPageSize] = usePersistentState<number>(
        "equipmentApprovalTablePageSize_v1",
        10,
    );
    const [pageIndex, setPageIndex] = usePersistentState<number>(
        "equipmentApprovalTablePageIndex_v1",
        0,
    );

    const [singleActionInfo, setSingleActionInfo] = useState<SingleActionInfo>({
        id: null,
        type: null,
    });
    const [singleActionRemarks, setSingleActionRemarks] = useState("");
    const [isBulkApproveDialogOpen, setIsBulkApproveDialogOpen] =
        useState(false);
    const [bulkApproveRemarks, setBulkApproveRemarks] = useState("");
    const [isBulkRejectDialogOpen, setIsBulkRejectDialogOpen] = useState(false);
    const [bulkRejectionRemarks, setBulkRejectionRemarks] = useState("");

    const approveMutation = useApproveEquipmentReservationMutation();
    const rejectMutation = useRejectEquipmentReservationMutation();

    const { data: reservations = [], isLoading } = useQuery(
        allEquipmentOwnerReservationsQueryOptions,
    );

    const preFilteredReservations = useMemo(() => {
        return reservations.filter((reservation) => {
            const matchesViewModeStatus =
                viewMode === "all" ||
                reservation.status.toLowerCase() === viewMode;
            return matchesViewModeStatus;
        });
    }, [reservations, viewMode]);

    const handleViewDetails = React.useCallback(
        (eventId: string | undefined) => {
            if (eventId === undefined) return;
            navigate({ to: `/app/events/${eventId}` });
        },
        [navigate],
    );

    const openSingleApproveDialog = React.useCallback(
        (reservationId: string) => {
            setSingleActionInfo({ id: reservationId, type: "approve" });
            setSingleActionRemarks("");
        },
        [],
    );

    const openSingleRejectDialog = React.useCallback(
        (reservationId: string) => {
            setSingleActionInfo({ id: reservationId, type: "reject" });
            setSingleActionRemarks("");
        },
        [],
    );

    const closeSingleActionDialog = () => {
        setSingleActionInfo({ id: null, type: null });
        setSingleActionRemarks("");
    };

    const confirmSingleApprove = () => {
        if (singleActionInfo.type !== "approve" || singleActionInfo.id === null)
            return;

        approveMutation.mutate(
            {
                reservationPublicId: singleActionInfo.id,
                remarks: singleActionRemarks,
            },
            {
                onSuccess: () => {
                    toast.success("Reservation approved.");
                    setRowSelection({});
                    closeSingleActionDialog();
                },
                onError: () => {
                    toast.error("Failed to approve.");
                },
            },
        );
    };

    const confirmSingleReject = () => {
        if (singleActionInfo.type !== "reject" || singleActionInfo.id === null)
            return;
        if (!singleActionRemarks.trim()) {
            toast.warning("Please provide a reason for rejection.");
            return;
        }

        rejectMutation.mutate(
            {
                reservationPublicId: singleActionInfo.id,
                remarks: singleActionRemarks,
            },
            {
                onSuccess: () => {
                    toast.success("Reservation rejected.");
                    setRowSelection({});
                    closeSingleActionDialog();
                },
                onError: () => {
                    toast.error("Failed to reject.");
                },
            },
        );
    };

    const confirmBulkApprove = () => {
        const selectedRows = table.getFilteredSelectedRowModel().rows;
        const eligibleRows = selectedRows.filter((row) => {
            const reservation = row.original;
            const isPending = reservation.status === "PENDING";
            const hasCurrentUserActed =
                currentUserId != null &&
                reservation.approvals?.some(
                    (approval) =>
                        approval.signedByUser.publicId === currentUserId,
                );
            return isPending && !hasCurrentUserActed;
        });
        const selectedIds = eligibleRows.map((row) => row.original.publicId);

        if (selectedIds.length === 0) {
            toast.info("No eligible reservations selected for approval.");
            setIsBulkApproveDialogOpen(false);
            setBulkApproveRemarks("");
            return;
        }

        const promises = selectedIds.map((id) =>
            approveMutation.mutateAsync({
                reservationPublicId: id,
                remarks: bulkApproveRemarks,
            }),
        );

        toast.promise(Promise.all(promises), {
            loading: `Approving ${selectedIds.length} reservation(s)...`,
            success: () => {
                setRowSelection({});
                setIsBulkApproveDialogOpen(false);
                setBulkApproveRemarks("");
                return `${selectedIds.length} reservation(s) approved.`;
            },
            error: (err) => {
                return `Failed to approve some reservations: ${err instanceof Error ? err.message : "Unknown error"}`;
            },
        });
    };

    const confirmBulkReject = () => {
        const selectedRows = table.getFilteredSelectedRowModel().rows;
        const eligibleRows = selectedRows.filter((row) => {
            const reservation = row.original;
            const isPending = reservation.status === "PENDING";
            const hasCurrentUserActed =
                currentUserId != null &&
                reservation.approvals?.some(
                    (approval) =>
                        approval.signedByUser.publicId === currentUserId,
                );
            return isPending && !hasCurrentUserActed;
        });
        const selectedIds = eligibleRows.map((row) => row.original.publicId);

        if (selectedIds.length === 0) {
            toast.info("No eligible reservations selected for rejection.");
            setIsBulkRejectDialogOpen(false);
            setBulkRejectionRemarks("");
            return;
        }
        if (!bulkRejectionRemarks.trim()) {
            toast.warning("Please provide a reason for rejection.");
            return;
        }

        const promises = selectedIds.map((id) =>
            rejectMutation.mutateAsync({
                reservationPublicId: id,
                remarks: bulkRejectionRemarks,
            }),
        );

        toast.promise(Promise.all(promises), {
            loading: `Rejecting ${selectedIds.length} reservation(s)...`,
            success: () => {
                setRowSelection({});
                setIsBulkRejectDialogOpen(false);
                setBulkRejectionRemarks("");
                return `${selectedIds.length} reservation(s) rejected.`;
            },
            error: (err) => {
                return `Failed to reject some reservations: ${err instanceof Error ? err.message : "Unknown error"}`;
            },
        });
    };
    // --- End Dialog Confirmation Handlers ---

    // --- Table Columns Definition ---
    const columns = useMemo<ColumnDef<EquipmentReservationDTO>[]>(
        () => [
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
                        className="translate-y-[2px]"
                    />
                ),
                cell: ({ row }) => (
                    <Checkbox
                        checked={row.getIsSelected()}
                        onCheckedChange={(value) => row.toggleSelected(!!value)}
                        aria-label="Select row"
                        className="translate-y-[2px]"
                    />
                ),
                enableSorting: false,
                enableHiding: false,
            },
            {
                accessorKey: "eventName",
                header: "Event",
                cell: ({ row }) => (
                    <Button
                        variant="link"
                        className="p-0 h-auto font-medium"
                        onClick={() =>
                            handleViewDetails(row.original.event.publicId)
                        }
                    >
                        {row.original.event.eventName ?? "N/A"}
                    </Button>
                ),
            },
            {
                accessorKey: "equipmentName",
                header: "Equipment",
                cell: ({ row }) => row.original.equipment.name ?? "N/A",
            },
            {
                accessorKey: "quantity",
                header: "Qty",
            },
            {
                id: "requesterName",
                header: "Requester",
                accessorFn: (row) =>
                    `${row.requestingUser?.firstName ?? ""} ${row.requestingUser?.lastName ?? ""}`.trim() ||
                    "N/A",
            },
            {
                accessorKey: "departmentName",
                header: "Department",
                cell: ({ row }) => row.original.department.name ?? "N/A",
            },
            {
                accessorKey: "startTime",
                header: ({ column }) => (
                    <Button
                        variant="ghost"
                        onClick={() =>
                            column.toggleSorting(column.getIsSorted() === "asc")
                        }
                    >
                        Start Time
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                ),
                cell: ({ row }) => formatDateTime(row.original.startTime),
            },
            {
                accessorKey: "endTime",
                header: "End Time",
                cell: ({ row }) => formatDateTime(row.original.endTime),
            },
            {
                accessorKey: "status",
                header: "Status",
                cell: ({ row }) => (
                    <Badge className={getStatusBadgeClass(row.original.status)}>
                        {row.original.status}
                    </Badge>
                ),
            },
            {
                id: "yourAction",
                header: "Your Action",
                cell: ({ row }) => {
                    const reservation = row.original;
                    const currentUserApproval =
                        currentUserId != null
                            ? reservation.approvals?.find(
                                  (approval) =>
                                      approval.signedByUser.publicId ===
                                      currentUserId,
                              )
                            : undefined;

                    if (!currentUserApproval) {
                        return <span className="text-muted-foreground">-</span>;
                    }
                    if (currentUserApproval.status === "APPROVED") {
                        return (
                            <div className="flex items-center justify-center text-green-600">
                                <Check className="h-4 w-4" />
                                <span className="sr-only">Approved by you</span>
                            </div>
                        );
                    }
                    if (currentUserApproval.status === "REJECTED") {
                        return (
                            <div className="flex items-center justify-center text-red-600">
                                <XCircle className="h-4 w-4" />
                                <span className="sr-only">Rejected by you</span>
                            </div>
                        );
                    }
                    return <span className="text-muted-foreground">-</span>;
                },
                enableSorting: false,
            },
            {
                accessorKey: "createdAt",
                header: ({ column }) => (
                    <Button
                        variant="ghost"
                        onClick={() =>
                            column.toggleSorting(column.getIsSorted() === "asc")
                        }
                    >
                        Submitted
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                ),
                cell: ({ row }) => formatDateTime(row.original.createdAt),
            },
            {
                id: "actions",
                header: () => <div className="text-center">Actions</div>,
                cell: ({ row }) => {
                    const reservation = row.original;
                    const isPending = reservation.status === "PENDING";
                    const currentUserApproval =
                        currentUserId != null
                            ? reservation.approvals?.find(
                                  (approval) =>
                                      approval.signedByUser.publicId ===
                                      currentUserId,
                              )
                            : undefined;
                    const hasCurrentUserActed = !!currentUserApproval;
                    const showApprovalActions =
                        isPending && !hasCurrentUserActed;

                    return (
                        <div className="text-center">
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
                                    <DropdownMenuLabel>
                                        Actions
                                    </DropdownMenuLabel>
                                    <DropdownMenuItem
                                        onClick={() =>
                                            handleViewDetails(
                                                reservation.event.publicId,
                                            )
                                        }
                                    >
                                        <Eye className="mr-2 h-4 w-4" />
                                        View Details
                                    </DropdownMenuItem>
                                    {/* Add link to equipment details if applicable */}
                                    {/* <DropdownMenuItem onClick={() => handleViewEquipment(reservation.equipmentId)}>
                                        <Package className="mr-2 h-4 w-4" />
                                        View Equipment
                                    </DropdownMenuItem> */}
                                    {showApprovalActions && (
                                        <>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                onClick={() =>
                                                    openSingleApproveDialog(
                                                        reservation.publicId,
                                                    )
                                                }
                                                disabled={
                                                    approveMutation.isPending
                                                }
                                            >
                                                <Check className="mr-2 h-4 w-4 text-green-600" />
                                                Approve
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() =>
                                                    openSingleRejectDialog(
                                                        reservation.publicId,
                                                    )
                                                }
                                                disabled={
                                                    rejectMutation.isPending
                                                }
                                                className="text-red-600 focus:text-red-600"
                                            >
                                                <X className="mr-2 h-4 w-4" />
                                                Reject
                                            </DropdownMenuItem>
                                        </>
                                    )}
                                    {/* Add Cancel/Delete actions if needed, based on role/status */}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    );
                },
                enableSorting: false,
                enableHiding: false,
            },
        ],
        [
            currentUserId,
            handleViewDetails,
            openSingleApproveDialog,
            openSingleRejectDialog,
            approveMutation.isPending,
            rejectMutation.isPending,
        ],
    );
    // --- End Table Columns Definition ---

    // --- Table Instance ---
    const table = useReactTable({
        data: preFilteredReservations,
        columns,
        state: {
            sorting,
            columnVisibility,
            rowSelection,
            globalFilter,
        },
        enableRowSelection: true,
        onRowSelectionChange: setRowSelection,
        onSortingChange: setSorting,
        onColumnVisibilityChange: setColumnVisibility,
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getRowId: (row) => row.publicId,
    });

    const stats = useMemo(() => {
        const sourceData = reservations;
        return {
            total: sourceData.length,
            pending: sourceData.filter((r) => r.status === "PENDING").length,
            approved: sourceData.filter((r) => r.status === "APPROVED").length,
            rejected: sourceData.filter(
                (r) => r.status === "REJECTED" || r.status === "CANCELLED",
            ).length,
        };
    }, [reservations]);

    const numSelected = table.getFilteredSelectedRowModel().rows.length;
    const numEligibleSelected = table
        .getFilteredSelectedRowModel()
        .rows.filter((row) => {
            const reservation = row.original;
            const isPending = reservation.status === "PENDING";
            const hasCurrentUserActed =
                currentUserId != null &&
                reservation.approvals?.some(
                    (approval) =>
                        approval.signedByUser.publicId === currentUserId,
                );
            return isPending && !hasCurrentUserActed;
        }).length;
    // --- End Selected Row Counts ---

    // --- Render Logic ---
    if (!currentUserRole) {
        return <div>Loading user...</div>;
    }

    const availableTabs: ViewMode[] =
        currentUserRole === "EQUIPMENT_OWNER" ||
        currentUserRole === "SUPER_ADMIN"
            ? ["pending", "approved", "rejected", "all"]
            : ["all"];

    return (
        <div className="bg-background">
            <div className="flex flex-col flex-1 overflow-hidden">
                <header className="flex items-center justify-between border-b px-6 py-3.5 h-16">
                    <h1 className="text-xl font-semibold">
                        Equipment Reservation Approval
                    </h1>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search reservations..."
                                className="w-64 pl-8"
                                value={globalFilter}
                                onChange={(e) =>
                                    setGlobalFilter(e.target.value)
                                }
                            />
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="ml-auto">
                                    Columns{" "}
                                    <ChevronDown className="ml-2 h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {table
                                    .getAllColumns()
                                    .filter((column) => column.getCanHide())
                                    .map((column) => {
                                        return (
                                            <DropdownMenuCheckboxItem
                                                key={column.id}
                                                className="capitalize"
                                                checked={column.getIsVisible()}
                                                onCheckedChange={(value) =>
                                                    column.toggleVisibility(
                                                        !!value,
                                                    )
                                                }
                                            >
                                                {column.id}
                                            </DropdownMenuCheckboxItem>
                                        );
                                    })}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                {(currentUserRole === "EQUIPMENT_OWNER" ||
                    currentUserRole === "SUPER_ADMIN") && (
                    <div className="grid grid-cols-4 gap-4 p-6 pb-0">
                        <Card
                            className={`hover:shadow-md transition-shadow cursor-pointer ${viewMode === "all" ? "ring-2 ring-primary" : ""}`}
                            onClick={() => setViewMode("all")}
                        >
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Total Reservations
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {stats.total}
                                </div>
                            </CardContent>
                        </Card>
                        <Card
                            className={`hover:shadow-md transition-shadow cursor-pointer ${viewMode === "pending" ? "ring-2 ring-primary" : ""}`}
                            onClick={() => setViewMode("pending")}
                        >
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Pending Approval
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-yellow-500">
                                    {stats.pending}
                                </div>
                            </CardContent>
                        </Card>
                        <Card
                            className={`hover:shadow-md transition-shadow cursor-pointer ${viewMode === "approved" ? "ring-2 ring-primary" : ""}`}
                            onClick={() => setViewMode("approved")}
                        >
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Approved
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-500">
                                    {stats.approved}
                                </div>
                            </CardContent>
                        </Card>
                        <Card
                            className={`hover:shadow-md transition-shadow cursor-pointer ${viewMode === "rejected" ? "ring-2 ring-primary" : ""}`}
                            onClick={() => setViewMode("rejected")}
                        >
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Rejected/Cancelled
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-red-500">
                                    {stats.rejected}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                <div className="flex items-center justify-between border-b px-6 py-2">
                    <div className="flex items-center gap-2">
                        <Tabs
                            value={viewMode}
                            onValueChange={(value) =>
                                setViewMode(value as ViewMode)
                            }
                        >
                            <TabsList>
                                {availableTabs.map((tab) => (
                                    <TabsTrigger
                                        key={tab}
                                        value={tab}
                                        className="capitalize"
                                    >
                                        {tab}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </Tabs>
                        {/* Bulk Actions */}
                        {numEligibleSelected > 0 && (
                            <div className="flex items-center gap-2 border-l pl-2 ml-2">
                                <span className="text-sm text-muted-foreground">
                                    {numEligibleSelected} eligible selected
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        setIsBulkApproveDialogOpen(true)
                                    }
                                    disabled={approveMutation.isPending}
                                >
                                    <Check className="mr-1 h-4 w-4 text-green-600" />
                                    Approve
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        setIsBulkRejectDialogOpen(true)
                                    }
                                    disabled={rejectMutation.isPending}
                                >
                                    <X className="mr-1 h-4 w-4 text-red-600" />
                                    Reject
                                </Button>
                            </div>
                        )}
                        {numSelected > 0 &&
                            numSelected !== numEligibleSelected && (
                                <div className="flex items-center gap-2 border-l pl-2 ml-2">
                                    <span className="text-sm text-muted-foreground">
                                        {numSelected - numEligibleSelected}{" "}
                                        selected item(s) not eligible for
                                        action.
                                    </span>
                                </div>
                            )}
                    </div>
                    {/* Add other filters if needed (e.g., by equipment) */}
                </div>

                {/* Table */}
                <div className="flex-1 overflow-auto p-6">
                    {isLoading ? (
                        <p className="text-center text-muted-foreground">
                            Loading reservations...
                        </p>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    {table
                                        .getHeaderGroups()
                                        .map((headerGroup) => (
                                            <TableRow key={headerGroup.id}>
                                                {headerGroup.headers.map(
                                                    (header) => {
                                                        return (
                                                            <TableHead
                                                                key={header.id}
                                                            >
                                                                {header.isPlaceholder
                                                                    ? null
                                                                    : flexRender(
                                                                          header
                                                                              .column
                                                                              .columnDef
                                                                              .header,
                                                                          header.getContext(),
                                                                      )}
                                                            </TableHead>
                                                        );
                                                    },
                                                )}
                                            </TableRow>
                                        ))}
                                </TableHeader>
                                <TableBody>
                                    {table.getRowModel().rows?.length ? (
                                        table.getRowModel().rows.map((row) => (
                                            <TableRow
                                                key={row.id}
                                                data-state={
                                                    row.getIsSelected() &&
                                                    "selected"
                                                }
                                            >
                                                {row
                                                    .getVisibleCells()
                                                    .map((cell) => (
                                                        <TableCell
                                                            key={cell.id}
                                                        >
                                                            {flexRender(
                                                                cell.column
                                                                    .columnDef
                                                                    .cell,
                                                                cell.getContext(),
                                                            )}
                                                        </TableCell>
                                                    ))}
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell
                                                colSpan={columns.length}
                                                className="h-24 text-center"
                                            >
                                                No results.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                    {/* Pagination */}
                    <div className="flex items-center justify-between space-x-2 py-4">
                        <div className="flex-1 text-sm text-muted-foreground">
                            {table.getFilteredSelectedRowModel().rows.length} of{" "}
                            {table.getFilteredRowModel().rows.length} row(s)
                            selected.
                        </div>
                        <div className="flex items-center space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => table.previousPage()}
                                disabled={!table.getCanPreviousPage()}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => table.nextPage()}
                                disabled={!table.getCanNextPage()}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- Dialogs --- */}
            {/* Single Action Dialog */}
            <Dialog
                open={singleActionInfo.type !== null}
                onOpenChange={(isOpen) => !isOpen && closeSingleActionDialog()}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {singleActionInfo.type === "approve"
                                ? "Approve Reservation"
                                : "Reject Reservation"}
                        </DialogTitle>
                        <DialogDescription>
                            {singleActionInfo.type === "approve"
                                ? "Optionally add remarks for this approval."
                                : "Please provide a reason for rejecting this reservation."}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <Textarea
                            placeholder={
                                singleActionInfo.type === "approve"
                                    ? "Optional remarks..."
                                    : "Enter reason for rejection..."
                            }
                            value={singleActionRemarks}
                            onChange={(e) =>
                                setSingleActionRemarks(e.target.value)
                            }
                            rows={5}
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={closeSingleActionDialog}
                            disabled={
                                approveMutation.isPending ||
                                rejectMutation.isPending
                            }
                        >
                            Cancel
                        </Button>
                        {singleActionInfo.type === "approve" && (
                            <Button
                                onClick={confirmSingleApprove}
                                disabled={approveMutation.isPending}
                            >
                                {approveMutation.isPending
                                    ? "Approving..."
                                    : "Approve"}
                            </Button>
                        )}
                        {singleActionInfo.type === "reject" && (
                            <Button
                                variant="destructive"
                                onClick={confirmSingleReject}
                                disabled={
                                    !singleActionRemarks.trim() ||
                                    rejectMutation.isPending
                                }
                            >
                                {rejectMutation.isPending
                                    ? "Rejecting..."
                                    : "Reject"}
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Bulk Approve Dialog */}
            <Dialog
                open={isBulkApproveDialogOpen}
                onOpenChange={setIsBulkApproveDialogOpen}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Approve Selected Reservations</DialogTitle>
                        <DialogDescription>
                            Optionally add remarks for approving the{" "}
                            {numEligibleSelected} selected eligible
                            reservation(s). This note will be recorded for all
                            of them.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <Textarea
                            placeholder="Optional remarks..."
                            value={bulkApproveRemarks}
                            onChange={(e) =>
                                setBulkApproveRemarks(e.target.value)
                            }
                            rows={5}
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsBulkApproveDialogOpen(false);
                                setBulkApproveRemarks("");
                            }}
                            disabled={approveMutation.isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={confirmBulkApprove}
                            disabled={
                                approveMutation.isPending ||
                                numEligibleSelected === 0
                            }
                        >
                            {approveMutation.isPending
                                ? "Approving..."
                                : `Approve ${numEligibleSelected} Item(s)`}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={isBulkRejectDialogOpen}
                onOpenChange={setIsBulkRejectDialogOpen}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Selected Reservations</DialogTitle>
                        <DialogDescription>
                            Provide a reason for rejecting the{" "}
                            {numEligibleSelected} selected eligible
                            reservation(s). This note will be recorded for all
                            of them.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <Textarea
                            placeholder="Enter reason for rejection..."
                            value={bulkRejectionRemarks}
                            onChange={(e) =>
                                setBulkRejectionRemarks(e.target.value)
                            }
                            rows={5}
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsBulkRejectDialogOpen(false);
                                setBulkRejectionRemarks("");
                            }}
                            disabled={rejectMutation.isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={confirmBulkReject}
                            disabled={
                                !bulkRejectionRemarks.trim() ||
                                rejectMutation.isPending ||
                                numEligibleSelected === 0
                            }
                        >
                            {rejectMutation.isPending
                                ? "Rejecting..."
                                : `Reject ${numEligibleSelected} Item(s)`}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
