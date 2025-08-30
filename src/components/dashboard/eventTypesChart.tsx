"use client";

import {
	type ChartConfig,
	ChartContainer,
	ChartLegend,
	ChartLegendContent,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import { EVENT_STATUSES } from "@/lib/constants";
import { eventTypeSummaryQueryOptions } from "@/lib/query";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import {
	Bar,
	BarChart,
	CartesianGrid,
	ResponsiveContainer,
	XAxis,
	YAxis,
} from "recharts";
import { Skeleton } from "../ui/skeleton";

interface EventTypesChartProps {
	dateRange?: DateRange;
}

export function EventTypesChart({ dateRange }: EventTypesChartProps) {
	const startDate = dateRange?.from
		? format(dateRange.from, "yyyy-MM-dd")
		: undefined;
	const endDate = dateRange?.to
		? format(dateRange.to, "yyyy-MM-dd")
		: undefined;

	const {
		data: eventTypesData, // This is EventTypeStatusDistributionDTO[]
		isLoading,
		isError,
		error,
	} = useQuery(eventTypeSummaryQueryOptions(startDate, endDate)); // Removed limit

	if (isLoading) {
		return (
			<div className="h-[300px] w-full flex items-center justify-center">
				<Skeleton className="h-[280px] w-[95%]" />
			</div>
		);
	}

	if (isError) {
		return (
			<div className="h-[300px] w-full flex flex-col items-center justify-center text-red-500">
				<p>Error loading event types data.</p>
				<p className="text-sm">{error?.message}</p>
			</div>
		);
	}

	if (!eventTypesData || eventTypesData.length === 0) {
		return (
			<div className="h-[300px] w-full flex items-center justify-center text-muted-foreground">
				<p>No event type data available for the selected period.</p>
			</div>
		);
	}

	const chartConfig = Object.fromEntries(
		Object.entries(EVENT_STATUSES).map(([statusKey, statusValue]) => [
			`${statusKey.toLowerCase()}Count`, // e.g., "pendingCount"
			{
				label: statusValue.label,
				color: statusValue.color,
			},
		]),
	) satisfies ChartConfig;

	return (
		<div className="h-[300px] w-full">
			<ChartContainer config={chartConfig} className="h-full w-full">
				<ResponsiveContainer width="100%" height="100%">
					<BarChart
						data={eventTypesData}
						layout="vertical"
						margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
					>
						<CartesianGrid horizontal={false} strokeDasharray="3 3" />
						<XAxis
							type="number"
							stroke="#888888"
							fontSize={12}
							tickLine={false}
							axisLine={false}
							allowDecimals={false}
						/>
						<YAxis
							type="category"
							dataKey="name" // Event type names on Y-axis
							stroke="#888888"
							fontSize={12}
							tickLine={false}
							axisLine={false}
							width={120} // Adjust for longer event type names
							interval={0} // Ensure all labels are shown
						/>
						<ChartTooltip
							cursor={{ fill: "hsl(var(--muted))" }}
							content={<ChartTooltipContent hideLabel />}
						/>
						<ChartLegend content={<ChartLegendContent />} />
						{Object.entries(EVENT_STATUSES).map(([statusKey, statusValue]) => (
							<Bar
								key={statusKey}
								dataKey={`${statusKey.toLowerCase()}Count`}
								stackId="a"
								fill={statusValue.color}
								name={statusValue.label}
								radius={[0, 4, 4, 0]} // Rounded right corners for horizontal bars
							/>
						))}
					</BarChart>
				</ResponsiveContainer>
			</ChartContainer>
		</div>
	);
}
