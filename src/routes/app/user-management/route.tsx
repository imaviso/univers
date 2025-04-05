import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

const allowedRoles: string[] = ["SUPER_ADMIN", "VP_ADMIN"];
export const Route = createFileRoute("/app/user-management")({
    component: RouteComponent,
    beforeLoad: async ({ location, context }) => {
        if (!allowedRoles.includes(context.role)) {
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
