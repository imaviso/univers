import { createFileRoute } from "@tanstack/react-router";
import { ActivityLogTable } from "@/components/activity-log/activityLogTable";

export const Route = createFileRoute("/app/activity-logs/")({
	component: ActivityLogsComponent,
});

function ActivityLogsComponent() {
	return (
		<div className="bg-background">
			<div className="flex flex-col flex-1 overflow-hidden">
				<header className="flex items-center justify-between border-b px-6 h-[65px]">
					<div>
						<h1 className="text-xl font-semibold">Activity Logs</h1>
						<p className="text-sm text-muted-foreground">
							View and export system activity logs
						</p>
					</div>
				</header>

				<div className="flex-1 overflow-auto p-6">
					<ActivityLogTable />
				</div>
			</div>
		</div>
	);
}
