import {
    Avatar,
    AvatarFallback /*, AvatarImage*/,
} from "@/components/ui/avatar"; // Keep AvatarImage if URLs might exist later
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { eventsQueryOptions, venuesQueryOptions } from "@/lib/query"; // Import query options
import type { Event } from "@/lib/types"; // Import Event type
import { formatDateRange, getInitials, getStatusColor } from "@/lib/utils"; // Import helpers
import { useSuspenseQuery } from "@tanstack/react-query"; // Import query hook
import { useNavigate } from "@tanstack/react-router";
import { format, getMonth, getYear } from "date-fns"; // Import date functions
import {
    // CalendarDays, // Removed, not using Q2 badge anymore
    CheckCircle,
    ChevronRight,
    Circle,
    Clock,
    MapPin, // Added for venue
    Paperclip, // Added for approved letter
    Tag, // Added for event type
} from "lucide-react";

// Sample timeline data removed
// const timelineEvents = [ ... ];

// Updated status icon logic based on backend statuses
const getStatusIcon = (status: string | undefined) => {
    switch (status?.toUpperCase()) {
        case "COMPLETED":
            return <CheckCircle className="h-4 w-4 text-green-500" />;
        case "APPROVED":
            return <Circle className="h-4 w-4 text-blue-500 fill-blue-500" />; // Example: Blue for approved
        case "PENDING":
            return <Circle className="h-4 w-4 text-yellow-500" />;
        case "REJECTED":
            return <Circle className="h-4 w-4 text-red-500" />; // Example: Red for rejected
        default:
            return <Circle className="h-4 w-4 text-muted-foreground" />;
    }
};

const getMonthName = (date: Date): string => {
    return format(date, "MMMM");
};

// Define structure for grouped events
interface MonthGroup {
    id: string; // e.g., "2024-04"
    month: string; // e.g., "April"
    year: number;
    events: Event[]; // Use the actual Event type
}

