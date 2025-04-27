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
import { useNavigate } from "@tanstack/react-router";
import { createFileRoute, redirect } from "@tanstack/react-router";
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

export const Route = createFileRoute("/app/equipment-approval/approval")({
    component: EquipmentReservationApproval,
    beforeLoad: async ({ location, context }) => {
        const navigationItem = allNavigation.find((item) => {
            // Allow exact match or any sub-route after the base path, e.g. "/app/notifications/..."
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
            throw redirect({
                to: "/login",
                search: {
                    redirect: location.href,
                },
            });
        }
    },
});

// Define types based on sample data
interface EquipmentItem {
    id: string;
    name: string;
    owner: string;
    quantity: number;
}

interface Approver {
    name: string;
    department: string;
    role: string;
    dateSigned: string | null;
    status: "pending" | "approved" | "disapproved";
}

interface Reservation {
    id: number;
    eventName: string;
    venue: string;
    venueId: number;
    department: string;
    contactNumber: string;
    userName: string;
    eventDate: string;
    startTime: string;
    endTime: string;
    status: "pending" | "approved" | "disapproved";
    createdAt: string;
    equipment: EquipmentItem[];
    remarks: { [key: string]: string };
    approvers: Approver[];
    disapprovalNote?: string;
}

// Sample equipment reservation data
export const initialReservations: Reservation[] = [
    {
        id: 1,
        eventName: "Computer Science Department Meeting",
        venue: "Main Conference Hall",
        venueId: 1,
        department: "Computer Science",
        contactNumber: "(555) 123-4567",
        userName: "Dr. Alan Turing",
        eventDate: "2024-05-15",
        startTime: "09:00",
        endTime: "12:00",
        status: "pending",
        createdAt: "2024-05-01T10:30:00Z",
        equipment: [
            { id: "msdo-camera", name: "Camera", owner: "MSDO", quantity: 1 },
            { id: "msdo-speaker", name: "Speaker", owner: "MSDO", quantity: 2 },
            { id: "opc-chairs", name: "Chairs", owner: "OPC", quantity: 20 },
        ],
        remarks: {
            MSDO: "Equipment is available for the requested date",
            OPC: "Chairs will be delivered to the venue 1 hour before the event",
        },
        approvers: [
            {
                name: "Michael Johnson",
                department: "Media Services Department",
                role: "MSDO Head",
                dateSigned: "2024-05-03T09:15:00Z",
                status: "pending",
            },
            {
                name: "Sarah Williams",
                department: "Office of Planning and Coordination",
                role: "OPC Director",
                dateSigned: null,
                status: "pending",
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
        eventDate: "2024-05-20",
        startTime: "13:00",
        endTime: "17:00",
        status: "approved",
        createdAt: "2024-04-25T08:45:00Z",
        equipment: [
            {
                id: "msdo-projector",
                name: "Projector",
                owner: "MSDO",
                quantity: 1,
            },
            {
                id: "msdo-microphone",
                name: "Wireless Microphone",
                owner: "MSDO",
                quantity: 3,
            },
            { id: "msdo-laptop", name: "Laptop", owner: "MSDO", quantity: 1 },
            { id: "opc-podium", name: "Podium", owner: "OPC", quantity: 1 },
            {
                id: "opc-extension",
                name: "Extension Wire",
                owner: "OPC",
                quantity: 5,
            },
        ],
        remarks: {
            MSDO: "All equipment will be set up by our technician",
            OPC: "Podium will be placed at the center of the stage",
        },
        approvers: [
            {
                name: "Michael Johnson",
                department: "Media Services Department",
                role: "MSDO Head",
                dateSigned: "2024-04-26T14:15:00Z",
                status: "approved",
            },
            {
                name: "Sarah Williams",
                department: "Office of Planning and Coordination",
                role: "OPC Director",
                dateSigned: "2024-04-27T09:30:00Z",
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
        eventDate: "2024-05-18",
        startTime: "14:00",
        endTime: "16:30",
        status: "pending",
        createdAt: "2024-05-03T13:15:00Z",
        equipment: [
            {
                id: "msdo-microphone",
                name: "Wireless Microphone",
                owner: "MSDO",
                quantity: 4,
            },
            { id: "msdo-speaker", name: "Speaker", owner: "MSDO", quantity: 2 },
            { id: "opc-chairs", name: "Chairs", owner: "OPC", quantity: 50 },
            {
                id: "opc-table",
                name: "Folding Table",
                owner: "OPC",
                quantity: 2,
            },
        ],
        remarks: {
            MSDO: "Microphones will be tested before the event",
            OPC: "",
        },
        approvers: [
            {
                name: "Michael Johnson",
                department: "Media Services Department",
                role: "MSDO Head",
                dateSigned: "2024-05-04T14:15:00Z",
                status: "approved",
            },
            {
                name: "Sarah Williams",
                department: "Office of Planning and Coordination",
                role: "OPC Director",
                dateSigned: null,
                status: "pending",
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
        eventDate: "2024-05-25",
        startTime: "10:00",
        endTime: "15:00",
        status: "disapproved",
        createdAt: "2024-05-02T11:30:00Z",
        equipment: [
            {
                id: "msdo-projector",
                name: "Projector",
                owner: "MSDO",
                quantity: 2,
            },
            { id: "msdo-laptop", name: "Laptop", owner: "MSDO", quantity: 10 },
            { id: "opc-chairs", name: "Chairs", owner: "OPC", quantity: 30 },
            {
                id: "opc-table",
                name: "Folding Table",
                owner: "OPC",
                quantity: 10,
            },
        ],
        remarks: {
            MSDO: "Not enough laptops available for the requested date",
            OPC: "Tables are already reserved for another event",
        },
        disapprovalNote:
            "We regret to inform you that your equipment reservation request cannot be accommodated due to unavailability of the requested equipment. Please consider rescheduling or reducing the quantity of equipment needed.",
        approvers: [
            {
                name: "Michael Johnson",
                department: "Media Services Department",
                role: "MSDO Head",
                dateSigned: "2024-05-03T16:15:00Z",
                status: "disapproved",
            },
            {
                name: "Sarah Williams",
                department: "Office of Planning and Coordination",
                role: "OPC Director",
                dateSigned: "2024-05-04T09:30:00Z",
                status: "disapproved",
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
        eventDate: "2024-06-02",
        startTime: "13:30",
        endTime: "16:00",
        status: "pending",
        createdAt: "2024-05-05T09:45:00Z",
        equipment: [
            {
                id: "msdo-projector",
                name: "Projector",
                owner: "MSDO",
                quantity: 1,
            },
            {
                id: "msdo-microphone",
                name: "Wireless Microphone",
                owner: "MSDO",
                quantity: 1,
            },
            {
                id: "opc-whiteboard",
                name: "Whiteboard",
                owner: "OPC",
                quantity: 1,
            },
        ],
        remarks: {
            MSDO: "Equipment is available for the requested date",
            OPC: "",
        },
        approvers: [
            {
                name: "Michael Johnson",
                department: "Media Services Department",
                role: "MSDO Head",
                dateSigned: "2024-05-06T14:15:00Z",
                status: "approved",
            },
            {
                name: "Sarah Williams",
                department: "Office of Planning and Coordination",
                role: "OPC Director",
                dateSigned: null,
                status: "pending",
            },
        ],
    },
];

// Available equipment owners for filtering
const equipmentOwners = [
    { id: "msdo", name: "MSDO" },
    { id: "opc", name: "OPC" },
];

export function EquipmentReservationApproval() {
    const navigate = useNavigate();
    const [reservations, setReservations] =
        useState<Reservation[]>(initialReservations);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const [ownerFilter, setOwnerFilter] = useState<string | null>(null);
    type ViewMode = "all" | "pending" | "approved" | "disapproved";
    const [viewMode, setViewMode] = useState<ViewMode>("all");

    // Filter reservations based on search query, status, and owner filters
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
            reservation.venue
                .toLowerCase()
                .includes(searchQuery.toLowerCase()) ||
            reservation.equipment.some((item) =>
                item.name.toLowerCase().includes(searchQuery.toLowerCase()),
            );

        const matchesStatus = statusFilter
            ? reservation.status === statusFilter
            : true;

        const matchesOwner = ownerFilter
            ? reservation.equipment.some(
                  (item) =>
                      item.owner.toLowerCase() === ownerFilter.toLowerCase(),
              )
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
            matchesSearch && matchesStatus && matchesOwner && matchesViewMode
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
        navigate({ to: `/app/equipment-approval/${reservationId}` });
    };

    const handleNavigateToVenue = (venueId: number) => {
        // Navigate to the venue details page
        navigate({ to: `/app/venues/${venueId}` });
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

    // Count equipment by owner
    const countEquipmentByOwner = (
        equipment: EquipmentItem[],
        owner: string,
    ) => {
        return equipment.filter((item) => item.owner === owner).length;
    };

    return (
        <div className="bg-background">
            <div className="flex flex-col flex-1 overflow-hidden">
                <header className="flex items-center justify-between border-b px-6 py-3.5">
                    <h1 className="text-xl font-semibold">
                        Equipment Reservation Approval
                    </h1>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground">
                                <title>Search Icon</title>
                            </Search>
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
                        className="hover:shadow-md transition-shadow cursor-pointer"
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
                        className="hover:shadow-md transition-shadow cursor-pointer"
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
                        className="hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => setViewMode("disapproved")}
                    >
                        <CardHeader className="pb-2">
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
                            value={ownerFilter || "all"}
                            onValueChange={(value) =>
                                setOwnerFilter(value === "all" ? null : value)
                            }
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filter by owner" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Owners</SelectItem>
                                {equipmentOwners.map(
                                    (owner: { id: string; name: string }) => (
                                        <SelectItem
                                            key={owner.id}
                                            value={owner.id}
                                        >
                                            {owner.name}
                                        </SelectItem>
                                    ),
                                )}
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
                                <TableHead>MSDO Items</TableHead>
                                <TableHead>OPC Items</TableHead>
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
                                        {countEquipmentByOwner(
                                            reservation.equipment,
                                            "MSDO",
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {countEquipmentByOwner(
                                            reservation.equipment,
                                            "OPC",
                                        )}
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
                                        colSpan={11}
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
