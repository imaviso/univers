import { isAuthenticated } from "@/lib/query";
import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/app/venues")({
    component: RouteComponent,
    beforeLoad: async ({ location }) => {
        const auth = await isAuthenticated(["ADMIN"]);
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
