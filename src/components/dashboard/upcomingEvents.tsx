import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { upcomingApprovedEventsQueryOptions } from "@/lib/query";
import type { EventDTO } from "@/lib/types";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { CalendarDays } from "lucide-react";
import { Skeleton } from "../ui/skeleton";

export function UpcomingEvents() {
    // Fetch 5 upcoming approved events by default
    const {
        data: events,
        isLoading,
        error,
    } = useSuspenseQuery(upcomingApprovedEventsQueryOptions(5));

    if (isLoading) {
        return (
            <ScrollArea className="h-[300px]">
                <div className="space-y-4 p-1">
                    {[...Array(3)].map((_, index) => (
                        <div
                            key={`skeleton-event-${
                                // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                                index
                            }`}
                            className="block p-3 rounded-lg border"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <Skeleton className="h-5 w-3/5" />
                                <Skeleton className="h-5 w-1/4" />
                            </div>
                            <Skeleton className="h-4 w-4/5 mb-2" />
                            <div className="flex items-center">
                                <Skeleton className="h-3 w-3 mr-1.5" />
                                <Skeleton className="h-3 w-2/5" />
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        );
    }
    if (error)
        return (
            <div className="flex flex-col h-[300px] p-6 items-center justify-center">
                <p className="text-red-500">
                    Error loading events: {error.message}
                </p>
            </div>
        );
    if (!events || events.length === 0)
        return (
            <div className="flex flex-col h-[300px] p-6 items-center justify-center">
                <p className="text-muted-foreground">
                    No upcoming approved events.
                </p>
            </div>
        );

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
