import { Link } from "@tanstack/react-router"; // Import Link for navigation
import { format, isSameDay } from "date-fns";
import {
	Building,
	Calendar,
	Clock,
	ExternalLink,
	MapPin,
	Phone,
	Tag,
	User,
	Users,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import type { Event } from "@/lib/types"; // Use the correct Event type
import { getApproverStatusBadge } from "@/lib/utils";

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
					{getApproverStatusBadge(event.status)}
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
				{/* Event Details Section */}
				<div className="space-y-4 pt-4">
					{/* Date & Time Section */}
					<div className="space-y-3">
						<div className="flex items-center gap-2 text-sm">
							<Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
							<span className="font-medium">
								{format(new Date(event.startTime), "PPP")}
							</span>
						</div>
						<div className="flex items-center gap-2 text-sm">
							<Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
							<span>
								{isSameDay(new Date(event.startTime), new Date(event.endTime))
									? `${format(new Date(event.startTime), "p")} - ${format(new Date(event.endTime), "p")}`
									: `${format(new Date(event.startTime), "p")} to ${format(new Date(event.endTime), "PPP p")}`}
							</span>
						</div>
					</div>

					<Separator />

					{/* Venue Section */}
					{event.eventVenue && (
						<>
							<div className="space-y-2">
								<div className="flex items-center gap-2 text-sm">
									<MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
									<span className="font-medium">{event.eventVenue.name}</span>
								</div>
								{event.eventVenue.location && (
									<div className="flex items-center gap-2 text-sm text-muted-foreground ml-6">
										<span>{event.eventVenue.location}</span>
									</div>
								)}
							</div>
							<Separator />
						</>
					)}

					{/* Department Section */}
					{event.department && (
						<>
							<div className="space-y-2">
								<div className="flex items-center gap-2 text-sm">
									<Building className="h-4 w-4 text-muted-foreground flex-shrink-0" />
									<span className="font-medium">{event.department.name}</span>
								</div>
								{event.department.description && (
									<div className="flex items-center gap-2 text-sm text-muted-foreground ml-6">
										<span>{event.department.description}</span>
									</div>
								)}
							</div>
							<Separator />
						</>
					)}

					{/* Event Type Section */}
					<div className="flex items-center gap-2 text-sm">
						<Tag className="h-4 w-4 text-muted-foreground flex-shrink-0" />
						<span>{event.eventType || "N/A"}</span>
					</div>

					<Separator />

					{/* Organizer Section */}
					<div className="flex items-center gap-2 text-sm">
						<User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
						<div className="flex items-center gap-2">
							<Avatar className="h-6 w-6">
								<AvatarImage
									src={event.organizer.profileImagePath || undefined}
								/>
								<AvatarFallback className="text-xs">
									{event.organizer.firstName[0]}
									{event.organizer.lastName[0]}
								</AvatarFallback>
							</Avatar>
							<span>
								{event.organizer.firstName} {event.organizer.lastName}
							</span>
							{event.organizer.phoneNumber && (
								<span className="text-muted-foreground text-xs">
									• {event.organizer.phoneNumber}
								</span>
							)}
						</div>
					</div>

					{/* Staff Section */}
					{event.assignedPersonnel && event.assignedPersonnel.length > 0 && (
						<>
							<Separator />
							<div className="space-y-3">
								<div className="flex items-center gap-2 text-sm">
									<Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
									<span className="font-medium">
										Staff ({event.assignedPersonnel.length})
									</span>
								</div>
								<div className="ml-6 space-y-2">
									{event.assignedPersonnel.map((person) => (
										<div
											key={person.publicId}
											className="flex items-center gap-2 text-sm"
										>
											<Avatar className="h-6 w-6">
												<AvatarFallback className="text-xs">
													{person.name
														.split(" ")
														.map((n) => n[0])
														.join("")
														.slice(0, 2)}
												</AvatarFallback>
											</Avatar>
											<span>{person.name}</span>
											{person.phoneNumber && (
												<div className="flex items-center gap-1 text-muted-foreground text-xs">
													<Phone className="h-3 w-3" />
													<span>{person.phoneNumber}</span>
												</div>
											)}
										</div>
									))}
								</div>
							</div>
						</>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
