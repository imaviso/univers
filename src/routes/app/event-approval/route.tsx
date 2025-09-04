import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import ErrorPage from "@/components/ErrorPage";
import PendingPage from "@/components/PendingPage";
import { allNavigation } from "@/lib/navigation";
import type { UserRole } from "@/lib/types";

export const Route = createFileRoute("/app/event-approval")({
	component: RouteComponent,
	beforeLoad: async ({ location, context }) => {
		if (context.authState == null) {
			throw redirect({
				to: "/login",
				search: {
					redirect: location.href,
				},
				replace: true,
			});
		}

		const customPathRegex =
			/^\/app\/venue-approval\/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
		const isCustomPath = customPathRegex.test(location.pathname);
		if (isCustomPath) {
			return;
		}

		const navigationItem = allNavigation.find(
			(item) => item.href === "/app/event-approval/approval",
		);

		const allowedRoles: string[] = navigationItem ? navigationItem.roles : [];

		const userRoles = context.authState?.roles || [];
		const isAuthorized = allowedRoles.some((role) =>
			userRoles.includes(role as UserRole),
		);

		if (!isAuthorized) {
			throw redirect({
				to: "/login",
			});
		}
	},
	errorComponent: () => <ErrorPage />,
	pendingComponent: () => <PendingPage />,
});

function RouteComponent() {
	return <Outlet />;
}
