import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app/event-staffing/staff")({
	component: RouteComponent,
});

function RouteComponent() {
	return <div>Hello "/app/event-staffing/staff"!</div>;
}
