import {
    Avatar,
    AvatarFallback /*, AvatarImage*/,
} from "@/components/ui/avatar"; // Keep AvatarImage if URLs might exist later
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
    allEventsQueryOptions,
    approvedEventsQueryOptions,
    useCurrentUser, // Import hook to get current user
    venuesQueryOptions,
} from "@/lib/query"; // Import query options
import type { Event } from "@/lib/types"; // Import Event type
import { formatDateRange, getInitials, getStatusColor } from "@/lib/utils"; // Import helpers
import { useQuery, useSuspenseQuery } from "@tanstack/react-query"; // Import query hook
import { useNavigate } from "@tanstack/react-router";
import { useVirtualizer } from "@tanstack/react-virtual"; // Added import
import { format, getMonth, getYear } from "date-fns"; // Import date functions
import {
    CheckCircle,
    ChevronRight,
    Circle,
    Clock,
    MapPin, // Added for venue
    Tag, // Added for event type
} from "lucide-react";
import { useRef } from "react"; // Added import

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
    const { data: currentUser } = useCurrentUser(); // Get current user

    // Fetch venues data
    const { data: venues = [] } = useSuspenseQuery(venuesQueryOptions);

    // Fetch approved events (for non-admins)
    const { data: approvedEvents = [] } = useSuspenseQuery(
        approvedEventsQueryOptions,
    );

    // Fetch all events (only enabled for SUPER_ADMIN)
    const { data: allEvents = [] } = useQuery({
        ...allEventsQueryOptions,
        enabled: currentUser?.role === "SUPER_ADMIN",
    });

    // Determine the source of events based on user role
    const timelineEventsSource =
        currentUser?.role === "SUPER_ADMIN" ? allEvents : approvedEvents;

    // Create a map for quick venue lookup
    const venueMap = new Map(
        venues.map((venue) => [venue.publicId, venue.name]),
    );

    // Group events by month and year using the selected source
    const groupedEvents = timelineEventsSource.reduce(
        (acc, event: Event) => {
            // Ensure startTime is valid before parsing
            if (typeof event.startTime !== "string") {
                console.warn(
                    `Event ${event.publicId} has invalid startTime: ${event.startTime}`,
                );
                return acc; // Skip this event
            }
            const startDate = new Date(event.startTime);
            if (Number.isNaN(startDate.getTime())) {
                console.warn(
                    `Event ${event.publicId} failed to parse startTime: ${event.startTime}`,
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
            acc[groupId].events.sort((a: Event, b: Event) => {
                // Use Event type for sorting
                const timeA = a.startTime ? new Date(a.startTime).getTime() : 0;
                const timeB = b.startTime ? new Date(b.startTime).getTime() : 0;
                // Handle potential NaN during sorting
                if (Number.isNaN(timeA) && Number.isNaN(timeB)) return 0;
                if (Number.isNaN(timeA)) return 1; // Put invalid dates last
                if (Number.isNaN(timeB)) return -1;
                return timeA - timeB;
            });

            return acc;
        },
        {} as Record<string, MonthGroup>,
    );

    // Sort the month groups
    const timelineData: MonthGroup[] = (
        Object.values(groupedEvents) as MonthGroup[]
    ).sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        const monthA = Number.parseInt(a.id.split("-")[1], 10);
        const monthB = Number.parseInt(b.id.split("-")[1], 10);
        return monthA - monthB;
    });

    const handleNavigate = (eventId: string | undefined) => {
        if (typeof eventId === "string") {
            navigate({ to: `/app/events/${eventId}` });
        } else {
            console.warn("Attempted to navigate with invalid event ID");
        }
    };

    // --- Virtualization Setup for Timeline ---
    const parentRef = useRef<HTMLDivElement>(null); // Ref for the scrollable container

    const rowVirtualizer = useVirtualizer({
        count: timelineData.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 300, // Estimate height of a MonthGroup (adjust as needed)
        overscan: 3,
    });
    // --- End Virtualization Setup ---

    return (
        <div className="space-y-6">
            {timelineData.length === 0 ? (
                <div className="text-center text-muted-foreground py-10">
                    No events found for the timeline.
                </div>
            ) : (
                // Added div for scrolling container ref for timeline
                <div
                    ref={parentRef}
                    className="h-[85vh] overflow-y-auto space-y-8 scrollbar-thin scrollbar-thumb-primary scrollbar-track-muted" // Adjust height & Added scrollbar classes
                >
                    {/* Added div for total virtual height */}
                    <div
                        style={{
                            height: `${rowVirtualizer.getTotalSize()}px`,
                            width: "99%",
                            position: "relative",
                        }}
                    >
                        {/* Map over virtual items */}
                        {rowVirtualizer.getVirtualItems().map((virtualItem) => {
                            const monthGroup = timelineData[virtualItem.index];
                            if (!monthGroup) return null;

                            return (
                                <div // Added wrapper for absolute positioning
                                    key={monthGroup.id} // virtualItem.key is also an option
                                    style={{
                                        position: "absolute",
                                        top: 0,
                                        left: 0,
                                        width: "100%",
                                        height: `${virtualItem.size}px`,
                                        transform: `translateY(${virtualItem.start}px)`,
                                        paddingBottom: "32px", // Corresponds to space-y-8 on original container
                                    }}
                                >
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-medium">
                                            {monthGroup.month} {monthGroup.year}
                                        </h3>
                                        <div className="space-y-4">
                                            {monthGroup.events.map((event) => {
                                                // Get organizer name directly
                                                const organizerName =
                                                    event.organizer
                                                        ? `${event.organizer.firstName} ${event.organizer.lastName}`
                                                        : "Unknown Organizer";

                                                // Format date range
                                                let dateDisplayString =
                                                    "Date not available";
                                                if (
                                                    typeof event.startTime ===
                                                        "string" &&
                                                    typeof event.endTime ===
                                                        "string"
                                                ) {
                                                    const startDate = new Date(
                                                        event.startTime,
                                                    );
                                                    const endDate = new Date(
                                                        event.endTime,
                                                    );
                                                    if (
                                                        !Number.isNaN(
                                                            startDate.getTime(),
                                                        ) &&
                                                        !Number.isNaN(
                                                            endDate.getTime(),
                                                        )
                                                    ) {
                                                        dateDisplayString =
                                                            formatDateRange(
                                                                startDate,
                                                                endDate,
                                                            );
                                                    } else {
                                                        dateDisplayString =
                                                            "Invalid date format";
                                                    }
                                                } else {
                                                    dateDisplayString =
                                                        "Date missing";
                                                }

                                                return (
                                                    <Card
                                                        key={
                                                            event.publicId ??
                                                            `temp-${Math.random()}`
                                                        }
                                                        className="overflow-hidden border-l-4"
                                                    >
                                                        <CardHeader>
                                                            <div className="flex items-start justify-between">
                                                                <div className="flex items-center gap-2">
                                                                    {getStatusIcon(
                                                                        event.status,
                                                                    )}
                                                                    <h4 className="font-medium">
                                                                        {
                                                                            event.eventName
                                                                        }
                                                                    </h4>
                                                                </div>
                                                                <Badge
                                                                    className={`${getStatusColor(event.status)}`}
                                                                >
                                                                    {event.status
                                                                        ? event.status
                                                                              .charAt(
                                                                                  0,
                                                                              )
                                                                              .toUpperCase() +
                                                                          event.status
                                                                              .slice(
                                                                                  1,
                                                                              )
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
                                                                    {
                                                                        dateDisplayString
                                                                    }
                                                                </span>
                                                            </div>
                                                            {/* Venue */}
                                                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                                                                <MapPin className="h-4 w-4" />
                                                                <span>
                                                                    {venueMap.get(
                                                                        event
                                                                            .eventVenue
                                                                            ?.publicId,
                                                                    ) ??
                                                                        "Unknown Venue"}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center justify-between gap-2">
                                                                <div className="flex items-center gap-2">
                                                                    <Avatar className="h-6 w-6">
                                                                        <AvatarFallback>
                                                                            {getInitials(
                                                                                organizerName,
                                                                            )}
                                                                        </AvatarFallback>
                                                                    </Avatar>
                                                                    <span className="text-xs">
                                                                        {
                                                                            organizerName
                                                                        }
                                                                    </span>
                                                                </div>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="flex items-center gap-2 text-sm font-normal"
                                                                    onClick={() =>
                                                                        handleNavigate(
                                                                            event.publicId,
                                                                        )
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
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
