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
    allEventsQueryOptions,
    approvedEventsQueryOptions,
    ownEventsQueryOptions,
    pendingVenueOwnerEventsQueryOptions,
    useCurrentUser,
    venuesQueryOptions,
} from "@/lib/query"; // Import query options
import type { Event, EventDTO, VenueDTO } from "@/lib/types"; // Ensure Venue is imported if not already, and add Event type
import { formatDateRange, getInitials, getStatusColor } from "@/lib/utils";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query"; // Import query hook
import { useNavigate } from "@tanstack/react-router";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ChevronRight, Clock, MapPin, Tag } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react"; // Import React hooks
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

// Helper function to map AppEvent to EventDTO, providing defaults for missing fields
const mapEventToEventDTO = (event: Event): EventDTO => {
    // Assuming AppEvent might be missing some EventDTO fields or has different field names.
    // Adjust this based on the actual structure of AppEvent vs EventDTO.
    // Ensure all fields required by EventDTO are present.
    return {
        // Fields assumed to be common or directly from AppEvent
        publicId: event.publicId,
        eventName: event.eventName,
        eventType: event.eventType,
        startTime: event.startTime, // Assumed to be ISO string from backend Instant
        endTime: event.endTime, // Assumed to be ISO string from backend Instant
        status: event.status,
        organizer: event.organizer,
        eventVenue: event.eventVenue,
        department: event.department,
        approvedLetterUrl: event.approvedLetterUrl ?? null,
        createdAt: event.createdAt ?? new Date().toISOString(), // Provide default if missing
        updatedAt: event.updatedAt ?? new Date().toISOString(), // Provide default if missing
        imageUrl: event.imageUrl,
        approvals: Array.isArray(event.approvals) ? event.approvals : [], // Ensure it's an array
        cancellationReason:
            typeof event.cancellationReason === "string"
                ? event.cancellationReason
                : null,
    };
};

