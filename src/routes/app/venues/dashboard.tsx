import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
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
import { DeleteConfirmDialog } from "@/components/user-management/deleteConfirmDialog";
import { VenueReservationFormDialog } from "@/components/venue-reservation/VenueReservationFormDialog";
import { VenueFormDialog } from "@/components/venue/venueFormDialog";
import { createVenue, deleteVenue, updateVenue } from "@/lib/api";
import {
    departmentsQueryOptions,
    getOwnEventsQueryOptions,
    ownReservationsQueryOptions,
    useCreateReservationMutation,
    usersQueryOptions,
    venuesQueryOptions,
} from "@/lib/query";
import type {
    CreateVenueReservationFormOutput,
    VenueInput,
} from "@/lib/schema";
import { DEPARTMENTS, type UserType, type Venue } from "@/lib/types";
import { getStatusBadgeClass } from "@/lib/utils";
import { useMutation, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import {
    createFileRoute,
    useNavigate,
    useRouteContext,
} from "@tanstack/react-router";
import { format, formatISO } from "date-fns";
import {
    Building,
    Calendar,
    Download,
    Edit,
    Eye,
    MapPin,
    MoreHorizontal,
    Plus,
    Search,
    Trash2,
    UserCircle,
    Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/venues/dashboard")({
    component: VenueManagement,
    loader: ({ context: { queryClient } }) => {
        queryClient.ensureQueryData(venuesQueryOptions);
        queryClient.ensureQueryData(getOwnEventsQueryOptions);
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
    // const [selectedItems, setSelectedItems] = useState<number[]>([]); // Bulk actions removed
    const [isAddVenueOpen, setIsAddVenueOpen] = useState(false);
    const [editingVenue, setEditingVenue] = useState<Venue | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [venueToDelete, setVenueToDelete] = useState<number | null>(null);
    const [viewMode, setViewMode] = useState<"table" | "grid" | "reservations">(
        role === "SUPER_ADMIN" ? "table" : "grid",
    );
    const [isReservationDialogOpen, setIsReservationDialogOpen] =
        useState(false);
    const [reservingVenueId, setReservingVenueId] = useState<
        string | undefined
    >(undefined); // Store ID for pre-selection

    // --- Queries ---
    const { data: departments = [] } = useSuspenseQuery(
        departmentsQueryOptions,
    );
    const { data: events = [] } = useSuspenseQuery(getOwnEventsQueryOptions);
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
            ? users.filter((user: UserType) => user.role === "VENUE_OWNER")
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
        onSuccess: (message, venueId) => {
            toast.success(message || "Venue deleted successfully.");
            queryClient.invalidateQueries({
                queryKey: venuesQueryOptions.queryKey,
            });
            setIsDeleteDialogOpen(false);
            setVenueToDelete(null);
            // setSelectedItems((prev) => prev.filter((id) => id !== venueId)); // Bulk actions removed
        },
        onError: (error) => {
            toast.error(`Failed to delete venue: ${error.message}`);
            setIsDeleteDialogOpen(false);
            setVenueToDelete(null);
        },
    });

    // Venue Reservation Mutation
    const createReservationMutation = useCreateReservationMutation();

    // --- Event Handlers ---
    const handleReservationSubmit = (
        formData: CreateVenueReservationFormOutput,
    ) => {
        if (!currentUser) {
            toast.error("You must be logged in to make a reservation.");
            return;
        }

        console.log("Form Data Received:", formData);

        // Transform data for the API
        const apiPayload = {
            reservationData: {
                venueId: formData.venueId,
                // Convert Date objects to ISO strings
                startTime: format(formData.startTime, "yyyy-MM-dd'T'HH:mm:ss"),
                endTime: format(formData.endTime, "yyyy-MM-dd'T'HH:mm:ss"),
                // departmentId and eventId are not collected in this simplified form
                // They might need to be added back if required by the backend logic
                departmentId: formData.departmentId,
                eventId: formData.eventId,
            },
            reservationLetterFile: formData.reservationLetterFile, // Already a File | undefined
        };

        console.log("API Payload:", apiPayload);

        createReservationMutation.mutate(apiPayload, {
            onSuccess: (newReservation) => {
                toast.success(
                    `Reservation for "${newReservation.venueName}" submitted successfully.`,
                );
                setIsReservationDialogOpen(false);
                setReservingVenueId(undefined); // Clear pre-selected venue
                // Optionally navigate to reservation details or refresh a reservation list
                // queryClient.invalidateQueries({ queryKey: ['myReservations'] }); // If such a query exists
            },
            onError: (error) => {
                toast.error(`Failed to submit reservation: ${error.message}`);
            },
        });
    };

    const handleAddOrEditSubmit = (
        venueData: VenueInput,
        imageFile: File | null,
    ) => {
        if (editingVenue) {
            updateVenueMutation.mutate({
                venueId: editingVenue.id,
                venueData,
                imageFile,
            });
        } else {
            let finalVenueData = { ...venueData };
            if (role === "VENUE_OWNER" && currentUser?.id) {
                finalVenueData = {
                    ...finalVenueData,
                    venueOwnerId: Number(currentUser.id),
                };
            }
            createVenueMutation.mutate({
                venueData: finalVenueData,
                imageFile,
            });
        }
    };

    const handleDeleteConfirm = () => {
        if (venueToDelete) {
            deleteVenueMutation.mutate(venueToDelete);
        }
    };

    const formatDateTime = (dateString: string | null | undefined): string => {
        // ... (keep existing formatDateTime)
        if (!dateString) return "—";
        try {
            return format(new Date(dateString), "MMM d, yyyy h:mm a");
        } catch (e) {
            console.error("Error formatting date:", dateString, e);
            return "Invalid Date";
        }
    };

    const handleNavigate = (venueId: number) => {
        navigate({ to: `/app/venues/${venueId}` });
    };

    // Filter venues
    const filteredVenues = venues.filter(
        // ... (keep existing filter logic)
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
        total: venues.length,
    };

    // --- Render Logic ---
    const isMutating =
        createVenueMutation.isPending ||
        updateVenueMutation.isPending ||
        deleteVenueMutation.isPending ||
        createReservationMutation.isPending; // Include reservation mutation

    const openReservationDialog = (venueId?: number) => {
        setReservingVenueId(venueId ? String(venueId) : undefined);
        setIsReservationDialogOpen(true);
    };
    return (
        <div className="bg-background">
            <div className="flex flex-col flex-1 overflow-hidden">
                {/* Header */}
                <header className="flex items-center justify-between border-b px-6 py-3.5 h-16">
                    <h1 className="text-xl font-semibold">Venue Management</h1>
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
                        {role === "SUPER_ADMIN" || role === "VENUE_OWNER" ? (
                            <Button
                                onClick={() => {
                                    setEditingVenue(null); // Clear editing state
                                    setIsAddVenueOpen(true);
                                }}
                                size="sm"
                                className="gap-1"
                                disabled={isMutating}
                            >
                                <Plus className="h-4 w-4" />
                                Add Venue
                            </Button>
                        ) : (
                            <Button
                                size="sm"
                                className="gap-1"
                                onClick={() => setIsReservationDialogOpen(true)}
                                disabled={isMutating} // Disable if any mutation is happening
                            >
                                <Calendar className="h-4 w-4" />
                                Reserve Venue
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
                    {/* Add other stats cards here */}
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
                                {role === "SUPER_ADMIN" && (
                                    <TabsTrigger value="table">
                                        Table
                                    </TabsTrigger>
                                )}
                                <TabsTrigger value="grid">
                                    {role === "SUPER_ADMIN" ? "Grid" : "Venues"}
                                </TabsTrigger>
                                {/* Separate tab for user's reservations */}
                                <TabsTrigger value="reservations">
                                    My Reservations
                                </TabsTrigger>
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
                    {/* Table View (SUPER_ADMIN only) */}
                    {viewMode === "table" && role === "SUPER_ADMIN" && (
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
                                    <TableHead>Owner</TableHead>
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
                                        <TableRow key={venue.id}>
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
                                                                venue.id,
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
                                            <TableCell>
                                                {venue.venueOwner ? (
                                                    <div
                                                        title={`${venue.venueOwner.firstName} ${venue.venueOwner.lastName} (${venue.venueOwner.email})`}
                                                    >
                                                        {
                                                            venue.venueOwner
                                                                .firstName
                                                        }{" "}
                                                        {
                                                            venue.venueOwner
                                                                .lastName
                                                        }
                                                        <div className="text-xs text-muted-foreground truncate">
                                                            {
                                                                venue.venueOwner
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
                                                                Venue Actions
                                                            </span>
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem
                                                            onClick={() =>
                                                                handleNavigate(
                                                                    venue.id,
                                                                )
                                                            }
                                                        >
                                                            <Eye className="mr-2 h-4 w-4" />{" "}
                                                            View
                                                        </DropdownMenuItem>
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
                                                                    venue.id,
                                                                );
                                                                setIsDeleteDialogOpen(
                                                                    true,
                                                                );
                                                            }}
                                                            disabled={
                                                                deleteVenueMutation.isPending &&
                                                                deleteVenueMutation.variables ===
                                                                    venue.id
                                                            }
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />{" "}
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={6}
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
                                        key={venue.id}
                                        className="overflow-hidden flex flex-col group"
                                    >
                                        <div className="aspect-video w-full overflow-hidden relative">
                                            <img
                                                src={venue.imagePath ?? null} // Construct URL
                                                alt={venue.name}
                                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                onError={(e) => {
                                                    e.currentTarget.src =
                                                        "/placeholder.svg";
                                                }}
                                                loading="lazy"
                                            />
                                            {role === "SUPER_ADMIN" && (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger
                                                        asChild
                                                    >
                                                        <Button
                                                            variant="secondary"
                                                            size="icon"
                                                            className="absolute top-2 right-2 h-7 w-7 opacity-80 group-hover:opacity-100"
                                                            disabled={
                                                                isMutating
                                                            }
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
                                                                    venue.id,
                                                                )
                                                            }
                                                        >
                                                            <Eye className="mr-2 h-4 w-4" />{" "}
                                                            View Details
                                                        </DropdownMenuItem>
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
                                                                    venue.id,
                                                                );
                                                                setIsDeleteDialogOpen(
                                                                    true,
                                                                );
                                                            }}
                                                            disabled={
                                                                deleteVenueMutation.isPending &&
                                                                deleteVenueMutation.variables ===
                                                                    venue.id
                                                            }
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />{" "}
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            )}
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
                            <h2 className="text-lg font-semibold mb-4">
                                My Venue Reservations
                            </h2>
                            {isLoadingOwnReservations ? (
                                <p className="text-muted-foreground">
                                    Loading reservations...
                                </p>
                            ) : ownReservations.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Venue</TableHead>
                                            <TableHead>Event</TableHead>
                                            <TableHead>Start Time</TableHead>
                                            <TableHead>End Time</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {ownReservations.map((res) => (
                                            <TableRow key={res.id}>
                                                <TableCell>
                                                    {res.venueName ?? "N/A"}
                                                </TableCell>
                                                <TableCell>
                                                    {res.eventName ?? "N/A"}
                                                </TableCell>
                                                <TableCell>
                                                    {formatDateTime(
                                                        res.startTime,
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {formatDateTime(
                                                        res.endTime,
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            className={getStatusBadgeClass(
                                                                res.status,
                                                            )}
                                                        >
                                                            {res.status}
                                                        </Badge>
                                                    </TableCell>
                                                </TableCell>
                                                <TableCell>
                                                    {/* Add actions like View Details, Cancel */}
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() =>
                                                            navigate({
                                                                to: `/app/reservations/${res.id}`,
                                                            })
                                                        }
                                                    >
                                                        View
                                                    </Button>
                                                    {/* Add Cancel button if applicable */}
                                                    {/* {res.status === 'PENDING' && <CancelReservationButton reservationId={res.id} />} */}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <div className="text-center text-muted-foreground py-8 border rounded-md bg-muted/20">
                                    You have no venue reservations.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Dialogs */}
            {/* Reservation Dialog (for non-admins) */}
            <VenueReservationFormDialog
                isOpen={isReservationDialogOpen}
                onClose={() => {
                    setIsReservationDialogOpen(false);
                    setReservingVenueId(undefined); // Clear pre-selected venue on close
                }}
                onSubmit={handleReservationSubmit} // Use the updated handler
                venues={venues.map((v) => ({
                    // Pass only necessary fields
                    id: v.id,
                    name: v.name,
                    location: v.location,
                    imagePath: v.imagePath,
                }))}
                events={events.map((e) => ({
                    id: e.id,
                    eventName: e.eventName,
                    startTime: e.startTime,
                    endTime: e.endTime,
                }))}
                departments={departments}
                isLoading={createReservationMutation.isPending} // Pass loading state
                initialVenueId={reservingVenueId} // Pass the ID for pre-selection
            />
            {/* Add/Edit Dialog (SUPER_ADMIN only) */}
            {(role === "SUPER_ADMIN" || role === "VENUE_OWNER") && (
                <>
                    <VenueFormDialog
                        isOpen={isAddVenueOpen}
                        onClose={() => {
                            setIsAddVenueOpen(false);
                            setEditingVenue(null);
                        }}
                        onSubmit={handleAddOrEditSubmit} // Use combined handler
                        venue={editingVenue || undefined} // Pass editing venue or undefined
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
                        description={`Are you sure you want to delete the venue "${venues.find((v) => v.id === venueToDelete)?.name}"? This action cannot be undone.`}
                        isDeleting={deleteVenueMutation.isPending}
                    />
                </>
            )}
        </div>
    );
}
