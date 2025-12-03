import { format } from "date-fns";
import { ChevronRight, Clock, MapPin, Tag } from "lucide-react";
import { useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCurrentUser } from "@/lib/query";
import type { EventDTO } from "@/lib/types";
import {
	formatDateRange,
	getApproverStatusBadge,
	getInitials,
} from "@/lib/utils";

// Helper component for rendering a single event card
export function EventCard({
	// Make sure it's exported
	event,
	venueMap,
	onNavigate,
}: {
	event: EventDTO;
	venueMap: Map<string, string>;
	onNavigate: (eventId: string | undefined) => void;
}) {
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
			(approval) => approval.signedByUser?.publicId === currentUser.publicId,
		);
	}, [event?.approvals, currentUser]);

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
				<div className="flex items-start justify-between gap-2">
					<div className="flex-1 min-w-0">
						{currentUserApproval ? (
							<TooltipProvider>
								<Tooltip delayDuration={500}>
									<TooltipTrigger asChild>
										<h3
											className={`text-sm sm:text-base font-medium truncate ${
												currentUserApproval.status === "APPROVED"
													? "text-maroon"
													: currentUserApproval.status === "REJECTED"
														? "text-red-600"
														: "text-yellow-600"
											}`}
											title={event.eventName}
										>
											{event.eventName}
										</h3>
									</TooltipTrigger>
									<TooltipContent>
										<div className="flex flex-col gap-1">
											<span className="font-medium">
												{currentUserApproval.status === "PENDING"
													? "Your approval is pending"
													: `You ${currentUserApproval.status.toLowerCase()} this event`}
											</span>
											{currentUserApproval.dateSigned && (
												<span className="text-xs text-primary-foreground">
													on{" "}
													{format(
														new Date(currentUserApproval.dateSigned),
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
							<h3
								className="text-sm sm:text-base font-medium truncate"
								title={event.eventName}
							>
								{event.eventName}
							</h3>
						)}
					</div>
					<div className="flex flex-col items-end gap-1 flex-shrink-0">
						{getApproverStatusBadge(event.status)}
					</div>
				</div>
			</CardHeader>
			<CardContent className="flex-grow">
				<div className="space-y-2 sm:space-y-3">
					<div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
						<Tag className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
						<span className="truncate" title={event.eventType ?? "N/A"}>
							{event.eventType ?? "N/A"}
						</span>
					</div>
					<div className="flex items-start gap-2 text-xs sm:text-sm text-muted-foreground">
						<Clock className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 mt-0.5" />
						<span className="break-words">{dateDisplayString}</span>
					</div>
					<div className="flex items-start gap-2 text-xs sm:text-sm text-muted-foreground">
						<MapPin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 mt-0.5" />
						<span className="break-words">
							{venueMap.get(event.eventVenue?.publicId) ?? "Unknown Venue"}
						</span>
					</div>
				</div>
			</CardContent>
			<Separator />
			<CardFooter className="flex items-center justify-between gap-2">
				<div className="flex items-center gap-2 min-w-0 flex-1">
					<Avatar className="h-6 w-6 sm:h-8 sm:w-8 flex-shrink-0">
						<AvatarImage
							src={event.organizer?.profileImagePath ?? ""}
							alt={organizerName}
						/>
						<AvatarFallback>{getInitials(organizerName)}</AvatarFallback>
					</Avatar>
					<span
						className="text-xs text-muted-foreground truncate"
						title={organizerName}
					>
						{organizerName}
					</span>
				</div>
				<Button
					variant="ghost"
					size="icon"
					className="flex items-center gap-2 text-sm font-normal flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10"
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
