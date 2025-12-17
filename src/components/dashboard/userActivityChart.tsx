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
import { userReservationActivityQueryOptions } from "@/lib/query";
import type { UserReservationActivityDTO } from "@/lib/types";
import { Skeleton } from "../ui/skeleton";

interface UserActivityChartProps {
	dateRange?: DateRange;
	limit?: number;
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

export function UserActivityChart({
	dateRange,
	limit = 7,
}: UserActivityChartProps) {
	const startDate = dateRange?.from
		? format(dateRange.from, "yyyy-MM-dd")
		: undefined;
	const endDate = dateRange?.to
		? format(dateRange.to, "yyyy-MM-dd")
		: undefined;

	const {
		data: userActivityData,
		isLoading,
		isError,
		error,
	} = useQuery(
		userReservationActivityQueryOptions(startDate, endDate, undefined, limit),
	);

	const typedUserActivityData = userActivityData as
		| UserReservationActivityDTO[]
		| undefined;

	const chartData = React.useMemo(() => {
		if (!typedUserActivityData) return [];
		return typedUserActivityData
			.map((user) => ({
				name: `${user.userFirstName} ${user.userLastName}`.trim(),
				value: user.totalReservationCount || 0,
			}))
			.filter((user) => user.value > 0)
			.sort((a, b) => b.value - a.value);
	}, [typedUserActivityData]);

	const totalReservations = React.useMemo(() => {
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
				<p className="text-sm">
					{error instanceof Error ? error.message : "Could not fetch data."}
				</p>
			</div>
		);
	}

	if (!chartData || chartData.length === 0) {
		return (
			<div className="h-[300px] w-full flex items-center justify-center text-muted-foreground">
				<p>No activity to display.</p>
			</div>
		);
	}

	return (
		<ChartContainer
			config={chartConfig}
			className="h-[350px] sm:h-[400px] w-full aspect-auto"
		>
			<PieChart>
				<Pie
					data={chartData}
					cx="50%"
					cy="45%"
					labelLine={false}
					label={false}
					outerRadius="60%"
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
							const percentage = (
								(data.value / totalReservations) *
								100
							).toFixed(1);
							return (
								<div className="min-w-[140px] rounded-lg border bg-background p-2 shadow-sm text-xs">
									<div className="font-bold mb-1 text-foreground truncate">
										{data.name}
									</div>
									<div className="space-y-1">
										<div className="flex items-center justify-between gap-2">
											<span className="text-muted-foreground">
												Reservations:
											</span>
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
					height={80}
					wrapperStyle={{
						fontSize: "10px",
						paddingTop: "10px",
						display: "flex",
						flexWrap: "wrap",
						justifyContent: "center",
						gap: "4px",
						maxWidth: "100%",
						overflowX: "auto",
						overflowY: "hidden",
					}}
					formatter={(value, entry) => {
						const data = entry.payload as { value: number };
						const percentage = ((data.value / totalReservations) * 100).toFixed(
							1,
						);
						const truncatedValue =
							value.length > 15 ? `${value.slice(0, 15)}...` : value;
						return `${truncatedValue} (${percentage}%)`;
					}}
				/>
			</PieChart>
		</ChartContainer>
	);
}
