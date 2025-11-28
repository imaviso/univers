import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import ErrorPage from "@/components/ErrorPage";
import PendingPage from "@/components/PendingPage";
import { allNavigation } from "@/lib/navigation";
import type { UserRole } from "@/lib/types";

export const Route = createFileRoute("/app/activity-logs")({
	beforeLoad: async ({ location, context }) => {
		const navigationItem = allNavigation.find((item) => {
			return (
				location.pathname === item.href ||
				location.pathname.startsWith(`${item.href}/`)
			);
		});
		const allowedRoles: string[] = navigationItem ? navigationItem.roles : [];

		if (context.authState == null) {
			throw redirect({
				to: "/login",
				search: {
					redirect: location.href,
				},
			});
		}
		const userRoles = context.authState?.roles || [];
		const isAuthorized = allowedRoles.some((role) =>
			userRoles.includes(role as UserRole),
		);

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
});

function RouteComponent() {
	return <Outlet />;
}
