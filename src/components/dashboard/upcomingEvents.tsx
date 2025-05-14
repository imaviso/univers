import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { upcomingApprovedEventsQueryOptions } from "@/lib/query";
import type { EventDTO } from "@/lib/types";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { CalendarDays } from "lucide-react";

export function UpcomingEvents() {
    // Fetch 5 upcoming approved events by default
    const {
        data: events,
        isLoading,
        error,
    } = useSuspenseQuery(upcomingApprovedEventsQueryOptions(5));

    if (isLoading) return <p>Loading upcoming events...</p>;
    if (error) return <p>Error loading events: {error.message}</p>;
    if (!events || events.length === 0)
        return <p>No upcoming approved events.</p>;

    return (
        <ScrollArea className="h-[300px]">
            <div className="space-y-4 p-1">
                {events.map((event: EventDTO) => (
                    <Link
                        key={event.publicId}
                        to="/app/events/$eventId"
                        params={{ eventId: event.publicId }}
                        className="block p-3 rounded-lg hover:bg-muted transition-colors border"
                    >
                        <div className="flex items-center justify-between mb-1">
                            <h4
                                className="font-semibold text-sm truncate"
                                title={event.eventName}
                            >
                                {event.eventName}
                            </h4>
                            <Badge
                                variant={
                                    event.status === "APPROVED"
                                        ? "default"
                                        : "secondary"
                                }
                            >
                                {event.status}
                            </Badge>
                        </div>
                        <p
                            className="text-xs text-muted-foreground truncate"
                            title={event.eventVenue?.name || "No venue"}
                        >
                            At: {event.eventVenue?.name || "N/A"}
                        </p>
                        <div className="text-xs text-muted-foreground flex items-center mt-1">
                            <CalendarDays className="h-3 w-3 mr-1.5" />
                            {format(
                                new Date(event.startTime),
                                "MMM d, yyyy, h:mm a",
                            )}
                        </div>
                    </Link>
                ))}
            </div>
        </ScrollArea>
    );
}
