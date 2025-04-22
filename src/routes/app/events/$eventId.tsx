import {
    Avatar,
    AvatarFallback /*, AvatarImage*/,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    ArrowLeft,
    Clock,
    Edit,
    MapPin,
    MoreHorizontal,
    Paperclip, // Added for approved letter
    Tag, // Added for event type
    Trash2,
} from "lucide-react";

import { eventQueryOptions, venuesQueryOptions } from "@/lib/query"; // Import query options
import type { Event } from "@/lib/types"; // Import Event type
import { formatDateRange, getInitials, getStatusColor } from "@/lib/utils"; // Import helpers
import { useSuspenseQuery } from "@tanstack/react-query"; // Import suspense query hook
import {
    // Link, // Removed if not used
    createFileRoute,
    notFound, // Import notFound
    useRouteContext,
    useRouter,
} from "@tanstack/react-router";

export const Route = createFileRoute("/app/events/$eventId")({
    loader: async ({ params: { eventId }, context: { queryClient } }) => {
        // Fetch the specific event
        const event = await queryClient.ensureQueryData(
            eventQueryOptions(eventId),
        );

        if (!event) {
            throw notFound(); // Throw 404 if event not found
        }

        // Ensure venues are available (might already be cached by parent route)
        const venues = await queryClient.ensureQueryData(venuesQueryOptions);

        return { event, venues }; // Return fetched data
    },
    component: EventDetailsPage,
});

