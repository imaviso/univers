"use client";

import {
    type ChartConfig,
    ChartStyle,
    ChartTooltip,
} from "@/components/ui/chart"; // Assuming ChartTooltipContent is also here or not needed for basic
import { userActivityQueryOptions } from "@/lib/query";
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

interface UserActivityChartProps {
    dateRange?: DateRange;
    limit?: number;
}

const BASE_CHART_COLORS_HSL = [
    "var(--chart-1)",
    "var(--chart-2)",
    "var(--chart-3)",
    "var(--chart-4)",
    "var(--chart-5)",
];

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
    } = useQuery(userActivityQueryOptions(startDate, endDate, limit));

    const chartData = React.useMemo(() => {
        if (!userActivityData) return [];
        return userActivityData.map((user, index) => ({
            name: `${user.userFirstName} ${user.userLastName}`.trim(),
            value: user.eventCount,
            fill: BASE_CHART_COLORS_HSL[index % BASE_CHART_COLORS_HSL.length],
        }));
    }, [userActivityData]);

    const chartConfig = React.useMemo(() => {
        const config: ChartConfig = {
            eventCount: {
                label: "Events Organized",
            },
        };
        for (const item of chartData) {
            // Create a unique key for config, e.g., from user name (slugified)
            const key = item.name
                .toLowerCase()
                .replace(/\s+/g, "-")
                .replace(/[^a-z0-9-]/g, "");
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
                            key={`skeleton-user-${
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
                <p className="text-red-500">
                    {error instanceof Error
                        ? error.message
                        : "Could not fetch data."}
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
                            hide // Names will be on bars
                        />
                        <ChartTooltip
                            cursor={{ fill: "var(--muted)" }}
                            content={({ active, payload }) => {
                                // Removed label as it's not typically used with dataKey on YAxis when hidden
                                if (active && payload && payload.length) {
                                    const data = payload[0].payload as {
                                        name: string;
                                        value: number;
                                        fill: string;
                                    }; // Cast for safety
                                    return (
                                        <div className="rounded-lg border bg-background p-2 shadow-sm text-xs text-foreground">
                                            <div className="font-bold mb-1 text-foreground">
                                                {data.name}
                                            </div>
                                            <div className="text-muted-foreground">
                                                Events Organized:{" "}
                                                <span className="font-semibold text-foreground">
                                                    {data.value.toLocaleString()}
                                                </span>
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
                                    key={`cell-user-${entry.name.replace(/\s+/g, "-")}`}
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
                                    value.length > 25
                                        ? `${value.substring(0, 22)}...`
                                        : value
                                } // Adjusted truncation
                            />
                            <LabelList
                                dataKey="value"
                                position="right"
                                offset={8}
                                className="fill-foreground"
                                style={{ fontSize: "12px" }}
                                formatter={(value: number) =>
                                    value.toLocaleString()
                                }
                            />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
