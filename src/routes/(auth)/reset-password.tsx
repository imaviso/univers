import { ResetPasswordForm } from "@/components/auth/resetPassword";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(auth)/reset-password")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div className="w-full max-w-md space-y-6">
			<ResetPasswordForm />
		</div>
	);
}
