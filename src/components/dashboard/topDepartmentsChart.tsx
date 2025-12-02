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
import { topDepartmentsQueryOptions } from "@/lib/query";
import type { TopDepartmentDTO } from "@/lib/types";
import { Skeleton } from "../ui/skeleton";

interface TopDepartmentsChartProps {
	dateRange?: DateRange;
}

// Define colors for each slice
const CHART_COLORS = [
	"var(--chart-1)",
	"var(--chart-2)",
	"var(--chart-3)",
	"var(--chart-4)",
	"var(--chart-5)",
];

export function TopDepartmentsChart({ dateRange }: TopDepartmentsChartProps) {
	const startDate = dateRange?.from
		? format(dateRange.from, "yyyy-MM-dd")
		: undefined;
	const endDate = dateRange?.to
		? format(dateRange.to, "yyyy-MM-dd")
		: undefined;
	const limit = 5;

	const {
		data: rawTopDepartmentsData,
		isLoading,
		isError,
		error,
	} = useQuery(topDepartmentsQueryOptions(startDate, endDate, limit));

	const topDepartmentsData = rawTopDepartmentsData as
		| TopDepartmentDTO[]
		| undefined;

	const chartData = React.useMemo(() => {
		if (!topDepartmentsData) return [];
		return topDepartmentsData
			.map((dept) => ({
				name: dept.departmentName,
				value: dept.reservationRate,
				totalEventCount: dept.totalEventCount,
				approvedCount: dept.approvedCount,
				ongoingCount: dept.ongoingCount,
				completedCount: dept.completedCount,
			}))
			.filter((dept) => dept.value > 0)
			.sort((a, b) => b.value - a.value);
	}, [topDepartmentsData]);

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

	const totalRate = React.useMemo(() => {
		return chartData.reduce((sum, item) => sum + item.value, 0);
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
				<p>Error loading top departments data.</p>
				<p className="text-sm">{error?.message}</p>
			</div>
		);
	}

	if (!chartData || chartData.length === 0) {
		return (
			<div className="h-[300px] w-full flex items-center justify-center text-muted-foreground">
				<p>No top departments data available for the selected period.</p>
			</div>
		);
	}

	return (
		<div className="h-[300px] w-full">
			<ChartContainer config={chartConfig} className="h-full w-full">
				<PieChart>
					<Pie
						data={chartData}
						cx="50%"
						cy="50%"
						labelLine={false}
						label={({ name, percent }) => {
							const percentage = (percent * 100).toFixed(1);
							return `${name}: ${percentage}%`;
						}}
						outerRadius={80}
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
								const percentage = ((data.value / totalRate) * 100).toFixed(1);
								return (
									<div className="min-w-[220px] rounded-lg border bg-background p-2 shadow-sm text-xs">
										<div className="font-bold mb-1 text-foreground">
											{data.name}
										</div>
										<div className="space-y-1">
											<div className="flex items-center justify-between">
												<span className="text-muted-foreground">
													Reservation Rate:
												</span>
												<span className="font-semibold text-foreground">
													{data.value.toFixed(1)}%
												</span>
											</div>
											<div className="flex items-center justify-between">
												<span className="text-muted-foreground">
													Share of Total:
												</span>
												<span className="font-semibold text-foreground">
													{percentage}%
												</span>
											</div>
											<div className="flex items-center justify-between">
												<span className="text-muted-foreground">
													Total Events:
												</span>
												<span className="font-semibold text-foreground">
													{data.totalEventCount}
												</span>
											</div>
											<div className="flex items-center justify-between">
												<span className="text-muted-foreground">Approved:</span>
												<span className="font-semibold text-foreground">
													{data.approvedCount}
												</span>
											</div>
											<div className="flex items-center justify-between">
												<span className="text-muted-foreground">Ongoing:</span>
												<span className="font-semibold text-foreground">
													{data.ongoingCount}
												</span>
											</div>
											<div className="flex items-center justify-between">
												<span className="text-muted-foreground">
													Completed:
												</span>
												<span className="font-semibold text-foreground">
													{data.completedCount}
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
						height={36}
						formatter={(value, entry) => {
							const data = entry.payload as { value: number };
							const percentage = ((data.value / totalRate) * 100).toFixed(1);
							return `${value} (${percentage}%)`;
						}}
					/>
				</PieChart>
			</ChartContainer>
		</div>
	);
}
