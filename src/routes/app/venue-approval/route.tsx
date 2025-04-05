import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

const allowedRoles: string[] = [
    "SUPER_ADMIN",
    "VPAA",
    "VENUE_OWNER",
    "VP_ADMIN",
];
export const Route = createFileRoute("/app/venue-approval")({
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
