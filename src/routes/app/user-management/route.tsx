import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import ErrorPage from "@/components/ErrorPage";
import PendingPage from "@/components/PendingPage";
import { allNavigation } from "@/lib/navigation";
import { departmentsQueryOptions, usersQueryOptions } from "@/lib/query";
import type { UserRole } from "@/lib/types";

export const Route = createFileRoute("/app/user-management")({
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
	loader: async ({ context: { queryClient } }) => {
		queryClient.ensureQueryData(usersQueryOptions);
		queryClient.ensureQueryData(departmentsQueryOptions);
	},
});

function RouteComponent() {
	return <Outlet />;
}
