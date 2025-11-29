import { createFileRoute, Outlet } from "@tanstack/react-router";
import NotFound from "@/components/404NotFound";
import { Sidebar } from "@/components/sideBar";
import { useWebSocketNotifications } from "@/hooks/use-websocket-notifications";
export const Route = createFileRoute("/app")({
	component: App,
	notFoundComponent: () => <NotFound />,
});

function App() {
	useWebSocketNotifications();
	return (
		<div className="flex h-screen overflow-y-hidden">
			<Sidebar />
			<div className="flex-1 relative flex h-full w-full flex-col overflow-y-auto overflow-x-hidden pt-16 lg:pt-0">
				<main>
					<Outlet />
				</main>
			</div>
		</div>
	);
}
