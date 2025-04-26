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
    Link,
    Outlet,
    createFileRoute,
    useNavigate,
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
import { useState } from "react";
import { fromTheme } from "tailwind-merge";

export const Route = createFileRoute("/app/venue-approval/approval")({
    component: VenueReservationApproval,
});

// Sample reservation data
export const initialReservations = [
    {
        id: 1,
        eventName: "Computer Science Department Meeting",
        venue: "Main Conference Hall",
        venueId: 1,
        department: "Computer Science",
        contactNumber: "(555) 123-4567",
        userName: "Dr. Alan Turing",
        userIdNumber: "EMP-1001",
        eventDate: "2024-05-15",
        startTime: "09:00",
        endTime: "12:00",
        status: "pending",
        createdAt: "2024-05-01T10:30:00Z",
        approvalLetter: "/placeholder.svg?height=800&width=600",
        remarks: {
            OPC: "No conflicts with other events",
            MSDO: "Equipment requirements noted",
            "Venue Owner": "Venue available on requested date",
            "VP Admin": "",
            VPAA: "",
            FAO: "",
            SSD: "Security arrangements confirmed",
        },
        approvers: [
            {
                name: "Jane Smith",
                idNumber: "EMP-2001",
                department: "Office of Planning and Coordination",
                role: "OPC Director",
                dateSigned: "2024-05-02T14:20:00Z",
                status: "approved",
            },
            {
                name: "Michael Johnson",
                idNumber: "EMP-2002",
                department: "Media Services Department",
                role: "MSDO Head",
                dateSigned: "2024-05-03T09:15:00Z",
                status: "approved",
            },
            {
                name: "Sarah Williams",
                idNumber: "EMP-2003",
                department: "Facilities Management",
                role: "Venue Owner",
                dateSigned: "2024-05-03T11:30:00Z",
                status: "approved",
            },
            {
                name: "Dr. Robert Chen",
                idNumber: "EMP-2004",
                department: "Administration",
                role: "VP Admin",
                dateSigned: null,
                status: "pending",
            },
            {
                name: "Dr. Elizabeth Taylor",
                idNumber: "EMP-2005",
                department: "Academic Affairs",
                role: "VPAA",
                dateSigned: null,
                status: "pending",
            },
            {
                name: "Thomas Garcia",
                idNumber: "EMP-2006",
                department: "Finance and Accounting",
                role: "FAO Director",
                dateSigned: null,
                status: "pending",
            },
            {
                name: "Maria Rodriguez",
                idNumber: "EMP-2007",
                department: "Security Services",
                role: "SSD Head",
                dateSigned: "2024-05-04T16:45:00Z",
                status: "approved",
            },
        ],
    },
    {
        id: 2,
        eventName: "Annual Faculty Research Symposium",
        venue: "Auditorium",
        venueId: 5,
        department: "Research and Development",
        contactNumber: "(555) 987-6543",
        userName: "Prof. Marie Curie",
        userIdNumber: "FAC-1002",
        eventDate: "2024-05-20",
        startTime: "13:00",
        endTime: "17:00",
        status: "approved",
        createdAt: "2024-04-25T08:45:00Z",
        approvalLetter: "/placeholder.svg?height=800&width=600",
        remarks: {
            OPC: "Priority event, all resources allocated",
            MSDO: "Full AV support confirmed",
            "Venue Owner": "Venue reserved and prepared",
            "VP Admin": "Approved with commendation",
            VPAA: "Academic merit recognized",
            FAO: "Budget allocation approved",
            SSD: "Enhanced security measures in place",
        },
        approvers: [
            {
                name: "Jane Smith",
                idNumber: "EMP-2001",
                department: "Office of Planning and Coordination",
                role: "OPC Director",
                dateSigned: "2024-04-26T10:20:00Z",
                status: "approved",
            },
            {
                name: "Michael Johnson",
                idNumber: "EMP-2002",
                department: "Media Services Department",
                role: "MSDO Head",
                dateSigned: "2024-04-26T14:15:00Z",
                status: "approved",
            },
            {
                name: "Sarah Williams",
                idNumber: "EMP-2003",
                department: "Facilities Management",
                role: "Venue Owner",
                dateSigned: "2024-04-27T09:30:00Z",
                status: "approved",
            },
            {
                name: "Dr. Robert Chen",
                idNumber: "EMP-2004",
                department: "Administration",
                role: "VP Admin",
                dateSigned: "2024-04-28T11:45:00Z",
                status: "approved",
            },
            {
                name: "Dr. Elizabeth Taylor",
                idNumber: "EMP-2005",
                department: "Academic Affairs",
                role: "VPAA",
                dateSigned: "2024-04-29T13:20:00Z",
                status: "approved",
            },
            {
                name: "Thomas Garcia",
                idNumber: "EMP-2006",
                department: "Finance and Accounting",
                role: "FAO Director",
                dateSigned: "2024-04-30T15:10:00Z",
                status: "approved",
            },
            {
                name: "Maria Rodriguez",
                idNumber: "EMP-2007",
                department: "Security Services",
                role: "SSD Head",
                dateSigned: "2024-05-01T09:45:00Z",
                status: "approved",
            },
        ],
    },
    {
        id: 3,
        eventName: "Student Council Elections Debate",
        venue: "Workshop Room A",
        venueId: 2,
        department: "Student Affairs",
        contactNumber: "(555) 234-5678",
        userName: "James Maxwell",
        userIdNumber: "STU-1003",
        eventDate: "2024-05-18",
        startTime: "14:00",
        endTime: "16:30",
        status: "pending",
        createdAt: "2024-05-03T13:15:00Z",
        approvalLetter: "/placeholder.svg?height=800&width=600",
        remarks: {
            OPC: "Scheduled as requested",
            MSDO: "Microphone and recording setup confirmed",
            "Venue Owner": "Room layout will be arranged as requested",
            "VP Admin": "",
            VPAA: "",
            FAO: "",
            SSD: "Standard security protocols in place",
        },
        approvers: [
            {
                name: "Jane Smith",
                idNumber: "EMP-2001",
                department: "Office of Planning and Coordination",
                role: "OPC Director",
                dateSigned: "2024-05-04T09:20:00Z",
                status: "approved",
            },
            {
                name: "Michael Johnson",
                idNumber: "EMP-2002",
                department: "Media Services Department",
                role: "MSDO Head",
                dateSigned: "2024-05-04T14:15:00Z",
                status: "approved",
            },
            {
                name: "Sarah Williams",
                idNumber: "EMP-2003",
                department: "Facilities Management",
                role: "Venue Owner",
                dateSigned: "2024-05-05T10:30:00Z",
                status: "approved",
            },
            {
                name: "Dr. Robert Chen",
                idNumber: "EMP-2004",
                department: "Administration",
                role: "VP Admin",
                dateSigned: null,
                status: "pending",
            },
            {
                name: "Dr. Elizabeth Taylor",
                idNumber: "EMP-2005",
                department: "Academic Affairs",
                role: "VPAA",
                dateSigned: null,
                status: "pending",
            },
            {
                name: "Thomas Garcia",
                idNumber: "EMP-2006",
                department: "Finance and Accounting",
                role: "FAO Director",
                dateSigned: null,
                status: "pending",
            },
            {
                name: "Maria Rodriguez",
                idNumber: "EMP-2007",
                department: "Security Services",
                role: "SSD Head",
                dateSigned: "2024-05-05T16:45:00Z",
                status: "approved",
            },
        ],
    },
    {
        id: 4,
        eventName: "Engineering Department Workshop",
        venue: "Training Center",
        venueId: 7,
        department: "Engineering",
        contactNumber: "(555) 345-6789",
        userName: "Dr. Nikola Tesla",
        userIdNumber: "FAC-1004",
        eventDate: "2024-05-25",
        startTime: "10:00",
        endTime: "15:00",
        status: "disapproved",
        createdAt: "2024-05-02T11:30:00Z",
        approvalLetter: "/placeholder.svg?height=800&width=600",
        remarks: {
            OPC: "Scheduling conflict with maintenance",
            MSDO: "Equipment not available on requested date",
            "Venue Owner": "Venue under renovation during requested period",
            "VP Admin": "Cannot approve due to facility constraints",
            VPAA: "",
            FAO: "",
            SSD: "",
        },
        disapprovalNote:
            "We regret to inform you that your venue reservation request cannot be accommodated due to scheduled renovations in the Training Center during the requested date. Please consider rescheduling for after June 10th when renovations will be complete, or selecting an alternative venue.",
        approvers: [
            {
                name: "Jane Smith",
                idNumber: "EMP-2001",
                department: "Office of Planning and Coordination",
                role: "OPC Director",
                dateSigned: "2024-05-03T14:20:00Z",
                status: "disapproved",
            },
            {
                name: "Michael Johnson",
                idNumber: "EMP-2002",
                department: "Media Services Department",
                role: "MSDO Head",
                dateSigned: "2024-05-03T16:15:00Z",
                status: "disapproved",
            },
            {
                name: "Sarah Williams",
                idNumber: "EMP-2003",
                department: "Facilities Management",
                role: "Venue Owner",
                dateSigned: "2024-05-04T09:30:00Z",
                status: "disapproved",
            },
            {
                name: "Dr. Robert Chen",
                idNumber: "EMP-2004",
                department: "Administration",
                role: "VP Admin",
                dateSigned: "2024-05-05T11:45:00Z",
                status: "disapproved",
            },
            {
                name: "Dr. Elizabeth Taylor",
                idNumber: "EMP-2005",
                department: "Academic Affairs",
                role: "VPAA",
                dateSigned: null,
                status: "not_required",
            },
            {
                name: "Thomas Garcia",
                idNumber: "EMP-2006",
                department: "Finance and Accounting",
                role: "FAO Director",
                dateSigned: null,
                status: "not_required",
            },
            {
                name: "Maria Rodriguez",
                idNumber: "EMP-2007",
                department: "Security Services",
                role: "SSD Head",
                dateSigned: null,
                status: "not_required",
            },
        ],
    },
    {
        id: 5,
        eventName: "Psychology Department Seminar",
        venue: "Executive Boardroom",
        venueId: 3,
        department: "Psychology",
        contactNumber: "(555) 456-7890",
        userName: "Dr. Sigmund Freud",
        userIdNumber: "FAC-1005",
        eventDate: "2024-06-02",
        startTime: "13:30",
        endTime: "16:00",
        status: "pending",
        createdAt: "2024-05-05T09:45:00Z",
        approvalLetter: "/placeholder.svg?height=800&width=600",
        remarks: {
            OPC: "Scheduled as requested",
            MSDO: "Video conferencing setup confirmed",
            "Venue Owner": "",
            "VP Admin": "",
            VPAA: "",
            FAO: "",
            SSD: "",
        },
        approvers: [
            {
                name: "Jane Smith",
                idNumber: "EMP-2001",
                department: "Office of Planning and Coordination",
                role: "OPC Director",
                dateSigned: "2024-05-06T10:20:00Z",
                status: "approved",
            },
            {
                name: "Michael Johnson",
                idNumber: "EMP-2002",
                department: "Media Services Department",
                role: "MSDO Head",
                dateSigned: "2024-05-06T14:15:00Z",
                status: "approved",
            },
            {
                name: "Sarah Williams",
                idNumber: "EMP-2003",
                department: "Facilities Management",
                role: "Venue Owner",
                dateSigned: null,
                status: "pending",
            },
            {
                name: "Dr. Robert Chen",
                idNumber: "EMP-2004",
                department: "Administration",
                role: "VP Admin",
                dateSigned: null,
                status: "pending",
            },
            {
                name: "Dr. Elizabeth Taylor",
                idNumber: "EMP-2005",
                department: "Academic Affairs",
                role: "VPAA",
                dateSigned: null,
                status: "pending",
            },
            {
                name: "Thomas Garcia",
                idNumber: "EMP-2006",
                department: "Finance and Accounting",
                role: "FAO Director",
                dateSigned: null,
                status: "pending",
            },
            {
                name: "Maria Rodriguez",
                idNumber: "EMP-2007",
                department: "Security Services",
                role: "SSD Head",
                dateSigned: null,
                status: "pending",
            },
        ],
    },
];

