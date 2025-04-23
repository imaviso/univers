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
import { usersQueryOptions, venuesQueryOptions } from "@/lib/query";
import type { VenueInput } from "@/lib/schema";
import { DEPARTMENTS, type UserType, type Venue } from "@/lib/types";
import { useMutation, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import {
    createFileRoute,
    useNavigate,
    useRouteContext,
} from "@tanstack/react-router";
import { format } from "date-fns";
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
    Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/venues/dashboard")({
    component: VenueManagement,
    loader: ({ context: { queryClient } }) =>
        queryClient.ensureQueryData(venuesQueryOptions),
});

export function VenueManagement() {
    const context = useRouteContext({ from: "/app/venues" });
    const role = context.authState?.role;
    const queryClient = context.queryClient;
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedItems, setSelectedItems] = useState<number[]>([]);
    const [isAddVenueOpen, setIsAddVenueOpen] = useState(false);
    const [editingVenue, setEditingVenue] = useState<Venue | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [venueToDelete, setVenueToDelete] = useState<number | null>(null);
    const [viewMode, setViewMode] = useState<"table" | "grid" | "reservations">(
        role === "SUPER_ADMIN" ? "table" : "grid",
    );
    const [isReservationDialogOpen, setIsReservationDialogOpen] =
        useState(false);
    // --- Queries ---
    // Fetch venues using React Query
    const { data: venues = [] } = useSuspenseQuery(venuesQueryOptions);
    const { data: users = [] } = useQuery({
        ...usersQueryOptions,
        enabled: role === "SUPER_ADMIN", // Only enable query if user is SUPER_ADMIN
    });

    // Derive venueOwners only if users were fetched
    const venueOwners =
        role === "SUPER_ADMIN" && users
            ? users.filter((user: UserType) => user.role === "VENUE_OWNER")
            : []; // Default to empty array if not SUPER_ADMIN or users not loaded yet
    // --- End Queries ---

    // --- Mutations ---
    const createVenueMutation = useMutation({
        mutationFn: createVenue,
        onMutate: async (newVenueData: VenueInput) => {
            await queryClient.cancelQueries({
                queryKey: venuesQueryOptions.queryKey,
            });
            const previousVenues = queryClient.getQueryData<Venue[]>(
                venuesQueryOptions.queryKey,
            );
            // Optimistic update (basic - no real ID/timestamps)
            queryClient.setQueryData<Venue[]>(
                venuesQueryOptions.queryKey,
                (old = []) => [
                    ...old,
                    {
                        ...newVenueData,
                        id: Math.random(), // Temporary ID
                        image:
                            typeof newVenueData.image === "object"
                                ? URL.createObjectURL(
                                      newVenueData.image as File,
                                  )
                                : newVenueData.image, // Handle File preview
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                    } as Venue,
                ],
            );
            return { previousVenues };
        },
        onError: (err, newVenueData, context) => {
            if (context?.previousVenues) {
                queryClient.setQueryData(
                    venuesQueryOptions.queryKey,
                    context.previousVenues,
                );
            }
            toast.error(
                `Failed to create venue: ${err instanceof Error ? err.message : "Unknown error"}`,
            );
        },
        onSuccess: () => {
            toast.success("Venue created successfully");
            setIsAddVenueOpen(false);
        },
        onSettled: () => {
            queryClient.invalidateQueries({
                queryKey: venuesQueryOptions.queryKey,
            });
        },
    });

    const updateVenueMutation = useMutation({
        mutationFn: updateVenue,
        onMutate: async (updatedVenueData: Venue) => {
            await queryClient.cancelQueries({
                queryKey: venuesQueryOptions.queryKey,
            });
            const previousVenues = queryClient.getQueryData<Venue[]>(
                venuesQueryOptions.queryKey,
            );
            queryClient.setQueryData<Venue[]>(
                venuesQueryOptions.queryKey,
                (old = []) =>
                    old.map((venue) =>
                        venue.id === updatedVenueData.id
                            ? updatedVenueData
                            : venue,
                    ),
            );
            return { previousVenues, updatedVenueData };
        },
        onError: (err, updatedVenueData, context) => {
            if (context?.previousVenues) {
                queryClient.setQueryData(
                    venuesQueryOptions.queryKey,
                    context.previousVenues,
                );
            }
            toast.error(
                `Failed to update venue: ${err instanceof Error ? err.message : "Unknown error"}`,
            );
        },
        onSuccess: () => {
            toast.success("Venue updated successfully");
            setIsAddVenueOpen(false);
            setEditingVenue(null);
        },
        onSettled: (updatedVenueData) => {
            queryClient.invalidateQueries({
                queryKey: venuesQueryOptions.queryKey,
            });
            // Optionally invalidate specific venue query if you have one
            // queryClient.invalidateQueries({ queryKey: ['venue', updatedVenueData?.id] });
        },
    });

    const deleteVenueMutation = useMutation({
        mutationFn: deleteVenue,
        onMutate: async (venueId: number) => {
            await queryClient.cancelQueries({
                queryKey: venuesQueryOptions.queryKey,
            });
            const previousVenues = queryClient.getQueryData<Venue[]>(
                venuesQueryOptions.queryKey,
            );
            queryClient.setQueryData<Venue[]>(
                venuesQueryOptions.queryKey,
                (old = []) => old.filter((venue) => venue.id !== venueId),
            );
            return { previousVenues };
        },
        onError: (err, venueId, context) => {
            if (context?.previousVenues) {
                queryClient.setQueryData(
                    venuesQueryOptions.queryKey,
                    context.previousVenues,
                );
            }
            toast.error(
                `Failed to delete venue: ${err instanceof Error ? err.message : "Unknown error"}`,
            );
        },
        onSuccess: () => {
            toast.success("Venue deleted successfully");
            setIsDeleteDialogOpen(false);
            setVenueToDelete(null);
        },
        onSettled: () => {
            queryClient.invalidateQueries({
                queryKey: venuesQueryOptions.queryKey,
            });
        },
    });

    // const deleteVenuesMutation = useMutation({
    //     mutationFn: deleteVenues, // Assumes API function exists: deleteVenues(ids: number[])
    //     onMutate: async (venueIds: number[]) => {
    //         await queryClient.cancelQueries({
    //             queryKey: venuesQueryOptions.queryKey,
    //         });
    //         const previousVenues = queryClient.getQueryData<Venue[]>(
    //             venuesQueryOptions.queryKey,
    //         );
    //         queryClient.setQueryData<Venue[]>(
    //             venuesQueryOptions.queryKey,
    //             (old = []) =>
    //                 old.filter((venue) => !venueIds.includes(venue.id)),
    //         );
    //         return { previousVenues };
    //     },
    //     onError: (err, venueIds, context) => {
    //         if (context?.previousVenues) {
    //             queryClient.setQueryData(
    //                 venuesQueryOptions.queryKey,
    //                 context.previousVenues,
    //             );
    //         }
    //         toast.error(
    //             `Failed to delete venues: ${err instanceof Error ? err.message : "Unknown error"}`,
    //         );
    //     },
    //     onSuccess: (data, venueIds) => {
    //         toast.success(`Successfully deleted ${venueIds.length} venue(s)`);
    //         setIsDeleteDialogOpen(false);
    //         setSelectedItems([]); // Clear selection
    //     },
    //     onSettled: () => {
    //         queryClient.invalidateQueries({
    //             queryKey: venuesQueryOptions.queryKey,
    //         });
    //     },
    // });
    // // --- End Mutations ---

    // --- Event Handlers ---
    const handleReservationSubmit = (data: Record<string, unknown>) => {
        // Use specific type if available
        console.log("Reservation data:", data);
        // TODO: Implement reservation mutation
        setIsReservationDialogOpen(false);
    };

    const handleNavigate = (venueId: number) => {
        navigate({ from: Route.fullPath, to: `/app/venues/${venueId}` });
    };

    // Filter venues based on search query (name and location)
    const filteredVenues = venues.filter((venue) => {
        const matchesSearch =
            venue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            venue.location.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
    });

    // Simplified stats
    const stats = {
        total: venues.length,
    };

    // Handle bulk selection
    const handleSelectAll = () => {
        if (selectedItems.length === filteredVenues.length) {
            setSelectedItems([]);
        } else {
            setSelectedItems(filteredVenues.map((venue) => venue.id));
        }
    };

    const handleSelectItem = (itemId: number) => {
        setSelectedItems((prev) =>
            prev.includes(itemId)
                ? prev.filter((id) => id !== itemId)
                : [...prev, itemId],
        );
    };

    // Use mutations in handlers
    const handleAddVenueSubmit = (venueData: VenueInput) => {
        // The VenueFormDialog should ideally return VenueInput
        // The API function createVenue should handle potential file upload
        createVenueMutation.mutate(venueData);
    };

    const handleEditVenueSubmit = (venueData: VenueInput) => {
        if (!editingVenue) return;
        // Construct the full Venue object expected by the API
        // The API function updateVenue should handle potential file upload
        const updatedVenue: Venue = {
            ...editingVenue, // Keep existing ID, createdAt
            ...venueData,
            // Image handling depends on how VenueFormDialog and API work
            // If venueData.image is a File, API needs FormData. If it's a URL string, it's simpler.
            image:
                typeof venueData.image === "object"
                    ? editingVenue.image
                    : venueData.image, // Example: Keep old image URL if new one isn't a string
            updatedAt: new Date().toISOString(), // Update timestamp locally for optimistic update
            // Ensure venueOwnerId is a number if present
            venueOwnerId: venueData.venueOwnerId ?? editingVenue.venueOwnerId,
        };
        updateVenueMutation.mutate(updatedVenue);
    };

    const handleDeleteConfirm = () => {
        if (venueToDelete) {
            deleteVenueMutation.mutate(venueToDelete);
        }
        // else if (selectedItems.length > 0) {
        //     deleteVenuesMutation.mutate(selectedItems);
        // }
    };

    // Helper to format date strings
    const formatDateTime = (dateString: string | null) => {
        if (!dateString) return "—";
        try {
            return format(new Date(dateString), "MMM d, yyyy h:mm a");
        } catch (e) {
            console.error("Error formatting date:", dateString, e);
            return "Invalid Date";
        }
    };
    // --- End Event Handlers ---

    // --- Render Logic ---
    const isMutating =
        createVenueMutation.isPending ||
        updateVenueMutation.isPending ||
        deleteVenueMutation.isPending;
    // || deleteVenuesMutation.isPending;

    return (
        <div className="bg-background">
            <div className="flex flex-col flex-1 overflow-hidden">
                <header className="flex items-center justify-between border-b px-6 py-3.5">
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
                        {role === "SUPER_ADMIN" ? (
                            <Button
                                onClick={() => setIsAddVenueOpen(true)}
                                size="sm"
                                className="gap-1"
                            >
                                <Plus className="h-4 w-4" />
                                Add Venue
                            </Button>
                        ) : (
                            <Button
                                size="sm"
                                className="gap-1"
                                onClick={() => setIsReservationDialogOpen(true)}
                            >
                                <Plus className="h-4 w-4" />
                                Reserve Venue
                            </Button>
                        )}
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-3 gap-4 p-6 pb-0">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">
                                Total Venues
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats.total}
                            </div>
                        </CardContent>
                    </Card>
                    {/* Add other stats cards if needed */}
                </div>

                <div className="flex items-center justify-between border-b px-6 py-2">
                    <div className="flex items-center gap-2">
                        {selectedItems.length > 0 ? (
                            <>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="gap-1 text-destructive"
                                    onClick={() => setIsDeleteDialogOpen(true)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Delete Selected
                                </Button>
                                <span className="text-sm text-muted-foreground">
                                    {selectedItems.length} venue
                                    {selectedItems.length > 1 ? "s" : ""}{" "}
                                    selected
                                </span>
                            </>
                        ) : (
                            <span className="text-sm text-muted-foreground">
                                {filteredVenues.length} venue
                                {filteredVenues.length !== 1 ? "s" : ""}
                            </span>
                        )}
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
                                {/* Keep reservations tab separate if needed, or integrate */}
                                <TabsTrigger value="reservations">
                                    My Reservations
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                        {/* Removed Filters and Export for simplicity */}
                    </div>
                </div>

                <div className="flex-1 overflow-auto p-6">
                    {/* Table View */}
                    {viewMode === "table" && role === "SUPER_ADMIN" && (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[40px]">
                                        <Checkbox
                                            checked={
                                                selectedItems.length > 0 &&
                                                selectedItems.length ===
                                                    filteredVenues.length
                                            }
                                            onCheckedChange={handleSelectAll}
                                            aria-label="Select all venues"
                                        />
                                    </TableHead>
                                    <TableHead>Venue</TableHead>{" "}
                                    {/* Combined Name/Image */}
                                    <TableHead>Location</TableHead>
                                    <TableHead>Owner ID</TableHead>
                                    <TableHead>Created At</TableHead>
                                    <TableHead>Updated At</TableHead>
                                    <TableHead className="w-[80px]">
                                        Actions
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredVenues.map((venue) => (
                                    <TableRow key={venue.id}>
                                        <TableCell>
                                            <Checkbox
                                                checked={selectedItems.includes(
                                                    venue.id,
                                                )}
                                                onCheckedChange={() =>
                                                    handleSelectItem(venue.id)
                                                }
                                                aria-label={`Select venue ${venue.name}`}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-md overflow-hidden bg-muted flex-shrink-0">
                                                    <img
                                                        src={
                                                            venue.image ||
                                                            "/placeholder.svg"
                                                        }
                                                        alt={venue.name}
                                                        className="h-full w-full object-cover"
                                                    />
                                                </div>
                                                <Button
                                                    variant="link"
                                                    className="p-0 h-auto text-left justify-start font-medium truncate"
                                                    onClick={() =>
                                                        handleNavigate(venue.id)
                                                    }
                                                >
                                                    {venue.name}
                                                </Button>
                                            </div>
                                        </TableCell>
                                        <TableCell className="truncate max-w-xs">
                                            {venue.location}
                                        </TableCell>
                                        <TableCell>
                                            {venue.venueOwnerId}
                                        </TableCell>
                                        <TableCell>
                                            {formatDateTime(venue.createdAt)}
                                        </TableCell>
                                        <TableCell>
                                            {formatDateTime(venue.updatedAt)}
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
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />{" "}
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {filteredVenues.length === 0 && (
                                    <TableRow>
                                        <TableCell
                                            colSpan={7} // Adjusted colspan
                                            className="text-center py-8 text-muted-foreground"
                                        >
                                            No venues found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                    {/* Grid View */}
                    {viewMode === "grid" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {filteredVenues.map((venue) => (
                                <Card
                                    key={venue.id}
                                    className="overflow-hidden flex flex-col cursor-pointer hover:shadow-md transition-shadow"
                                    onClick={() => handleNavigate(venue.id)}
                                >
                                    <div className="aspect-video w-full overflow-hidden">
                                        <img
                                            src={
                                                venue.image ||
                                                "/placeholder.svg"
                                            }
                                            alt={venue.name}
                                            className="h-full w-full object-cover"
                                        />
                                    </div>
                                    <CardHeader>
                                        <CardTitle
                                            className="text-base font-semibold truncate"
                                            title={venue.name}
                                        >
                                            {venue.name}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="text-sm text-muted-foreground flex-grow">
                                        <div className="flex items-start gap-1.5">
                                            <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                            <span className="line-clamp-2">
                                                {venue.location}
                                            </span>
                                        </div>
                                    </CardContent>
                                    {/* Optional Footer for quick info */}
                                    {/* <CardFooter className="text-xs text-muted-foreground pt-2 pb-3">
                                        <span>Owner ID: {venue.venueOwnerId}</span>
                                    </CardFooter> */}
                                </Card>
                            ))}
                            {filteredVenues.length === 0 && (
                                <div className="col-span-full text-center py-8 text-muted-foreground">
                                    No venues found.
                                </div>
                            )}
                        </div>
                    )}

                    {/* Reservations View */}
                    {viewMode === "reservations" && (
                        <div className="text-center text-muted-foreground py-8">
                            Reservation list placeholder.
                            {/* Add reservation listing component here */}
                        </div>
                    )}
                </div>
            </div>

            {/* Dialogs */}
            <VenueReservationFormDialog
                isOpen={isReservationDialogOpen}
                onClose={() => setIsReservationDialogOpen(false)}
                onSubmit={handleReservationSubmit}
                // Pass necessary props like venues list, event types, departments
                venues={venues.map((v) => ({
                    id: v.id.toString(),
                    name: v.name,
                }))} // Simplified for selection
                departments={DEPARTMENTS.map((d) => d.label)} // Make sure DEPARTMENTS is imported/defined
                isLoading={false} // Pass loading state if applicable
            />

            {role === "SUPER_ADMIN" && (
                <>
                    <VenueFormDialog
                        isOpen={isAddVenueOpen}
                        onClose={() => {
                            setIsAddVenueOpen(false);
                            setEditingVenue(null);
                        }}
                        onSubmit={
                            editingVenue
                                ? handleEditVenueSubmit
                                : handleAddVenueSubmit
                        }
                        venue={editingVenue}
                        isLoading={
                            createVenueMutation.isPending ||
                            updateVenueMutation.isPending
                        }
                        venueOwners={venueOwners}
                    />
                    <DeleteConfirmDialog
                        isOpen={isDeleteDialogOpen}
                        onClose={() => {
                            setIsDeleteDialogOpen(false);
                            setVenueToDelete(null);
                        }}
                        onConfirm={handleDeleteConfirm}
                        title={
                            venueToDelete
                                ? "Delete Venue"
                                : "Delete Selected Venues"
                        }
                        description={
                            venueToDelete
                                ? `Are you sure you want to delete the venue "${venues.find((v) => v.id === venueToDelete)?.name}"? This action cannot be undone.`
                                : `Are you sure you want to delete ${selectedItems.length} selected venue(s)? This action cannot be undone.`
                        }
                        isLoading={
                            deleteVenueMutation.isPending
                            // ||
                            // deleteVenuesMutation.isPending
                        }
                    />
                </>
            )}
        </div>
    );
}
