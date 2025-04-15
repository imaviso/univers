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
import { VenueFormDialog } from "@/components/venue/venueFormDialog";
import {
    createFileRoute,
    useNavigate,
    useRouteContext,
} from "@tanstack/react-router";
import {
    Building,
    Calendar,
    Download,
    Edit,
    MapPin,
    MoreHorizontal,
    Plus,
    Search,
    Trash2,
    Users,
} from "lucide-react";
import { useState } from "react";
import { VenueReservationFormDialog } from "@/components/venue-reservation/VenueReservationFormDialog";
import { DEPARTMENTS } from "@/lib/types";

export const Route = createFileRoute("/app/venues/dashboard")({
    component: VenueManagement,
});

// Sample venue data
export const initialVenues = [
    {
        id: 1,
        name: "Main Conference Hall",
        address: "123 Convention Center Way, New York, NY 10001",
        type: "Conference Hall",
        capacity: 500,
        status: "available",
        amenities: ["Wi-Fi", "Projector", "Sound System", "Stage", "Catering"],
        contactPerson: "John Smith",
        contactEmail: "john@venueexample.com",
        contactPhone: "(212) 555-1234",
        description:
            "Our largest venue with state-of-the-art AV equipment and flexible seating arrangements.",
        image: "/placeholder.svg?height=200&width=300",
        bookingRate: 65,
        upcomingEvents: 3,
    },
    {
        id: 2,
        name: "Workshop Room A",
        address: "123 Convention Center Way, New York, NY 10001",
        type: "Meeting Room",
        capacity: 50,
        status: "booked",
        amenities: ["Wi-Fi", "Whiteboard", "TV Screen", "Coffee Service"],
        contactPerson: "Sarah Johnson",
        contactEmail: "sarah@venueexample.com",
        contactPhone: "(212) 555-2345",
        description:
            "Perfect for workshops, training sessions, and small group meetings.",
        image: "/placeholder.svg?height=200&width=300",
        bookingRate: 80,
        upcomingEvents: 5,
    },
    {
        id: 3,
        name: "Executive Boardroom",
        address: "555 Business Plaza, New York, NY 10022",
        type: "Boardroom",
        capacity: 20,
        status: "available",
        amenities: [
            "Wi-Fi",
            "Video Conferencing",
            "Smart Board",
            "Refreshments",
        ],
        contactPerson: "Michael Brown",
        contactEmail: "michael@venueexample.com",
        contactPhone: "(212) 555-3456",
        description:
            "Elegant boardroom with premium furnishings and advanced technology for executive meetings.",
        image: "/placeholder.svg?height=200&width=300",
        bookingRate: 45,
        upcomingEvents: 2,
    },
    {
        id: 4,
        name: "Outdoor Pavilion",
        address: "789 Park Avenue, New York, NY 10065",
        type: "Outdoor",
        capacity: 300,
        status: "maintenance",
        amenities: ["Covered Area", "Power Outlets", "Lighting", "Restrooms"],
        contactPerson: "Jennifer Lee",
        contactEmail: "jennifer@venueexample.com",
        contactPhone: "(212) 555-4567",
        description:
            "Beautiful outdoor space with garden views, perfect for receptions and social events.",
        image: "/placeholder.svg?height=200&width=300",
        bookingRate: 30,
        upcomingEvents: 0,
    },
    {
        id: 5,
        name: "Auditorium",
        address: "321 Education Lane, New York, NY 10003",
        type: "Auditorium",
        capacity: 350,
        status: "available",
        amenities: [
            "Wi-Fi",
            "Theater Seating",
            "Advanced AV",
            "Backstage Area",
        ],
        contactPerson: "David Wilson",
        contactEmail: "david@venueexample.com",
        contactPhone: "(212) 555-5678",
        description:
            "Professional auditorium with tiered seating, ideal for presentations and performances.",
        image: "/placeholder.svg?height=200&width=300",
        bookingRate: 55,
        upcomingEvents: 1,
    },
    {
        id: 6,
        name: "Gallery Space",
        address: "456 Arts District, New York, NY 10012",
        type: "Gallery",
        capacity: 150,
        status: "booked",
        amenities: [
            "Wi-Fi",
            "Track Lighting",
            "Open Floor Plan",
            "Catering Prep Area",
        ],
        contactPerson: "Emma Rodriguez",
        contactEmail: "emma@venueexample.com",
        contactPhone: "(212) 555-6789",
        description:
            "Modern, open gallery space perfect for exhibitions, receptions, and networking events.",
        image: "/placeholder.svg?height=200&width=300",
        bookingRate: 75,
        upcomingEvents: 4,
    },
    {
        id: 7,
        name: "Training Center",
        address: "987 Corporate Drive, New York, NY 10017",
        type: "Classroom",
        capacity: 80,
        status: "available",
        amenities: ["Wi-Fi", "Computers", "Projector", "Breakout Areas"],
        contactPerson: "Robert Chen",
        contactEmail: "robert@venueexample.com",
        contactPhone: "(212) 555-7890",
        description:
            "Fully equipped training facility with computer workstations and flexible seating.",
        image: "/placeholder.svg?height=200&width=300",
        bookingRate: 60,
        upcomingEvents: 2,
    },
    {
        id: 8,
        name: "Rooftop Terrace",
        address: "777 Skyline Avenue, New York, NY 10019",
        type: "Outdoor",
        capacity: 200,
        status: "unavailable",
        amenities: [
            "Panoramic Views",
            "Bar Area",
            "Lounge Seating",
            "Sound System",
        ],
        contactPerson: "Sophia Martinez",
        contactEmail: "sophia@venueexample.com",
        contactPhone: "(212) 555-8901",
        description:
            "Stunning rooftop venue with city views, perfect for cocktail parties and special events.",
        image: "/placeholder.svg?height=200&width=300",
        bookingRate: 90,
        upcomingEvents: 0,
    },
];

