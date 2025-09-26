import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { parseISO } from "date-fns";
import { useEffect, useMemo, useState } from "react";

import ErrorPage from "@/components/ErrorPage";
import type { CalendarEvent } from "@/components/event-calendar";
import { EventCalendar } from "@/components/event-calendar";
import {
	buildStatusLegendItems,
	STATUS_TO_EVENT_COLOR,
} from "@/components/event-calendar/constants";
import { EventDetailsModal } from "@/components/events/eventDetailsModal";
import PendingPage from "@/components/PendingPage";
import { allNavigation } from "@/lib/navigation";
import { searchEventsQueryOptions } from "@/lib/query";
import type { EventDTO, Event as EventType, UserRole } from "@/lib/types";

export const Route = createFileRoute("/app/calendar")({
	component: Calendar,
	beforeLoad: async ({ location, context }) => {
		const navigationItem = allNavigation.find((item) => {
			return (
				location.pathname === item.href ||
				location.pathname.startsWith(`${item.href}/`)
			);
		});
		const allowedRoles: string[] = navigationItem ? navigationItem.roles : [];

		if (context.authState == null) {
			throw redirect({
				to: "/login",
				search: {
					redirect: location.href,
				},
			});
		}
		const userRoles = context.authState?.roles || [];
		const isAuthorized = allowedRoles.some((role) =>
			userRoles.includes(role as UserRole),
		);

		if (!isAuthorized) {
			throw redirect({
				to: "/login",
				search: {
					redirect: location.href,
				},
			});
		}
	},
	loader: async ({ context }) => {
		context.queryClient.ensureQueryData(searchEventsQueryOptions("ALL"));
	},
	errorComponent: () => <ErrorPage />,
	pendingComponent: () => <PendingPage />,
});

function Calendar() {
	const { data: eventsData = [], isLoading } = useQuery(
		searchEventsQueryOptions("ALL"),
	);

	const [events, setEvents] = useState<CalendarEvent[]>([]);
	const [selectedId, setSelectedId] = useState<string | null>(null);

	const allowedStatuses = useMemo(
		() => new Set(["APPROVED", "ONGOING", "PENDING"]),
		[],
	);

	const legendItems = useMemo(
		() => buildStatusLegendItems(allowedStatuses),
		[allowedStatuses],
	);

	const mappedEvents = useMemo<CalendarEvent[]>(() => {
		return (eventsData as EventDTO[])
			.filter((e) => allowedStatuses.has((e.status || "").toUpperCase()))
			.map((e) => ({
				id: e.publicId,
				title: e.eventName,
				description: e.eventType || "",
				start: parseISO(e.startTime),
				end: parseISO(e.endTime),
				allDay: false,
				color: STATUS_TO_EVENT_COLOR[(e.status || "").toUpperCase()] ?? "sky",
				location: e.eventVenue?.name,
				staffCount: e.assignedPersonnel?.length || 0,
				staffNames: e.assignedPersonnel?.map((p) => p.name) || [],
			}));
	}, [eventsData, allowedStatuses]);

	// Initialize/refresh local state from server data
	useEffect(() => {
		setEvents(mappedEvents);
	}, [mappedEvents]);

	const selectedEvent = useMemo(() => {
		return (
			(eventsData as EventDTO[]).find((e) => e.publicId === selectedId) || null
		);
	}, [eventsData, selectedId]);

	if (isLoading) {
		return <PendingPage />;
	}

	return (
		<div className="flex flex-col flex-1 overflow-hidden">
			<EventCalendar
				events={events}
				legendItems={legendItems}
				onEventClick={(event) => setSelectedId(event.id)}
			/>
			{selectedEvent && (
				<EventDetailsModal
					isOpen={!!selectedEvent}
					onClose={() => setSelectedId(null)}
					event={selectedEvent as unknown as EventType}
				/>
			)}
		</div>
	);
}
