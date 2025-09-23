"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import * as React from "react";
import type { DateRange } from "react-day-picker";
import {
	Bar,
	BarChart,
	CartesianGrid,
	ResponsiveContainer,
	XAxis,
	YAxis,
} from "recharts";
import {
	type ChartConfig,
	ChartStyle,
	ChartTooltip,
} from "@/components/ui/chart"; // Assuming ChartTooltipContent is also here or not needed for basic
import { userReservationActivityQueryOptions } from "@/lib/query";
import type { UserReservationActivityDTO } from "@/lib/types"; // Import for explicit typing
import { Skeleton } from "../ui/skeleton";

interface UserActivityChartProps {
	dateRange?: DateRange;
	limit?: number;
}

// const BASE_CHART_COLORS_HSL = ...; // No longer needed directly here

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

export function UserActivityChart({
	dateRange,
	limit = 7,
}: UserActivityChartProps) {
	const id = "bar-user-activity";
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
	// Explicitly type userActivityData for clarity with UserReservationActivityDTO
	const typedUserActivityData = userActivityData as
		| UserReservationActivityDTO[]
		| undefined;

	const chartData = React.useMemo(() => {
		if (!typedUserActivityData) return [];
		return typedUserActivityData
			.map((user) => ({
				name: `${user.userFirstName} ${user.userLastName}`.trim(),
				pendingCount: user.pendingCount || 0,
				approvedCount: user.approvedCount || 0,
				ongoingCount: user.ongoingCount || 0,
				completedCount: user.completedCount || 0,
				rejectedCount: user.rejectedCount || 0,
				canceledCount: user.canceledCount || 0,
				totalReservationCount: user.totalReservationCount || 0,
			}))
			.sort((a, b) => b.totalReservationCount - a.totalReservationCount); // Sort by total
	}, [typedUserActivityData]);

	const chartConfig = React.useMemo(() => {
		const config: ChartConfig = {};
		for (const status of RESERVATION_STATUSES) {
			config[status.key] = { label: status.label, color: status.color };
		}
		config.totalReservationCount = { label: "Total Reservations" }; // For tooltip or labels
		// Add individual user names to config if needed for specific styling, though not typical for stacked bars
		// chartData.forEach(item => {
		//     const userKey = item.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
		//     config[userKey] = { label: item.name };
		// });
		return config;
	}, []); // chartData dependency removed as colors are from RESERVATION_STATUSES

	if (isLoading) {
		return (
			<div className="flex flex-col h-[300px] p-6">
				<div className="flex-1 space-y-3">
					{[...Array(limit)].map((_, i) => (
						<Skeleton
							key={`skeleton-user-${
								// biome-ignore lint/suspicious/noArrayIndexKey: Using index for skeleton is acceptable as the list is static.
								i
							}`}
							className="h-8 w-full rounded"
						/>
					))}
				</div>
			</div>
		);
	}

	if (isError) {
		return (
			<div className="flex flex-col h-[300px] p-6 items-center justify-center">
				<p className="text-red-500">
					{error instanceof Error ? error.message : "Could not fetch data."}
				</p>
			</div>
		);
	}

	if (!chartData || chartData.length === 0) {
		return (
			<div className="flex flex-col h-[300px] p-6 items-center justify-center">
				<p className="text-muted-foreground">No activity to display.</p>
			</div>
		);
	}

	return (
		<div data-chart={id} className="flex flex-col h-[300px] p-6">
			<ChartStyle id={id} config={chartConfig} />
			<div className="flex-1">
				<ResponsiveContainer width="100%" height="100%">
					<BarChart
						layout="vertical"
						data={chartData}
						margin={{
							top: 5,
							right: 50, // Adjusted for count label
							left: 20,
							bottom: 5,
						}}
						barCategoryGap="20%"
					>
						<CartesianGrid
							horizontal={false}
							strokeDasharray="3 3"
							stroke="var(--border)"
						/>
						<XAxis
							type="number"
							stroke="var(--muted)"
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
							tickFormatter={(value) =>
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
												{label} {/* User's name from YAxis dataKey */}
											</div>
											<div className="space-y-1">
												{RESERVATION_STATUSES.map((status) => {
													const count = data[status.key];
													if (count > 0) {
														// Only show statuses with counts
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
								stackId="a" // All bars in the same stack
								fill={status.color}
								radius={0} // Stacked bars typically don't have individual radius
								barSize={30}
							/>
						))}
						{/* Optional: LabelList for total on top of the stack */}
						{/* <LabelList dataKey="totalReservationCount" position="right" offset={8} className="fill-foreground" style={{ fontSize: "12px" }} formatter={(value: number) => value.toLocaleString()} /> */}
					</BarChart>
				</ResponsiveContainer>
			</div>
		</div>
	);
}
