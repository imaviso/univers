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
import { approveEvent, rejectEvent } from "@/lib/api";
import { allNavigation } from "@/lib/navigation";
import {
    allVenueOwnerReservationsQueryOptions,
    eventsQueryKeys,
    venuesQueryOptions,
} from "@/lib/query";
import type { VenueReservationDTO } from "@/lib/types";
import { getStatusBadgeClass } from "@/lib/utils";
import {
    useMutation,
    useQueryClient,
    useSuspenseQuery,
} from "@tanstack/react-query";
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
import { format } from "date-fns";
import {
    ArrowUpDown,
    Calendar,
    Check,
    CheckCircle2,
    ChevronDown,
    Download,
    Eye,
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
    reservationId: string | null;
    eventId: string | null;
    type: "approve" | "reject" | null;
};

export function VenueReservationApproval() {
    const navigate = useNavigate();
    const context = useRouteContext({ from: "/app/venue-approval/approval" });
    const currentUserId = context.authState?.publicId;
    const queryClient = useQueryClient();

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

    const [singleActionInfo, setSingleActionInfo] = useState<SingleActionInfo>({
        reservationId: null,
        eventId: null,
        type: null,
    });
    const [singleActionRemarks, setSingleActionRemarks] = useState("");

    const [isBulkApproveDialogOpen, setIsBulkApproveDialogOpen] =
        useState(false);
    const [bulkApproveRemarks, setBulkApproveRemarks] = useState("");
    const [isBulkRejectDialogOpen, setIsBulkRejectDialogOpen] = useState(false);
    const [bulkRejectionRemarks, setBulkRejectionRemarks] = useState("");

    const approveEventMutation = useMutation({
        mutationFn: approveEvent,
        onSuccess: (
            message,
            variables: { eventId: string; remarks: string },
        ) => {
            toast.success(message || "Event approved successfully.");
            queryClient.invalidateQueries({
                queryKey: allVenueOwnerReservationsQueryOptions.queryKey,
            });
            queryClient.invalidateQueries({
                queryKey: eventsQueryKeys.detail(variables.eventId),
            });
            queryClient.invalidateQueries({
                queryKey: eventsQueryKeys.approvals(variables.eventId),
            });
            queryClient.invalidateQueries({
                queryKey: eventsQueryKeys.lists(),
            });
            queryClient.invalidateQueries({
                queryKey: eventsQueryKeys.approved(),
            });
            queryClient.invalidateQueries({
                queryKey: eventsQueryKeys.pending(),
            });
            queryClient.invalidateQueries({
                queryKey: eventsQueryKeys.pendingVenueOwner(),
            });
            queryClient.invalidateQueries({
                queryKey: eventsQueryKeys.pendingDeptHead(),
            });
            queryClient.invalidateQueries({ queryKey: eventsQueryKeys.own() });
        },
        onError: (error) => {
            toast.error(error.message || "Failed to approve event.");
        },
    });

    const rejectEventMutation = useMutation({
        mutationFn: rejectEvent,
        onSuccess: (
            message,
            variables: { eventId: string; remarks: string },
        ) => {
            toast.success(message || "Event rejected successfully.");
            queryClient.invalidateQueries({
                queryKey: allVenueOwnerReservationsQueryOptions.queryKey,
            });
            queryClient.invalidateQueries({
                queryKey: eventsQueryKeys.detail(variables.eventId),
            });
            queryClient.invalidateQueries({
                queryKey: eventsQueryKeys.approvals(variables.eventId),
            });
            queryClient.invalidateQueries({
                queryKey: eventsQueryKeys.lists(),
            });
            queryClient.invalidateQueries({
                queryKey: eventsQueryKeys.approved(),
            });
            queryClient.invalidateQueries({
                queryKey: eventsQueryKeys.pending(),
            });
            queryClient.invalidateQueries({
                queryKey: eventsQueryKeys.pendingVenueOwner(),
            });
            queryClient.invalidateQueries({
                queryKey: eventsQueryKeys.pendingDeptHead(),
            });
            queryClient.invalidateQueries({ queryKey: eventsQueryKeys.own() });
        },
        onError: (error) => {
            toast.error(error.message || "Failed to reject event.");
        },
    });

    const preFilteredReservations = useMemo(() => {
        return (fetchedReservations ?? []).filter(
            (reservation: VenueReservationDTO) => {
                const matchesStatus = statusFilter
                    ? reservation.status.toLowerCase() ===
                      statusFilter.toLowerCase()
                    : true;
                const matchesVenue = venueFilter
                    ? reservation.venue.publicId === venueFilter
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

    const handleViewDetails = React.useCallback(
        (eventId: string) => {
            navigate({ to: `/app/events/${eventId}` });
        },
        [navigate],
    );
    const handleNavigateToVenue = React.useCallback(
        (venueId: string | undefined) => {
            if (venueId === undefined) return;
            navigate({ from: Route.fullPath, to: `/app/venues/${venueId}` });
        },
        [navigate],
    );

    const openSingleApproveDialog = React.useCallback(
        (reservation: VenueReservationDTO) => {
            if (!reservation.event?.publicId) {
                toast.error("Event ID is missing for this reservation.");
                return;
            }
            setSingleActionInfo({
                reservationId: reservation.publicId,
                eventId: reservation.event.publicId,
                type: "approve",
            });
            setSingleActionRemarks("");
        },
        [],
    );

    const openSingleRejectDialog = React.useCallback(
        (reservation: VenueReservationDTO) => {
            if (!reservation.event?.publicId) {
                toast.error("Event ID is missing for this reservation.");
                return;
            }
            setSingleActionInfo({
                reservationId: reservation.publicId,
                eventId: reservation.event.publicId,
                type: "reject",
            });
            setSingleActionRemarks("");
        },
        [],
    );

    const closeSingleActionDialog = () => {
        setSingleActionInfo({ reservationId: null, eventId: null, type: null });
        setSingleActionRemarks("");
    };

    const confirmSingleApprove = () => {
        if (
            singleActionInfo.type !== "approve" ||
            singleActionInfo.eventId === null
        ) {
            toast.error("Cannot approve: Event ID is missing.");
            return;
        }
        const payload = {
            eventId: singleActionInfo.eventId,
            remarks: singleActionRemarks,
        };
        approveEventMutation.mutate(payload, {
            onSuccess: (message) => {
                toast.success(message || "Event approved.");
                setRowSelection({});
                closeSingleActionDialog();
            },
            onError: (error) => {
                toast.error(error.message || "Failed to approve event.");
            },
        });
    };

    const confirmSingleReject = () => {
        if (
            singleActionInfo.type !== "reject" ||
            singleActionInfo.eventId === null
        ) {
            toast.error("Cannot reject: Event ID is missing.");
            return;
        }
        if (!singleActionRemarks.trim()) {
            toast.warning("Please provide a reason for rejection.");
            return;
        }
        const payload = {
            eventId: singleActionInfo.eventId,
            remarks: singleActionRemarks,
        };
        rejectEventMutation.mutate(payload, {
            onSuccess: (message) => {
                toast.success(message || "Event rejected.");
                setRowSelection({});
                closeSingleActionDialog();
            },
            onError: (error) => {
                toast.error(error.message || "Failed to reject event.");
            },
        });
    };

    const confirmBulkApprove = () => {
        const selectedRows = table.getFilteredSelectedRowModel().rows;
        const eligibleEventPayloads = selectedRows
            .filter((row) => {
                const reservation = row.original;
                const isPending = reservation.status === "PENDING";
                const hasCurrentUserActedOnReservation =
                    currentUserId != null &&
                    reservation.approvals?.some(
                        (approval) =>
                            approval.signedByUser.publicId === currentUserId,
                    );
                return (
                    isPending &&
                    !hasCurrentUserActedOnReservation &&
                    reservation.event &&
                    reservation.event.publicId
                );
            })
            .map((row) => {
                const eventId = row.original.event?.publicId;
                if (!eventId) return null;
                return {
                    eventId: eventId,
                    remarks: bulkApproveRemarks,
                };
            })
            .filter(
                (payload): payload is { eventId: string; remarks: string } =>
                    payload !== null,
            );

        if (eligibleEventPayloads.length === 0) {
            toast.info("No eligible reservations selected for event approval.");
            setIsBulkApproveDialogOpen(false);
            setBulkApproveRemarks("");
            return;
        }

        const promises = eligibleEventPayloads.map((payload) =>
            approveEventMutation.mutateAsync(payload),
        );

        toast.promise(Promise.all(promises), {
            loading: `Approving events for ${eligibleEventPayloads.length} reservation(s)...`,
            success: (messages: string[]) => {
                setRowSelection({});
                setIsBulkApproveDialogOpen(false);
                setBulkApproveRemarks("");
                return `${eligibleEventPayloads.length} event(s) approved.`;
            },
            error: (err: Error) => {
                return `Failed to approve some events: ${err.message}`;
            },
        });
    };

    const confirmBulkReject = () => {
        const selectedRows = table.getFilteredSelectedRowModel().rows;

        if (!bulkRejectionRemarks.trim()) {
            toast.warning("Please provide a reason for rejection.");
            return;
        }

        const eligibleEventPayloads = selectedRows
            .filter((row) => {
                const reservation = row.original;
                const isPending = reservation.status === "PENDING";
                const hasCurrentUserActedOnReservation =
                    currentUserId != null &&
                    reservation.approvals?.some(
                        (approval) =>
                            approval.signedByUser.publicId === currentUserId,
                    );
                return (
                    isPending &&
                    !hasCurrentUserActedOnReservation &&
                    reservation.event &&
                    reservation.event.publicId
                );
            })
            .map((row) => {
                const eventId = row.original.event?.publicId;
                if (!eventId) return null;
                return {
                    eventId: eventId,
                    remarks: bulkRejectionRemarks,
                };
            })
            .filter(
                (payload): payload is { eventId: string; remarks: string } =>
                    payload !== null,
            );

        if (eligibleEventPayloads.length === 0) {
            toast.info(
                "No eligible reservations selected for event rejection.",
            );
            setIsBulkRejectDialogOpen(false);
            setBulkRejectionRemarks("");
            return;
        }

        const promises = eligibleEventPayloads.map((payload) =>
            rejectEventMutation.mutateAsync(payload),
        );

        toast.promise(Promise.all(promises), {
            loading: `Rejecting events for ${eligibleEventPayloads.length} reservation(s)...`,
            success: (messages: string[]) => {
                setRowSelection({});
                setIsBulkRejectDialogOpen(false);
                setBulkRejectionRemarks("");
                return `${eligibleEventPayloads.length} event(s) rejected.`;
            },
            error: (err: Error) => {
                return `Failed to reject some events: ${err.message}`;
            },
        });
    };

    const columns = useMemo<ColumnDef<VenueReservationDTO>[]>(
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
                                handleNavigateToVenue(
                                    reservation.venue.publicId,
                                )
                            }
                        >
                            {reservation.venue.name}
                        </Button>
                    );
                },
            },
            {
                accessorKey: "departmentName",
                header: "Department",
                cell: ({ row }) => row.original.department?.name ?? "N/A",
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
                                        onClick={() => {
                                            if (reservation.event !== null) {
                                                handleViewDetails(
                                                    reservation.event.publicId,
                                                );
                                            }
                                        }}
                                        disabled={reservation.event === null}
                                    >
                                        <Eye className="mr-2 h-4 w-4" />
                                        View Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() =>
                                            handleNavigateToVenue(
                                                reservation.venue.publicId,
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
                                                onClick={() =>
                                                    openSingleApproveDialog(
                                                        reservation,
                                                    )
                                                }
                                                disabled={
                                                    approveEventMutation.isPending ||
                                                    rejectEventMutation.isPending
                                                }
                                            >
                                                <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                                                Approve
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() =>
                                                    openSingleRejectDialog(
                                                        reservation,
                                                    )
                                                }
                                                disabled={
                                                    approveEventMutation.isPending ||
                                                    rejectEventMutation.isPending
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
            approveEventMutation.isPending,
            rejectEventMutation.isPending,
            currentUserId,
            handleNavigateToVenue,
            openSingleApproveDialog,
            handleViewDetails,
            openSingleRejectDialog,
        ],
    );

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
        getRowId: (row) => row.publicId.toString(),
    });

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

    return (
        <div className="bg-background">
            <div className="flex flex-col flex-1 overflow-hidden">
                <header className="flex items-center justify-between border-b px-6 py-3.5">
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

                <div className="grid grid-cols-4 gap-4 p-6 pb-0">
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

                <div className="flex items-center justify-between border-b px-6 py-2">
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
                                    onClick={() =>
                                        setIsBulkApproveDialogOpen(true)
                                    }
                                    disabled={
                                        approveEventMutation.isPending ||
                                        rejectEventMutation.isPending
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
                                        approveEventMutation.isPending ||
                                        rejectEventMutation.isPending
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
                                        key={venue.publicId}
                                        value={venue.publicId}
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

                <div className="flex-1 overflow-auto p-6">
                    <div className="rounded-md border">
                        <Table>
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
                            <TableBody>
                                {table.getRowModel().rows?.length ? (
                                    table.getRowModel().rows.map((row) => (
                                        <TableRow
                                            key={row.original.publicId}
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
                                approveEventMutation.isPending ||
                                rejectEventMutation.isPending
                            }
                        >
                            Cancel
                        </Button>
                        {singleActionInfo.type === "approve" && (
                            <Button
                                onClick={confirmSingleApprove}
                                disabled={approveEventMutation.isPending}
                            >
                                {approveEventMutation.isPending
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
                                    rejectEventMutation.isPending
                                }
                            >
                                {rejectEventMutation.isPending
                                    ? "Rejecting..."
                                    : "Confirm Rejection"}
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

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
                            disabled={approveEventMutation.isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={confirmBulkApprove}
                            disabled={
                                approveEventMutation.isPending ||
                                numEligibleSelected === 0
                            }
                        >
                            {approveEventMutation.isPending
                                ? "Approving..."
                                : `Confirm Approval (${numEligibleSelected})`}
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
                            disabled={rejectEventMutation.isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={confirmBulkReject}
                            disabled={
                                !bulkRejectionRemarks.trim() ||
                                rejectEventMutation.isPending ||
                                numEligibleSelected === 0
                            }
                        >
                            {rejectEventMutation.isPending
                                ? "Rejecting..."
                                : `Confirm Rejection (${numEligibleSelected})`}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
