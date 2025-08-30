import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { recentActivityQueryOptions } from "@/lib/query";
import type { RecentActivityItemDTO } from "@/lib/types";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import { Building, CalendarCheck, CalendarClock } from "lucide-react";
import { Scroller } from "../ui/scroller";
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

function getActivityTitle(type: string, description: string): string {
	if (type.toLowerCase().includes("event")) {
		if (description.toLowerCase().includes("created")) {
			return "New Event Created";
		}
		return "Event Status Updated";
	}
	if (type.toLowerCase().includes("reservation")) {
		if (description.toLowerCase().includes("created")) {
			return "New Equipment Reservation";
		}
		return "Reservation Status Updated";
	}
	return type;
}

export function RecentActivity() {
	const {
		data: activities,
		isLoading,
		error,
	} = useSuspenseQuery(recentActivityQueryOptions(10));

	if (isLoading) {
		return (
			<Scroller className="h-[300px]">
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
			</Scroller>
		);
	}
	if (error)
		return (
			<div className="flex flex-col h-[300px] p-6 items-center justify-center">
				<p className="text-red-500">Error loading activity: {error.message}</p>
			</div>
		);
	if (!activities || activities.length === 0)
		return (
			<div className="flex flex-col h-[300px] p-6 items-center justify-center">
				<p className="text-muted-foreground">No recent activity.</p>
			</div>
		);

	return (
		<Scroller className="h-[300px]" withNavigation hideScrollbar>
			<div className="space-y-4 p-1">
				{activities.map((activity: RecentActivityItemDTO) => (
					<div key={activity.id} className="flex items-start gap-3">
						<Avatar className="h-9 w-9 border">
							<AvatarFallback>
								{activity.actorName
									? activity.actorName
											.split(" ")
											.map((n) => n[0])
											.join("")
											.toUpperCase()
											.substring(0, 2)
									: "SY"}
							</AvatarFallback>
						</Avatar>
						<div className="flex-1 space-y-1">
							<div className="flex items-center justify-between">
								<p className="text-sm font-medium leading-none">
									{getActivityTitle(activity.type, activity.description)}
								</p>
								<p className="text-xs text-muted-foreground">
									{formatDistanceToNow(new Date(activity.timestamp), {
										addSuffix: true,
									})}
								</p>
							</div>
							<p className="text-sm text-muted-foreground">
								{activity.description}
							</p>
							<div className="flex items-center justify-between">
								<Link
									to="/app/events/$eventId"
									params={{ eventId: activity.entityPath }}
									className="text-xs text-primary hover:underline"
								>
									View Details
								</Link>
								<span className="text-xs text-muted-foreground">
									by {activity.actorName || "System"}
								</span>
							</div>
						</div>
						<div className="self-center">{getActivityIcon(activity.type)}</div>
					</div>
				))}
			</div>
		</Scroller>
	);
}
