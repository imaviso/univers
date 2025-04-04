import { Sidebar } from "@/components/sideBar";
import { NotificationProvider } from "@/contexts/notification-context";
import { isAuthenticated, useCurrentUser } from "@/lib/query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { Outlet } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/app")({
    component: App,
    beforeLoad: async ({ location }) => {
        const auth = await isAuthenticated(["ORGANIZER", "ADMIN", "USER"]);
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

function App() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { isLoading, isError } = useCurrentUser();

    if (isLoading) {
        return <div>Loading...</div>; // Or a more sophisticated loading indicator
    }

    if (isError) {
        return <div>Error loading user data.</div>; // Handle the error appropriately
    }

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
