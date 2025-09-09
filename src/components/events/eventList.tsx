import { useSuspenseQuery } from "@tanstack/react-query"; // Import query hook
import { useNavigate } from "@tanstack/react-router";
import { EventCard } from "@/components/events/eventCard"; // Import EventCard relative to src
import { ScrollArea } from "@/components/ui/scroll-area"; // Import ScrollArea
import {
	searchEventsQueryOptions,
	useCurrentUser,
	venuesQueryOptions,
} from "@/lib/query"; // Import query options
import type { VenueDTO } from "@/lib/types"; // Ensure Venue is imported if not already
import { EventListItem } from "./EventListItem"; // Import EventListItem

// Accept activeTab and eventStatusFilter as props
export function EventList({
	activeTab,
	eventStatusFilter,
	sortBy,
	startDateISO,
	endDateISO,
	displayView, // Add displayView prop
}: {
	activeTab: "all" | "mine" | "related"; // Updated type
	eventStatusFilter: string;
	sortBy?: string;
	startDateISO?: string;
	endDateISO?: string;
	displayView: "list" | "card"; // Define prop type
}) {
	const navigate = useNavigate();
	const { data: venues = [] } = useSuspenseQuery(venuesQueryOptions);
	const { data: currentUser } = useCurrentUser();

	const venueMap = new Map(
		venues.map((venue: VenueDTO) => [venue.publicId, venue.name]),
	);

	// Directly use activeTab as scope. Backend handles role-based access for each scope.
	const scope = activeTab;

	// Fetch data using the single search query
	const { data: events = [] } = useSuspenseQuery(
		searchEventsQueryOptions(
			scope, // Use the scope determined by activeTab
			eventStatusFilter,
			sortBy,
			startDateISO,
			endDateISO,
		),
	);

	const handleNavigate = (eventId: string | undefined) => {
		if (typeof eventId === "string") {
			navigate({ to: `/app/events/${eventId}` });
		} else {
			console.warn("Attempted to navigate with invalid event ID");
		}
	};

	// Client-side filter: Hide CANCELED events in 'mine' tab for non-admins
	const eventsToDisplay = events.filter((event) => {
		if (scope === "mine") {
			if (
				event.status?.toUpperCase() === "CANCELED" &&
				!currentUser?.roles?.includes("SUPER_ADMIN") &&
				!currentUser?.roles?.includes("VP_ADMIN") &&
				!currentUser?.roles?.includes("ADMIN") &&
				!currentUser?.roles?.includes("DEPT_HEAD")
			) {
				return false;
			}
		}
		return true;
	});

	const noEventsMessage =
		activeTab === "all"
			? "No events found."
			: "You have not created any events yet.";

	return (
		<ScrollArea className="h-[90vh] w-full">
			{eventsToDisplay.length === 0 ? (
				<div className="text-center text-muted-foreground py-10">
					{noEventsMessage}
				</div>
			) : (
				<div>
					{" "}
					{/* Container for list or grid */}
					{displayView === "card" ? (
						<div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 pr-6 py-4">
							{eventsToDisplay.map((event) => (
								<EventCard
									key={`card-${activeTab}-${event.publicId}`}
									event={event}
									venueMap={venueMap}
									onNavigate={handleNavigate}
								/>
							))}
						</div>
					) : (
						<div className="flex flex-col gap-0 pr-6">
							{" "}
							{/* List view container */}
							{/* Optional: Add a header row here */}
							{eventsToDisplay.map((event) => (
								<EventListItem
									key={`list-${activeTab}-${event.publicId}`}
									event={event}
									venueMap={venueMap}
									onNavigate={handleNavigate}
								/>
							))}
						</div>
					)}
				</div>
			)}
		</ScrollArea>
	);
}
