import NotFound from "@/components/404NotFound";
import { Sidebar } from "@/components/sideBar";
import { NotificationProvider } from "@/contexts/notification-context";
import { createFileRoute } from "@tanstack/react-router";
import { Outlet } from "@tanstack/react-router";
export const Route = createFileRoute("/app")({
    component: App,
    notFoundComponent: () => <NotFound />,
});

function App() {
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
