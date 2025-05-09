import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
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
import { DeleteConfirmDialog } from "@/components/user-management/deleteConfirmDialog";
import { VenueFormDialog } from "@/components/venue/venueFormDialog";
import { createVenue, deleteVenue, updateVenue } from "@/lib/api";
import {
    departmentsQueryOptions,
    ownEventsQueryOptions,
    ownReservationsQueryOptions,
    usersQueryOptions,
    venuesQueryOptions,
} from "@/lib/query";
import type { VenueInput } from "@/lib/schema";
import type { UserDTO, VenueDTO } from "@/lib/types";
import { getStatusBadgeClass } from "@/lib/utils";
import { useMutation, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import {
    createFileRoute,
    useNavigate,
    useRouteContext,
} from "@tanstack/react-router";
import { format } from "date-fns";
import {
    Building,
    Edit,
    Eye,
    HelpCircle,
    MapPin,
    MoreHorizontal,
    Plus,
    Search,
    Trash2,
    UserCheck,
    UserCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/venues/dashboard")({
    component: VenueManagement,
    loader: ({ context: { queryClient } }) => {
        queryClient.ensureQueryData(venuesQueryOptions);
        queryClient.ensureQueryData(ownEventsQueryOptions);
        queryClient.ensureQueryData(departmentsQueryOptions);
        queryClient.ensureQueryData(ownReservationsQueryOptions);
    },
});

