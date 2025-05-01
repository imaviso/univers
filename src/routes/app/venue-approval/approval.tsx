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
import {
    allVenueOwnerReservationsQueryOptions,
    pendingVenueOwnerReservationsQueryOptions, // Use reservation query
    venuesQueryOptions, // Keep for venue filter dropdown
} from "@/lib/query";
import type { Venue, VenueReservationDTO } from "@/lib/types"; // Import VenueReservationDTO
import { formatDateTime, getStatusBadgeClass } from "@/lib/utils"; // Import utils
import { useSuspenseQuery } from "@tanstack/react-query";
import {
    Link,
    createFileRoute,
    useNavigate,
    useRouteContext,
} from "@tanstack/react-router";
import { format } from "date-fns";
import {
    Calendar,
    Download,
    Eye,
    Filter,
    MoreHorizontal,
    Search,
} from "lucide-react";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/app/venue-approval/approval")({
    component: VenueReservationApproval,
    loader: ({ context: { queryClient } }) => {
        // Ensure both queries are fetched before rendering
        return Promise.all([
            queryClient.ensureQueryData(
                pendingVenueOwnerReservationsQueryOptions,
            ), // Fetch reservations
            queryClient.ensureQueryData(venuesQueryOptions), // Fetch venues for filter
        ]);
    },
});

type ViewMode = "all" | "pending" | "approved" | "rejected"; // Adjusted view modes

