import ErrorPage from "@/components/ErrorPage";
import PendingPage from "@/components/PendingPage";
import { allNavigation } from "@/lib/navigation";
import {
    eventsQueryOptions,
    usersQueryOptions,
    venuesQueryOptions,
} from "@/lib/query";
import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/app/events")({
    beforeLoad: async ({ location, context }) => {
        const navigationItem = allNavigation.find((item) => {
            // Allow exact match or any sub-route after the base path.
            if (
                location.pathname === item.href ||
                location.pathname.startsWith(`${item.href}/`)
            ) {
                return true;
            }
            if (item.href === "/app/events/timeline") {
                const customPathRegex = /^\/app\/events\/\d+$/;
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
                to: "/login",
                search: {
                    redirect: location.href,
                },
            });
        }
    },
    component: RouteComponent,
    errorComponent: () => <ErrorPage />,
    pendingComponent: () => <PendingPage />,
    loader: async ({ context }) => {
        context.queryClient.ensureQueryData(eventsQueryOptions);
        context.queryClient.ensureQueryData(venuesQueryOptions);
    },
});

function RouteComponent() {
    return <Outlet />;
}
