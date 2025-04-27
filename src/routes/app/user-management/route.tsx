import ErrorPage from "@/components/ErrorPage";
import PendingPage from "@/components/PendingPage";
import { allNavigation } from "@/lib/navigation";
import { departmentsQueryOptions, usersQueryOptions } from "@/lib/query";
import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/app/user-management")({
    beforeLoad: async ({ location, context }) => {
        const navigationItem = allNavigation.find((item) => {
            return (
                location.pathname === item.href ||
                location.pathname.startsWith(`${item.href}/`)
            );
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
    loader: async ({ context: { queryClient } }) => {
        queryClient.ensureQueryData(usersQueryOptions);
        queryClient.ensureQueryData(departmentsQueryOptions);
    },
});

function RouteComponent() {
    return <Outlet />;
}
