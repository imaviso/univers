export const EVENT_STATUSES: Record<
	string,
	{
		label: string;
		color: string;
		dataKey: keyof EventCountDTOWithOptionalCounts;
	}
> = {
	pending: {
		label: "Pending",
		color: "var(--chart-1)",
		dataKey: "pendingCount",
	},
	approved: {
		label: "Approved",
		color: "var(--chart-2)",
		dataKey: "approvedCount",
	},
	ongoing: {
		label: "Ongoing",
		color: "var(--chart-3)",
		dataKey: "ongoingCount",
	},
	completed: {
		label: "Completed",
		color: "var(--chart-4)",
		dataKey: "completedCount",
	},
	rejected: {
		label: "Rejected",
		color: "var(--chart-5)",
		dataKey: "rejectedCount",
	},
	canceled: {
		label: "Canceled",
		color: "var(--chart-6)",
		dataKey: "canceledCount",
	},
};

// Helper type for EventCountDTO to ensure dataKey is valid
interface EventCountDTOWithOptionalCounts {
	date: string;
	pendingCount?: number;
	approvedCount?: number;
	rejectedCount?: number;
	canceledCount?: number;
	ongoingCount?: number;
	completedCount?: number;
}

// Default placeholder for equipment images
export const DEFAULT_EQUIPMENT_IMAGE_URL =
	"https://placehold.co/600x400?text=Equipment";

// Default placeholder for venue images
export const DEFAULT_VENUE_IMAGE_URL =
	"https://placehold.co/600x400?text=Venue";
