import { Sidebar } from "@/components/sideBar";
import { NotificationProvider } from "@/contexts/notification-context";
import { SettingsProvider } from "@/contexts/settings-context";
import { isAuthenticated } from "@/lib/stores";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { Outlet } from "@tanstack/react-router";
import { useState } from "react";
export const Route = createFileRoute("/app")({
    component: App,
    // beforeLoad: async ({ location }) => {
    // 	if (!isAuthenticated) {
    // 		throw redirect({
    // 			to: "/login",
    // 			search: {
    // 				// Use the current location to power a redirect after login
    // 				// (Do not use `router.state.resolvedLocation` as it can
    // 				// potentially lag behind the actual current location)
    // 				redirect: location.href,
    // 			},
    // 		});
    // 	}
    // },
});

function App() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    return (
        <div className="flex h-screen overflow-y-hidden">
            <NotificationProvider>
                <Sidebar />
                <div className="flex-1 relative flex h-full w-full flex-col overflow-y-auto overflow-x-hidden">
                    <main>
                        <Outlet />
                    </main>
                </div>
            </NotificationProvider>
        </div>
    );
}
