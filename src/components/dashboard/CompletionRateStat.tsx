import { CheckCircle } from "lucide-react"; // Example icon
import { StatCard } from "./StatCard";

export function CompletionRateStat() {
	// Placeholder data and logic
	const completionRate = "N/A"; // Replace with actual data fetching when available
	const isLoading = false; // Set to true when fetching data

	return (
		<StatCard
			title="Event Completion Rate"
			value={completionRate}
			icon={CheckCircle}
			isLoading={isLoading}
			description="Based on completed events"
		/>
	);
}
