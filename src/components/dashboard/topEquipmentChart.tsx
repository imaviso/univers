import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import * as React from "react"; // Added React import
import type { DateRange } from "react-day-picker";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
} from "@/components/ui/chart";
import { topEquipmentQueryOptions } from "@/lib/query"; // Corrected path
import type { TopEquipmentDTO } from "@/lib/types"; // Import for explicit typing
import { Skeleton } from "../ui/skeleton";

interface TopEquipmentChartProps {
	dateRange?: DateRange;
	equipmentTypeFilter?: string;
}

// Define statuses (same as in UserActivityChart)
const RESERVATION_STATUSES = [
	{ key: "pendingCount", label: "Pending", color: "var(--chart-1)" },
	{ key: "approvedCount", label: "Reserved", color: "var(--chart-2)" },
	{ key: "ongoingCount", label: "Ongoing", color: "var(--chart-3)" },
	{ key: "completedCount", label: "Completed", color: "var(--chart-4)" },
	{
		key: "rejectedCount",
		label: "Denied Reservation",
		color: "var(--chart-5)",
	},
	{
		key: "canceledCount",
		label: "Canceled",
		color: "var(--chart-6, var(--muted-foreground))",
	},
] as const;

// chartConfig will be generated dynamically based on statuses and data

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
	const limit = 7; // Fetch top 7 equipment types

	const {
		data: rawTopEquipmentData, // Rename to avoid conflict with typed variable
		isLoading,
		isError,
		error,
	} = useQuery(
		topEquipmentQueryOptions(startDate, endDate, equipmentTypeFilter, limit),
	);

	const topEquipmentData = rawTopEquipmentData as TopEquipmentDTO[] | undefined;

	// console.log("TopEquipmentChart received filters:", { dateRange, equipmentTypeFilter });
	// console.log("Top Equipment Data:", topEquipmentData);

	const chartData = React.useMemo(() => {
		if (!topEquipmentData) return [];
		return topEquipmentData
			.map((equip) => ({
				name: equip.equipmentName,
				pendingCount: equip.pendingCount || 0,
				approvedCount: equip.approvedCount || 0,
				ongoingCount: equip.ongoingCount || 0,
				completedCount: equip.completedCount || 0,
				rejectedCount: equip.rejectedCount || 0,
				canceledCount: equip.canceledCount || 0,
				totalReservationCount: equip.totalReservationCount || 0,
			}))
			.sort((a, b) => b.totalReservationCount - a.totalReservationCount);
	}, [topEquipmentData]);

	const chartConfig = React.useMemo(() => {
		const config: ChartConfig = {};
		for (const status of RESERVATION_STATUSES) {
			config[status.key] = { label: status.label, color: status.color };
		}
		config.totalReservationCount = { label: "Total Reservations" };
		return config;
	}, []);

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
				<p>Error loading top equipment data.</p>
				<p className="text-sm">{error?.message}</p>
			</div>
		);
	}

	if (!chartData || chartData.length === 0) {
		// Check chartData instead
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
				<BarChart
					layout="vertical" // Changed to vertical
					data={chartData}
					margin={{ top: 5, right: 50, left: 20, bottom: 5 }} // Adjusted margins
					accessibilityLayer
				>
					<CartesianGrid horizontal={false} strokeDasharray="3 3" />
					<XAxis
						type="number"
						stroke="var(--muted-foreground)"
						fontSize={12}
						tickLine={false}
						axisLine={false}
					/>
					<YAxis
						type="category"
						dataKey="name"
						stroke="var(--muted-foreground)"
						fontSize={12}
						tickLine={false}
						axisLine={false}
						width={120} // Adjust width for names
						tickFormatter={(value: string) =>
							value.length > 15 ? `${value.substring(0, 13)}...` : value
						}
					/>
					<ChartTooltip
						cursor={{ fill: "var(--muted)" }}
						content={({ active, payload, label }) => {
							if (active && payload && payload.length) {
								const data = payload[0].payload as (typeof chartData)[number];
								return (
									<div className="min-w-[180px] rounded-lg border bg-background p-2 shadow-sm text-xs">
										<div className="font-bold mb-1 text-foreground">
											{label} {/* Equipment's name */}
										</div>
										<div className="space-y-1">
											{RESERVATION_STATUSES.map((status) => {
												const count = data[status.key];
												if (count > 0) {
													return (
														<div
															key={status.key}
															className="flex items-center justify-between"
														>
															<div className="flex items-center">
																<span
																	className="w-2.5 h-2.5 rounded-full mr-2"
																	style={{
																		backgroundColor: status.color,
																	}}
																/>
																<span className="text-muted-foreground">
																	{status.label}:
																</span>
															</div>
															<span className="font-semibold text-foreground">
																{count.toLocaleString()}
															</span>
														</div>
													);
												}
												return null;
											})}
											<hr className="my-1" />
											<div className="flex items-center justify-between font-medium">
												<span className="text-muted-foreground">Total:</span>
												<span className="text-foreground">
													{data.totalReservationCount.toLocaleString()}
												</span>
											</div>
										</div>
									</div>
								);
							}
							return null;
						}}
					/>
					{RESERVATION_STATUSES.map((status) => (
						<Bar
							key={status.key}
							dataKey={status.key}
							stackId="a"
							fill={status.color}
							radius={0}
							barSize={30}
						/>
					))}
				</BarChart>
			</ChartContainer>
		</div>
	);
}
