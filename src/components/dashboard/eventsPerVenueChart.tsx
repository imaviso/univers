"use client";

import {
    type ChartConfig,
    ChartStyle,
    ChartTooltip,
} from "@/components/ui/chart";
import { topVenuesQueryOptions } from "@/lib/query";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import * as React from "react";
import type { DateRange } from "react-day-picker";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    LabelList,
    ResponsiveContainer,
    XAxis,
    YAxis,
} from "recharts";
import { Skeleton } from "../ui/skeleton";

interface EventsPerVenueChartProps {
    dateRange?: DateRange;
}

const BASE_CHART_COLORS_HSL = [
    "var(--chart-1)",
    "var(--chart-2)",
    "var(--chart-3)",
    "var(--chart-4)",
    "var(--chart-5)",
];

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
        data: topVenuesData,
        isLoading,
        isError,
        error,
    } = useQuery(topVenuesQueryOptions(startDate, endDate, limit));

    const totalEvents = React.useMemo(() => {
        if (!topVenuesData) return 0;
        return topVenuesData.reduce((sum, item) => sum + item.eventCount, 0);
    }, [topVenuesData]);

    const chartData = React.useMemo(() => {
        if (!topVenuesData) return [];
        return topVenuesData.map((item, index) => ({
            name: item.venueName,
            value: item.eventCount,
            fill: BASE_CHART_COLORS_HSL[index % BASE_CHART_COLORS_HSL.length],
            percentage:
                totalEvents > 0
                    ? Number.parseFloat(
                          ((item.eventCount / totalEvents) * 100).toFixed(1),
                      )
                    : 0,
        }));
    }, [topVenuesData, totalEvents]);

    const chartConfig = React.useMemo(() => {
        const config: ChartConfig = {
            events: {
                label: "Events",
            },
        };
        for (const item of chartData) {
            const key = item.name.toLowerCase().replace(/[^a-z0-9]/g, "");
            config[key] = {
                label: item.name,
                color: item.fill,
            };
        }
        return config;
    }, [chartData]);

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
                        <YAxis type="category" dataKey="name" hide />
                        <ChartTooltip
                            cursor={{ fill: "var(--muted)" }}
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    const data = payload[0].payload;
                                    return (
                                        <div className="rounded-lg border bg-background p-2 shadow-sm text-xs">
                                            <div className="font-bold mb-1">
                                                {data.name}
                                            </div>
                                            <div>
                                                Events:{" "}
                                                {data.value.toLocaleString()}
                                            </div>
                                            <div>
                                                Percentage: {data.percentage}%
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={30}>
                            {chartData.map((entry) => (
                                <Cell
                                    key={`cell-${entry.name}`}
                                    fill={entry.fill}
                                />
                            ))}
                            <LabelList
                                dataKey="name"
                                position="insideLeft"
                                offset={8}
                                className="fill-background dark:fill-foreground font-medium"
                                style={{ fontSize: "12px" }}
                                formatter={(value: string) =>
                                    value.length > 20
                                        ? `${value.substring(0, 18)}...`
                                        : value
                                }
                            />
                            <LabelList
                                dataKey="value"
                                position="right"
                                offset={8}
                                className="fill-foreground"
                                style={{ fontSize: "12px" }}
                                formatter={(
                                    value: number,
                                    entry: {
                                        name: string;
                                        value: number;
                                        percentage: number;
                                        fill: string;
                                    },
                                ) => {
                                    if (
                                        entry &&
                                        typeof entry.percentage === "number"
                                    ) {
                                        return `${value.toLocaleString()} (${entry.percentage}%)`;
                                    }
                                    return value.toLocaleString();
                                }}
                            />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
