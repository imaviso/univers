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
import { topEquipmentQueryOptions } from "@/lib/query";
import type { TopEquipmentDTO } from "@/lib/types";
import { Skeleton } from "../ui/skeleton";

interface TopEquipmentChartProps {
	dateRange?: DateRange;
	equipmentTypeFilter?: string;
}

// Define chart colors for pie slices
const CHART_COLORS = [
	"var(--chart-1)",
	"var(--chart-2)",
	"var(--chart-3)",
	"var(--chart-4)",
	"var(--chart-5)",
	"var(--chart-6)",
	"var(--chart-7)",
];

export function TopEquipmentChart({
	dateRange,
	equipmentTypeFilter,
}: TopEquipmentChartProps) {
	const startDate = dateRange?.from
		? format(dateRange.from, "yyyy-MM-dd")
		: undefined;
	const endDate = dateRange?.to
		? format(dateRange.to, "yyyy-MM-dd")
		: undefined;
	const limit = 7;

	const {
		data: rawTopEquipmentData,
		isLoading,
		isError,
		error,
	} = useQuery(
		topEquipmentQueryOptions(startDate, endDate, equipmentTypeFilter, limit),
	);

	const topEquipmentData = rawTopEquipmentData as TopEquipmentDTO[] | undefined;

	const chartData = React.useMemo(() => {
		if (!topEquipmentData) return [];
		return topEquipmentData
			.map((equip) => ({
				name: equip.equipmentName,
				value: equip.totalReservationCount || 0,
			}))
			.filter((equip) => equip.value > 0)
			.sort((a, b) => b.value - a.value);
	}, [topEquipmentData]);

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
				<p>Error loading top equipment data.</p>
				<p className="text-sm">{error?.message}</p>
			</div>
		);
	}

	if (!chartData || chartData.length === 0) {
		return (
			<div className="h-[300px] w-full flex items-center justify-center text-muted-foreground">
				<p>
					{equipmentTypeFilter && equipmentTypeFilter.trim() !== ""
						? `No data available for equipment filter "${equipmentTypeFilter}" in the selected period.`
						: "No top equipment data available for the selected period."}
				</p>
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
								const percentage = (
									(data.value / totalReservations) *
									100
								).toFixed(1);
								return (
									<div className="min-w-[180px] rounded-lg border bg-background p-2 shadow-sm text-xs">
										<div className="font-bold mb-1 text-foreground">
											{data.name}
										</div>
										<div className="space-y-1">
											<div className="flex items-center justify-between">
												<span className="text-muted-foreground">
													Reservations:
												</span>
												<span className="font-semibold text-foreground">
													{data.value.toLocaleString()}
												</span>
											</div>
											<div className="flex items-center justify-between">
												<span className="text-muted-foreground">
													Percentage:
												</span>
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
						height={36}
						formatter={(value, entry) => {
							const data = entry.payload as { value: number };
							const percentage = (
								(data.value / totalReservations) *
								100
							).toFixed(1);
							return `${value} (${percentage}%)`;
						}}
					/>
				</PieChart>
			</ChartContainer>
		</div>
	);
}
