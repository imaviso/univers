"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import * as React from "react";
import type { DateRange } from "react-day-picker";
import { Cell, Legend, Pie, PieChart } from "recharts";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
} from "@/components/ui/chart";
import { topVenuesQueryOptions } from "@/lib/query";
import type { TopVenueDTO } from "@/lib/types";
import { Skeleton } from "../ui/skeleton";

interface EventsPerVenueChartProps {
	dateRange?: DateRange;
}

const CHART_COLORS = [
	"var(--chart-1)",
	"var(--chart-2)",
	"var(--chart-3)",
	"var(--chart-4)",
	"var(--chart-5)",
	"var(--chart-6)",
	"var(--chart-7)",
];

export function EventsPerVenueChart({ dateRange }: EventsPerVenueChartProps) {
	const startDate = dateRange?.from
		? format(dateRange.from, "yyyy-MM-dd")
		: undefined;
	const endDate = dateRange?.to
		? format(dateRange.to, "yyyy-MM-dd")
		: undefined;
	const limit = 7;

	const {
		data: rawTopVenuesData,
		isLoading,
		isError,
		error,
	} = useQuery(topVenuesQueryOptions(startDate, endDate, limit));

	const topVenuesData = rawTopVenuesData as TopVenueDTO[] | undefined;

	const chartData = React.useMemo(() => {
		if (!topVenuesData) return [];
		return topVenuesData
			.map((venue) => ({
				name: venue.venueName,
				value: venue.totalEventCount || 0,
			}))
			.filter((venue) => venue.value > 0)
			.sort((a, b) => b.value - a.value);
	}, [topVenuesData]);

	const totalEvents = React.useMemo(() => {
		return chartData.reduce((sum, item) => sum + item.value, 0);
	}, [chartData]);

	const chartConfig = React.useMemo(() => {
		const config: ChartConfig = {};
		chartData.forEach((item, index) => {
			const key = item.name.toLowerCase().replace(/\s+/g, "-");
			config[key] = {
				label: item.name,
				color: CHART_COLORS[index % CHART_COLORS.length],
			};
		});
		return config;
	}, [chartData]);

	if (isLoading) {
		return (
			<div className="h-[300px] w-full flex items-center justify-center">
				<Skeleton className="h-[200px] w-[200px] rounded-full" />
			</div>
		);
	}

	if (isError) {
		return (
			<div className="h-[300px] w-full flex flex-col items-center justify-center text-red-500">
				<p className="text-sm">Error loading data.</p>
				<p className="text-sm">{error?.message || "Could not fetch data."}</p>
			</div>
		);
	}

	if (chartData.length === 0) {
		return (
			<div className="h-[300px] w-full flex items-center justify-center text-muted-foreground">
				<p>No event data for venues to display.</p>
			</div>
		);
	}

	return (
		<ChartContainer
			config={chartConfig}
			className="h-[400px] sm:h-[450px] w-full aspect-auto"
		>
			<PieChart>
				<Pie
					data={chartData}
					cx="50%"
					cy="40%"
					labelLine={false}
					label={false}
					outerRadius="55%"
					fill="#8884d8"
					dataKey="value"
				>
					{chartData.map((entry, index) => (
						<Cell
							key={`cell-${entry.name}`}
							fill={CHART_COLORS[index % CHART_COLORS.length]}
						/>
					))}
				</Pie>
				<ChartTooltip
					content={({ active, payload }) => {
						if (active && payload && payload.length) {
							const data = payload[0].payload;
							const percentage = ((data.value / totalEvents) * 100).toFixed(1);
							return (
								<div className="min-w-[140px] rounded-lg border bg-background p-2 shadow-sm text-xs">
									<div className="font-bold mb-1 text-foreground truncate">
										{data.name}
									</div>
									<div className="space-y-1">
										<div className="flex items-center justify-between gap-2">
											<span className="text-muted-foreground">Events:</span>
											<span className="font-semibold text-foreground">
												{data.value.toLocaleString()}
											</span>
										</div>
										<div className="flex items-center justify-between gap-2">
											<span className="text-muted-foreground">Percentage:</span>
											<span className="font-semibold text-foreground">
												{percentage}%
											</span>
										</div>
									</div>
								</div>
							);
						}
						return null;
					}}
				/>
				<Legend
					verticalAlign="bottom"
					height={100}
					wrapperStyle={{
						fontSize: "9px",
						paddingTop: "10px",
						lineHeight: "1.4",
						maxWidth: "100%",
						overflowX: "auto",
						overflowY: "hidden",
						display: "flex",
						flexWrap: "wrap",
						justifyContent: "center",
						gap: "4px",
					}}
					formatter={(value, entry) => {
						const data = entry.payload as { value: number };
						const percentage = ((data.value / totalEvents) * 100).toFixed(1);
						const truncatedValue =
							value.length > 12 ? `${value.slice(0, 12)}...` : value;
						return `${truncatedValue} (${percentage}%)`;
					}}
				/>
			</PieChart>
		</ChartContainer>
	);
}
