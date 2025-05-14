"use client";

import {
    type ChartConfig,
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";
import { eventTypeSummaryQueryOptions } from "@/lib/query";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { Skeleton } from "../ui/skeleton";

interface EventTypesChartProps {
    dateRange?: DateRange;
    // Filters like venueFilter, equipmentTypeFilter are not used by this specific endpoint
}

// Consistent color palette for charts
const CHART_COLORS = [
    "var(--chart-1)",
    "var(--chart-2)",
    "var(--chart-3)",
    "var(--chart-4)",
    "var(--chart-5)",
];

export function EventTypesChart({ dateRange }: EventTypesChartProps) {
    const startDate = dateRange?.from
        ? format(dateRange.from, "yyyy-MM-dd")
        : undefined;
    const endDate = dateRange?.to
        ? format(dateRange.to, "yyyy-MM-dd")
        : undefined;

    const {
        data: eventTypesData,
        isLoading,
        isError,
        error,
    } = useQuery(eventTypeSummaryQueryOptions(startDate, endDate, 7)); // Limit to 7 to match colors, or adjust logic

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

    const chartData = eventTypesData.map((item, index) => ({
        name: item.name,
        value: item.value,
        fill: CHART_COLORS[index % CHART_COLORS.length],
    }));

    const chartConfig = Object.fromEntries(
        chartData.map((item) => [
            item.name, // Using item.name as key, ensure it's a valid key for ChartConfig
            {
                label: item.name,
                color: item.fill,
            },
        ]),
    ) satisfies ChartConfig;

    return (
        <div className="h-[300px] w-full">
            <ChartContainer config={chartConfig} className="h-full w-full">
                {/* ResponsiveContainer might be redundant if ChartContainer handles it, but PieChart often needs it explicitly */}
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart
                        margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                    >
                        <ChartTooltip
                            cursor={true}
                            content={
                                <ChartTooltipContent hideLabel nameKey="name" />
                            }
                        />
                        <Pie
                            data={chartData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            labelLine={false}
                            label={(
                                { name, percent, value }, // Access value directly from item
                            ) =>
                                `${name}: ${(percent * 100).toFixed(0)}% (${value})`
                            }
                            strokeWidth={1.5} // Add stroke for better separation
                        >
                            {chartData.map((entry) => (
                                <Cell
                                    key={`cell-${entry.name}`}
                                    fill={entry.fill}
                                />
                            ))}
                        </Pie>
                        <ChartLegend
                            content={<ChartLegendContent nameKey="name" />}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </ChartContainer>
        </div>
    );
}
