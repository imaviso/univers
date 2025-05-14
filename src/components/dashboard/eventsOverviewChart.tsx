import {
    type ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import type { DateRange } from "react-day-picker";
import {
    Area,
    AreaChart,
    CartesianGrid,
    // ResponsiveContainer, // ChartContainer handles responsiveness
    XAxis,
    // YAxis, // Removed to match example more closely
} from "recharts";
import { eventsOverviewQueryOptions } from "../../lib/query";
import { Skeleton } from "../ui/skeleton";

interface EventsOverviewChartProps {
    dateRange?: DateRange;
}

// Updated chartConfig based on the new Area Chart example
const chartConfig = {
    events: {
        label: "Events",
        color: "var(--chart-1)",
    },
} satisfies ChartConfig;

export function EventsOverviewChart({ dateRange }: EventsOverviewChartProps) {
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
            <div className="h-[350px] w-full flex items-center justify-center">
                <Skeleton className="h-[330px] w-[95%]" />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="h-[350px] w-full flex flex-col items-center justify-center text-red-500">
                <p>Error loading events overview data.</p>
                <p className="text-sm">{error?.message}</p>
            </div>
        );
    }

    if (!eventsOverviewData || eventsOverviewData.length === 0) {
        return (
            <div className="h-[350px] w-full flex items-center justify-center text-muted-foreground">
                <p>No event overview data available for the selected period.</p>
            </div>
        );
    }

    const chartData = eventsOverviewData.map((item) => ({
        date: format(parseISO(item.date), "MMM dd"),
        events: item.eventCount,
    }));

    return (
        <div className="h-[250px] w-full">
            <ChartContainer config={chartConfig} className="h-full w-full">
                <AreaChart
                    accessibilityLayer
                    data={chartData}
                    margin={{
                        left: 12,
                        right: 12,
                        top: 20, // Added top margin for a bit of space
                        bottom: 0,
                    }}
                >
                    <CartesianGrid vertical={true} />
                    <XAxis
                        dataKey="date" // Our date is already 'MMM dd'
                        tickLine={true}
                        axisLine={true}
                        tickMargin={8}
                        minTickGap={32} // Keep or adjust if needed after adding interval
                        interval={0} // Added to show all ticks
                        padding={{ left: 20, right: 20 }} // Added padding
                        // tickFormatter={(value) => value.slice(0, 3)} // Not needed for 'MMM dd'
                        tick={{ fontSize: 12 }}
                    />
                    {/* YAxis component removed to match example style, Recharts might add a default one */}
                    <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent indicator="line" />}
                    />
                    <Area
                        dataKey="events"
                        type="natural"
                        fill={chartConfig.events.color}
                        fillOpacity={0.4}
                        stroke={chartConfig.events.color}
                        label={{ value: "Events", position: "top", dy: 0 }}
                    />
                </AreaChart>
            </ChartContainer>
        </div>
    );
}
