export const EventHeight = 24;

// Vertical gap between events in pixels - controls spacing in month view
export const EventGap = 4;

// Height of hour cells in week and day views - controls the scale of time display
export const WeekCellsHeight = 64;

// Number of days to show in the agenda view
export const AgendaDaysToShow = 30;

// Start and end hours for the week and day views
export const StartHour = 0;
export const EndHour = 24;

// Default start and end times
export const DefaultStartHour = 9; // 9 AM
export const DefaultEndHour = 10; // 10 AM

// ---------- Status → Color mapping (centralized) ----------
import type { EventColor } from "./types";
import { EVENT_STATUSES } from "@/lib/constants";

// Uppercase status to calendar EventColor used across views
export const STATUS_TO_EVENT_COLOR: Record<string, EventColor> = {
	APPROVED: "maroon",
	ONGOING: "sky",
	PENDING: "gold",
	CANCELED: "rose",
	CANCELLED: "rose",
	REJECTED: "rose",
	COMPLETED: "violet",
};

export interface StatusLegendItem {
	key: string;
	label: string;
	color: EventColor;
}

// Build legend items from a list/set of statuses
export function buildStatusLegendItems(
	statuses: Iterable<string>,
): StatusLegendItem[] {
	return Array.from(statuses)
		.map((s) => s.toUpperCase())
		.filter((s, idx, arr) => arr.indexOf(s) === idx)
		.map((status) => {
			const color = STATUS_TO_EVENT_COLOR[status] ?? "sky";
			const label =
				EVENT_STATUSES[status.toLowerCase()]?.label ??
				status.charAt(0) + status.slice(1).toLowerCase();
			return { key: status, label, color };
		});
}
