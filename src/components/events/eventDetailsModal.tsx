import { Link } from "@tanstack/react-router"; // Import Link for navigation
import { format, isSameDay } from "date-fns";
import { Clock, ExternalLink, Users } from "lucide-react"; // Removed Edit, Trash. Added ExternalLink
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import type { Event } from "@/lib/types"; // Use the correct Event type
import { getStatusColor } from "@/lib/utils";

// Removed useState as Team/Comments tabs are removed

interface EventDetailsModalProps {
	isOpen: boolean;
	onClose: () => void;
	event: Event;
}

export function EventDetailsModal({
	isOpen,
	onClose,
	event,
}: EventDetailsModalProps) {
	// Removed state for tabs, comments, etc.

	if (!event) return null;

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-[550px]">
				{" "}
				{/* Adjusted width */}
				<DialogHeader>
					<DialogTitle className="text-xl flex items-center gap-4">
						{event.eventName}
						<Button variant="outline" size="sm" className="gap-1" asChild>
							<Link
								to="/app/events/$eventId"
								params={{ eventId: event.publicId }}
							>
								<ExternalLink className="h-4 w-4" />
							</Link>
						</Button>
					</DialogTitle>
				</DialogHeader>
				<div className="flex justify-between items-start gap-4">
					{" "}
					{/* Use items-start */}
					<Badge className={`${getStatusColor(event.status)}`}>
						{event.status
							? event.status.charAt(0).toUpperCase() +
								event.status.slice(1).toLowerCase()
							: "Unknown"}
					</Badge>
					<div className="flex flex-col sm:flex-row gap-2">
						{" "}
						{/* Stack buttons on small screens */}
						{/* Button to navigate to the full event details page */}
						{/* TODO: Implement Edit/Delete functionality */}
						{/* <Button variant="outline" size="sm" className="gap-1">
                            <Edit className="h-4 w-4" />
                            Edit
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-1 text-destructive hover:text-destructive"
                        >
                            <Trash className="h-4 w-4" />
                            Delete
                        </Button> */}
					</div>
				</div>
				{/* Simplified Details Section */}
				<div className="space-y-4 pt-4">
					<div className="space-y-3">
						{/* Event Time */}
						<div className="flex items-center gap-2 text-sm">
							<Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
							<span>
								{format(new Date(event.startTime), "PPP")}
								{isSameDay(new Date(event.startTime), new Date(event.endTime))
									? // Same day: Show time range
										` ${format(new Date(event.startTime), "p")} - ${format(new Date(event.endTime), "p")}`
									: // Different days: Show end date
										` to ${format(new Date(event.endTime), "PPP")}`}
							</span>
						</div>

						{/* Organizer Info */}
						<div className="flex items-center gap-2 text-sm">
							<Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
							<span>
								Organizer: {event.organizer.firstName}{" "}
								{event.organizer.lastName}
							</span>
						</div>

						{/* TODO: Display Venue Location (Requires fetching Venue data) */}
						{/* <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span>Venue: {venue?.name ?? 'Loading...'} ({venue?.location ?? '...'})</span>
                        </div> */}

						{/* Event Type */}
						<div className="flex items-center gap-2 text-sm">
							{/* You might want a specific icon for event type */}
							<span className="ml-6">
								{" "}
								{/* Indent to align with others */}
								Type: {event.eventType || "N/A"}
							</span>
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
