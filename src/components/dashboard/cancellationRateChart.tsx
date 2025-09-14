"use client";

import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import type { DateRange } from "react-day-picker";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import { cancellationRatesQueryOptions } from "../../lib/query";
import { Skeleton } from "../ui/skeleton";

interface CancellationRateChartProps {
	dateRange?: DateRange;
	venueFilter?: string;
	equipmentTypeFilter?: string;
}

const chartConfig = {
	rate: {
		label: "Cancellation Rate",
		color: "var(--chart-3)",
	},
} satisfies ChartConfig;

export function CancellationRateChart({
	dateRange,
	// venueFilter,
	// equipmentTypeFilter,
}: CancellationRateChartProps) {
	const startDate = dateRange?.from
		? format(dateRange.from, "yyyy-MM-dd")
		: undefined;
	const endDate = dateRange?.to
		? format(dateRange.to, "yyyy-MM-dd")
		: undefined;

	const {
		data: cancellationData,
		isLoading,
		isError,
		error,
	} = useQuery(cancellationRatesQueryOptions(startDate, endDate));

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
				<p>Error loading cancellation rate data.</p>
				<p className="text-sm">{error?.message}</p>
			</div>
		);
	}

	if (!cancellationData || cancellationData.length === 0) {
		return (
			<div className="h-[300px] w-full flex items-center justify-center text-muted-foreground">
				<p>No cancellation data available for the selected period.</p>
			</div>
		);
	}

	const chartData = cancellationData.map((item) => ({
		date: format(parseISO(item.date), "MMM dd"),
		rate: item.cancellationRate,
		totalCreated: item.totalCreatedCount,
		canceled: item.canceledCount,
	}));

	return (
		<div className="h-[300px] w-full">
			<ChartContainer config={chartConfig} className="h-full w-full">
				<AreaChart
					accessibilityLayer
					data={chartData}
					margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
				>
					<CartesianGrid vertical={false} />
					<XAxis
						dataKey="date"
						tickLine={false}
						axisLine={false}
						tickMargin={8}
					/>
					<YAxis
						label={{
							value: "% Rate",
							angle: -90,
							position: "insideLeft",
							fill: "var(--muted-foreground)",
						}}
						domain={[0, 100]}
						tickFormatter={(value) => `${value}%`}
						allowDecimals={false}
						tick={{ fill: "var(--muted-foreground)" }}
						axisLine={{ stroke: "hsl(var(--border))" }}
						tickLine={{ stroke: "hsl(var(--border))" }}
					/>
					<ChartTooltip
						cursor={true}
						content={
							<ChartTooltipContent
								indicator="line"
								labelFormatter={(value, payload) => {
									const dateLabel = payload?.[0]?.payload?.date;
									return dateLabel ? `Date: ${dateLabel}` : value;
								}}
								formatter={(value, name, item) => {
									if (name === "rate") {
										const rateValue = Number(value).toFixed(2);
										const { totalCreated, canceled } = item.payload;
										return (
											<div className="flex flex-col">
												<span>{`Rate: ${rateValue}%`}</span>
												<span className="text-xs text-muted-foreground">
													{`(Canceled: ${canceled}, Total: ${totalCreated})`}
												</span>
											</div>
										);
									}
									return [`${value}% `, name];
								}}
							/>
						}
					/>
					<Area
						dataKey="rate"
						type="monotone"
						fill={chartConfig.rate.color}
						fillOpacity={0.3}
						stroke={chartConfig.rate.color}
						name="Cancellation Rate"
						dot={false}
					/>
				</AreaChart>
			</ChartContainer>
		</div>
	);
}
