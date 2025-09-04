import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { toast } from "sonner";
import ErrorPage from "@/components/ErrorPage";
import PendingPage from "@/components/PendingPage";
import { allNavigation } from "@/lib/navigation";
import { allEquipmentOwnerReservationsQueryOptions } from "@/lib/query";
import type { UserRole } from "@/lib/types";

export const Route = createFileRoute("/app/equipment-approval")({
	component: RouteComponent,
	errorComponent: () => <ErrorPage />,
	pendingComponent: () => <PendingPage />,
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
			toast.error("You are not authorized to view this page.");
			throw redirect({
				to: "/app",
			});
		}
	},
	loader: ({ context }) => {
		context.queryClient.ensureQueryData(
			allEquipmentOwnerReservationsQueryOptions,
		);
	},
});

function RouteComponent() {
	return <Outlet />;
}