// Helper component for rendering a single event card
function EventCard({
    event,
    venueMap,
    onNavigate,
}: {
    event: EventDTO;
    venueMap: Map<string, string>;
    onNavigate: (eventId: string | undefined) => void;
}) {
    let dateDisplayString = "Date not available";

    if (
        typeof event.startTime === "string" &&
        typeof event.endTime === "string"
    ) {
        const startDate = new Date(event.startTime);
        const endDate = new Date(event.endTime);

        if (
            !Number.isNaN(startDate.getTime()) &&
            !Number.isNaN(endDate.getTime())
        ) {
            dateDisplayString = formatDateRange(startDate, endDate);
        } else {
            console.error(
                `Failed to parse dates for event ${event.publicId}: start='${event.startTime}', end='${event.endTime}'`,
            );
            dateDisplayString = "Invalid date format received";
        }
    } else {
        console.warn(
            `Missing or invalid date strings for event ${event.publicId}: start='${event.startTime}', end='${event.endTime}'`,
        );
        dateDisplayString = "Date missing";
    }

    const organizerName = event.organizer
        ? `${event.organizer.firstName} ${event.organizer.lastName}`
        : "Unknown Organizer";

    return (
        <Card
            key={event.publicId ?? `temp-${Math.random()}`}
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
                            {venueMap.get(event.eventVenue?.publicId) ??
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
                    onClick={() => onNavigate(event.publicId)}
                    disabled={typeof event.publicId !== "string"}
                >
                    <span className="sr-only">View Details</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Button>
            </CardFooter>
        </Card>
    );
}

// Accept activeTab and eventStatusFilter as props
export function EventList({
    activeTab,
    eventStatusFilter,
}: { activeTab: "all" | "mine"; eventStatusFilter: string }) {
    const navigate = useNavigate();
    const { data: venues = [] } = useSuspenseQuery(venuesQueryOptions);
    const { data: currentUser } = useCurrentUser();

    // Fetch raw data (typed as AppEvent[])
    const { data: rawOwnEvents = [] } = useSuspenseQuery(ownEventsQueryOptions);
    const { data: rawApprovedEvents = [] } = useSuspenseQuery(
        approvedEventsQueryOptions,
    );
    const { data: rawAllEvents = [] } = useQuery({
        ...allEventsQueryOptions,
        enabled:
            currentUser?.role === "SUPER_ADMIN" ||
            currentUser?.role === "VP_ADMIN" ||
            currentUser?.role === "MSDO" ||
            currentUser?.role === "OPC" ||
            currentUser?.role === "SSD" ||
            currentUser?.role === "FAO" ||
            currentUser?.role === "VPAA" ||
            currentUser?.role === "DEPT_HEAD",
    });
    const { data: rawPendingVenueOwnerEvents = [] } = useQuery({
        ...pendingVenueOwnerEventsQueryOptions,
        enabled: currentUser?.role === "VENUE_OWNER",
    });

    const venueMap = new Map(
        venues.map((venue: VenueDTO) => [venue.publicId, venue.name]),
    );

    // Map raw data to EventDTO[]
    const ownEvents: EventDTO[] = rawOwnEvents.map(mapEventToEventDTO);
    const approvedEvents: EventDTO[] =
        rawApprovedEvents.map(mapEventToEventDTO);
    const allEvents: EventDTO[] = (rawAllEvents ?? []).map(mapEventToEventDTO);
    const pendingVenueOwnerEvents: EventDTO[] =
        rawPendingVenueOwnerEvents.map(mapEventToEventDTO);

    const handleNavigate = (eventId: string | undefined) => {
        if (typeof eventId === "string") {
            navigate({ to: `/app/events/${eventId}` });
        } else {
            console.warn("Attempted to navigate with invalid event ID");
        }
    };

    const filteredOwnEvents = ownEvents.filter((event) => {
        if (
            event.status?.toUpperCase() === "CANCELED" &&
            currentUser?.role !== "SUPER_ADMIN" &&
            currentUser?.role !== "VP_ADMIN" &&
            currentUser?.role !== "MSDO" &&
            currentUser?.role !== "OPC" &&
            currentUser?.role !== "SSD" &&
            currentUser?.role !== "FAO" &&
            currentUser?.role !== "VPAA" &&
            currentUser?.role !== "DEPT_HEAD"
        ) {
            return false;
        }
        return true;
    });

    // Determine which list to render for the 'all' tab based on role
    let allEventsSource: EventDTO[] = []; // Initialize with correct type

    if (currentUser?.role === "VENUE_OWNER") {
        allEventsSource = pendingVenueOwnerEvents;
    } else if (
        currentUser?.role === "SUPER_ADMIN" ||
        currentUser?.role === "VP_ADMIN" ||
        currentUser?.role === "MSDO" ||
        currentUser?.role === "OPC" ||
        currentUser?.role === "SSD" ||
        currentUser?.role === "FAO" ||
        currentUser?.role === "VPAA" ||
        currentUser?.role === "DEPT_HEAD"
    ) {
        allEventsSource = allEvents;
    } else {
        // Default to approved events for other roles (like ORGANIZER)
        allEventsSource = approvedEvents;
    }

    // Determine which list to render based on the activeTab prop
    const baseEventsToDisplay =
        activeTab === "all" ? allEventsSource : filteredOwnEvents;

    // Apply status filter
    const eventsToDisplay = useMemo(() => {
        if (eventStatusFilter === "ALL" || !baseEventsToDisplay) {
            return baseEventsToDisplay ?? [];
        }
        return baseEventsToDisplay.filter(
            (event) =>
                event.status?.toUpperCase() === eventStatusFilter.toUpperCase(),
        );
    }, [baseEventsToDisplay, eventStatusFilter]);

    const noEventsMessage =
        activeTab === "all"
            ? "No events found."
            : "You have not created any events yet.";

    // --- Virtualization Setup ---
    const parentRef = useRef<HTMLDivElement>(null);
    const [lanes, setLanes] = useState(4);
    const gap = 16; // Corresponds to gap-4
    const minCardWidth = 300; // Minimum width before wrapping to fewer columns

    // Effect to calculate lanes based on container width
    useEffect(() => {
        const parentElement = parentRef.current;
        if (!parentElement) return;

        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                // Use contentBoxSize for more accurate width calculation, excluding padding
                const parentWidth = entry.contentBoxSize[0]?.inlineSize;
                if (parentWidth) {
                    // Calculate how many columns fit
                    const newLanes = Math.max(
                        1,
                        Math.floor((parentWidth + gap) / (minCardWidth + gap)),
                    );
                    setLanes(newLanes);
                }
            }
        });

        resizeObserver.observe(parentElement);

        // Cleanup observer on component unmount
        return () => {
            resizeObserver.disconnect();
        };
    }, []); // Rerun only on mount/unmount - gap and minCardWidth are constants

    const virtualizer = useVirtualizer({
        count: eventsToDisplay.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 300, // Initial estimate, measureElement will correct it
        overscan: 5,
        lanes: lanes, // Use dynamic lanes
        gap: 0,
        getItemKey: (index) => eventsToDisplay[index]?.publicId ?? index,
        measureElement: (element) => {
            // Ensure it's an HTMLElement before accessing offsetHeight
            if (element instanceof HTMLElement) {
                return element.offsetHeight;
            }
            return 0; // Default or fallback size
        },
    });

    // Get virtual items
    const virtualItems = virtualizer.getVirtualItems();

    // Calculate item width based on current lanes and parent width
    // This calculation needs to happen *inside* the component body to access parentRef.current
    // But be careful as parentRef.current might not be available initially or during render
    const parentWidth = parentRef.current?.clientWidth ?? 0;
    // Subtract padding (p-4 => 1rem = 16px each side) from clientWidth
    const containerWidth = parentWidth ? parentWidth - 2 * 16 : 0;
    const itemWidth =
        lanes > 0 && containerWidth > 0
            ? (containerWidth - (lanes - 1) * gap) / lanes
            : 0;

    return (
        <div
            ref={parentRef}
            className="h-[85vh] overflow-y-auto overflow-x-hidden p-4 scrollbar-thin scrollbar-thumb-primary scrollbar-track-muted"
            style={{ contain: "strict" }} // Optimization hint for browsers
        >
            {eventsToDisplay.length === 0 ? (
                <div className="text-center text-muted-foreground py-10">
                    {noEventsMessage}
                </div>
            ) : (
                <div
                    className="w-full relative" // Container for absolute positioned items
                    style={{
                        height: `${virtualizer.getTotalSize()}px`, // Set total height
                    }}
                >
                    {virtualItems.map((virtualItem) => {
                        const event = eventsToDisplay[virtualItem.index];
                        if (!event || !event.publicId || itemWidth <= 0)
                            return null; // Ensure event and itemWidth are valid

                        const itemLeft = virtualItem.lane * (itemWidth + gap);

                        return (
                            <div
                                key={virtualItem.key}
                                ref={virtualizer.measureElement}
                                data-index={virtualItem.index}
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    width: `${itemWidth}px`,
                                    height: `${virtualItem.size}px`,
                                    transform: `translateY(${virtualItem.start}px) translateX(${itemLeft}px)`,
                                    paddingBottom: `${gap}px`,
                                }}
                            >
                                <EventCard
                                    event={event}
                                    venueMap={venueMap}
                                    onNavigate={handleNavigate}
                                />
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
