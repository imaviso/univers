import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { eventsQueryOptions, venuesQueryOptions } from "@/lib/query"; // Import query options
import type { Event } from "@/lib/types";
import { formatDateRange, getInitials } from "@/lib/utils";
import { useSuspenseQuery } from "@tanstack/react-query"; // Import query hook
import { useNavigate } from "@tanstack/react-router";
import { ChevronRight, Clock, MapPin, Paperclip, Tag } from "lucide-react";
import { Avatar, AvatarFallback } from "../ui/avatar";

const getStatusColor = (status: string | undefined) => {
    switch (
        status?.toUpperCase() // Use uppercase for case-insensitivity
    ) {
        case "PENDING":
            return "bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20";
        case "APPROVED": // Assuming 'APPROVED' might be a status
            return "bg-green-500/10 text-green-600 hover:bg-green-500/20";
        case "REJECTED": // Assuming 'REJECTED' might be a status
            return "bg-red-500/10 text-red-600 hover:bg-red-500/20";
        case "COMPLETED": // Assuming 'COMPLETED' might be a status
            return "bg-purple-500/10 text-purple-600 hover:bg-purple-500/20";
        default:
            return "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20";
    }
};

export function EventList() {
    const navigate = useNavigate();
    const { data: events = [] } = useSuspenseQuery(eventsQueryOptions);
    const { data: venues = [] } = useSuspenseQuery(venuesQueryOptions);

    // Create maps for quick lookups
    const venueMap = new Map(venues.map((venue) => [venue.id, venue.name]));

    const handleNavigate = (eventId: number | undefined) => {
        if (typeof eventId === "number") {
            navigate({ to: `/app/events/${eventId}` });
        } else {
            console.warn("Attempted to navigate with invalid event ID");
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Events</h2>
            </div>
            {events.length === 0 ? (
                <div className="text-center text-muted-foreground py-10">
                    No events found.
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {events.map((event: Event) => {
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
                                dateDisplayString = formatDateRange(
                                    startDate,
                                    endDate,
                                );
                            } else {
                                console.error(
                                    `Failed to parse dates for event ${event.id}: start='${event.startTime}', end='${event.endTime}'`,
                                );
                                dateDisplayString =
                                    "Invalid date format received";
                            }
                        } else {
                            console.warn(
                                `Missing or invalid date strings for event ${event.id}: start='${event.startTime}', end='${event.endTime}'`,
                            );
                            dateDisplayString = "Date missing";
                        }

                        // Access organizer details directly from event.organizer
                        const organizerName = event.organizer
                            ? `${event.organizer.firstName} ${event.organizer.lastName}`
                            : "Unknown Organizer";
                        // const organizerAvatar = event.organizer?.avatarUrl; // Example if avatar URL existed

                        return (
                            <Card
                                key={event.id ?? `temp-${Math.random()}`}
                                className="overflow-hidden transition-all hover:shadow-md flex flex-col" // Added flex flex-col
                            >
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <h3 className="font-medium">
                                            {event.eventName}
                                        </h3>
                                        <Badge
                                            className={`${getStatusColor(event.status)}`}
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
                                </CardHeader>
                                <CardContent className="flex-grow">
                                    {" "}
                                    {/* Added flex-grow */}
                                    <div className="space-y-3">
                                        {/* Event Type */}
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Tag className="h-4 w-4" />
                                            <span>
                                                {event.eventType ?? "N/A"}
                                            </span>
                                        </div>
                                        {/* Date/Time */}
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Clock className="h-4 w-4" />
                                            <span>{dateDisplayString}</span>
                                        </div>
                                        {/* Venue */}
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <MapPin className="h-4 w-4" />
                                            <span>
                                                {venueMap.get(
                                                    event.eventVenueId,
                                                ) ?? "Unknown Venue"}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                                <Separator />
                                <CardFooter className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Avatar className="h-8 w-8">
                                            {/* Add AvatarImage if URL is available */}
                                            {/* <AvatarImage src={organizerAvatar} /> */}
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
                                        className="flex items-center gap-2 text-sm font-normal" // Removed ml-auto
                                        onClick={() => handleNavigate(event.id)}
                                        disabled={typeof event.id !== "number"}
                                    >
                                        <span className="sr-only">
                                            View Details
                                        </span>
                                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                </CardFooter>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