export function EventTimeline() {
    const navigate = useNavigate();
    // Fetch events and venues data
    const { data: events = [] } = useSuspenseQuery(eventsQueryOptions);
    const { data: venues = [] } = useSuspenseQuery(venuesQueryOptions);

    // Create a map for quick venue lookup
    const venueMap = new Map(venues.map((venue) => [venue.id, venue.name]));

    // Group events by month and year
    const groupedEvents = events.reduce(
        (acc, event: Event) => {
            // Ensure startTime is valid before parsing
            if (typeof event.startTime !== "string") {
                console.warn(
                    `Event ${event.id} has invalid startTime: ${event.startTime}`,
                );
                return acc; // Skip this event
            }
            const startDate = new Date(`${event.startTime}Z`);
            if (Number.isNaN(startDate.getTime())) {
                console.warn(
                    `Event ${event.id} failed to parse startTime: ${event.startTime}`,
                );
                return acc; // Skip if date parsing fails
            }

            const year = getYear(startDate);
            const monthIndex = getMonth(startDate); // 0-indexed
            const monthName = getMonthName(startDate);
            const groupId = `${year}-${String(monthIndex + 1).padStart(2, "0")}`; // e.g., 2024-04

            if (!acc[groupId]) {
                acc[groupId] = {
                    id: groupId,
                    month: monthName,
                    year: year,
                    events: [],
                };
            }
            acc[groupId].events.push(event);
            // Sort events within the month group by start time
            acc[groupId].events.sort(
                (a: { startTime: Date }, b: { startTime: Date }) => {
                    const timeA = a.startTime
                        ? new Date(`${a.startTime}Z`).getTime()
                        : 0;
                    const timeB = b.startTime
                        ? new Date(`${b.startTime}Z`).getTime()
                        : 0;
                    // Handle potential NaN during sorting
                    if (Number.isNaN(timeA) && Number.isNaN(timeB)) return 0;
                    if (Number.isNaN(timeA)) return 1; // Put invalid dates last
                    if (Number.isNaN(timeB)) return -1;
                    return timeA - timeB;
                },
            );

            return acc;
        },
        {} as Record<string, MonthGroup>,
    );

    const timelineData: MonthGroup[] = (
        Object.values(groupedEvents) as MonthGroup[]
    ).sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        const monthA = Number.parseInt(a.id.split("-")[1], 10);
        const monthB = Number.parseInt(b.id.split("-")[1], 10);
        return monthA - monthB;
    });

    const handleNavigate = (eventId: number | undefined) => {
        if (typeof eventId === "number") {
            navigate({ to: `/app/events/${eventId}` });
        } else {
            console.warn("Attempted to navigate with invalid event ID");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Event Timeline</h2>
                {/* Removed Q2 Badge */}
            </div>

            {timelineData.length === 0 ? (
                <div className="text-center text-muted-foreground py-10">
                    No events found for the timeline.
                </div>
            ) : (
                <div className="space-y-8">
                    {timelineData.map((monthGroup) => (
                        <div key={monthGroup.id} className="space-y-4">
                            <h3 className="text-lg font-medium">
                                {monthGroup.month} {monthGroup.year}
                            </h3>
                            <div className="space-y-4">
                                {monthGroup.events.map((event) => {
                                    // Get organizer name directly
                                    const organizerName = event.organizer
                                        ? `${event.organizer.firstName} ${event.organizer.lastName}`
                                        : "Unknown Organizer";
                                    // const organizerAvatar = event.organizer?.avatarUrl;

                                    // Format date range
                                    let dateDisplayString =
                                        "Date not available";
                                    if (
                                        typeof event.startTime === "string" &&
                                        typeof event.endTime === "string"
                                    ) {
                                        const startDate = new Date(
                                            `${event.startTime}Z`,
                                        );
                                        const endDate = new Date(
                                            `${event.endTime}Z`,
                                        );
                                        if (
                                            !Number.isNaN(
                                                startDate.getTime(),
                                            ) &&
                                            !Number.isNaN(endDate.getTime())
                                        ) {
                                            dateDisplayString = formatDateRange(
                                                startDate,
                                                endDate,
                                            );
                                        } else {
                                            dateDisplayString =
                                                "Invalid date format";
                                        }
                                    } else {
                                        dateDisplayString = "Date missing";
                                    }

                                    return (
                                        <Card
                                            key={
                                                event.id ??
                                                `temp-${Math.random()}`
                                            }
                                            className="overflow-hidden border-l-4"
                                            // Optional: Style border based on status
                                            // style={{ borderLeftColor: ... }}
                                        >
                                            <CardHeader>
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-center gap-2">
                                                        {getStatusIcon(
                                                            event.status,
                                                        )}
                                                        <h4 className="font-medium">
                                                            {event.eventName}{" "}
                                                            {/* Use eventName */}
                                                        </h4>
                                                    </div>
                                                    <Badge
                                                        className={`${getStatusColor(event.status)}`}
                                                    >
                                                        {/* Use actual status */}
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
                                            <CardContent>
                                                {/* Event Type */}
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                                    <Tag className="h-4 w-4" />
                                                    <span>
                                                        {event.eventType ??
                                                            "N/A"}
                                                    </span>
                                                </div>
                                                {/* Date/Time */}
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                                    <Clock className="h-4 w-4" />
                                                    <span>
                                                        {dateDisplayString}
                                                    </span>{" "}
                                                    {/* Use formatted date */}
                                                </div>
                                                {/* Venue */}
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                                                    <MapPin className="h-4 w-4" />
                                                    <span>
                                                        {venueMap.get(
                                                            event.eventVenueId,
                                                        ) ?? "Unknown Venue"}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <Avatar className="h-6 w-6">
                                                            {/* <AvatarImage src={organizerAvatar} /> */}
                                                            <AvatarFallback>
                                                                {getInitials(
                                                                    organizerName,
                                                                )}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <span className="text-xs">
                                                            {organizerName}
                                                        </span>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="flex items-center gap-2 text-sm font-normal"
                                                        onClick={() =>
                                                            handleNavigate(
                                                                event.id,
                                                            )
                                                        }
                                                        disabled={
                                                            typeof event.id !==
                                                            "number"
                                                        }
                                                    >
                                                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
