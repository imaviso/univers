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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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
    allVenueOwnerReservationsQueryOptions,
    useApproveReservationMutation,
    useRejectReservationMutation,
    venuesQueryOptions,
} from "@/lib/query";
import type { Venue, VenueReservationDTO } from "@/lib/types";
import { formatDateTime, getStatusBadgeClass } from "@/lib/utils";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
    Link,
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
import { format } from "date-fns";
import {
    ArrowUpDown,
    Calendar,
    Check,
    CheckCircle2,
    ChevronDown,
    Download,
    Eye,
    Filter,
    MoreHorizontal,
    Search,
    X,
    XCircle,
} from "lucide-react";
import React, { useMemo, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/venue-approval/approval")({
    component: VenueReservationApproval,
    beforeLoad: async ({ location, context }) => {
        const navigationItem = allNavigation.find(
            (item) => item.href === location.pathname,
        );
        const allowedRoles: string[] = navigationItem
            ? navigationItem.roles
            : [];
        if (!context.authState) {
            throw redirect({ to: "/login", replace: true });
        }
        const isAuthorized = allowedRoles.includes(context.authState.role);
        if (!isAuthorized) {
            throw redirect({
                to: "/app/dashboard",
                replace: true,
            });
        }
    },
    loader: ({ context: { queryClient } }) => {
        return Promise.all([
            queryClient.ensureQueryData(allVenueOwnerReservationsQueryOptions),
            queryClient.ensureQueryData(venuesQueryOptions),
        ]);
    },
});

type ViewMode = "all" | "pending" | "approved" | "rejected";

type SingleActionInfo = {
    id: number | null;
    type: "approve" | "reject" | null;
};

