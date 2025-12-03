import { createFileRoute } from "@tanstack/react-router";
import { ActivityLogTable } from "@/components/activity-log/activityLogTable";

export const Route = createFileRoute("/app/activity-logs/")({
	component: ActivityLogsComponent,
});

function ActivityLogsComponent() {
	return (
		<div className="bg-background">
			<div className="flex flex-col flex-1 overflow-hidden">
				<header className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0 sm:justify-between border-b px-4 sm:px-6 py-3 sm:py-0 sm:h-[65px]">
					<div>
						<h1 className="text-lg sm:text-xl font-semibold">Activity Logs</h1>
						<p className="text-xs sm:text-sm text-muted-foreground">
							View and export system activity logs
						</p>
					</div>
				</header>

				<div className="flex-1 overflow-auto p-4 sm:p-6">
					<ActivityLogTable />
				</div>
			</div>
		</div>
	);
}
