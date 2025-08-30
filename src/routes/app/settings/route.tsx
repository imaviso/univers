import ErrorPage from "@/components/ErrorPage";
import PendingPage from "@/components/PendingPage";
import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/app/settings")({
	component: Settings,
	beforeLoad: async ({ location, context }) => {
		if (context.authState == null) {
			throw redirect({
				to: "/login",
				search: {
					redirect: location.href,
				},
			});
		}
	},
	pendingComponent: () => <PendingPage />,
	errorComponent: () => <ErrorPage />,
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