export function EventDetailsPage() {
    const context = useRouteContext({ from: "/app/events" }); // Get parent context if needed (e.g., for role)
    const role = "role" in context ? context.role : "USER"; // Example role access
    // const [commentText, setCommentText] = useState(""); // Removed comment state
    const router = useRouter();
    const onBack = () => router.history.back();

    // Use data fetched by the loader
    const { event, venues } = Route.useLoaderData();
    // Create venue map
    const venueMap = new Map(venues.map((venue) => [venue.id, venue.name]));

    // Format date range using helper
    let dateDisplayString = "Date not available";
    if (
        typeof event.startTime === "string" &&
        typeof event.endTime === "string"
    ) {
        const startDate = new Date(`${event.startTime}Z`);
        const endDate = new Date(`${event.endTime}Z`);
        if (
            !Number.isNaN(startDate.getTime()) &&
            !Number.isNaN(endDate.getTime())
        ) {
            dateDisplayString = formatDateRange(startDate, endDate);
        } else {
            dateDisplayString = "Invalid date format";
        }
    } else {
        dateDisplayString = "Date missing";
    }

    // Get organizer details
    const organizerName = event.organizer
        ? `${event.organizer.firstName} ${event.organizer.lastName}`
        : "Unknown Organizer";
    // const organizerAvatar = event.organizer?.avatarUrl; // If avatar exists
    let approvedLetterUrl: string | null = null;
    if (event.approvedLetterPath) {
        // Example: Extract filename if path is like '/path/to/static/dir/filename.ext'
        const filename = event.approvedLetterPath.split("/").pop();
        if (filename) {
            // Example: Assuming files are served under '/api/files/approved-letters/'
            approvedLetterUrl = `/api/files/approved-letters/${filename}`;
            // If served directly from root static path:
            // approvedLetterUrl = `/approved-letters/${filename}`;
        } else {
            console.error(
                "Could not extract filename from approvedLetterPath:",
                event.approvedLetterPath,
            );
        }
    }

    return (
        <div className="flex h-screen bg-background">
            <div className="flex flex-col flex-1 overflow-hidden">
                <header className="flex items-center justify-between border-b px-6 py-3.5">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onBack} // Use direct call
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        {/* Use real event name */}
                        <h1 className="text-xl font-semibold">
                            {event.eventName}
                        </h1>
                        {/* Use real status */}
                        <Badge className={`${getStatusColor(event.status)}`}>
                            {event.status
                                ? event.status.charAt(0).toUpperCase() +
                                  event.status.slice(1).toLowerCase()
                                : "Unknown"}
                        </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Keep role-based actions if needed */}
                        {role === "SUPER_ADMIN" && (
                            <>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-1"
                                    // onClick={() => navigate({ to: `/app/events/${event.id}/edit` })} // Example edit navigation
                                >
                                    <Edit className="h-4 w-4" />
                                    Edit
                                </Button>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        {/* Add real actions here */}
                                        <DropdownMenuItem>
                                            Duplicate
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                            Archive
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="text-destructive">
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </>
                        )}
                    </div>
                </header>
                <main className="flex-1 overflow-auto">
                    <div className="p-6 space-y-6">
                        {/* Event Overview Card */}
                        <Card>
                            <CardHeader className="pb-2">
                                <h2 className="text-lg font-medium">
                                    Event Overview
                                </h2>
                            </CardHeader>
                            <CardContent>
                                <div className="grid md:grid-cols-2 gap-6">
                                    {/* Left Column */}
                                    <div className="space-y-4">
                                        {/* ID and Status */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <h3 className="text-sm font-medium text-muted-foreground">
                                                    Event ID
                                                </h3>
                                                <p className="text-sm font-medium">
                                                    {event.id}{" "}
                                                    {/* Display real ID */}
                                                </p>
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-medium text-muted-foreground">
                                                    Status
                                                </h3>
                                                <Badge
                                                    className={`${getStatusColor(event.status)} mt-1`}
                                                >
                                                    {event.status
                                                        ? event.status
                                                              .charAt(0)
                                                              .toUpperCase() +
                                                          event.status
                                                              .slice(1)
                                                              .toLowerCase()
                                                        : "Unknown"}
                                                </Badge>
                                            </div>
                                        </div>

                                        {/* Event Type */}
                                        <div>
                                            <h3 className="text-sm font-medium text-muted-foreground">
                                                Event Type
                                            </h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Tag className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-sm">
                                                    {event.eventType ?? "N/A"}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Date & Time */}
                                        <div>
                                            <h3 className="text-sm font-medium text-muted-foreground">
                                                Date & Time
                                            </h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Clock className="h-4 w-4 text-muted-foreground" />
                                                {/* Display formatted date range */}
                                                <span className="text-sm">
                                                    {dateDisplayString}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Location */}
                                        <div>
                                            <h3 className="text-sm font-medium text-muted-foreground">
                                                Location
                                            </h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-sm">
                                                    {/* Look up venue name */}
                                                    {venueMap.get(
                                                        event.eventVenueId,
                                                    ) ?? "Unknown Venue"}
                                                </span>
                                            </div>
                                            {/* Removed hardcoded address */}
                                        </div>

                                        {/* Approved Letter - Updated */}
                                        {event.approvedLetterPath &&
                                            approvedLetterUrl && (
                                                <div>
                                                    <h3 className="text-sm font-medium text-muted-foreground">
                                                        Approved Letter
                                                    </h3>
                                                    <Dialog>
                                                        <DialogTrigger asChild>
                                                            <div className="flex items-center gap-2 mt-1 cursor-pointer text-blue-600 hover:underline">
                                                                <Paperclip className="h-4 w-4" />
                                                                <span className="text-sm">
                                                                    View
                                                                    Attached
                                                                    Letter
                                                                </span>
                                                            </div>
                                                        </DialogTrigger>
                                                        <DialogContent className="sm:max-w-[600px] md:max-w-[800px] lg:max-w-[1000px]">
                                                            {" "}
                                                            {/* Adjust size */}
                                                            <DialogHeader>
                                                                <DialogTitle>
                                                                    Approved
                                                                    Letter
                                                                </DialogTitle>
                                                                <DialogDescription>
                                                                    Viewing the
                                                                    letter for
                                                                    event:{" "}
                                                                    {
                                                                        event.eventName
                                                                    }
                                                                </DialogDescription>
                                                            </DialogHeader>
                                                            <div className="mt-4 max-h-[70vh] overflow-auto">
                                                                {" "}
                                                                {/* Limit height and allow scroll */}
                                                                {/* Display image - adjust if it could be PDF */}
                                                                <img
                                                                    src={
                                                                        approvedLetterUrl
                                                                    }
                                                                    alt="Approved Letter"
                                                                    className="max-w-full h-auto mx-auto"
                                                                />
                                                                {/* For PDF, you might use: */}
                                                                {/* <iframe src={approvedLetterUrl} width="100%" height="600px" title="Approved Letter"></iframe> */}
                                                            </div>
                                                        </DialogContent>
                                                    </Dialog>
                                                </div>
                                            )}

                                        {/* Removed Attendees */}
                                    </div>

                                    {/* Right Column */}
                                    <div className="space-y-4">
                                        {/* Organizer */}
                                        <div>
                                            <h3 className="text-sm font-medium text-muted-foreground">
                                                Organizer
                                            </h3>
                                            <div className="flex items-center gap-3 mt-2">
                                                <Avatar className="h-10 w-10">
                                                    {/* <AvatarImage src={organizerAvatar} /> */}
                                                    <AvatarFallback>
                                                        {getInitials(
                                                            organizerName,
                                                        )}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <div className="text-sm font-medium">
                                                        {organizerName}
                                                    </div>
                                                    {/* Display organizer role if available */}
                                                    {event.organizer?.role && (
                                                        <div className="text-xs text-muted-foreground">
                                                            {
                                                                event.organizer
                                                                    .role
                                                            }
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            {/* Display organizer contact details */}
                                            {event.organizer && (
                                                <div className="mt-2 ml-13 space-y-1">
                                                    {event.organizer
                                                        .idNumber && (
                                                        <div className="text-xs text-muted-foreground">
                                                            ID:{" "}
                                                            {
                                                                event.organizer
                                                                    .idNumber
                                                            }
                                                        </div>
                                                    )}
                                                    {event.organizer.email && (
                                                        <div className="text-xs text-muted-foreground">
                                                            {
                                                                event.organizer
                                                                    .email
                                                            }
                                                        </div>
                                                    )}
                                                    {event.organizer
                                                        .phoneNumber && (
                                                        <div className="text-xs text-muted-foreground">
                                                            {
                                                                event.organizer
                                                                    .phoneNumber
                                                            }
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Removed Description (can add back if needed) */}
                                        {/* Removed Progress */}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Removed Tabbed Content (Agenda, Team, Tasks, Resources, Comments) */}
                        {/* You can add these back if you fetch the corresponding data */}
                    </div>
                </main>
            </div>
        </div>
    );
}
