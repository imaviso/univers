import ErrorPage from "@/components/ErrorPage";
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
import { venuesQueryOptions } from "@/lib/query";
import type { Venue } from "@/lib/types";
import {
    createFileRoute,
    useNavigate,
    useRouter,
} from "@tanstack/react-router";
import { format } from "date-fns";
import {
    ArrowLeft,
    Calendar,
    Clock,
    Download,
    Eye,
    MapPin,
    MoreHorizontal,
    UserCircle,
    Users,
    Wifi,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/venues/$venueId")({
    component: VenueDetails,
    loader: async ({ params: { venueId }, context }) => {
        // Find venue in the updated mock data
        const venues = context.queryClient.ensureQueryData(venuesQueryOptions);
        const venue = (await venues).find((v) => v.id.toString() === venueId) as
            | Venue
            | undefined; // Cast or ensure type safety

        if (!venue) {
            // Use TanStack Router's notFound utility or throw a specific error
            throw new Error(`Venue with ID ${venueId} not found`);
            // Or: throw notFound(); // if you import { notFound } from '@tanstack/react-router'
        }

        return { venue /*, reservations */ };
    },
});

export function VenueDetails() {
    const navigate = useNavigate();
    const { venue } = Route.useLoaderData();
    const router = useRouter();
    const onBack = () => router.history.back();
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
                            onClick={onBack}
                            aria-label="Go back"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <h1 className="text-xl font-semibold">{venue.name}</h1>
                        {/* Removed type badge as it's not in the new entity */}
                    </div>
                    {/* Removed action buttons if not applicable */}
                </header>

                {/* Added Tabs */}
                <Tabs
                    value={activeTab}
                    onValueChange={setActiveTab}
                    className="flex-1 overflow-hidden"
                >
                    <TabsList className="w-full text-foreground mb-3 h-auto gap-2 rounded-none border-b bg-transparent px-6 py-1">
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

                    <div className="flex-1 overflow-auto p-6">
                        {/* Overview Tab */}
                        <TabsContent value="overview" className="h-full">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Left Column: Image */}
                                <div className="md:col-span-2 space-y-6">
                                    <div className="rounded-lg overflow-hidden border aspect-video">
                                        <img
                                            src={
                                                venue.imagePath ||
                                                "/placeholder.svg"
                                            }
                                            alt={venue.name}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    {/* Add Description/Amenities back here if those fields exist */}
                                </div>

                                {/* Right Column: Details */}
                                <div className="space-y-6">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>
                                                Venue Information
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="flex items-center gap-2">
                                                <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                                <span className="text-sm">
                                                    Location: {venue.location}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <UserCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                                <span className="text-sm">
                                                    Owner:{" "}
                                                    {
                                                        venue.venueOwner
                                                            ?.firstName
                                                    }{" "}
                                                    {venue.venueOwner?.lastName}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                                <span className="text-sm">
                                                    Created:{" "}
                                                    {formatDateTime(
                                                        venue.createdAt,
                                                    )}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                                <span className="text-sm">
                                                    Last Updated:{" "}
                                                    {formatDateTime(
                                                        venue.updatedAt,
                                                    )}
                                                </span>
                                            </div>
                                            {/* Removed capacity, contact info etc. */}
                                        </CardContent>
                                    </Card>
                                    {/* Add other cards (e.g., Upcoming Events) if needed */}
                                </div>
                            </div>
                        </TabsContent>

                        {/* Reservations Tab */}
                        <TabsContent value="reservations" className="h-full">
                            <div className="space-y-6">
                                <h2 className="text-lg font-semibold">
                                    Venue Reservations
                                </h2>
                                {/* Add Table or List for reservations here */}
                                <div className="text-center text-muted-foreground py-8 border rounded-md">
                                    Reservation list placeholder.
                                </div>
                            </div>
                        </TabsContent>

                        {/* Calendar Tab */}
                        <TabsContent value="calendar" className="h-full">
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
