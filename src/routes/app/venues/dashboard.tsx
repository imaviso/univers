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
import { DEPARTMENTS } from "@/lib/types";
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

export const Route = createFileRoute("/app/venues/dashboard")({
    component: VenueManagement,
});

export const initialVenues = [
    {
        id: 1,
        name: "Main Conference Hall",
        location: "123 Convention Center Way, New York, NY 10001",
        venueOwnerId: 101,
        image: "/placeholder.svg?text=Venue+1&height=200&width=300", // Added image
        createdAt: new Date("2024-01-15T10:00:00Z").toISOString(),
        updatedAt: new Date("2024-04-10T14:30:00Z").toISOString(),
    },
    {
        id: 2,
        name: "Workshop Room A",
        location: "123 Convention Center Way, New York, NY 10001",
        venueOwnerId: 102,
        image: "/placeholder.svg?text=Venue+2&height=200&width=300", // Added image
        createdAt: new Date("2024-01-20T09:00:00Z").toISOString(),
        updatedAt: new Date("2024-03-25T11:00:00Z").toISOString(),
    },
    {
        id: 3,
        name: "Executive Boardroom",
        location: "555 Business Plaza, New York, NY 10022",
        venueOwnerId: 101,
        image: "/placeholder.svg?text=Venue+3&height=200&width=300", // Added image
        createdAt: new Date("2024-02-01T11:30:00Z").toISOString(),
        updatedAt: new Date("2024-04-15T09:45:00Z").toISOString(),
    },
    {
        id: 4,
        name: "Outdoor Pavilion",
        location: "789 Park Avenue, New York, NY 10065",
        venueOwnerId: 103,
        image: "/placeholder.svg?text=Venue+4&height=200&width=300", // Added image
        createdAt: new Date("2024-02-10T16:00:00Z").toISOString(),
        updatedAt: new Date("2024-04-01T08:15:00Z").toISOString(),
    },
    {
        id: 5,
        name: "Auditorium",
        location: "321 Education Lane, New York, NY 10003",
        venueOwnerId: 102,
        image: "/placeholder.svg?text=Venue+5&height=200&width=300", // Added image
        createdAt: new Date("2024-03-05T13:00:00Z").toISOString(),
        updatedAt: new Date("2024-04-18T10:00:00Z").toISOString(),
    },
];
// --- END NEW MOCK DATA STRUCTURE ---

// Define the type for the new Venue structure
type Venue = {
    id: number;
    name: string;
    location: string;
    venueOwnerId: number;
    image?: string; // Added optional image field
    createdAt: string; // Use string for ISO date format
    updatedAt: string; // Use string for ISO date format
};

const eventTypes = [
    { id: "1", name: "Conference" },
    { id: "2", name: "Workshop" },
    { id: "3", name: "Seminar" },
    { id: "4", name: "Meeting" },
    { id: "5", name: "Social Event" },
    { id: "6", name: "Other" },
];

export function VenueManagement() {
    const context = useRouteContext({ from: "/app/venues" });
    const role = "role" in context ? context.role : "USER";
    const navigate = useNavigate();
    const [venues, setVenues] = useState(initialVenues);
    const [searchQuery, setSearchQuery] = useState("");
    const [typeFilter, setTypeFilter] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const [selectedItems, setSelectedItems] = useState<number[]>([]);
    const [isAddVenueOpen, setIsAddVenueOpen] = useState(false);
    const [editingVenue, setEditingVenue] = useState<any>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [venueToDelete, setVenueToDelete] = useState<number | null>(null);
    const [viewMode, setViewMode] = useState<"table" | "grid" | "reservations">(
        role === "SUPER_ADMIN" ? "table" : "grid",
    );

    const [isReservationDialogOpen, setIsReservationDialogOpen] =
        useState(false);

    const handleReservationSubmit = (data) => {
        console.log("Reservation data:", data);
        // Submit to your API here
        setIsReservationDialogOpen(false);
    };
    const handleNavigate = (venueId: number) => {
        navigate({ from: Route.fullPath, to: `/app/venues/${venueId}` });
    };

    const filteredVenues = venues.filter((venue) => {
        const matchesSearch =
            venue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            venue.location.toLowerCase().includes(searchQuery.toLowerCase());
        // Add back type/status filters if needed and if those fields exist on Venue
        // const matchesType = typeFilter ? venue.type === typeFilter : true;
        // const matchesStatus = statusFilter ? venue.status === statusFilter : true;
        return matchesSearch; // && matchesType && matchesStatus;
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
        if (selectedItems.includes(itemId)) {
            setSelectedItems(selectedItems.filter((id) => id !== itemId));
        } else {
            setSelectedItems([...selectedItems, itemId]);
        }
    };

    // Handle venue operations
    const handleAddVenue = (
        venueData: Omit<Venue, "id" | "createdAt" | "updatedAt">,
    ) => {
        const newVenue: Venue = {
            id: Math.max(0, ...venues.map((v) => v.id)) + 1, // Simple ID generation
            ...venueData,
            // Image URL might come from venueData if form handles upload, or use placeholder
            image:
                venueData.image ||
                `/placeholder.svg?text=New+Venue&height=200&width=300`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        setVenues([...venues, newVenue]);
        setIsAddVenueOpen(false);
    };

    const handleEditVenue = (venueData: Venue) => {
        setVenues(
            venues.map((venue) =>
                venue.id === venueData.id ? { ...venue, ...venueData } : venue,
            ),
        );
        setEditingVenue(null);
    };

    const handleDeleteVenue = (itemId: number) => {
        setVenues(venues.filter((venue) => venue.id !== itemId));
        setVenueToDelete(null);
        setIsDeleteDialogOpen(false);
    };

    const handleBulkDelete = () => {
        setVenues(venues.filter((venue) => !selectedItems.includes(venue.id)));
        setSelectedItems([]);
        setIsDeleteDialogOpen(false);
    };

    const formatDateTime = (dateString: string | null) => {
        if (!dateString) return "—";
        try {
            return format(new Date(dateString), "MMM d, yyyy h:mm a");
        } catch (e) {
            console.error("Error formatting date:", dateString, e);
            return "Invalid Date";
        }
    };

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
                            editingVenue ? handleEditVenue : handleAddVenue
                        }
                        venue={editingVenue}
                        // Pass necessary props like venueTypes, amenities if needed by the form
                    />
                    <DeleteConfirmDialog
                        isOpen={isDeleteDialogOpen}
                        onClose={() => {
                            setIsDeleteDialogOpen(false);
                            setVenueToDelete(null);
                        }}
                        onConfirm={() => {
                            if (venueToDelete) {
                                handleDeleteVenue(venueToDelete);
                            } else if (selectedItems.length > 0) {
                                handleBulkDelete();
                            }
                        }}
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
                    />
                </>
            )}
        </div>
    );
}
