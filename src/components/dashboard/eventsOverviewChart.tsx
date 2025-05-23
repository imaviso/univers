import {
    type ChartConfig,
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
// Removed useState, DropdownMenu components, Button, ListFilter as they will be in parent
import type { DateRange } from "react-day-picker";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { EVENT_STATUSES } from "../../lib/constants";
import { eventsOverviewQueryOptions } from "../../lib/query";
import type { EventCountDTO } from "../../lib/types"; // Explicit import
import { Skeleton } from "../ui/skeleton";

interface EventsOverviewChartProps {
    dateRange?: DateRange;
    visibleStatuses: Record<string, boolean>; // Added visibleStatuses prop
}

export function EventsOverviewChart({
    dateRange,
    visibleStatuses,
}: EventsOverviewChartProps) {
    // visibleStatuses state and handler are now managed by the parent component

    // Dynamically create chartConfig based on VISIBLE EVENT_STATUSES from props
    const activeChartConfig = Object.entries(EVENT_STATUSES)
        .filter(([statusKey]) => visibleStatuses[statusKey]) // Use prop here
        .reduce((acc, [statusKey, statusValue]) => {
            acc[statusKey] = {
                label: statusValue.label,
                color: statusValue.color,
            };
            return acc;
        }, {} as ChartConfig);

    const startDate = dateRange?.from
        ? format(dateRange.from, "yyyy-MM-dd")
        : undefined;
    const endDate = dateRange?.to
        ? format(dateRange.to, "yyyy-MM-dd")
        : undefined;

    const {
        data: eventsOverviewData,
        isLoading,
        isError,
        error,
    } = useQuery(eventsOverviewQueryOptions(startDate, endDate));

    if (isLoading) {
        return (
            <div className="h-[250px] w-full flex items-center justify-center">
                <Skeleton className="h-full w-[95%]" />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="h-[250px] w-full flex flex-col items-center justify-center text-red-500">
                <p>Error loading events overview data.</p>
                <p className="text-sm">{error?.message}</p>
            </div>
        );
    }

    if (!eventsOverviewData || eventsOverviewData.length === 0) {
        return (
            <div className="h-[250px] w-full flex items-center justify-center text-muted-foreground">
                <p>No event overview data available for the selected period.</p>
            </div>
        );
    }

    const chartData = eventsOverviewData.map((item: EventCountDTO) => {
        const dataPoint: { [key: string]: string | number } = {
            date: format(parseISO(item.date), "MMM dd"),
        };
        for (const statusKey in EVENT_STATUSES) {
            const dataKey = EVENT_STATUSES[statusKey].dataKey;
            dataPoint[statusKey] = item[dataKey] ?? 0;
        }
        return dataPoint;
    });

    return (
        // Removed the DropdownMenu UI from here
        // The main wrapping div <div className="w-full"> might also be redundant if parent handles layout
        // For now, let's keep it to ensure chart takes full width of its direct container.
        <div className="w-full h-[300px]">
            {" "}
            {/* Ensure chart has a defined height */}
            <ChartContainer
                config={activeChartConfig}
                className="h-full w-full"
            >
                <LineChart
                    accessibilityLayer
                    data={chartData}
                    margin={{
                        left: 12,
                        right: 12,
                        top: 12,
                        bottom: 12,
                    }}
                >
                    <CartesianGrid vertical={false} />
                    <XAxis
                        dataKey="date"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        padding={{ left: 10, right: 10 }}
                        tick={{ fontSize: 12 }}
                    />
                    <YAxis
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        tick={{ fontSize: 12 }}
                    />
                    <ChartTooltip
                        cursor={true}
                        content={
                            <ChartTooltipContent indicator="dot" hideLabel />
                        }
                    />
                    {Object.entries(EVENT_STATUSES)
                        .filter(([statusKey]) => visibleStatuses[statusKey])
                        .map(([statusKey, statusConfig]) => (
                            <Line
                                key={statusKey}
                                dataKey={statusKey}
                                type="natural"
                                stroke={statusConfig.color}
                                strokeWidth={2}
                                dot={false}
                            />
                        ))}
                    <ChartLegend
                        verticalAlign="top"
                        content={<ChartLegendContent />}
                    />
                </LineChart>
            </ChartContainer>
        </div>
    );
}
