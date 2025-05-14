import {
    type ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import {
    Bar,
    BarChart,
    CartesianGrid,
    LabelList,
    XAxis,
    YAxis,
} from "recharts";
import { topEquipmentQueryOptions } from "../../lib/query";
import { Skeleton } from "../ui/skeleton";

interface TopEquipmentChartProps {
    dateRange?: DateRange;
    equipmentTypeFilter?: string;
}

const chartConfig = {
    count: {
        label: "Reservations",
        color: "var(--chart-3)",
    },
} satisfies ChartConfig;

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
        data: topEquipmentData,
        isLoading,
        isError,
        error,
    } = useQuery(
        topEquipmentQueryOptions(
            startDate,
            endDate,
            equipmentTypeFilter,
            limit,
        ),
    );

    // console.log("TopEquipmentChart received filters:", { dateRange, equipmentTypeFilter });
    // console.log("Top Equipment Data:", topEquipmentData);

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

    if (!topEquipmentData || topEquipmentData.length === 0) {
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

    const chartData = topEquipmentData
        .map((item) => ({
            name: item.equipmentName,
            count: item.reservationCount,
        }))
        .sort((a, b) => b.count - a.count); // Ensure descending order

    return (
        <div className="h-[300px] w-full">
            <ChartContainer config={chartConfig} className="h-full w-full">
                <BarChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    accessibilityLayer
                >
                    <CartesianGrid vertical={false} />
                    <XAxis
                        dataKey="name"
                        type="category"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                        interval={0}
                        tick={{ fontSize: 12 }}
                    />
                    <YAxis
                        dataKey="count"
                        type="number"
                        allowDecimals={false}
                    />
                    <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent hideLabel />}
                    />
                    <Bar dataKey="count" fill="var(--color-count)" radius={8}>
                        <LabelList
                            position="top"
                            offset={12}
                            className="fill-foreground"
                            fontSize={12}
                        />
                    </Bar>
                </BarChart>
            </ChartContainer>
        </div>
    );
}
