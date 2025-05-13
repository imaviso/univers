import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DeleteConfirmDialog } from "@/components/user-management/deleteConfirmDialog";
import { VenueGrid } from "@/components/venue/VenueGrid";
import { VenueTable } from "@/components/venue/VenueTable";
import { VenueFormDialog } from "@/components/venue/venueFormDialog";
import { createVenue, deleteVenue, updateVenue } from "@/lib/api";
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
    HelpCircle,
    MapPin,
    Plus,
    UserCheck,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

// Moved formatDateTime to VenueTable.tsx and kept a global one in dashboard for VenueGrid if needed (or de-duplicate)
// For now, assuming dashboard's formatDateTime is still used by dialogs or other parts.
const formatGlobalDateTime = (
    dateString: string | null | undefined,
): string => {
    if (!dateString) return "—";
    try {
        return format(new Date(dateString), "MMM d, yyyy h:mm a");
    } catch (e) {
        console.error("Error formatting date:", dateString, e);
        return "Invalid Date";
    }
};

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
    const role = context.authState?.role;
    const currentUser = context.authState; // Get full user object
    const queryClient = context.queryClient;
    const navigate = useNavigate();
    // State variables
    const [isAddVenueOpen, setIsAddVenueOpen] = useState(false);
    const [editingVenue, setEditingVenue] = useState<VenueDTO | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [venueToDelete, setVenueToDelete] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<"table" | "grid" | "events">(
        role === "SUPER_ADMIN" || role === "VENUE_OWNER" ? "table" : "grid",
    );
    const [activeEventTab, setActiveEventTab] = useState("all");

    // React Table States - MOVED to VenueTable.tsx
    const { data: venues = [] } = useSuspenseQuery(venuesQueryOptions);
    const { data: users = [] } = useQuery({
        ...usersQueryOptions,
        enabled: role === "SUPER_ADMIN",
    });

    const { data: ownEvents = [], isLoading: isLoadingOwnEvents } = useQuery({
        ...ownEventsQueryOptions,
        enabled: viewMode === "events" && role !== "SUPER_ADMIN",
    });

    const venueOwners =
        role === "SUPER_ADMIN"
            ? users.filter((user: UserDTO) => user.role === "VENUE_OWNER")
            : [];

    // Wrap handleNavigate in useCallback
    const handleNavigate = useCallback(
        (venueId: string) => {
            navigate({ to: `/app/venues/${venueId}` });
        },
        [navigate],
    );

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

    const deleteVenueMutation = useMutation({
        mutationFn: deleteVenue,
        onSuccess: () => {
            toast.success("Venue deleted successfully.");
            queryClient.invalidateQueries({
                queryKey: venuesQueryOptions.queryKey,
            });
            setIsDeleteDialogOpen(false);
            setVenueToDelete(null);
        },
        onError: () => {
            toast.error("Failed to delete venue.");
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

    // Filter venues
    const baseVenuesToDisplay =
        role === "VENUE_OWNER" && currentUser?.publicId
            ? venues.filter(
                  (venue) =>
                      venue.venueOwner?.publicId === currentUser.publicId,
              )
            : venues;

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

    // Moved isMutating definition before venueTableColumns
    const isMutating =
        createVenueMutation.isPending ||
        updateVenueMutation.isPending ||
        deleteVenueMutation.isPending;

    // --- Helper Functions for Card Actions ---
    const handleEditClick = useCallback((venue: VenueDTO) => {
        setEditingVenue(venue);
        setIsAddVenueOpen(true);
    }, []);

    const handleDeleteClick = useCallback((venueId: string) => {
        setVenueToDelete(venueId);
        setIsDeleteDialogOpen(true);
    }, []);

    // --- Render Logic ---
    return (
        <div className="bg-background">
            <div className="flex flex-col flex-1 overflow-hidden">
                {/* Header */}
                <header className="flex items-center justify-between border-b px-6 py-3.5 h-16">
                    <h1 className="text-xl font-semibold">Venues</h1>
                    <div className="flex items-center gap-2">
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
                        {/* DataTableFilter will be placed here or nearby */}
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
                                {/* Separate tab for user's events */}
                                {role !== "SUPER_ADMIN" && (
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
                    {/* Filter component and column toggle for Table View - MOVED to VenueTable.tsx */}
                    {viewMode === "table" &&
                        (role === "SUPER_ADMIN" || role === "VENUE_OWNER") && (
                            <VenueTable
                                venues={baseVenuesToDisplay}
                                role={role}
                                isMutating={isMutating}
                                onNavigate={handleNavigate}
                                onEdit={handleEditClick}
                                onDelete={handleDeleteClick}
                            />
                        )}

                    {/* Grid View */}
                    {viewMode === "grid" && (
                        <VenueGrid
                            venues={baseVenuesToDisplay}
                            isMutating={isMutating}
                            role={role}
                            onNavigate={handleNavigate}
                            onEdit={handleEditClick}
                            onDelete={handleDeleteClick}
                        />
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
                                                        {formatGlobalDateTime(
                                                            event.startTime,
                                                        )}
                                                    </span>
                                                </div>
                                                <div className="flex items-start gap-1.5">
                                                    <CalendarDays className="h-4 w-4 mt-0.5 flex-shrink-0 opacity-0" />
                                                    <span>
                                                        {formatGlobalDateTime(
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
