import { isAuthenticated } from "@/lib/query";
import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
export const Route = createFileRoute("/app/venue-approval")({
    component: RouteComponent,
    beforeLoad: async ({ location }) => {
        const auth = await isAuthenticated([
            "SUPER_ADMIN",
            "VPAA",
            "VENUE_OWNER",
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
