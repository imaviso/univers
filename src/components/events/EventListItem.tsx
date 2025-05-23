import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCurrentUser } from "@/lib/query";
import type { EventDTO } from "@/lib/types";
import { formatDateRange, getInitials, getStatusColor } from "@/lib/utils";
import { format } from "date-fns";
import { ChevronRight, Clock, MapPin, Tag } from "lucide-react";
import { useMemo } from "react";

interface EventListItemProps {
    event: EventDTO;
    venueMap: Map<string, string>;
    onNavigate: (eventId: string | undefined) => void;
}

export function EventListItem({
    event,
    venueMap,
    onNavigate,
}: EventListItemProps) {
    const { data: currentUser } = useCurrentUser();

    // Get current user's approval status for this event
    const currentUserApproval = useMemo(() => {
        if (
            !currentUser?.publicId ||
            !event?.approvals ||
            !Array.isArray(event.approvals)
        ) {
            return null;
        }
        return event.approvals.find(
            (approval) =>
                approval.signedByUser?.publicId === currentUser.publicId,
        );
    }, [event?.approvals, currentUser]);

    const organizerName = event.organizer
        ? `${event.organizer.firstName} ${event.organizer.lastName}`
        : "Unknown Organizer";

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
            dateDisplayString = "Invalid date format";
        }
    } else {
        dateDisplayString = "Date missing";
    }

    return (
        <div className="flex items-center justify-between p-4 border-b hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-4 flex-1 min-w-0">
                <Avatar className="h-10 w-10 hidden sm:flex">
                    <AvatarImage
                        src={
                            event.imageUrl ||
                            event.organizer?.profileImagePath ||
                            ""
                        }
                        alt={event.eventName}
                    />
                    <AvatarFallback>
                        {getInitials(event.eventName)}
                    </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                    {currentUserApproval ? (
                        <TooltipProvider>
                            <Tooltip delayDuration={500}>
                                <TooltipTrigger asChild>
                                    <p
                                        className={`font-medium truncate ${
                                            currentUserApproval.status ===
                                            "APPROVED"
                                                ? "text-green-600"
                                                : currentUserApproval.status ===
                                                    "REJECTED"
                                                  ? "text-red-600"
                                                  : "text-yellow-600"
                                        }`}
                                        title={event.eventName}
                                    >
                                        {event.eventName}
                                    </p>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <div className="flex flex-col gap-1">
                                        <span className="font-medium">
                                            You{" "}
                                            {currentUserApproval.status.toLowerCase()}{" "}
                                            this event
                                        </span>
                                        {currentUserApproval.dateSigned && (
                                            <span className="text-xs text-primary-foreground">
                                                on{" "}
                                                {format(
                                                    new Date(
                                                        currentUserApproval.dateSigned,
                                                    ),
                                                    "MMM d, yyyy 'at' h:mm a",
                                                )}
                                            </span>
                                        )}
                                        {currentUserApproval.remarks && (
                                            <span className="text-xs text-primary-foreground italic">
                                                "{currentUserApproval.remarks}"
                                            </span>
                                        )}
                                    </div>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    ) : (
                        <p
                            className="font-medium truncate"
                            title={event.eventName}
                        >
                            {event.eventName}
                        </p>
                    )}
                    <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                        <Tag className="h-4 w-4 flex-shrink-0" />
                        <span
                            className="truncate"
                            title={event.eventType ?? "N/A"}
                        >
                            {event.eventType ?? "N/A"}
                        </span>
                    </div>
                </div>
            </div>

            <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground mx-4 flex-shrink-0">
                <Clock className="h-4 w-4" />
                <span>{dateDisplayString}</span>
            </div>

            <div className="hidden lg:flex items-center gap-2 text-sm text-muted-foreground mx-4 flex-shrink-0">
                <MapPin className="h-4 w-4" />
                <span
                    className="truncate"
                    title={
                        venueMap.get(event.eventVenue?.publicId) ??
                        "Unknown Venue"
                    }
                >
                    {venueMap.get(event.eventVenue?.publicId) ??
                        "Unknown Venue"}
                </span>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground mx-4 flex-shrink-0">
                <Avatar className="h-8 w-8">
                    <AvatarImage
                        src={event.organizer?.profileImagePath ?? ""}
                        alt={organizerName}
                    />
                    <AvatarFallback>
                        {getInitials(organizerName)}
                    </AvatarFallback>
                </Avatar>
                <span
                    className="hidden xl:inline truncate"
                    title={organizerName}
                >
                    {organizerName}
                </span>
            </div>

            <Badge
                className={`${getStatusColor(event.status)} w-24 justify-center text-center flex-shrink-0 mx-4 hidden sm:flex`}
            >
                {event.status
                    ? event.status.charAt(0).toUpperCase() +
                      event.status.slice(1).toLowerCase()
                    : "Unknown"}
            </Badge>

            <Button
                variant="ghost"
                size="icon"
                onClick={() => onNavigate(event.publicId)}
                disabled={typeof event.publicId !== "string"}
                className="flex-shrink-0"
            >
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </Button>
        </div>
    );
}
