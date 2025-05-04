import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
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
import { allNavigation } from "@/lib/navigation";
import {
    allEquipmentOwnerReservationsQueryOptions,
    allEquipmentReservationsQueryOptions,
    ownEquipmentReservationsQueryOptions,
    pendingEquipmentOwnerReservationsQueryOptions,
    useCurrentUser,
} from "@/lib/query";
import type { EquipmentReservationDTO, UserRole } from "@/lib/types";
import { formatDateTime, getStatusBadgeClass } from "@/lib/utils"; // Use utils
import { useQuery } from "@tanstack/react-query";
import {
    createFileRoute,
    redirect,
    useNavigate,
    useRouteContext,
} from "@tanstack/react-router";
import { Download, Eye, Filter, MoreHorizontal, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/equipment-approval/approval")({
    component: EquipmentReservationApproval,
    beforeLoad: async ({ location, context }) => {
        // ... (keep existing beforeLoad logic) ...
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
                to: "/app", // Redirect to a safe page
            });
        }
    },
    // Optionally prefetch data based on role
    loader: ({ context }) => {
        const role = context.authState?.role;
        if (role === "EQUIPMENT_OWNER") {
            context.queryClient.ensureQueryData(
                pendingEquipmentOwnerReservationsQueryOptions,
            );
        } else if (role === "SUPER_ADMIN") {
            context.queryClient.ensureQueryData(
                allEquipmentReservationsQueryOptions,
            );
        } else {
            // Prefetch own reservations for other roles if needed
            // context.queryClient.ensureQueryData(ownEquipmentReservationsQueryOptions);
        }
    },
});

// Define view modes based on backend endpoints/logic
type ViewMode = "all" | "pending" | "approved" | "disapproved"; // Keep these simple status filters

