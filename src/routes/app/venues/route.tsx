import ErrorPage from "@/components/ErrorPage";
import PendingPage from "@/components/PendingPage";
import { allNavigation } from "@/lib/navigation";
import { usersQueryOptions, venuesQueryOptions } from "@/lib/query";
import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/app/venues")({
    beforeLoad: async ({ location, context }) => {
        const navigationItem = allNavigation.find((item) => {
            // Allow exact match or any sub-route after the base path.
            if (
                location.pathname === item.href ||
                location.pathname.startsWith(`${item.href}/`)
            ) {
                return true;
            }
            if (item.href === "/app/venues/dashboard") {
                const customPathRegex = /^\/app\/venues\/\d+$/;
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

        const isAuthorized = allowedRoles.includes(context.authState.role);

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
    pendingComponent: () => <PendingPage />,
    errorComponent: () => <ErrorPage />,
    loader: async ({ context }) => {
        context.queryClient.ensureQueryData(venuesQueryOptions);
        if (context.authState?.role === "SUPER_ADMIN") {
            context.queryClient.ensureQueryData(usersQueryOptions);
        }
    },
});

function RouteComponent() {
    return <Outlet />;
}
