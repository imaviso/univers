import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { recentActivityQueryOptions } from "@/lib/query";
import type { RecentActivityItemDTO } from "@/lib/types";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import { Building, CalendarCheck, CalendarClock } from "lucide-react"; // Example icons

function getActivityIcon(type: string) {
    if (type.toLowerCase().includes("event")) {
        return <CalendarClock className="h-5 w-5 text-muted-foreground" />;
    }
    if (type.toLowerCase().includes("reservation")) {
        return <CalendarCheck className="h-5 w-5 text-muted-foreground" />;
    }
    return <Building className="h-5 w-5 text-muted-foreground" />; // Default icon
}

export function RecentActivity() {
    const {
        data: activities,
        isLoading,
        error,
    } = useSuspenseQuery(recentActivityQueryOptions(10));

    if (isLoading) return <p>Loading recent activity...</p>;
    if (error) return <p>Error loading activity: {error.message}</p>;
    if (!activities || activities.length === 0)
        return <p>No recent activity.</p>;

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
