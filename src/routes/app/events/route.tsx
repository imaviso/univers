import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
const allowedRoles: string[] = [
    "SUPER_ADMIN",
    "ORGANIZER",
    "VPAA",
    "EQUIPMENT_OWNER",
    "VENUE_OWNER",
    "VP_ADMIN",
];
export const Route = createFileRoute("/app/events")({
    component: RouteComponent,
    beforeLoad: async ({ location, context }) => {
        if (!allowedRoles.includes(context.role)) {
            throw redirect({
                to: "/auth/login",
                search: {
                    redirect: location.href,
                },
            });
        }
    },
});

function RouteComponent() {
    return <Outlet />;
}
