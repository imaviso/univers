import { SettingsSidebar } from "@/components/settings/settingsSidebar";
import { isAuthenticated } from "@/lib/query";
import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/app/settings")({
    component: Settings,
    beforeLoad: async ({ location }) => {
        const auth = await isAuthenticated([
            "ORGANIZER",
            "SUPER_ADMIN",
            "EQUIPMENT_OWNER",
            "VENUE_OWNER",
            "VPAA",
            "VP_ADMIN",
        ]);
        if (!auth) {
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
            <SettingsSidebar />
            <div className="flex-1 relative flex h-full w-full flex-col overflow-y-auto overflow-x-hidden">
                <div className="items-center justify-between px-6 py-4">
                    <Outlet />
                </div>
            </div>
        </div>
    );
}
