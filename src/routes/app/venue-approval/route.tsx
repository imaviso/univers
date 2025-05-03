import { allNavigation } from "@/lib/navigation";
import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/app/venue-approval")({
    component: RouteComponent,
    beforeLoad: async ({ location, context }) => {
        if (context.authState == null) {
            throw redirect({
                to: "/login",
                search: {
                    redirect: location.href,
                },
            });
        }

        const detailPathRegex = /^\/app\/venue-approval\/\d+$/;
        const isDetailPath = detailPathRegex.test(location.pathname);

        if (isDetailPath) {
            return;
        }

        const navigationItem = allNavigation.find(
            (item) => item.href === "/app/venue-approval/approval",
        );

        const allowedRoles: string[] = navigationItem
            ? navigationItem.roles
            : [];

        const isAuthorized = allowedRoles.includes(context.authState.role);

        if (!isAuthorized) {
            throw redirect({
                to: "/login",
            });
        }
    },
});

function RouteComponent() {
    return <Outlet />;
}