export function VenueReservationApproval() {
    const navigate = useNavigate();
    const context = useRouteContext({ from: "/app/venue-approval" }); // Get context
    const role = context.authState?.role; // Get user role

    // Fetch data using useSuspenseQuery - data is guaranteed by loader
    const { data: fetchedReservations } = useSuspenseQuery(
        allVenueOwnerReservationsQueryOptions,
    );
    const { data: venues } = useSuspenseQuery(venuesQueryOptions); // For filter

    // Create a map for quick venue lookup by ID (still useful for filter)
    const venueMap = useMemo(() => {
        const map = new Map<number, Venue>();
        for (const venue of venues ?? []) {
            map.set(venue.id, venue);
        }
        return map;
    }, [venues]);

    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const [venueFilter, setVenueFilter] = useState<string | null>(null); // Stores venue ID as string
    const [viewMode, setViewMode] = useState<ViewMode>("pending"); // Default to pending

    // Filter reservations based on search query, status, and venue filters
    const filteredReservations = useMemo(() => {
        return (fetchedReservations ?? []).filter(
            (reservation: VenueReservationDTO) => {
                // Use fields from VenueReservationDTO
                const matchesSearch =
                    reservation.venueName // Search venue name directly
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase()) ||
                    reservation.requestingUser?.firstName
                        ?.toLowerCase()
                        .includes(searchQuery.toLowerCase()) ||
                    reservation.requestingUser?.lastName
                        ?.toLowerCase()
                        .includes(searchQuery.toLowerCase()) ||
                    reservation.departmentName // Search department name
                        ?.toLowerCase()
                        .includes(searchQuery.toLowerCase());

                const matchesStatus = statusFilter
                    ? reservation.status.toLowerCase() ===
                      statusFilter.toLowerCase()
                    : true;

                // Filter by venueId
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
                            : viewMode === "rejected" // Changed from disapproved
                              ? reservation.status.toLowerCase() ===
                                    "rejected" ||
                                reservation.status.toLowerCase() === "cancelled"
                              : true;

                return (
                    matchesSearch &&
                    matchesStatus &&
                    matchesVenue &&
                    matchesViewMode
                );
            },
        );
    }, [
        fetchedReservations,
        searchQuery,
        statusFilter,
        venueFilter,
        viewMode,
        // venueMap dependency removed as venueName is direct
    ]);

    // Reservation statistics based on fetched data
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
                // Changed from disapproved
                (r) =>
                    r.status.toLowerCase() === "rejected" ||
                    r.status.toLowerCase() === "cancelled",
            ).length,
        };
    }, [fetchedReservations]);

    // Handle reservation operations
    const handleViewDetails = (reservationId: number) => {
        // Navigate to the specific reservation detail page
        navigate({ to: `/app/venue-approval/${reservationId}` });
    };

    const handleNavigateToVenue = (venueId: number | undefined) => {
        if (venueId === undefined) return;
        navigate({ from: Route.fullPath, to: `/app/venues/${venueId}` });
    };

    // Format date and time from ISO strings (using utils)
    const formatDate = (dateString: string | undefined | null) => {
        if (!dateString) return "N/A";
        try {
            return format(new Date(dateString), "MMM d, yyyy");
        } catch (e) {
            console.error("Error formatting date:", dateString, e);
            return "Invalid Date";
        }
    };

    const formatTime = (dateString: string | undefined | null) => {
        if (!dateString) return "N/A";
        try {
            return format(new Date(dateString), "h:mm a");
        } catch (e) {
            console.error("Error formatting time:", dateString, e);
            return "Invalid Time";
        }
    };

    return (
        <div className="bg-background">
            <div className="flex flex-col flex-1 overflow-hidden">
                {/* Header */}
                <header className="flex items-center justify-between border-b px-6 py-3.5">
                    <h1 className="text-xl font-semibold">
                        Venue Reservation Approval
                    </h1>
                    {/* Search Input */}
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
                    {/* Total */}
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
                    {/* Pending */}
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
                    {/* Approved */}
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
                    {/* Rejected/Cancelled */}
                    <Card
                        className="hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => setViewMode("rejected")} // Changed from disapproved
                    >
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">
                                Rejected/Cancelled
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-500">
                                {stats.rejected}{" "}
                                {/* Changed from disapproved */}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters and Actions Bar */}
                <div className="flex items-center justify-between border-b px-6 py-2">
                    {/* View Mode Tabs */}
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
                                    {" "}
                                    {/* Changed from disapproved */}
                                    Rejected/Cancelled
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>

                    {/* Other Filters/Actions */}
                    <div className="flex items-center gap-2">
                        {/* Venue Filter */}
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
                                {/* Populate venues from fetched data */}
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

                        {/* More Filters Button (Placeholder) */}
                        <Button variant="outline" size="sm" className="gap-1">
                            <Filter className="h-4 w-4" />
                            More Filters
                        </Button>

                        {/* Export Button (Placeholder) */}
                        <Button variant="outline" size="sm" className="gap-1">
                            <Download className="h-4 w-4" />
                            Export
                        </Button>
                    </div>
                </div>

                {/* Table */}
                <div className="flex-1 overflow-auto p-6">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {/* Updated Table Headers */}
                                <TableHead>Venue</TableHead>
                                <TableHead>Department</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Time</TableHead>
                                <TableHead>Requester</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Submitted</TableHead>
                                <TableHead className="w-[100px]">
                                    Actions
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredReservations.map(
                                (reservation: VenueReservationDTO) => {
                                    return (
                                        <TableRow key={reservation.id}>
                                            {/* Updated Table Cells */}
                                            <TableCell>
                                                <Button
                                                    variant="link"
                                                    className="p-0 h-auto"
                                                    onClick={() =>
                                                        handleNavigateToVenue(
                                                            reservation.venueId,
                                                        )
                                                    }
                                                >
                                                    {reservation.venueName}
                                                </Button>
                                            </TableCell>
                                            <TableCell>
                                                {reservation.departmentName ??
                                                    "N/A"}
                                            </TableCell>
                                            <TableCell>
                                                {formatDate(
                                                    reservation.startTime,
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {formatTime(
                                                    reservation.startTime,
                                                )}{" "}
                                                -{" "}
                                                {formatTime(
                                                    reservation.endTime,
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {reservation.requestingUser
                                                    ?.firstName ?? ""}{" "}
                                                {reservation.requestingUser
                                                    ?.lastName ?? "N/A"}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    className={getStatusBadgeClass(
                                                        reservation.status,
                                                    )}
                                                >
                                                    {reservation.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {formatDate(
                                                    reservation.createdAt,
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger
                                                        asChild
                                                    >
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
                                                                    reservation.id,
                                                                )
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
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    );
                                },
                            )}
                            {filteredReservations.length === 0 && (
                                <TableRow>
                                    <TableCell
                                        colSpan={8} // Adjusted colspan
                                        className="text-center py-8 text-muted-foreground"
                                    >
                                        No reservations found. Try adjusting
                                        your filters.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}
