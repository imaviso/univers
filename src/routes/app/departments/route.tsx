import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import ErrorPage from "@/components/ErrorPage";
import PendingPage from "@/components/PendingPage";
import { allNavigation } from "@/lib/navigation";
import { departmentsQueryOptions, usersQueryOptions } from "@/lib/query"; // Add departmentsQueryOptions
import type { UserRole } from "@/lib/types";

export const Route = createFileRoute("/app/departments")({
	beforeLoad: async ({ location, context }) => {
		const navigationItem = allNavigation.find((item) => {
			return (
				location.pathname === item.href ||
				location.pathname.startsWith(`${item.href}/`)
			);
		});
		// Define roles allowed to access this route (e.g., SUPER_ADMIN)
		const allowedRoles: string[] = navigationItem
			? navigationItem.roles
			: ["SUPER_ADMIN"];

		if (context.authState == null) {
			throw redirect({
				to: "/login",
				search: { redirect: location.href },
			});
		}
		const userRoles = context.authState?.roles || [];
		const isAuthorized = allowedRoles.some((role) =>
			userRoles.includes(role as UserRole),
		);

		if (!isAuthorized) {
			throw redirect({
				// Redirect if not authorized
				to: "/app", // Or to a specific unauthorized page
			});
		}
	},
	component: RouteComponent,
	pendingComponent: () => <PendingPage />,
	errorComponent: () => <ErrorPage />,
	loader: async ({ context }) => {
		await context.queryClient.ensureQueryData(departmentsQueryOptions);
		await context.queryClient.ensureQueryData(usersQueryOptions);
	},
});

function RouteComponent() {
	return <Outlet />;
}
