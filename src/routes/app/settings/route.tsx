import { settingsNavigation } from "@/lib/navigation";
import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/app/settings")({
    component: Settings,
    beforeLoad: async ({ location, context }) => {
        const navigationItem = settingsNavigation.find((item) => {
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
});

function Settings() {
    return (
        <div className="flex h-screen overflow-y-hidden">
            <div className="flex-1 relative flex h-full w-full flex-col overflow-y-auto overflow-x-hidden">
                <div className="items-center justify-between px-6 py-4">
                    <Outlet />
                </div>
            </div>
        </div>
    );
}