export function VenueReservationApproval() {
    // ... hooks and state ...
    const navigate = useNavigate();
    const context = useRouteContext({ from: "/app/venue-approval/approval" });
    const currentUserId = context.authState?.id;

    const { data: fetchedReservations } = useSuspenseQuery(
        allVenueOwnerReservationsQueryOptions,
    );
    const { data: venues } = useSuspenseQuery(venuesQueryOptions);

    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const [venueFilter, setVenueFilter] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>("pending");

    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnVisibility, setColumnVisibility] =
        React.useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = React.useState<RowSelectionState>(
        {},
    );

    // --- Dialog States ---
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
    // --- End Dialog States ---

    const approveMutation = useApproveReservationMutation();
    const rejectMutation = useRejectReservationMutation();

    // ... preFilteredReservations memo ...
    const preFilteredReservations = useMemo(() => {
        return (fetchedReservations ?? []).filter(
            (reservation: VenueReservationDTO) => {
                const matchesStatus = statusFilter
                    ? reservation.status.toLowerCase() ===
                      statusFilter.toLowerCase()
                    : true;
                const matchesVenue = venueFilter
                    ? reservation.venueId.toString() === venueFilter
                    : true;
                const matchesViewMode =
                    viewMode === "all"
                        ? true
                        : viewMode === "pending"
                          ? reservation.status.toLowerCase() === "pending"
                          : viewMode === "approved"
                            ? reservation.status.toLowerCase() === "approved"
                            : viewMode === "rejected"
                              ? reservation.status.toLowerCase() ===
                                    "rejected" ||
                                reservation.status.toLowerCase() === "cancelled"
                              : true;
                return matchesStatus && matchesVenue && matchesViewMode;
            },
        );
    }, [fetchedReservations, statusFilter, venueFilter, viewMode]);

    // ... handleViewDetails, handleNavigateToVenue ...
    const handleViewDetails = React.useCallback(
        (reservationId: number) => {
            navigate({ to: `/app/venue-approval/${reservationId}` });
        },
        [navigate],
    );
    const handleNavigateToVenue = React.useCallback(
        (venueId: number | undefined) => {
            if (venueId === undefined) return;
            navigate({ from: Route.fullPath, to: `/app/venues/${venueId}` });
        },
        [navigate],
    );

    // --- Single Action Dialog Triggers ---
    const openSingleApproveDialog = React.useCallback(
        (reservationId: number) => {
            setSingleActionInfo({ id: reservationId, type: "approve" });
            setSingleActionRemarks(""); // Reset remarks
        },
        [],
    ); // State setters are stable

    const openSingleRejectDialog = React.useCallback(
        (reservationId: number) => {
            setSingleActionInfo({ id: reservationId, type: "reject" });
            setSingleActionRemarks(""); // Reset remarks
        },
        [],
    ); // State setters are stable

    const closeSingleActionDialog = () => {
        setSingleActionInfo({ id: null, type: null });
        setSingleActionRemarks("");
    };
    // --- End Single Action Dialog Triggers ---

    // --- Dialog Confirmation Handlers ---
    const confirmSingleApprove = () => {
        if (singleActionInfo.type !== "approve" || singleActionInfo.id === null)
            return;

        approveMutation.mutate(
            {
                reservationId: singleActionInfo.id,
                remarks: singleActionRemarks, // Use remarks from state
            },
            {
                onSuccess: (message) => {
                    toast.success(message || "Reservation approved.");
                    setRowSelection({});
                    closeSingleActionDialog(); // Close dialog on success
                },
                onError: (error) => {
                    toast.error(error.message || "Failed to approve.");
                    // Optionally keep dialog open on error?
                },
            },
        );
    };

    const confirmSingleReject = () => {
        if (singleActionInfo.type !== "reject" || singleActionInfo.id === null)
            return;
        if (!singleActionRemarks.trim()) {
            toast.warning("Please provide a reason for rejection.");
            return; // Keep dialog open
        }

        rejectMutation.mutate(
            {
                reservationId: singleActionInfo.id,
                remarks: singleActionRemarks, // Use remarks from state
            },
            {
                onSuccess: (message) => {
                    toast.success(message || "Reservation rejected.");
                    setRowSelection({});
                    closeSingleActionDialog(); // Close dialog on success
                },
                onError: (error) => {
                    toast.error(error.message || "Failed to reject.");
                    // Optionally keep dialog open on error?
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
                    (approval) => approval.userId.toString() === currentUserId,
                );
            return isPending && !hasCurrentUserActed;
        });
        const selectedIds = eligibleRows.map((row) => row.original.id);

        if (selectedIds.length === 0) {
            toast.info("No eligible reservations selected for approval.");
            setIsBulkApproveDialogOpen(false); // Close dialog if none eligible
            setBulkApproveRemarks("");
            return;
        }

        const promises = selectedIds.map((id) =>
            approveMutation.mutateAsync({
                reservationId: id,
                remarks: bulkApproveRemarks, // Use remarks from state
            }),
        );

        toast.promise(Promise.all(promises), {
            loading: `Approving ${selectedIds.length} reservation(s)...`,
            success: () => {
                setRowSelection({});
                setIsBulkApproveDialogOpen(false); // Close dialog
                setBulkApproveRemarks(""); // Reset remarks
                return `${selectedIds.length} reservation(s) approved.`;
            },
            error: (err) => {
                // Keep dialog open on error?
                return `Failed to approve some reservations: ${err instanceof Error ? err.message : "Unknown error"}`;
            },
        });
    };

    const confirmBulkReject = () => {
        // Renamed from handleBulkReject
        const selectedRows = table.getFilteredSelectedRowModel().rows;
        const eligibleRows = selectedRows.filter((row) => {
            const reservation = row.original;
            const isPending = reservation.status === "PENDING";
            const hasCurrentUserActed =
                currentUserId != null &&
                reservation.approvals?.some(
                    (approval) => approval.userId.toString() === currentUserId,
                );
            return isPending && !hasCurrentUserActed;
        });
        const selectedIds = eligibleRows.map((row) => row.original.id);

        if (selectedIds.length === 0) {
            toast.info("No eligible reservations selected for rejection.");
            setIsBulkRejectDialogOpen(false); // Close dialog if none eligible
            setBulkRejectionRemarks("");
            return;
        }
        if (!bulkRejectionRemarks.trim()) {
            toast.warning("Please provide a reason for rejection.");
            return; // Keep dialog open
        }

        const promises = selectedIds.map((id) =>
            rejectMutation.mutateAsync({
                reservationId: id,
                remarks: bulkRejectionRemarks, // Use remarks from state
            }),
        );

        toast.promise(Promise.all(promises), {
            loading: `Rejecting ${selectedIds.length} reservation(s)...`,
            success: () => {
                setRowSelection({});
                setIsBulkRejectDialogOpen(false); // Close dialog
                setBulkRejectionRemarks(""); // Reset remarks
                return `${selectedIds.length} reservation(s) rejected.`;
            },
            error: (err) => {
                // Keep dialog open on error?
                return `Failed to reject some reservations: ${err instanceof Error ? err.message : "Unknown error"}`;
            },
        });
    };
    // --- End Dialog Confirmation Handlers ---

    const columns = useMemo<ColumnDef<VenueReservationDTO>[]>(
        () => [
            // ... select column ...
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
            // ... other columns ...
            {
                accessorKey: "venueName",
                header: ({ column }) => (
                    <Button
                        variant="ghost"
                        onClick={() =>
                            column.toggleSorting(column.getIsSorted() === "asc")
                        }
                    >
                        Venue
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                ),
                cell: ({ row }) => {
                    const reservation = row.original;
                    return (
                        <Button
                            variant="link"
                            className="p-0 h-auto font-medium"
                            onClick={() =>
                                handleNavigateToVenue(reservation.venueId)
                            }
                        >
                            {reservation.venueName}
                        </Button>
                    );
                },
            },
            {
                accessorKey: "departmentName",
                header: "Department",
                cell: ({ row }) => row.original.departmentName ?? "N/A",
            },
            {
                accessorKey: "startTime",
                header: "Date",
                cell: ({ row }) =>
                    format(row.original.startTime, "MMM d, yyyy"),
            },
            {
                id: "timeRange",
                header: "Time",
                cell: ({ row }) =>
                    `${format(row.original.startTime, "h:mm a")} - ${format(row.original.endTime, "h:mm a")}`,
            },
            {
                id: "requesterName",
                accessorFn: (row) =>
                    `${row.requestingUser?.firstName ?? ""} ${row.requestingUser?.lastName ?? ""}`.trim() ||
                    "N/A",
                header: "Requester",
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
                                      approval.userId.toString() ===
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
                cell: ({ row }) =>
                    format(row.original.createdAt, "MMM d, yyyy"),
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
                                      approval.userId.toString() ===
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
                                            handleViewDetails(reservation.id)
                                        }
                                    >
                                        <Eye className="mr-2 h-4 w-4" />
                                        View Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() =>
                                            handleNavigateToVenue(
                                                reservation.venueId,
                                            )
                                        }
                                    >
                                        <Calendar className="mr-2 h-4 w-4" />
                                        View Venue
                                    </DropdownMenuItem>
                                    {showApprovalActions && (
                                        <>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                // onClick={() => handleApproveSingle(reservation.id)} // Old direct action
                                                onClick={() =>
                                                    openSingleApproveDialog(
                                                        reservation.id,
                                                    )
                                                } // Open dialog instead
                                                disabled={
                                                    approveMutation.isPending ||
                                                    rejectMutation.isPending
                                                }
                                            >
                                                <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                                                Approve
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                // onClick={() => handleRejectSingle(reservation.id)} // Old direct action
                                                onClick={() =>
                                                    openSingleRejectDialog(
                                                        reservation.id,
                                                    )
                                                } // Open dialog instead
                                                disabled={
                                                    approveMutation.isPending ||
                                                    rejectMutation.isPending
                                                }
                                                className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                            >
                                                <X className="mr-2 h-4 w-4" />
                                                Reject
                                            </DropdownMenuItem>
                                        </>
                                    )}
                                    {hasCurrentUserActed && (
                                        <>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                disabled
                                                className="text-muted-foreground italic"
                                            >
                                                {currentUserApproval?.status ===
                                                "APPROVED" ? (
                                                    <Check className="mr-2 h-4 w-4 text-green-600" />
                                                ) : (
                                                    <XCircle className="mr-2 h-4 w-4 text-red-600" />
                                                )}
                                                You have already{" "}
                                                {currentUserApproval?.status.toLowerCase()}{" "}
                                                this
                                            </DropdownMenuItem>
                                        </>
                                    )}
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
            approveMutation.isPending,
            rejectMutation.isPending,
            currentUserId,
            handleNavigateToVenue,
            openSingleApproveDialog,
            handleViewDetails,
            openSingleRejectDialog,
        ],
    );

    // ... table instance ...
    const table = useReactTable({
        data: preFilteredReservations,
        columns,
        state: {
            sorting,
            columnVisibility,
            rowSelection,
            globalFilter: searchQuery,
        },
        enableRowSelection: true,
        onRowSelectionChange: setRowSelection,
        onSortingChange: setSorting,
        onColumnVisibilityChange: setColumnVisibility,
        onGlobalFilterChange: setSearchQuery,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getRowId: (row) => row.id.toString(),
    });

    // ... stats memo ...
    const stats = useMemo(() => {
        const allReservations = fetchedReservations ?? [];
        return {
            total: allReservations.length,
            pending: allReservations.filter(
                (r) => r.status.toLowerCase() === "pending",
            ).length,
            approved: allReservations.filter(
                (r) => r.status.toLowerCase() === "approved",
            ).length,
            rejected: allReservations.filter(
                (r) =>
                    r.status.toLowerCase() === "rejected" ||
                    r.status.toLowerCase() === "cancelled",
            ).length,
        };
    }, [fetchedReservations]);

    // ... numSelected, numEligibleSelected ...
    const numSelected = table.getFilteredSelectedRowModel().rows.length;
    const numEligibleSelected = table
        .getFilteredSelectedRowModel()
        .rows.filter((row) => {
            const reservation = row.original;
            const isPending = reservation.status === "PENDING";
            const hasCurrentUserActed =
                currentUserId != null &&
                reservation.approvals?.some(
                    (approval) => approval.userId.toString() === currentUserId,
                );
            return isPending && !hasCurrentUserActed;
        }).length;

    // ... return JSX ...
    return (
        <div className="bg-background">
            <div className="flex flex-col flex-1 overflow-hidden">
                {/* Header */}
                <header className="flex items-center justify-between border-b px-6 py-3.5">
                    {/* ... header content ... */}
                    <h1 className="text-xl font-semibold">
                        Venue Reservation Approval
                    </h1>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search reservations..."
                                className="w-64 pl-8"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </header>

                {/* Stats Cards */}
                <div className="grid grid-cols-4 gap-4 p-6 pb-0">
                    {/* ... stats cards ... */}
                    <Card
                        className="hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => setViewMode("all")}
                    >
                        <CardHeader>
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
                        className="hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => setViewMode("pending")}
                    >
                        <CardHeader>
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
                        className="hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => setViewMode("approved")}
                    >
                        <CardHeader>
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
                        className="hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => setViewMode("rejected")}
                    >
                        <CardHeader>
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

                {/* Filters and Actions Bar */}
                <div className="flex items-center justify-between border-b px-6 py-2">
                    {/* ... tabs and bulk actions ... */}
                    <div className="flex items-center gap-2">
                        <Tabs
                            value={viewMode}
                            onValueChange={(value) =>
                                setViewMode(value as ViewMode)
                            }
                        >
                            <TabsList>
                                <TabsTrigger value="all">All</TabsTrigger>
                                <TabsTrigger value="pending">
                                    Pending
                                </TabsTrigger>
                                <TabsTrigger value="approved">
                                    Approved
                                </TabsTrigger>
                                <TabsTrigger value="rejected">
                                    Rejected/Cancelled
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                        {numEligibleSelected > 0 && (
                            <div className="flex items-center gap-2 border-l pl-2 ml-2">
                                <span className="text-sm text-muted-foreground">
                                    {numEligibleSelected} eligible selected
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-1"
                                    // onClick={handleBulkApprove} // Old direct action
                                    onClick={() =>
                                        setIsBulkApproveDialogOpen(true)
                                    } // Open dialog
                                    disabled={
                                        approveMutation.isPending ||
                                        rejectMutation.isPending
                                    }
                                >
                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                    Approve
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-1 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/50 hover:border-destructive/50"
                                    onClick={() =>
                                        setIsBulkRejectDialogOpen(true)
                                    }
                                    disabled={
                                        approveMutation.isPending ||
                                        rejectMutation.isPending
                                    }
                                >
                                    <X className="h-4 w-4" />
                                    Reject
                                </Button>
                            </div>
                        )}
                        {numSelected > 0 &&
                            numSelected !== numEligibleSelected && (
                                <div className="flex items-center gap-2 border-l pl-2 ml-2">
                                    <span className="text-sm text-muted-foreground">
                                        ({numSelected} total selected)
                                    </span>
                                </div>
                            )}
                    </div>
                    {/* ... filters and column toggle ... */}
                    <div className="flex items-center gap-2">
                        <Select
                            value={venueFilter || "all"}
                            onValueChange={(value) =>
                                setVenueFilter(value === "all" ? null : value)
                            }
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filter by venue" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Venues</SelectItem>
                                {(venues ?? []).map((venue) => (
                                    <SelectItem
                                        key={venue.id}
                                        value={venue.id.toString()}
                                    >
                                        {venue.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="ml-auto"
                                    size="sm"
                                >
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
                                                {typeof column.columnDef
                                                    .header === "string"
                                                    ? column.columnDef.header
                                                    : column.id === "yourAction"
                                                      ? "Your Action"
                                                      : column.id}
                                            </DropdownMenuCheckboxItem>
                                        );
                                    })}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Button variant="outline" size="sm" className="gap-1">
                            <Download className="h-4 w-4" />
                            Export
                        </Button>
                    </div>
                </div>

                {/* Table */}
                <div className="flex-1 overflow-auto p-6">
                    <div className="rounded-md border">
                        <Table>
                            {/* ... table header ... */}
                            <TableHeader>
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <TableRow key={headerGroup.id}>
                                        {headerGroup.headers.map((header) => {
                                            return (
                                                <TableHead key={header.id}>
                                                    {header.isPlaceholder
                                                        ? null
                                                        : flexRender(
                                                              header.column
                                                                  .columnDef
                                                                  .header,
                                                              header.getContext(),
                                                          )}
                                                </TableHead>
                                            );
                                        })}
                                    </TableRow>
                                ))}
                            </TableHeader>
                            {/* ... table body ... */}
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
                                                    <TableCell key={cell.id}>
                                                        {flexRender(
                                                            cell.column
                                                                .columnDef.cell,
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
                                            {searchQuery
                                                ? `No reservations match your search query "${searchQuery}".`
                                                : "No reservations found for the selected filters."}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                    {/* Pagination and Selected Count */}
                    <div className="flex items-center justify-between space-x-2 py-4">
                        <div className="flex-1 text-sm text-muted-foreground">
                            {numSelected} of{" "}
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

            {/* Single Action Dialog (Approve/Reject) */}
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
                                ? "You can optionally add remarks for this approval."
                                : "Please provide a reason for rejection. This note will be recorded."}
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
                                    : "Confirm Approval"}
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
                                    : "Confirm Rejection"}
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
                            Optionally add remarks for approving the selected{" "}
                            {numEligibleSelected} eligible reservation(s). This
                            note will be recorded for all of them.
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
                                : `Confirm Approval (${numEligibleSelected})`}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Bulk Rejection Dialog */}
            <Dialog
                open={isBulkRejectDialogOpen}
                onOpenChange={setIsBulkRejectDialogOpen}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Selected Reservations</DialogTitle>
                        <DialogDescription>
                            Provide a reason for rejecting the selected{" "}
                            {numEligibleSelected} eligible reservation(s). This
                            note will be recorded for all of them.
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
                            onClick={confirmBulkReject} // Use the confirmation handler
                            disabled={
                                !bulkRejectionRemarks.trim() ||
                                rejectMutation.isPending ||
                                numEligibleSelected === 0
                            }
                        >
                            {rejectMutation.isPending
                                ? "Rejecting..."
                                : `Confirm Rejection (${numEligibleSelected})`}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* --- End Dialogs --- */}
        </div>
    );
}
