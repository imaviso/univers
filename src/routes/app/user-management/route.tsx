import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app/user-management")({
    component: RouteComponent,
});

function RouteComponent() {
    return <Outlet />;
}
