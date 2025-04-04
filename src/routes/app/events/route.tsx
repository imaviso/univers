import { isAuthenticated } from "@/lib/query";
import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
export const Route = createFileRoute("/app/events")({
    component: RouteComponent,
    beforeLoad: async ({ location }) => {
        const auth = await isAuthenticated([
            "ORGANIZER",
            "SUPER_ADMIN",
            "EQUIPMENT_OWNER",
            "VENUE_OWNER",
            "VPAA",
            "VP_ADMIN",
        ]);
        if (!auth) {
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
