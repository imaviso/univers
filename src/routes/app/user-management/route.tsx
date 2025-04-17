import { allNavigation } from "@/lib/navigation";
import { usersQueryOptions } from "@/lib/query";
import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/app/user-management")({
    beforeLoad: async ({ location, context }) => {
        const navigationItem = allNavigation.find((item) => {
            // Allow exact match or any sub-route after the base path, e.g. "/app/notifications/..."
            return (
                location.pathname === item.href ||
                location.pathname.startsWith(`${item.href}/`)
            );
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
    component: RouteComponent,
    pendingComponent: () => <div>Loading...</div>,
    errorComponent: () => <div>Error</div>,
    loader: async ({ context: { queryClient } }) => {
        queryClient.ensureQueryData(usersQueryOptions);
    },
});

function RouteComponent() {
    return <Outlet />;
}
