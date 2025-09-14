import { createFileRoute } from "@tanstack/react-router";
import { InputOTPForm } from "@/components/auth/otp-form";
export const Route = createFileRoute("/(auth)/verify-email")({
	component: VerifyEmailPage,
});

function VerifyEmailPage() {
	return (
		<div className="w-full max-w-md space-y-6">
			<InputOTPForm />
		</div>
	);
}