export function VenueManagement() {
    const context = useRouteContext({ from: "/app/venues" });
    const role = context.authState?.role;
    const currentUser = context.authState; // Get full user object
    const queryClient = context.queryClient;
    const navigate = useNavigate();
    // State variables
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddVenueOpen, setIsAddVenueOpen] = useState(false);
    const [editingVenue, setEditingVenue] = useState<VenueDTO | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [venueToDelete, setVenueToDelete] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<"table" | "grid" | "reservations">(
        role === "SUPER_ADMIN" || role === "VENUE_OWNER" ? "table" : "grid",
    );
    const [activeVenueReservationTab, setActiveVenueReservationTab] =
        useState("all"); // State for venue reservation tabs

    const { data: venues = [] } = useSuspenseQuery(venuesQueryOptions);
    const { data: users = [] } = useQuery({
        ...usersQueryOptions,
        enabled: role === "SUPER_ADMIN",
    });
    const { data: ownReservations = [], isLoading: isLoadingOwnReservations } =
        useQuery({
            ...ownReservationsQueryOptions,
            enabled: viewMode === "reservations",
        });

    const venueOwners =
        role === "SUPER_ADMIN"
            ? users.filter((user: UserDTO) => user.role === "VENUE_OWNER")
            : [];

    // --- Mutations ---
    const createVenueMutation = useMutation({
        mutationFn: createVenue,
        onSuccess: (newVenue) => {
            toast.success(`Venue "${newVenue.name}" created successfully.`);
            queryClient.invalidateQueries({
                queryKey: venuesQueryOptions.queryKey,
            });
            setIsAddVenueOpen(false);
        },
        onError: (error) => {
            toast.error(`Failed to create venue: ${error.message}`);
        },
    });

    const updateVenueMutation = useMutation({
        mutationFn: updateVenue,
        onSuccess: (updatedVenue) => {
            toast.success(`Venue "${updatedVenue.name}" updated successfully.`);
            queryClient.invalidateQueries({
                queryKey: venuesQueryOptions.queryKey,
            });
            setIsAddVenueOpen(false);
            setEditingVenue(null);
        },
        onError: (error) => {
            toast.error(`Failed to update venue: ${error.message}`);
        },
    });

    const deleteVenueMutation = useMutation({
        mutationFn: deleteVenue,
        onSuccess: (message, _venueId) => {
            toast.success(message || "Venue deleted successfully.");
            queryClient.invalidateQueries({
                queryKey: venuesQueryOptions.queryKey,
            });
            setIsDeleteDialogOpen(false);
            setVenueToDelete(null);
        },
        onError: (error) => {
            toast.error(`Failed to delete venue: ${error.message}`);
            setIsDeleteDialogOpen(false);
            setVenueToDelete(null);
        },
    });

    const handleAddOrEditSubmit = (
        venueData: VenueInput,
        imageFile: File | null | undefined,
    ) => {
        if (editingVenue) {
            updateVenueMutation.mutate({
                venueId: editingVenue.publicId,
                venueData,
                imageFile: imageFile === undefined ? null : imageFile,
            });
        } else {
            let finalVenueData = { ...venueData };
            if (role === "VENUE_OWNER" && currentUser?.publicId) {
                finalVenueData = {
                    ...finalVenueData,
                    venueOwnerId: currentUser.publicId,
                };
            }
            createVenueMutation.mutate({
                venueData: finalVenueData,
                imageFile: imageFile === undefined ? null : imageFile,
            });
        }
    };

    const handleDeleteConfirm = () => {
        if (venueToDelete) {
            deleteVenueMutation.mutate(venueToDelete);
        }
    };

    const formatDateTime = (dateString: string | null | undefined): string => {
        if (!dateString) return "—";
        try {
            return format(new Date(dateString), "MMM d, yyyy h:mm a");
        } catch (e) {
            console.error("Error formatting date:", dateString, e);
            return "Invalid Date";
        }
    };

    const handleNavigate = (venueId: string) => {
        navigate({ to: `/app/venues/${venueId}` });
    };

    // Filter venues
    const baseVenuesToDisplay =
        role === "VENUE_OWNER" && currentUser?.publicId
            ? venues.filter(
                  (venue) =>
                      venue.venueOwner?.publicId === currentUser.publicId,
              )
            : venues;

    const filteredVenues = baseVenuesToDisplay.filter(
        (venue) =>
            venue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            venue.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
            venue.venueOwner?.firstName
                ?.toLowerCase()
                .includes(searchQuery.toLowerCase()) ||
            venue.venueOwner?.lastName
                ?.toLowerCase()
                .includes(searchQuery.toLowerCase()) ||
            venue.venueOwner?.email
                ?.toLowerCase()
                .includes(searchQuery.toLowerCase()),
    );

    // Stats
    const stats = {
        total: baseVenuesToDisplay.length,
        myVenues:
            role === "VENUE_OWNER" && currentUser?.publicId
                ? venues.filter(
                      (venue) =>
                          venue.venueOwner?.publicId === currentUser.publicId,
                  ).length
                : 0,
        unassignedVenues:
            role === "SUPER_ADMIN"
                ? venues.filter((venue) => !venue.venueOwner).length
                : 0,
    };

    // Filtered venue reservations based on active tab
    const filteredVenueReservations = useMemo(() => {
        if (activeVenueReservationTab === "all" || !ownReservations) {
            return ownReservations ?? [];
        }
        return ownReservations.filter(
            (res) =>
                res.status.toLowerCase() ===
                activeVenueReservationTab.toLowerCase(),
        );
    }, [ownReservations, activeVenueReservationTab]);

    // --- Render Logic ---
    const isMutating =
        createVenueMutation.isPending ||
        updateVenueMutation.isPending ||
        deleteVenueMutation.isPending;

    return (
        <div className="bg-background">
            <div className="flex flex-col flex-1 overflow-hidden">
                {/* Header */}
                <header className="flex items-center justify-between border-b px-6 py-3.5 h-16">
                    <h1 className="text-xl font-semibold">Venues</h1>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search venues..."
                                className="w-64 pl-8"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        {role === "SUPER_ADMIN" && (
                            <Button
                                onClick={() => {
                                    setEditingVenue(null);
                                    setIsAddVenueOpen(true);
                                }}
                                size="sm"
                                className="gap-1"
                                disabled={isMutating}
                            >
                                <Plus className="h-4 w-4" />
                                Add Venue
                            </Button>
                        )}
                    </div>
                </header>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-4 p-6 pb-0">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Total Venues
                            </CardTitle>
                            <Building className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats.total}
                            </div>
                        </CardContent>
                    </Card>
                    {role === "VENUE_OWNER" && (
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    My Venues
                                </CardTitle>
                                <UserCheck className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {stats.myVenues}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                    {role === "SUPER_ADMIN" && (
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Unassigned Venues
                                </CardTitle>
                                <HelpCircle className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {stats.unassignedVenues}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Filters and Actions Bar */}
                <div className="flex items-center justify-between border-b px-6 py-2">
                    <div className="flex items-center gap-2">
                        {/* Bulk Actions Removed */}
                        <span className="text-sm text-muted-foreground">
                            {filteredVenues.length} venue
                            {filteredVenues.length !== 1 ? "s" : ""} found
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* View Mode Toggle */}
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
                                    role === "VENUE_OWNER") && (
                                    <TabsTrigger value="table">
                                        Table
                                    </TabsTrigger>
                                )}
                                <TabsTrigger value="grid">
                                    {role === "SUPER_ADMIN" ||
                                    role === "VENUE_OWNER"
                                        ? "Grid"
                                        : "Venues"}
                                </TabsTrigger>
                                {/* Separate tab for user's reservations */}
                                {role !== "SUPER_ADMIN" && (
                                    <TabsTrigger value="reservations">
                                        My Reservations
                                    </TabsTrigger>
                                )}
                            </TabsList>
                        </Tabs>
                        {/* Add Export button if needed */}
                        {/* <Button variant="outline" size="sm" className="gap-1" disabled={isMutating}>
                        <Download className="h-4 w-4" /> Export
                    </Button> */}
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-auto p-6">
                    {/* Table View (SUPER_ADMIN or VENUE_OWNER) */}
                    {viewMode === "table" &&
                        (role === "SUPER_ADMIN" || role === "VENUE_OWNER") && (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        {/* <TableHead className="w-[40px]">
                                    <Checkbox
                                        // checked={selectedItems.length === filteredVenues.length && filteredVenues.length > 0}
                                        // onCheckedChange={handleSelectAll}
                                        aria-label="Select all"
                                        // disabled={isMutating}
                                    />
                                </TableHead> */}
                                        <TableHead>Name</TableHead>
                                        <TableHead>Location</TableHead>
                                        {role === "SUPER_ADMIN" && (
                                            <TableHead>Owner</TableHead>
                                        )}
                                        <TableHead>Created At</TableHead>
                                        <TableHead>Updated At</TableHead>
                                        <TableHead className="w-[100px]">
                                            Actions
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredVenues.length > 0 ? (
                                        filteredVenues.map((venue) => (
                                            <TableRow key={venue.publicId}>
                                                {/* <TableCell>
                                        <Checkbox
                                            // checked={selectedItems.includes(venue.id)}
                                            // onCheckedChange={() => handleSelectItem(venue.id)}
                                            aria-label={`Select venue ${venue.name}`}
                                            // disabled={isMutating}
                                        />
                                    </TableCell> */}
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded-md overflow-hidden bg-muted flex-shrink-0">
                                                            <img
                                                                src={
                                                                    venue.imagePath ??
                                                                    "https://cit.edu/wp-content/uploads/2023/07/GLE-Building.jpg"
                                                                } // Construct URL
                                                                alt={venue.name}
                                                                className="h-full w-full object-cover"
                                                                loading="lazy"
                                                            />
                                                        </div>
                                                        <Button
                                                            variant="link"
                                                            className="p-0 h-auto text-left justify-start font-medium truncate"
                                                            onClick={() =>
                                                                handleNavigate(
                                                                    venue.publicId,
                                                                )
                                                            }
                                                            title={venue.name}
                                                        >
                                                            {venue.name}
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                                <TableCell
                                                    className="truncate max-w-xs"
                                                    title={venue.location}
                                                >
                                                    {venue.location}
                                                </TableCell>
                                                {role === "SUPER_ADMIN" && (
                                                    <TableCell>
                                                        {venue.venueOwner ? (
                                                            <div
                                                                title={`${venue.venueOwner.firstName} ${venue.venueOwner.lastName} (${venue.venueOwner.email})`}
                                                            >
                                                                {
                                                                    venue
                                                                        .venueOwner
                                                                        .firstName
                                                                }{" "}
                                                                {
                                                                    venue
                                                                        .venueOwner
                                                                        .lastName
                                                                }
                                                                <div className="text-xs text-muted-foreground truncate">
                                                                    {
                                                                        venue
                                                                            .venueOwner
                                                                            .email
                                                                    }
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <span className="text-muted-foreground">
                                                                —
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                )}
                                                <TableCell>
                                                    {formatDateTime(
                                                        venue.createdAt,
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {formatDateTime(
                                                        venue.updatedAt,
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
                                                                disabled={
                                                                    isMutating
                                                                }
                                                            >
                                                                <MoreHorizontal className="h-4 w-4" />
                                                                <span className="sr-only">
                                                                    Venue
                                                                    Actions
                                                                </span>
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem
                                                                onClick={() =>
                                                                    handleNavigate(
                                                                        venue.publicId,
                                                                    )
                                                                }
                                                            >
                                                                <Eye className="mr-2 h-4 w-4" />{" "}
                                                                View
                                                            </DropdownMenuItem>
                                                            {role ===
                                                                "SUPER_ADMIN" && (
                                                                <>
                                                                    <DropdownMenuItem
                                                                        onClick={() => {
                                                                            setEditingVenue(
                                                                                venue,
                                                                            );
                                                                            setIsAddVenueOpen(
                                                                                true,
                                                                            );
                                                                        }}
                                                                    >
                                                                        <Edit className="mr-2 h-4 w-4" />{" "}
                                                                        Edit
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem
                                                                        className="text-destructive focus:text-destructive"
                                                                        onClick={() => {
                                                                            setVenueToDelete(
                                                                                venue.publicId,
                                                                            );
                                                                            setIsDeleteDialogOpen(
                                                                                true,
                                                                            );
                                                                        }}
                                                                        disabled={
                                                                            deleteVenueMutation.isPending &&
                                                                            deleteVenueMutation.variables ===
                                                                                venue.publicId
                                                                        }
                                                                    >
                                                                        <Trash2 className="mr-2 h-4 w-4" />{" "}
                                                                        Delete
                                                                    </DropdownMenuItem>
                                                                </>
                                                            )}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell
                                                colSpan={
                                                    role === "SUPER_ADMIN"
                                                        ? 6
                                                        : 5
                                                }
                                                className="text-center py-8 text-muted-foreground"
                                            >
                                                No venues found matching your
                                                search.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        )}

                    {/* Grid View */}
                    {viewMode === "grid" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredVenues.length > 0 ? (
                                filteredVenues.map((venue) => (
                                    <Card
                                        key={venue.publicId}
                                        className="overflow-hidden flex flex-col group"
                                    >
                                        <div className="aspect-video w-full overflow-hidden relative">
                                            <img
                                                src={
                                                    venue.imagePath ?? undefined
                                                } // Construct URL
                                                alt={venue.name}
                                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                onError={(e) => {
                                                    e.currentTarget.src =
                                                        "/placeholder.svg";
                                                }}
                                                loading="lazy"
                                            />
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="secondary"
                                                        size="icon"
                                                        className="absolute top-2 right-2 h-7 w-7 opacity-80 group-hover:opacity-100"
                                                        disabled={isMutating}
                                                    >
                                                        <MoreHorizontal className="h-4 w-4" />
                                                        <span className="sr-only">
                                                            Venue Actions
                                                        </span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        onClick={() =>
                                                            handleNavigate(
                                                                venue.publicId,
                                                            )
                                                        }
                                                    >
                                                        <Eye className="mr-2 h-4 w-4" />{" "}
                                                        View Details
                                                    </DropdownMenuItem>
                                                    {role === "SUPER_ADMIN" && (
                                                        <>
                                                            <DropdownMenuItem
                                                                onClick={() => {
                                                                    setEditingVenue(
                                                                        venue,
                                                                    );
                                                                    setIsAddVenueOpen(
                                                                        true,
                                                                    );
                                                                }}
                                                            >
                                                                <Edit className="mr-2 h-4 w-4" />{" "}
                                                                Edit
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                className="text-destructive focus:text-destructive"
                                                                onClick={() => {
                                                                    setVenueToDelete(
                                                                        venue.publicId,
                                                                    );
                                                                    setIsDeleteDialogOpen(
                                                                        true,
                                                                    );
                                                                }}
                                                                disabled={
                                                                    deleteVenueMutation.isPending &&
                                                                    deleteVenueMutation.variables ===
                                                                        venue.publicId
                                                                }
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" />{" "}
                                                                Delete
                                                            </DropdownMenuItem>
                                                        </>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                        <CardHeader className="pb-2 pt-4 px-4">
                                            <CardTitle
                                                className="text-base font-semibold truncate"
                                                title={venue.name}
                                            >
                                                {venue.name}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="text-sm text-muted-foreground flex-grow px-4 pb-3">
                                            <div className="flex items-start gap-1.5 mb-2">
                                                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                                <span
                                                    className="line-clamp-2"
                                                    title={venue.location}
                                                >
                                                    {venue.location}
                                                </span>
                                            </div>
                                            {venue.venueOwner && (
                                                <div
                                                    className="flex items-start gap-1.5"
                                                    title={`${venue.venueOwner.firstName} ${venue.venueOwner.lastName}`}
                                                >
                                                    <UserCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                                    <span className="truncate">
                                                        Owner:{" "}
                                                        {
                                                            venue.venueOwner
                                                                .firstName
                                                        }{" "}
                                                        {
                                                            venue.venueOwner
                                                                .lastName
                                                        }
                                                    </span>
                                                </div>
                                            )}
                                        </CardContent>
                                        {/* {role !== "SUPER_ADMIN" && ( // Show Reserve button for non-admins
                                            <CardFooter className="p-4 pt-0">
                                                <Button
                                                    size="sm"
                                                    className="w-full"
                                                    onClick={() =>
                                                        setIsReservationDialogOpen(
                                                            true,
                                                        )
                                                    }
                                                >
                                                    Reserve
                                                </Button>
                                            </CardFooter>
                                        )} */}
                                    </Card>
                                ))
                            ) : (
                                <div className="col-span-full text-center py-8 text-muted-foreground">
                                    No venues found matching your search.
                                </div>
                            )}
                        </div>
                    )}

                    {viewMode === "reservations" && (
                        <div>
                            <Tabs
                                value={activeVenueReservationTab}
                                onValueChange={setActiveVenueReservationTab}
                                className="w-full mb-4"
                            >
                                <TabsList className="text-foreground h-auto gap-2 rounded-none border-b bg-transparent px-0 py-1">
                                    {[
                                        "all",
                                        "pending",
                                        "approved",
                                        "rejected",
                                        "canceled",
                                    ].map((tab) => (
                                        <TabsTrigger
                                            key={tab}
                                            value={tab}
                                            className="capitalize data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                                        >
                                            {tab}
                                        </TabsTrigger>
                                    ))}
                                </TabsList>
                            </Tabs>

                            {isLoadingOwnReservations ? (
                                <p className="text-muted-foreground">
                                    Loading reservations...
                                </p>
                            ) : filteredVenueReservations.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {filteredVenueReservations.map((res) => (
                                        <Card
                                            key={res.publicId}
                                            className="overflow-hidden flex flex-col group"
                                        >
                                            <div className="aspect-video w-full overflow-hidden relative">
                                                <img
                                                    src={
                                                        res.venue.imagePath ??
                                                        "/placeholder.svg"
                                                    }
                                                    alt={
                                                        res.venue.name ??
                                                        "Venue image"
                                                    }
                                                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                    onError={(e) => {
                                                        e.currentTarget.src =
                                                            "/placeholder.svg";
                                                    }}
                                                    loading="lazy"
                                                />
                                            </div>
                                            <CardHeader className="pb-2 pt-4 px-4">
                                                <CardTitle
                                                    className="text-base font-semibold truncate"
                                                    title={
                                                        res.venue.name ??
                                                        undefined
                                                    }
                                                >
                                                    {res.venue.name ?? "N/A"}
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="text-sm text-muted-foreground flex-grow px-4 pb-3 space-y-1.5">
                                                <div>
                                                    <strong>Event:</strong>{" "}
                                                    {res.event?.eventName ??
                                                        "N/A"}
                                                </div>
                                                <div>
                                                    <strong>Starts:</strong>{" "}
                                                    {formatDateTime(
                                                        res.startTime,
                                                    )}
                                                </div>
                                                <div>
                                                    <strong>Ends:</strong>{" "}
                                                    {formatDateTime(
                                                        res.endTime,
                                                    )}
                                                </div>
                                                <div>
                                                    <strong>Status:</strong>{" "}
                                                    <Badge
                                                        className={getStatusBadgeClass(
                                                            res.status,
                                                        )}
                                                    >
                                                        {res.status}
                                                    </Badge>
                                                </div>
                                            </CardContent>
                                            <div className="p-4 pt-0 border-t mt-auto">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="w-full"
                                                    onClick={() =>
                                                        navigate({
                                                            to: `/app/events/${res.event?.publicId}`,
                                                        })
                                                    }
                                                >
                                                    View Details
                                                </Button>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center text-muted-foreground py-8 border rounded-md bg-muted/20">
                                    You have no{" "}
                                    {activeVenueReservationTab !== "all"
                                        ? activeVenueReservationTab
                                        : ""}{" "}
                                    venue reservations.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {role === "SUPER_ADMIN" && (
                <>
                    <VenueFormDialog
                        isOpen={isAddVenueOpen}
                        onClose={() => {
                            setIsAddVenueOpen(false);
                            setEditingVenue(null);
                        }}
                        onSubmit={handleAddOrEditSubmit}
                        venue={editingVenue || undefined}
                        isLoading={
                            createVenueMutation.isPending ||
                            updateVenueMutation.isPending
                        }
                        venueOwners={role === "SUPER_ADMIN" ? venueOwners : []}
                        currentUserRole={role}
                    />
                    <DeleteConfirmDialog
                        isOpen={isDeleteDialogOpen}
                        onClose={() => {
                            setIsDeleteDialogOpen(false);
                            setVenueToDelete(null);
                        }}
                        onConfirm={handleDeleteConfirm}
                        title="Delete Venue"
                        description={`Are you sure you want to delete the venue "${venues.find((v) => v.publicId === venueToDelete)?.name}"? This action cannot be undone.`}
                        isLoading={deleteVenueMutation.isPending}
                    />
                </>
            )}
        </div>
    );
}
