"use client";

import {
    type ChartConfig,
    ChartStyle, // Re-added import
    ChartTooltip,
} from "@/components/ui/chart";
import { topVenuesQueryOptions } from "@/lib/query";
import type { TopVenueDTO } from "@/lib/types"; // Import for explicit typing
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
import { Skeleton } from "../ui/skeleton";

interface EventsPerVenueChartProps {
    dateRange?: DateRange;
}

// const BASE_CHART_COLORS_HSL = ...; // No longer needed

// Define statuses (same as in UserActivityChart and TopEquipmentChart)
const RESERVATION_STATUSES = [
    { key: "pendingCount", label: "Pending", color: "var(--chart-1)" },
    { key: "approvedCount", label: "Approved", color: "var(--chart-2)" },
    { key: "ongoingCount", label: "Ongoing", color: "var(--chart-3)" },
    { key: "completedCount", label: "Completed", color: "var(--chart-4)" },
    { key: "rejectedCount", label: "Rejected", color: "var(--chart-5)" },
    {
        key: "canceledCount",
        label: "Canceled",
        color: "var(--chart-6, var(--muted-foreground))",
    },
] as const;

export function EventsPerVenueChart({ dateRange }: EventsPerVenueChartProps) {
    const id = "bar-events-per-venue";
    const startDate = dateRange?.from
        ? format(dateRange.from, "yyyy-MM-dd")
        : undefined;
    const endDate = dateRange?.to
        ? format(dateRange.to, "yyyy-MM-dd")
        : undefined;
    const limit = 7;

    const {
        data: rawTopVenuesData, // Rename to avoid conflict
        isLoading,
        isError,
        error,
    } = useQuery(topVenuesQueryOptions(startDate, endDate, limit));

    const topVenuesData = rawTopVenuesData as TopVenueDTO[] | undefined;

    // const totalEvents = ...; // No longer needed directly here, can be derived in tooltip if necessary

    const chartData = React.useMemo(() => {
        if (!topVenuesData) return [];
        return topVenuesData
            .map((venue) => ({
                name: venue.venueName,
                pendingCount: venue.pendingCount || 0,
                approvedCount: venue.approvedCount || 0,
                ongoingCount: venue.ongoingCount || 0,
                completedCount: venue.completedCount || 0,
                rejectedCount: venue.rejectedCount || 0,
                canceledCount: venue.canceledCount || 0,
                totalEventCount: venue.totalEventCount || 0,
            }))
            .sort((a, b) => b.totalEventCount - a.totalEventCount);
    }, [topVenuesData]);

    const chartConfig = React.useMemo(() => {
        const config: ChartConfig = {};
        for (const status of RESERVATION_STATUSES) {
            config[status.key] = { label: status.label, color: status.color };
        }
        config.totalEventCount = { label: "Total Events" };
        return config;
    }, []);

    if (isLoading) {
        return (
            <div className="flex flex-col h-[300px] p-6">
                <div className="flex-1 space-y-3">
                    {[...Array(limit)].map((_, i) => (
                        <Skeleton
                            key={`skeleton-item-${
                                // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
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
                <div className="grid gap-1 text-center mb-4">
                    <p className="text-sm text-red-500">Error loading data.</p>
                </div>
                <p className="text-red-500">
                    {error?.message || "Could not fetch data."}
                </p>
            </div>
        );
    }

    if (chartData.length === 0) {
        return (
            <div className="flex flex-col h-[300px] p-6 items-center justify-center">
                <div className="grid gap-1 text-center mb-4">
                    <p className="text-sm text-muted-foreground">
                        No data available for the selected period.
                    </p>
                </div>
                <p className="text-muted-foreground">
                    No event data for venues to display.
                </p>
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
                            right: 30,
                            left: 20,
                            bottom: 5,
                        }}
                        barCategoryGap="20%"
                    >
                        <CartesianGrid
                            horizontal={false}
                            strokeDasharray="3 3"
                        />
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
                                value.length > 15
                                    ? `${value.substring(0, 13)}...`
                                    : value
                            }
                        />
                        <ChartTooltip
                            cursor={{ fill: "var(--muted)" }}
                            content={({ active, payload, label }) => {
                                if (active && payload && payload.length) {
                                    const data = payload[0]
                                        .payload as (typeof chartData)[number];
                                    return (
                                        <div className="min-w-[180px] rounded-lg border bg-background p-2 shadow-sm text-xs">
                                            <div className="font-bold mb-1 text-foreground">
                                                {label} {/* Venue's name */}
                                            </div>
                                            <div className="space-y-1">
                                                {RESERVATION_STATUSES.map(
                                                    (status) => {
                                                        const count =
                                                            data[status.key];
                                                        if (count > 0) {
                                                            // Only show statuses with counts
                                                            return (
                                                                <div
                                                                    key={
                                                                        status.key
                                                                    }
                                                                    className="flex items-center justify-between"
                                                                >
                                                                    <div className="flex items-center">
                                                                        <span
                                                                            className="w-2.5 h-2.5 rounded-full mr-2"
                                                                            style={{
                                                                                backgroundColor:
                                                                                    status.color,
                                                                            }}
                                                                        />
                                                                        <span className="text-muted-foreground">
                                                                            {
                                                                                status.label
                                                                            }
                                                                            :
                                                                        </span>
                                                                    </div>
                                                                    <span className="font-semibold text-foreground">
                                                                        {count.toLocaleString()}
                                                                    </span>
                                                                </div>
                                                            );
                                                        }
                                                        return null;
                                                    },
                                                )}
                                                <hr className="my-1" />
                                                <div className="flex items-center justify-between font-medium">
                                                    <span className="text-muted-foreground">
                                                        Total:
                                                    </span>
                                                    <span className="text-foreground">
                                                        {data.totalEventCount.toLocaleString()}
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
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
