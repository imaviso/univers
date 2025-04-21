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
    pendingComponent: () => <PendingPage />,
    errorComponent: () => <ErrorPage />,
    loader: async ({ context }) => {
        context.queryClient.ensureQueryData(venuesQueryOptions);
        if ("role" in context && context.role === "SUPER_ADMIN") {
            context.queryClient.ensureQueryData(usersQueryOptions);
        }
    },
});

function RouteComponent() {
    return <Outlet />;
}
