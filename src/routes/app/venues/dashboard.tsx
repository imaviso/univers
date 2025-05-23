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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DeleteConfirmDialog } from "@/components/user-management/deleteConfirmDialog";
import { VenueDataTable } from "@/components/venue/venueDataTable";
import { VenueFormDialog } from "@/components/venue/venueFormDialog";
import { bulkDeleteVenues, createVenue, updateVenue } from "@/lib/api";
import {
    departmentsQueryOptions,
    ownEventsQueryOptions,
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
    CalendarDays,
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
import { useCallback, useEffect, useMemo, useState } from "react";
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

export const Route = createFileRoute("/app/venues/dashboard")({
    component: VenueManagement,
    loader: ({ context: { queryClient } }) => {
        queryClient.ensureQueryData(venuesQueryOptions);
        queryClient.ensureQueryData(ownEventsQueryOptions);
        queryClient.ensureQueryData(departmentsQueryOptions);
    },
});

export function VenueManagement() {
    const context = useRouteContext({ from: "/app/venues" });
    const role = context.authState?.roles || [];
    const currentUser = context.authState;
    const queryClient = context.queryClient;
    const navigate = useNavigate();
    // State variables
    const [searchQuery, setSearchQuery] = usePersistentState<string>(
        "venueDashboardSearchQuery_v1",
        "",
    );
    const [isAddVenueOpen, setIsAddVenueOpen] = useState(false);
    const [editingVenue, setEditingVenue] = useState<VenueDTO | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedVenueIds, setSelectedVenueIds] = useState<string[]>([]);
    const [viewMode, setViewMode] = usePersistentState<
        "table" | "grid" | "events"
    >(
        "venueDashboardViewMode_v1",
        role.includes("SUPER_ADMIN") || role.includes("VENUE_OWNER")
            ? "table"
            : "grid",
    );
    const [activeEventTab, setActiveEventTab] = usePersistentState<string>(
        "venueDashboardActiveEventTab_v1",
        "all",
    );

    const { data: venues = [] } = useSuspenseQuery(venuesQueryOptions);
    const { data: users = [] } = useQuery({
        ...usersQueryOptions,
        enabled: role.includes("SUPER_ADMIN"),
    });

    const { data: ownEvents = [], isLoading: isLoadingOwnEvents } = useQuery({
        ...ownEventsQueryOptions,
        enabled: viewMode === "events" && !role.includes("SUPER_ADMIN"),
    });

    const venueOwners = role.includes("SUPER_ADMIN")
        ? users.filter((user: UserDTO) => user.roles.includes("VENUE_OWNER"))
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
        onError: () => {
            toast.error("Failed to create venue.");
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
        onError: () => {
            toast.error("Failed to update venue.");
        },
    });

    const bulkDeleteVenuesMutation = useMutation({
        mutationFn: bulkDeleteVenues,
        onSuccess: () => {
            toast.success("Selected venues deleted successfully.");
            queryClient.invalidateQueries({
                queryKey: venuesQueryOptions.queryKey,
            });
        },
        onError: () => {
            toast.error("Failed to delete selected venues.");
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
            if (role.includes("VENUE_OWNER") && currentUser?.publicId) {
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
        if (selectedVenueIds.length > 0) {
            bulkDeleteVenuesMutation.mutate(selectedVenueIds);
        }
    };

    // Create a wrapper function that matches the VenueDataTable interface
    const handleSetVenueToDelete = useCallback((id: string | null) => {
        if (id) {
            setSelectedVenueIds([id]);
            setIsDeleteDialogOpen(true);
        } else {
            setSelectedVenueIds([]);
        }
    }, []);

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
        role.includes("VENUE_OWNER") && currentUser?.publicId
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

    // Filter user's own events for the "My Events" tab
    const filteredOwnEvents = useMemo(() => {
        if (!ownEvents) return [];
        return ownEvents.filter((event) => {
            if (activeEventTab === "all") return true;
            return event.status.toLowerCase() === activeEventTab.toLowerCase();
        });
    }, [ownEvents, activeEventTab]);

    // Stats
    const stats = {
        total: baseVenuesToDisplay.length,
        myVenues:
            role.includes("VENUE_OWNER") && currentUser?.publicId
                ? venues.filter(
                      (venue) =>
                          venue.venueOwner?.publicId === currentUser.publicId,
                  ).length
                : 0,
        unassignedVenues: role.includes("SUPER_ADMIN")
            ? venues.filter((venue) => !venue.venueOwner).length
            : 0,
    };

    // --- Render Logic ---
    const isMutating =
        createVenueMutation.isPending ||
        updateVenueMutation.isPending ||
        bulkDeleteVenuesMutation.isPending;

    const handleEditVenue = useCallback((venue: VenueDTO) => {
        setEditingVenue(venue);
        setIsAddVenueOpen(true);
    }, []);

    return (
        <div className="bg-background">
            <div className="flex flex-col flex-1 overflow-hidden">
                {/* Header */}
                <header className="flex items-center justify-between border-b px-6 h-[65px]">
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
                        {role.includes("SUPER_ADMIN") && (
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
                    {role.includes("VENUE_OWNER") && (
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
                    {role.includes("SUPER_ADMIN") && (
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
                                    value as "table" | "grid" | "events",
                                )
                            }
                        >
                            <TabsList>
                                {(role.includes("SUPER_ADMIN") ||
                                    role.includes("VENUE_OWNER")) && (
                                    <TabsTrigger value="table">
                                        Table
                                    </TabsTrigger>
                                )}
                                <TabsTrigger value="grid">
                                    {role.includes("SUPER_ADMIN") ||
                                    role.includes("VENUE_OWNER")
                                        ? "Grid"
                                        : "Venues"}
                                </TabsTrigger>
                                {/* Separate tab for user's events */}
                                {!role.includes("SUPER_ADMIN") && (
                                    <TabsTrigger value="events">
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
                        (role.includes("SUPER_ADMIN") ||
                            role.includes("VENUE_OWNER")) && (
                            <VenueDataTable
                                data={filteredVenues}
                                currentUser={currentUser}
                                venueOwners={venueOwners}
                                handleEditVenue={handleEditVenue}
                                setVenueToDelete={handleSetVenueToDelete}
                                setIsDeleteDialogOpen={setIsDeleteDialogOpen}
                                isDeletingVenue={
                                    bulkDeleteVenuesMutation.isPending
                                }
                                venueToDeleteId={selectedVenueIds[0] ?? null}
                                onBulkDelete={
                                    role.includes("SUPER_ADMIN")
                                        ? (ids) => {
                                              if (ids.length > 0) {
                                                  setSelectedVenueIds(ids);
                                                  setIsDeleteDialogOpen(true);
                                              }
                                          }
                                        : undefined
                                }
                            />
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
                                                    {role.includes(
                                                        "SUPER_ADMIN",
                                                    ) && (
                                                        <>
                                                            <DropdownMenuItem
                                                                onClick={() =>
                                                                    handleEditVenue(
                                                                        venue,
                                                                    )
                                                                }
                                                                disabled={
                                                                    isMutating
                                                                }
                                                            >
                                                                <Edit className="mr-2 h-4 w-4" />{" "}
                                                                Edit
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                className="text-destructive focus:text-destructive"
                                                                onClick={() =>
                                                                    handleSetVenueToDelete(
                                                                        venue.publicId,
                                                                    )
                                                                }
                                                                disabled={
                                                                    bulkDeleteVenuesMutation.isPending &&
                                                                    selectedVenueIds.includes(
                                                                        venue.publicId,
                                                                    )
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

                    {viewMode === "events" && (
                        <div>
                            <Tabs
                                value={activeEventTab}
                                onValueChange={setActiveEventTab}
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

                            {isLoadingOwnEvents ? (
                                <p className="text-muted-foreground">
                                    Loading events...
                                </p>
                            ) : filteredOwnEvents.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {filteredOwnEvents.map((event) => (
                                        <Card
                                            key={event.publicId}
                                            className="overflow-hidden flex flex-col group"
                                        >
                                            <div className="aspect-video w-full overflow-hidden relative">
                                                <img
                                                    src={
                                                        event.imageUrl ??
                                                        event.eventVenue
                                                            .imagePath ??
                                                        "/placeholder.svg"
                                                    }
                                                    alt={
                                                        event.eventName ??
                                                        "Event image"
                                                    }
                                                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                    onError={(e) => {
                                                        e.currentTarget.src =
                                                            "/placeholder.svg";
                                                    }}
                                                    loading="lazy"
                                                />
                                            </div>
                                            <CardHeader className="pb-2 pt-4 px-4 flex flex-row justify-between items-center">
                                                <CardTitle
                                                    className="text-base font-semibold truncate"
                                                    title={
                                                        event.eventName ??
                                                        undefined
                                                    }
                                                >
                                                    {event.eventName ?? "N/A"}
                                                </CardTitle>
                                                <Badge
                                                    className={getStatusBadgeClass(
                                                        event.status,
                                                    )}
                                                >
                                                    {event.status}
                                                </Badge>
                                            </CardHeader>
                                            <CardContent className="text-sm text-muted-foreground flex-grow px-4 pb-3 space-y-1.5">
                                                <div className="flex items-start gap-1.5">
                                                    <Building className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                                    <span
                                                        className="line-clamp-2"
                                                        title={
                                                            event.eventVenue
                                                                .name
                                                        }
                                                    >
                                                        {event.eventVenue.name}
                                                    </span>
                                                </div>
                                                <div className="flex items-start gap-1.5">
                                                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                                    <span
                                                        className="line-clamp-2"
                                                        title={
                                                            event.eventVenue
                                                                .location
                                                        }
                                                    >
                                                        {
                                                            event.eventVenue
                                                                .location
                                                        }
                                                    </span>
                                                </div>
                                                <div className="flex items-start gap-1.5">
                                                    <CalendarDays className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                                    <span>
                                                        {formatDateTime(
                                                            event.startTime,
                                                        )}
                                                    </span>
                                                </div>
                                                <div className="flex items-start gap-1.5">
                                                    <CalendarDays className="h-4 w-4 mt-0.5 flex-shrink-0 opacity-0" />
                                                    <span>
                                                        {formatDateTime(
                                                            event.endTime,
                                                        )}
                                                    </span>
                                                </div>
                                            </CardContent>
                                            <div className="p-4 pt-0 border-t mt-auto">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="w-full"
                                                    onClick={() =>
                                                        navigate({
                                                            to: `/app/events/${event.publicId}`,
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
                                    {activeEventTab !== "all"
                                        ? activeEventTab
                                        : ""}{" "}
                                    events.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {currentUser?.roles.includes("SUPER_ADMIN") && (
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
                        venueOwners={
                            currentUser?.roles.includes("SUPER_ADMIN")
                                ? venueOwners
                                : []
                        }
                        currentUserRole={currentUser?.roles}
                    />
                    <DeleteConfirmDialog
                        isOpen={isDeleteDialogOpen}
                        onClose={() => {
                            setIsDeleteDialogOpen(false);
                            setSelectedVenueIds([]);
                        }}
                        onConfirm={handleDeleteConfirm}
                        title={
                            selectedVenueIds.length > 1
                                ? "Delete Venues"
                                : "Delete Venue"
                        }
                        description={
                            selectedVenueIds.length > 1
                                ? `Are you sure you want to delete ${selectedVenueIds.length} selected venues? This action cannot be undone.`
                                : `Are you sure you want to delete the venue "${venues.find((v) => v.publicId === selectedVenueIds[0])?.name}"? This action cannot be undone.`
                        }
                        isLoading={bulkDeleteVenuesMutation.isPending}
                    />
                </>
            )}
        </div>
    );
}
