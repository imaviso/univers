import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    createFileRoute,
    useNavigate,
    useRouter,
} from "@tanstack/react-router";
import { format } from "date-fns";
import {
    ArrowLeft,
    Calendar,
    Download,
    Eye,
    MapPin,
    MoreHorizontal,
    Users,
    Wifi,
} from "lucide-react";
import { useState } from "react";
import { initialReservations } from "../venue-approval/approval";
import { initialVenues } from "./dashboard.tsx";

export const Route = createFileRoute("/app/venues/$venueId")({
    component: VenueDetails,
    loader: async ({ params: { venueId } }) => {
        const reservation = initialReservations.find(
            (r) => r.id.toString() === venueId,
        );
        const routerVenue = initialVenues.find(
            (v) => v.id.toString() === venueId,
        );

        if (!reservation) {
            throw new Error("Reservation not found");
        }

        if (!routerVenue) {
            throw new Error("Venue not found");
        }

        return {
            reservation,
            routerVenue,
        };
    },
});

export function VenueDetails() {
    const navigate = useNavigate();
    const { reservation, routerVenue } = Route.useLoaderData();
    const router = useRouter();
    const onBack = () => router.history.back();
    const [venue, setVenue] = useState(routerVenue);
    const [venueReservations, setVenueReservations] = useState([reservation]);
    const [activeTab, setActiveTab] = useState("overview");

    if (!venue) {
        return (
            <div className="flex h-screen bg-background">
                <div className="flex flex-col flex-1 items-center justify-center">
                    <p>Loading venue details...</p>
                </div>
            </div>
        );
    }

    if (!venue) {
        return (
            <div className="flex h-screen bg-background">
                <div className="flex flex-col flex-1 items-center justify-center">
                    <p>Loading venue details...</p>
                </div>
            </div>
        );
    }

    // Handle navigation to reservation details
    const handleViewReservation = (reservationId: number) => {
        // Navigate to the reservation details page
        navigate({ to: `/app/reservations/${reservationId}` });
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

    const formatDateTime = (dateString: string | null) => {
        if (!dateString) return "—";
        return format(new Date(dateString), "MMM d, yyyy h:mm a");
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
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onBack()}
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <h1 className="text-xl font-semibold">{venue.name}</h1>
                        <Badge variant="outline">{venue.type}</Badge>
                    </div>
                </header>

                <Tabs
                    value={activeTab}
                    onValueChange={setActiveTab}
                    className="flex-1 overflow-hidden"
                >
                    <TabsList className="w-full text-foreground mb-3 h-auto gap-2 rounded-none border-b bg-transparent px-0 py-1">
                        <TabsTrigger
                            className="hover:bg-accent hover:text-foreground data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                            value="overview"
                        >
                            Overview
                        </TabsTrigger>
                        <TabsTrigger
                            className="hover:bg-accent hover:text-foreground data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                            value="reservations"
                        >
                            Reservations
                        </TabsTrigger>
                        <TabsTrigger
                            className="hover:bg-accent hover:text-foreground data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                            value="calendar"
                        >
                            Calendar
                        </TabsTrigger>
                    </TabsList>

                    <div className="flex-1 overflow-auto">
                        <TabsContent value="overview" className="p-6 h-full">
                            <div className="grid grid-cols-3 gap-6">
                                <div className="col-span-2 space-y-6">
                                    <div className="rounded-lg overflow-hidden border">
                                        <img
                                            src={
                                                venue.image ||
                                                "/placeholder.svg"
                                            }
                                            alt={venue.name}
                                            className="w-full h-64 object-cover"
                                        />
                                    </div>

                                    <div className="space-y-4">
                                        <h2 className="text-lg font-semibold">
                                            Description
                                        </h2>
                                        <p className="text-muted-foreground">
                                            {venue.description}
                                        </p>
                                    </div>

                                    <div className="space-y-4">
                                        <h2 className="text-lg font-semibold">
                                            Amenities
                                        </h2>
                                        <div className="flex flex-wrap gap-2">
                                            {venue.amenities.map(
                                                (
                                                    amenity: string,
                                                    index: number,
                                                ) => (
                                                    <Badge
                                                        key={index}
                                                        variant="secondary"
                                                        className="flex items-center gap-1"
                                                    >
                                                        <Wifi className="h-3 w-3" />
                                                        {amenity}
                                                    </Badge>
                                                ),
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <Card>
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-base">
                                                Venue Details
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="flex items-center gap-2">
                                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-sm">
                                                    {venue.address}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Users className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-sm">
                                                    Capacity: {venue.capacity}{" "}
                                                    people
                                                </span>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-base">
                                                Contact Information
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-2">
                                            <div className="text-sm">
                                                <span className="font-medium">
                                                    Contact Person:
                                                </span>{" "}
                                                {venue.contactPerson}
                                            </div>
                                            <div className="text-sm">
                                                <span className="font-medium">
                                                    Email:
                                                </span>{" "}
                                                {venue.contactEmail}
                                            </div>
                                            <div className="text-sm">
                                                <span className="font-medium">
                                                    Phone:
                                                </span>{" "}
                                                {venue.contactPhone}
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-base">
                                                Upcoming Events
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold">
                                                {venueReservations.length}
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                {
                                                    venueReservations.filter(
                                                        (r) =>
                                                            r.status ===
                                                            "pending",
                                                    ).length
                                                }{" "}
                                                pending approval
                                            </p>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent
                            value="reservations"
                            className="p-6 h-full"
                        >
                            <div className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-lg font-semibold">
                                        Venue Reservations
                                    </h2>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="gap-1"
                                    >
                                        <Download className="h-4 w-4" />
                                        Export
                                    </Button>
                                </div>

                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Event Name</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Time</TableHead>
                                            <TableHead>Department</TableHead>
                                            <TableHead>Requester</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Submitted</TableHead>
                                            <TableHead className="w-[100px]">
                                                Actions
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {venueReservations.length > 0 ? (
                                            venueReservations.map(
                                                (reservation) => (
                                                    <TableRow
                                                        key={reservation.id}
                                                    >
                                                        <TableCell className="font-medium">
                                                            <Button
                                                                variant="link"
                                                                className="p-0 h-auto text-left justify-start font-medium"
                                                                onClick={() =>
                                                                    handleViewReservation(
                                                                        reservation.id,
                                                                    )
                                                                }
                                                            >
                                                                {
                                                                    reservation.eventName
                                                                }
                                                            </Button>
                                                        </TableCell>
                                                        <TableCell>
                                                            {formatDate(
                                                                reservation.eventDate,
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
                                                            {
                                                                reservation.department
                                                            }
                                                        </TableCell>
                                                        <TableCell>
                                                            {
                                                                reservation.userName
                                                            }
                                                        </TableCell>
                                                        <TableCell>
                                                            {getStatusBadge(
                                                                reservation.status,
                                                            )}
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
                                                                    <DropdownMenuItem
                                                                        onClick={() =>
                                                                            handleViewReservation(
                                                                                reservation.id,
                                                                            )
                                                                        }
                                                                    >
                                                                        <Eye className="mr-2 h-4 w-4" />
                                                                        View
                                                                        Details
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </TableCell>
                                                    </TableRow>
                                                ),
                                            )
                                        ) : (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={8}
                                                    className="text-center py-8 text-muted-foreground"
                                                >
                                                    No reservations found for
                                                    this venue.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </TabsContent>

                        <TabsContent value="calendar" className="p-6 h-full">
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center">
                                    <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                                    <h3 className="text-lg font-medium">
                                        Calendar View
                                    </h3>
                                    <p className="text-muted-foreground">
                                        Calendar integration will be available
                                        soon.
                                    </p>
                                </div>
                            </div>
                        </TabsContent>
                    </div>
                </Tabs>
            </div>
        </div>
    );
}
