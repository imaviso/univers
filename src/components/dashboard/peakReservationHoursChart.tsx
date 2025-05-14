import {
    type ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { CartesianGrid, Line, LineChart, XAxis } from "recharts";
import { peakReservationHoursQueryOptions } from "../../lib/query";
import { Skeleton } from "../ui/skeleton";

interface PeakReservationHoursChartProps {
    dateRange?: DateRange;
    venueFilter?: string;
    equipmentTypeFilter?: string;
}

const formatHour = (hour: number): string => {
    if (hour === 0) return "12 AM";
    if (hour === 12) return "12 PM";
    if (hour < 12) return `${hour} AM`;
    return `${hour - 12} PM`;
};

const chartConfig = {
    reservations: {
        label: "Reservations",
        color: "var(--chart-2)",
    },
} satisfies ChartConfig;

export function PeakReservationHoursChart({
    dateRange,
    venueFilter,
    equipmentTypeFilter,
}: PeakReservationHoursChartProps) {
    const startDate = dateRange?.from
        ? format(dateRange.from, "yyyy-MM-dd")
        : undefined;
    const endDate = dateRange?.to
        ? format(dateRange.to, "yyyy-MM-dd")
        : undefined;

    const {
        data: peakHoursData,
        isLoading,
        isError,
        error,
    } = useQuery(peakReservationHoursQueryOptions(startDate, endDate));

    if (isLoading) {
        return (
            <div className="h-[300px] w-full flex flex-col items-center justify-center p-4">
                {/* Removed CardHeader, CardTitle, CardDescription */}
                <div className="h-[300px] w-full flex items-center justify-center">
                    <Skeleton className="h-[280px] w-[95%]" />
                </div>
                <div className="flex gap-2 font-medium leading-none text-muted-foreground mt-2 text-sm">
                    Loading peak reservation hours data...
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="h-[300px] w-full flex flex-col items-center justify-center p-4 text-red-500">
                {/* Removed CardHeader, CardTitle, CardDescription */}
                <p className="text-lg font-semibold">Error Loading Data</p>
                <p className="text-sm">
                    Could not load peak reservation hours data.
                </p>
                <p className="text-xs mt-1">{error?.message}</p>
                {/* Removed CardFooter */}
            </div>
        );
    }

    if (!peakHoursData || peakHoursData.length === 0) {
        return (
            <div className="h-[300px] w-full flex flex-col items-center justify-center p-4 text-muted-foreground">
                {/* Removed CardHeader, CardTitle, CardDescription */}
                <p className="text-lg font-semibold">No Data Available</p>
                <p className="text-sm">
                    No peak reservation hour data available for the selected
                    period.
                </p>
                {/* Removed CardFooter */}
            </div>
        );
    }

    const chartData = peakHoursData
        .map((item) => ({
            time: formatHour(item.hourOfDay),
            hourValue: item.hourOfDay, // Keep original hour for sorting
            reservations: item.eventCount, // Corrected from item.count based on typical DTOs
        }))
        .sort((a, b) => a.hourValue - b.hourValue); // Sort by hour of day

    // Removed Card, CardHeader, CardContent, CardFooter wrappers
    // The title and description can be handled by the parent component if needed
    return (
        <div className="h-[300px] w-full p-4">
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <LineChart
                    accessibilityLayer
                    data={chartData}
                    margin={{
                        top: 20,
                        left: 20,
                        bottom: 20,
                        right: 20,
                    }}
                >
                    <CartesianGrid vertical={false} />
                    <XAxis
                        dataKey="time"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                    />
                    <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent hideLabel />}
                    />
                    <Line
                        dataKey="reservations"
                        type="natural"
                        stroke="var(--chart-4)"
                        strokeWidth={2}
                        dot={true}
                    />
                </LineChart>
            </ChartContainer>
        </div>
    );
}
