import { allNavigation } from "@/lib/navigation";
import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/app/venue-approval")({
    component: RouteComponent,
    beforeLoad: async ({ location, context }) => {
        const navigationItem = allNavigation.find((item) => {
            // Allow exact match or any sub-route after the base path.
            if (
                location.pathname === item.href ||
                location.pathname.startsWith(`${item.href}/`)
            ) {
                return true;
            }
            // Allow custom route with a dynamic numeric value (e.g. "/app/venues/123")
            if (item.href === "/app/venue-approval/approval") {
                const customPathRegex = /^\/app\/venue-approval\/\d+$/;
                return customPathRegex.test(location.pathname);
            }
            return false;
        });
        const allowedRoles: string[] = navigationItem
            ? navigationItem.roles
            : [];
        const isAuthorized =
            "role" in context && // <-- Check if the key 'role' exists
            context.role != null && // <-- Optional but good: ensure role isn't null/undefined
            allowedRoles.includes(context.role);

        if (!isAuthorized) {
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
