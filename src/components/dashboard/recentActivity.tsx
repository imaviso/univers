import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { recentActivityQueryOptions } from "@/lib/query";
import type { RecentActivityItemDTO } from "@/lib/types";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import { Building, CalendarCheck, CalendarClock } from "lucide-react";
import { Skeleton } from "../ui/skeleton";

function getActivityIcon(type: string) {
    if (type.toLowerCase().includes("event")) {
        return <CalendarClock className="h-5 w-5 text-muted-foreground" />;
    }
    if (type.toLowerCase().includes("reservation")) {
        return <CalendarCheck className="h-5 w-5 text-muted-foreground" />;
    }
    return <Building className="h-5 w-5 text-muted-foreground" />;
}

export function RecentActivity() {
    const {
        data: activities,
        isLoading,
        error,
    } = useSuspenseQuery(recentActivityQueryOptions(10));

    if (isLoading) {
        return (
            <ScrollArea className="h-[300px]">
                <div className="space-y-4 p-1">
                    {[...Array(3)].map((_, index) => (
                        <div
                            key={`recent-activity-skeleton-item-${
                                // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                                index
                            }`}
                            className="flex items-start gap-3"
                        >
                            <Skeleton className="h-9 w-9 rounded-full" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-3 w-1/4" />
                            </div>
                            <Skeleton className="h-5 w-5" />
                        </div>
                    ))}
                </div>
            </ScrollArea>
        );
    }
    if (error)
        return (
            <div className="flex flex-col h-[300px] p-6 items-center justify-center">
                <p className="text-red-500">
                    Error loading activity: {error.message}
                </p>
            </div>
        );
    if (!activities || activities.length === 0)
        return (
            <div className="flex flex-col h-[300px] p-6 items-center justify-center">
                <p className="text-muted-foreground">No recent activity.</p>
            </div>
        );

    return (
        <ScrollArea className="h-[300px]">
            <div className="space-y-4 p-1">
                {activities.map((activity: RecentActivityItemDTO) => (
                    <div key={activity.id} className="flex items-start gap-3">
                        <Avatar className="h-9 w-9 border">
                            {/* Placeholder for user/system avatar based on actorName if available */}
                            {/* <AvatarImage src={activity.actorAvatarUrl} alt={activity.actorName} /> */}
                            <AvatarFallback>
                                {activity.actorName
                                    ? activity.actorName
                                          .substring(0, 2)
                                          .toUpperCase()
                                    : "SY"}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-medium leading-none">
                                    {activity.title}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(
                                        new Date(activity.timestamp),
                                        { addSuffix: true },
                                    )}
                                </p>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {activity.description} - by{" "}
                                <span className="font-medium">
                                    {activity.actorName || "System"}
                                </span>
                            </p>
                            <Link
                                to={"/app/events/$eventId"}
                                params={{ eventId: activity.id }}
                                className="text-xs text-primary hover:underline"
                            >
                                View Details
                            </Link>
                        </div>
                        <div className="self-center">
                            {getActivityIcon(activity.type)}
                        </div>
                    </div>
                ))}
            </div>
        </ScrollArea>
    );
}
