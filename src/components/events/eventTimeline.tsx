import { useQuery, useSuspenseQuery } from "@tanstack/react-query"; // Import query hook
import { useNavigate } from "@tanstack/react-router";
import { format, getMonth, getYear } from "date-fns"; // Import date functions
import {
	CheckCircle,
	ChevronRight,
	Circle,
	Clock,
	MapPin, // Added for venue
	Tag, // Added for event type
} from "lucide-react";
import {
	Avatar,
	AvatarFallback /*, AvatarImage*/,
} from "@/components/ui/avatar"; // Keep AvatarImage if URLs might exist later
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area"; // Import ScrollArea
import {
	timelineEventsByDateRangeQueryOptions, // Import new query option
	useCurrentUser, // Import hook to get current user
	venuesQueryOptions,
} from "@/lib/query"; // Import query options
import type { Event } from "@/lib/types"; // Import Event type
import { formatDateRange, getInitials, getStatusColor } from "@/lib/utils"; // Import helpers

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

interface EventTimelineProps {
	startDateISO?: string;
	endDateISO?: string;
}

export function EventTimeline({
	startDateISO,
	endDateISO,
}: EventTimelineProps) {
	const navigate = useNavigate();
	const { data: currentUser } = useCurrentUser();

	// Fetch venues data
	const { data: venues = [] } = useSuspenseQuery(venuesQueryOptions);

	// Fetch events using the new timelineEventsByDateRangeQueryOptions, now using props
	const { data: timelineEventsSource = [], isLoading: isLoadingEvents } =
		useQuery({
			...timelineEventsByDateRangeQueryOptions(startDateISO, endDateISO), // Use ISO dates from props
			enabled: !!currentUser,
		});

	// Create a map for quick venue lookup
	const venueMap = new Map(venues.map((venue) => [venue.publicId, venue.name]));

	// Group events by month and year using the selected source
	const groupedEvents = timelineEventsSource.reduce(
		(acc: Record<string, MonthGroup>, event: Event) => {
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

	const handleNavigate = (eventId: string) => {
		navigate({ to: `/app/events/${eventId}` });
	};

	return (
		<ScrollArea className="h-[85vh] w-full">
			<div className="space-y-6 p-4">
				{isLoadingEvents ? (
					<div className="text-center text-muted-foreground py-10">
						Loading events...
					</div>
				) : timelineData.length === 0 ? (
					<div className="text-center text-muted-foreground py-10">
						No events found for the selected date range.
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

										// Format date range
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
											<Card
												key={event.publicId}
												className="overflow-hidden border-l-4"
											>
												<CardHeader>
													<div className="flex items-start justify-between">
														<div className="flex items-center gap-2">
															{getStatusIcon(event.status)}
															<h4 className="font-medium">{event.eventName}</h4>
														</div>
														<Badge
															className={`${getStatusColor(event.status)}`}
														>
															{event.status
																? event.status.charAt(0).toUpperCase() +
																	event.status.slice(1).toLowerCase()
																: "Unknown"}
														</Badge>
													</div>
												</CardHeader>
												<CardContent>
													{/* Event Type */}
													<div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
														<Tag className="h-4 w-4" />
														<span>{event.eventType ?? "N/A"}</span>
													</div>
													{/* Date/Time */}
													<div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
														<Clock className="h-4 w-4" />
														<span>{dateDisplayString}</span>
													</div>
													{/* Venue */}
													<div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
														<MapPin className="h-4 w-4" />
														<span>
															{venueMap.get(event.eventVenue?.publicId) ??
																"Unknown Venue"}
														</span>
													</div>
													<div className="flex items-center justify-between gap-2">
														<div className="flex items-center gap-2">
															<Avatar className="h-6 w-6">
																<AvatarFallback>
																	{getInitials(organizerName)}
																</AvatarFallback>
															</Avatar>
															<span className="text-xs">{organizerName}</span>
														</div>
														<Button
															variant="ghost"
															size="icon"
															className="flex items-center gap-2 text-sm font-normal"
															onClick={() => handleNavigate(event.publicId)}
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
		</ScrollArea>
	);
}
