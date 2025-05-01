import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
    eventsQueryOptions,
    getApprovedEventsQuery,
    getOwnEventsQueryOptions,
    useCurrentUser,
    venuesQueryOptions,
} from "@/lib/query"; // Import query options
import type { Event, Venue } from "@/lib/types"; // Ensure Venue is imported if not already
import { formatDateRange, getInitials } from "@/lib/utils";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query"; // Import query hook
import { useNavigate } from "@tanstack/react-router";
import { ChevronRight, Clock, MapPin, Tag } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

const getStatusColor = (status: string | undefined) => {
    switch (
        status?.toUpperCase() // Use uppercase for case-insensitivity
    ) {
        case "PENDING":
            return "bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20";
        case "APPROVED":
            return "bg-green-500/10 text-green-600 hover:bg-green-500/20";
        case "REJECTED":
            return "bg-red-500/10 text-red-600 hover:bg-red-500/20";
        case "COMPLETED":
            return "bg-purple-500/10 text-purple-600 hover:bg-purple-500/20";
        case "CANCELED":
            return "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20";
        default:
            return "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20";
    }
};

// Helper component for rendering a single event card
function EventCard({
    event,
    venueMap,
    onNavigate,
}: {
    event: Event;
    venueMap: Map<number, string>;
    onNavigate: (eventId: number | undefined) => void;
}) {
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
            console.error(
                `Failed to parse dates for event ${event.id}: start='${event.startTime}', end='${event.endTime}'`,
            );
            dateDisplayString = "Invalid date format received";
        }
    } else {
        console.warn(
            `Missing or invalid date strings for event ${event.id}: start='${event.startTime}', end='${event.endTime}'`,
        );
        dateDisplayString = "Date missing";
    }

    const organizerName = event.organizer
        ? `${event.organizer.firstName} ${event.organizer.lastName}`
        : "Unknown Organizer";

    return (
        <Card
            key={event.id ?? `temp-${Math.random()}`}
            className="overflow-hidden transition-all hover:shadow-md flex flex-col"
        >
            <CardHeader>
                <div className="flex items-start justify-between">
                    <h3 className="font-medium">{event.eventName}</h3>
                    <Badge className={`${getStatusColor(event.status)}`}>
                        {event.status
                            ? event.status.charAt(0).toUpperCase() +
                              event.status.slice(1).toLowerCase()
                            : "Unknown"}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="flex-grow">
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Tag className="h-4 w-4" />
                        <span>{event.eventType ?? "N/A"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{dateDisplayString}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>
                            {venueMap.get(event.eventVenueId) ??
                                "Unknown Venue"}
                        </span>
                    </div>
                </div>
            </CardContent>
            <Separator />
            <CardFooter className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                        <AvatarImage
                            src={event.organizer?.profileImagePath ?? ""}
                            alt={organizerName}
                        />
                        <AvatarFallback>
                            {getInitials(organizerName)}
                        </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground">
                        {organizerName}
                    </span>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="flex items-center gap-2 text-sm font-normal"
                    onClick={() => onNavigate(event.id)}
                    disabled={typeof event.id !== "number"}
                >
                    <span className="sr-only">View Details</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Button>
            </CardFooter>
        </Card>
    );
}

// Accept activeTab as a prop
export function EventList({ activeTab }: { activeTab: "all" | "mine" }) {
    const navigate = useNavigate();
    const { data: venues = [] } = useSuspenseQuery(venuesQueryOptions);
    const { data: currentUser } = useCurrentUser();
    const { data: ownEvents = [] } = useSuspenseQuery(getOwnEventsQueryOptions);
    const { data: approvedEvents = [] } = useSuspenseQuery(
        getApprovedEventsQuery,
    );
    const { data: allEvents = [] } = useQuery({
        ...eventsQueryOptions,
        enabled: currentUser?.role === "SUPER_ADMIN",
    });

    const venueMap = new Map(
        venues.map((venue: Venue) => [venue.id, venue.name]),
    );

    const handleNavigate = (eventId: number | undefined) => {
        if (typeof eventId === "number") {
            navigate({ to: `/app/events/${eventId}` });
        } else {
            console.warn("Attempted to navigate with invalid event ID");
        }
    };

    const filteredOwnEvents = ownEvents.filter((event) => {
        if (
            event.status?.toUpperCase() === "CANCELED" &&
            currentUser?.role !== "SUPER_ADMIN"
        ) {
            return false;
        }
        return true;
    });

    // Determine which list to render for the 'all' tab based on role
    const allEventsSource =
        currentUser?.role === "SUPER_ADMIN" ? allEvents : approvedEvents;

    // Determine which list to render based on the activeTab prop
    const eventsToDisplay =
        activeTab === "all" ? allEventsSource : filteredOwnEvents;

    const noEventsMessage =
        activeTab === "all"
            ? "No events found."
            : "You have not created any events yet.";

    return (
        <div>
            {eventsToDisplay.length === 0 ? (
                <div className="text-center text-muted-foreground py-10">
                    {noEventsMessage}
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 pt-4">
                    {eventsToDisplay.map((event: Event) => (
                        <EventCard
                            key={`${activeTab}-${event.id}`} // Ensure unique key across tabs
                            event={event}
                            venueMap={venueMap}
                            onNavigate={handleNavigate}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