// Available venue types
const venueTypes = [
    "Conference Hall",
    "Meeting Room",
    "Boardroom",
    "Auditorium",
    "Classroom",
    "Gallery",
    "Outdoor",
    "Ballroom",
];

// Common amenities
const commonAmenities = [
    "Wi-Fi",
    "Projector",
    "Sound System",
    "Video Conferencing",
    "Whiteboard",
    "Smart Board",
    "Stage",
    "Catering",
    "Coffee Service",
    "Refreshments",
    "Restrooms",
    "Parking",
    "Accessibility Features",
    "Breakout Areas",
    "Lounge Seating",
    "Bar Area",
];

// Mock data for venues and event types
const venues = [
    { id: "1", name: "Main Auditorium" },
    { id: "2", name: "Conference Room A" },
    { id: "3", name: "Conference Room B" },
    { id: "4", name: "Outdoor Pavilion" },
    { id: "5", name: "Lecture Hall" },
];

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
    // Filter venues based on search query and filters
    const filteredVenues = venues.filter((venue) => {
        const matchesSearch =
            venue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            venue.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
            venue.description
                .toLowerCase()
                .includes(searchQuery.toLowerCase()) ||
            venue.contactPerson
                .toLowerCase()
                .includes(searchQuery.toLowerCase());

        const matchesType = typeFilter ? venue.type === typeFilter : true;
        const matchesStatus = statusFilter
            ? venue.status === statusFilter
            : true;

        return matchesSearch && matchesType && matchesStatus;
    });

    // Venue statistics
    const stats = {
        total: venues.length,
        available: venues.filter((venue) => venue.status === "available")
            .length,
        booked: venues.filter((venue) => venue.status === "booked").length,
        maintenance: venues.filter((venue) => venue.status === "maintenance")
            .length,
        unavailable: venues.filter((venue) => venue.status === "unavailable")
            .length,
        totalCapacity: venues.reduce((sum, venue) => sum + venue.capacity, 0),
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
    const handleAddVenue = (venueData: any) => {
        const newVenue = {
            id: venues.length + 1,
            ...venueData,
            image: "/placeholder.svg?height=200&width=300",
            bookingRate: Math.floor(Math.random() * 50) + 30, // Random booking rate between 30-80%
            upcomingEvents: Math.floor(Math.random() * 5), // Random number of upcoming events
        };
        setVenues([...venues, newVenue]);
        setIsAddVenueOpen(false);
    };

    const handleEditVenue = (venueData: any) => {
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

    // Status badge styling
    const getStatusBadge = (status: string) => {
        switch (status) {
            case "available":
                return (
                    <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
                        Available
                    </Badge>
                );
            case "booked":
                return (
                    <Badge className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20">
                        Booked
                    </Badge>
                );
            case "maintenance":
                return (
                    <Badge className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20">
                        Maintenance
                    </Badge>
                );
            case "unavailable":
                return (
                    <Badge className="bg-red-500/10 text-red-500 hover:bg-red-500/20">
                        Unavailable
                    </Badge>
                );
            default:
                return <Badge variant="outline">{status}</Badge>;
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

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-3 gap-4 p-6 pb-0">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">
                                Total Venues
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats.total}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Total capacity: {stats.totalCapacity} people
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">
                                Available Venues
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-500">
                                {stats.available}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {Math.round(
                                    (stats.available / stats.total) * 100,
                                )}
                                % of total venues
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">
                                Currently Booked
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-500">
                                {stats.booked}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {Math.round((stats.booked / stats.total) * 100)}
                                % of total venues
                            </p>
                        </CardContent>
                    </Card>
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
                                {role !== "SUPER_ADMIN" && (
                                    <TabsTrigger value="reservations">
                                        My Reservations
                                    </TabsTrigger>
                                )}
                            </TabsList>
                        </Tabs>

                        {role === "SUPER_ADMIN" && (
                            <>
                                <Select
                                    value={typeFilter || ""}
                                    onValueChange={(value) =>
                                        setTypeFilter(value || null)
                                    }
                                >
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Filter by type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            All Types
                                        </SelectItem>
                                        {venueTypes.map((type) => (
                                            <SelectItem key={type} value={type}>
                                                {type}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Select
                                    value={statusFilter || ""}
                                    onValueChange={(value) =>
                                        setStatusFilter(value || null)
                                    }
                                >
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Filter by status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            All Statuses
                                        </SelectItem>
                                        <SelectItem value="available">
                                            Available
                                        </SelectItem>
                                        <SelectItem value="booked">
                                            Booked
                                        </SelectItem>
                                        <SelectItem value="maintenance">
                                            Maintenance
                                        </SelectItem>
                                        <SelectItem value="unavailable">
                                            Unavailable
                                        </SelectItem>
                                    </SelectContent>
                                </Select>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-1"
                                >
                                    <Download className="h-4 w-4" />
                                    Export
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                <div className="flex-1 overflow-auto p-6">
                    {viewMode === "table" && (
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
                                        />
                                    </TableHead>
                                    <TableHead>Venue</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Capacity</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Booking Rate</TableHead>
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
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-md overflow-hidden bg-muted">
                                                    <img
                                                        src={
                                                            venue.image ||
                                                            "/placeholder.svg"
                                                        }
                                                        alt={venue.name}
                                                        className="h-full w-full object-cover"
                                                    />
                                                </div>
                                                <div>
                                                    <div className="font-medium">
                                                        {venue.name}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                        <MapPin className="h-3 w-3" />
                                                        {
                                                            venue.address.split(
                                                                ",",
                                                            )[0]
                                                        }
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>{venue.type}</TableCell>
                                        <TableCell>
                                            {venue.capacity} people
                                        </TableCell>
                                        <TableCell>
                                            {getStatusBadge(venue.status)}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                <div className="flex justify-between text-xs">
                                                    <span>
                                                        {venue.bookingRate}%
                                                    </span>
                                                </div>
                                                <Progress
                                                    value={venue.bookingRate}
                                                    className="h-2"
                                                />
                                            </div>
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
                                                            setEditingVenue(
                                                                venue,
                                                            )
                                                        }
                                                    >
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem>
                                                        <Calendar className="mr-2 h-4 w-4" />
                                                        View Calendar
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() =>
                                                            handleNavigate(
                                                                venue.id,
                                                            )
                                                        }
                                                    >
                                                        <Building className="mr-2 h-4 w-4" />
                                                        View Details
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        className="text-destructive"
                                                        onClick={() => {
                                                            setVenueToDelete(
                                                                venue.id,
                                                            );
                                                            setIsDeleteDialogOpen(
                                                                true,
                                                            );
                                                        }}
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
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
                                            colSpan={8}
                                            className="text-center py-8 text-muted-foreground"
                                        >
                                            No venues found. Try adjusting your
                                            filters.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                    {viewMode === "grid" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredVenues.map((venue) => (
                                <Card
                                    key={venue.id}
                                    className="overflow-hidden"
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
                                    <CardHeader className="p-4 pb-2">
                                        <div className="flex justify-between">
                                            <div className="flex items-start gap-2">
                                                {role === "SUPER_ADMIN" && (
                                                    <Checkbox
                                                        checked={selectedItems.includes(
                                                            venue.id,
                                                        )}
                                                        onCheckedChange={() =>
                                                            handleSelectItem(
                                                                venue.id,
                                                            )
                                                        }
                                                    />
                                                )}
                                                <div>
                                                    <CardTitle className="text-base">
                                                        {venue.name}
                                                    </CardTitle>
                                                    <CardDescription className="text-xs flex items-center gap-1">
                                                        <MapPin className="h-3 w-3" />
                                                        {venue.address}
                                                    </CardDescription>
                                                </div>
                                            </div>
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
                                                    {role === "SUPER_ADMIN" && (
                                                        <DropdownMenuItem
                                                            onClick={() =>
                                                                setEditingVenue(
                                                                    venue,
                                                                )
                                                            }
                                                        >
                                                            <Edit className="mr-2 h-4 w-4" />
                                                            Edit
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuItem>
                                                        <Calendar className="mr-2 h-4 w-4" />
                                                        View Calendar
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() =>
                                                            handleNavigate(
                                                                venue.id,
                                                            )
                                                        }
                                                    >
                                                        <Building className="mr-2 h-4 w-4" />
                                                        View Details
                                                    </DropdownMenuItem>
                                                    {role === "SUPER_ADMIN" && (
                                                        <>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                className="text-destructive"
                                                                onClick={() => {
                                                                    setVenueToDelete(
                                                                        venue.id,
                                                                    );
                                                                    setIsDeleteDialogOpen(
                                                                        true,
                                                                    );
                                                                }}
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Delete
                                                            </DropdownMenuItem>
                                                        </>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-4 pt-0">
                                        <div className="flex flex-wrap gap-1 mb-3">
                                            {getStatusBadge(venue.status)}
                                            <Badge variant="outline">
                                                {venue.type}
                                            </Badge>
                                            <Badge
                                                variant="outline"
                                                className="flex items-center gap-1"
                                            >
                                                <Users className="h-3 w-3" />
                                                {venue.capacity}
                                            </Badge>
                                        </div>

                                        <div className="text-sm mb-3">
                                            {venue.description}
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <div>
                                                <div className="text-muted-foreground">
                                                    Booking Rate
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Progress
                                                        value={
                                                            venue.bookingRate
                                                        }
                                                        className="h-2 flex-1"
                                                    />
                                                    <span className="text-xs">
                                                        {venue.bookingRate}%
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-3">
                                            <div className="text-sm text-muted-foreground">
                                                Amenities
                                            </div>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {venue.amenities
                                                    .slice(0, 3)
                                                    .map((amenity, index) => (
                                                        <Badge
                                                            key={index}
                                                            variant="secondary"
                                                            className="text-xs"
                                                        >
                                                            {amenity}
                                                        </Badge>
                                                    ))}
                                                {venue.amenities.length > 3 && (
                                                    <Badge
                                                        variant="secondary"
                                                        className="text-xs"
                                                    >
                                                        +
                                                        {venue.amenities
                                                            .length - 3}{" "}
                                                        more
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="p-4 pt-0 flex justify-between">
                                        <div className="text-sm">
                                            <span className="text-muted-foreground">
                                                Contact:{" "}
                                            </span>
                                            {venue.contactPerson}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            {venue.upcomingEvents} upcoming
                                            events
                                        </div>
                                    </CardFooter>
                                </Card>
                            ))}

                            {filteredVenues.length === 0 && (
                                <div className="col-span-full text-center py-8 text-muted-foreground">
                                    No venues found. Try adjusting your filters.
                                </div>
                            )}
                        </div>
                    )}
                    <div className="flex-1 overflow-auto p-6">
                        {viewMode === "reservations" && (
                            <div className="text-center text-muted-foreground">
                                No reservations found.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <VenueReservationFormDialog
                isOpen={isReservationDialogOpen}
                onClose={() => setIsReservationDialogOpen(false)}
                onSubmit={handleReservationSubmit}
                venues={venues.map((venue) => ({
                    id: venue.id,
                    name: venue.name,
                    capacity: venue.capacity,
                    location: venue.address,
                    amenities: venue.amenities,
                    image: venue.image,
                    availableTimes: [
                        "08:00",
                        "09:00",
                        "10:00",
                        "11:00",
                        "12:00",
                        "13:00",
                        "14:00",
                        "15:00",
                        "16:00",
                        "17:00",
                    ], // Adding some default available times
                }))}
                eventTypes={eventTypes.map((type) => type.name)}
                departments={DEPARTMENTS.map((dept) => dept.label)}
                isLoading={false}
            />

            {role === "SUPER_ADMIN" && (
                <>
                    <VenueFormDialog
                        isOpen={isAddVenueOpen || !!editingVenue}
                        onClose={() => {
                            setIsAddVenueOpen(false);
                            setEditingVenue(null);
                        }}
                        onSubmit={
                            editingVenue ? handleEditVenue : handleAddVenue
                        }
                        venue={editingVenue}
                        venueTypes={venueTypes}
                        amenities={commonAmenities}
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
                                ? "Are you sure you want to delete this venue? This action cannot be undone."
                                : `Are you sure you want to delete ${selectedItems.length} selected venues? This action cannot be undone.`
                        }
                    />
                </>
            )}
        </div>
    );
}
