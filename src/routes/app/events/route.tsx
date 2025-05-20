import ErrorPage from "@/components/ErrorPage";
import PendingPage from "@/components/PendingPage";
import { allNavigation } from "@/lib/navigation";
import {
    allEventsQueryOptions,
    approvedEventsQueryOptions,
    ownEventsQueryOptions,
    pendingVenueOwnerEventsQueryOptions,
    venuesQueryOptions,
} from "@/lib/query";
import type { UserRole } from "@/lib/types";
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
                const customPathRegex =
                    /^\/app\/events\/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
                return customPathRegex.test(location.pathname);
            }
            return false;
        });
        const allowedRoles: string[] = navigationItem
            ? navigationItem.roles
            : [];

        if (context.authState == null) {
            throw redirect({
                to: "/login",
                search: {
                    redirect: location.href,
                },
            });
        }

        const userRoles = context.authState?.roles || [];
        const isAuthorized = allowedRoles.some((role) =>
            userRoles.includes(role as UserRole),
        );

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
        if (
            context.authState?.roles.includes("SUPER_ADMIN") ||
            context.authState?.roles.includes("ADMIN") ||
            context.authState?.roles.includes("DEPT_HEAD")
        ) {
            context.queryClient.ensureQueryData(allEventsQueryOptions);
        }
        if (context.authState?.roles.includes("VENUE_OWNER")) {
            context.queryClient.ensureQueryData(
                pendingVenueOwnerEventsQueryOptions,
            );
        }
        context.queryClient.ensureQueryData(venuesQueryOptions);
        context.queryClient.ensureQueryData(ownEventsQueryOptions);
        context.queryClient.ensureQueryData(approvedEventsQueryOptions);
    },
});

function RouteComponent() {
    return <Outlet />;
}