// Available venues (for reference)
const venues = [
    { id: 1, name: "Main Conference Hall" },
    { id: 2, name: "Workshop Room A" },
    { id: 3, name: "Executive Boardroom" },
    { id: 4, name: "Outdoor Pavilion" },
    { id: 5, name: "Auditorium" },
    { id: 6, name: "Gallery Space" },
    { id: 7, name: "Training Center" },
    { id: 8, name: "Rooftop Terrace" },
];

type ViewMode = "all" | "pending" | "approved" | "disapproved";

export function VenueReservationApproval() {
    const navigate = useNavigate();
    const [reservations, setReservations] = useState(initialReservations);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const [venueFilter, setVenueFilter] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>("all");

    // Filter reservations based on search query, status, and venue filters
    const filteredReservations = reservations.filter((reservation) => {
        const matchesSearch =
            reservation.eventName
                .toLowerCase()
                .includes(searchQuery.toLowerCase()) ||
            reservation.userName
                .toLowerCase()
                .includes(searchQuery.toLowerCase()) ||
            reservation.department
                .toLowerCase()
                .includes(searchQuery.toLowerCase()) ||
            reservation.venue.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter
            ? reservation.status === statusFilter
            : true;
        const matchesVenue = venueFilter
            ? reservation.venueId.toString() === venueFilter
            : true;
        const matchesViewMode =
            viewMode === "all"
                ? true
                : viewMode === "pending"
                  ? reservation.status === "pending"
                  : viewMode === "approved"
                    ? reservation.status === "approved"
                    : viewMode === "disapproved"
                      ? reservation.status === "disapproved"
                      : true;

        return (
            matchesSearch && matchesStatus && matchesVenue && matchesViewMode
        );
    });

    // Reservation statistics
    const stats = {
        total: reservations.length,
        pending: reservations.filter((r) => r.status === "pending").length,
        approved: reservations.filter((r) => r.status === "approved").length,
        disapproved: reservations.filter((r) => r.status === "disapproved")
            .length,
    };

    // Handle reservation operations
    const handleViewDetails = (reservationId: number) => {
        // Navigate to the reservation details page
        navigate({ to: `/app/venue-approval/${reservationId}` });
    };

    const handleNavigateToVenue = (venueId: number) => {
        // Navigate to the venue details page
        navigate({ from: Route.fullPath, to: `/app/venues/${venueId}` });
    };

    // Status badge styling
    const getStatusBadge = (status: string) => {
        switch (status) {
            case "pending":
                return (
                    <Badge className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20">
                        Pending
                    </Badge>
                );
            case "approved":
                return (
                    <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
                        Approved
                    </Badge>
                );
            case "disapproved":
                return (
                    <Badge className="bg-red-500/10 text-red-500 hover:bg-red-500/20">
                        Disapproved
                    </Badge>
                );
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    // Format date and time
    const formatDate = (dateString: string) => {
        return format(new Date(dateString), "MMM d, yyyy");
    };

    const formatTime = (timeString: string) => {
        const [hours, minutes] = timeString.split(":");
        const date = new Date();
        date.setHours(Number.parseInt(hours, 10));
        date.setMinutes(Number.parseInt(minutes, 10));
        return format(date, "h:mm a");
    };

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

                {/* Stats Cards */}
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
                        onClick={() => setViewMode("disapproved")}
                    >
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">
                                Disapproved
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-500">
                                {stats.disapproved}
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
                                <TabsTrigger value="disapproved">
                                    Disapproved
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>

                    <div className="flex items-center gap-2">
                        <Select
                            value={venueFilter || "all"}
                            onValueChange={(value) => setVenueFilter(value)}
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filter by venue" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Venues</SelectItem>
                                {venues.map((venue) => (
                                    <SelectItem
                                        key={venue.id}
                                        value={venue.id.toString()}
                                    >
                                        {venue.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Button variant="outline" size="sm" className="gap-1">
                            <Filter className="h-4 w-4" />
                            More Filters
                        </Button>

                        <Button variant="outline" size="sm" className="gap-1">
                            <Download className="h-4 w-4" />
                            Export
                        </Button>
                    </div>
                </div>

                <div className="flex-1 overflow-auto p-6">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Event Name</TableHead>
                                <TableHead>Venue</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Time</TableHead>
                                <TableHead>Department</TableHead>
                                <TableHead>Requester</TableHead>
                                <TableHead>ID Number</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Submitted</TableHead>
                                <TableHead className="w-[100px]">
                                    Actions
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredReservations.map((reservation) => (
                                <TableRow key={reservation.id}>
                                    <TableCell className="font-medium">
                                        <Button
                                            variant="link"
                                            className="p-0 h-auto text-left justify-start font-medium"
                                            onClick={() =>
                                                handleViewDetails(
                                                    reservation.id,
                                                )
                                            }
                                        >
                                            {reservation.eventName}
                                        </Button>
                                    </TableCell>
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
                                            {reservation.venue}
                                        </Button>
                                    </TableCell>
                                    <TableCell>
                                        {formatDate(reservation.eventDate)}
                                    </TableCell>
                                    <TableCell>
                                        {formatTime(reservation.startTime)} -{" "}
                                        {formatTime(reservation.endTime)}
                                    </TableCell>
                                    <TableCell>
                                        {reservation.department}
                                    </TableCell>
                                    <TableCell>
                                        {reservation.userName}
                                    </TableCell>
                                    <TableCell>
                                        {reservation.userIdNumber}
                                    </TableCell>
                                    <TableCell>
                                        {getStatusBadge(reservation.status)}
                                    </TableCell>
                                    <TableCell>
                                        {formatDate(reservation.createdAt)}
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
                            ))}
                            {filteredReservations.length === 0 && (
                                <TableRow>
                                    <TableCell
                                        colSpan={10}
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