export function EquipmentReservationApproval() {
    const navigate = useNavigate();
    const { authState } = useRouteContext({ from: "/app" }); // Get auth state
    const currentUserRole = authState?.role as UserRole | undefined;

    const [searchQuery, setSearchQuery] = useState("");
    // const [statusFilter, setStatusFilter] = useState<string | null>(null); // Replaced by viewMode
    // const [ownerFilter, setOwnerFilter] = useState<string | null>(null); // Backend handles owner filtering
    const [viewMode, setViewMode] = useState<ViewMode>("pending"); // Default to pending for approvers

    // --- Determine Query based on Role and View ---
    const queryOptions = useMemo(() => {
        if (currentUserRole === "EQUIPMENT_OWNER") {
            // Equipment owners see reservations related to their equipment
            if (viewMode === "pending") {
                return pendingEquipmentOwnerReservationsQueryOptions;
            }
            // For 'all', 'approved', 'disapproved', fetch all and filter client-side for now
            // Or backend could add status filters to the 'allEquipmentOwnerReservations' endpoint
            return allEquipmentOwnerReservationsQueryOptions;
        }
        if (currentUserRole === "SUPER_ADMIN") {
            // Super Admins see all reservations
            return allEquipmentReservationsQueryOptions;
        }
        // Default: Other users see their own reservations (if this page is intended for them)
        // If only for approvers, this case might redirect or show nothing.
        return ownEquipmentReservationsQueryOptions;
    }, [currentUserRole, viewMode]);

    const { data: reservations = [], isLoading } = useQuery(queryOptions);

    // --- Client-side Filtering (Apply search and viewMode status filter) ---
    const filteredReservations = useMemo(() => {
        return reservations.filter((reservation) => {
            const lowerSearch = searchQuery.toLowerCase();
            const matchesSearch =
                reservation.eventName?.toLowerCase().includes(lowerSearch) ||
                reservation.requestingUser?.firstName
                    ?.toLowerCase()
                    .includes(lowerSearch) ||
                reservation.requestingUser?.lastName
                    ?.toLowerCase()
                    .includes(lowerSearch) ||
                reservation.departmentName
                    ?.toLowerCase()
                    .includes(lowerSearch) ||
                reservation.equipmentName?.toLowerCase().includes(lowerSearch);

            const matchesViewModeStatus =
                viewMode === "all" ||
                reservation.status.toLowerCase() === viewMode;

            return matchesSearch && matchesViewModeStatus;
        });
    }, [reservations, searchQuery, viewMode]);

    // --- Reservation statistics (calculated from potentially filtered data) ---
    const stats = useMemo(() => {
        // Calculate stats based on the *source* data before client-side search filtering
        // but potentially after role-based fetching
        const sourceData = reservations;
        return {
            total: sourceData.length,
            pending: sourceData.filter((r) => r.status === "PENDING").length,
            approved: sourceData.filter((r) => r.status === "APPROVED").length,
            disapproved: sourceData.filter((r) => r.status === "REJECTED")
                .length, // Use REJECTED
        };
    }, [reservations]);

    // --- Event Handlers ---
    const handleViewDetails = (eventId: number) => {
        navigate({ to: `/app/events/${eventId}` });
    };

    // --- Render Logic ---
    if (!currentUserRole) {
        // Should be handled by beforeLoad, but good practice
        return <div>Loading user...</div>;
    }

    // Determine which tabs to show based on role
    const availableTabs: ViewMode[] =
        currentUserRole === "EQUIPMENT_OWNER" ||
        currentUserRole === "SUPER_ADMIN"
            ? ["pending", "approved", "disapproved", "all"]
            : ["all"]; // Regular users might only see 'all' of their own

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
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </header>

                {/* Stats Cards */}
                {(currentUserRole === "EQUIPMENT_OWNER" ||
                    currentUserRole === "SUPER_ADMIN") && (
                    <div className="grid grid-cols-4 gap-4 p-6 pb-0">
                        {/* Stats Cards - Adjust labels/values if needed */}
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
                            className={`hover:shadow-md transition-shadow cursor-pointer ${viewMode === "disapproved" ? "ring-2 ring-primary" : ""}`}
                            onClick={() => setViewMode("disapproved")}
                        >
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Rejected
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-red-500">
                                    {stats.disapproved}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Filter/Action Bar */}
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
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Owner filter removed - backend handles this */}
                        {/* <Button variant="outline" size="sm" className="gap-1">
                            <Filter className="h-4 w-4" />
                            More Filters
                        </Button> */}
                        {/* <Button variant="outline" size="sm" className="gap-1">
                            <Download className="h-4 w-4" />
                            Export
                        </Button> */}
                    </div>
                </div>

                {/* Table */}
                <div className="flex-1 overflow-auto p-6">
                    {isLoading ? (
                        <p className="text-center text-muted-foreground">
                            Loading reservations...
                        </p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Event</TableHead>
                                    <TableHead>Equipment</TableHead>
                                    <TableHead>Qty</TableHead>
                                    <TableHead>Requester</TableHead>
                                    <TableHead>Department</TableHead>
                                    <TableHead>Start Time</TableHead>
                                    <TableHead>End Time</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Submitted</TableHead>
                                    <TableHead className="w-[100px]">
                                        Actions
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredReservations.map((res) => (
                                    <TableRow key={res.id}>
                                        <TableCell className="font-medium">
                                            {/* Link to event details? */}
                                            {res.eventName ?? "N/A"}
                                        </TableCell>
                                        <TableCell>
                                            {res.equipmentName ?? "N/A"}
                                        </TableCell>
                                        <TableCell>{res.quantity}</TableCell>
                                        <TableCell>
                                            {res.requestingUser?.firstName}{" "}
                                            {res.requestingUser?.lastName ??
                                                "N/A"}
                                        </TableCell>
                                        <TableCell>
                                            {res.departmentName ?? "N/A"}
                                        </TableCell>
                                        <TableCell>
                                            {formatDateTime(res.startTime)}
                                        </TableCell>
                                        <TableCell>
                                            {formatDateTime(res.endTime)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                className={getStatusBadgeClass(
                                                    res.status,
                                                )}
                                            >
                                                {res.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {formatDateTime(res.createdAt)}
                                        </TableCell>
                                        <TableCell>
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
                                                                res.eventId,
                                                            )
                                                        }
                                                    >
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        View Details
                                                    </DropdownMenuItem>
                                                    {/* Add other actions like Cancel/Delete based on role/status */}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {filteredReservations.length === 0 && (
                                    <TableRow>
                                        <TableCell
                                            colSpan={10} // Adjusted colspan
                                            className="text-center py-8 text-muted-foreground"
                                        >
                                            No reservations found. Try adjusting
                                            your filters.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </div>
            </div>
        </div>
    );
}
