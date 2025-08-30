import RegistrationForm from "@/components/auth/registerForm";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(auth)/register")({
	component: RegisterPage,
});

function RegisterPage() {
	return (
		<div className="w-full max-w-2xl space-y-6">
			<div className="flex flex-col space-y-2 text-center">
				<h1 className="text-2xl font-semibold tracking-tight">
					Create an account
				</h1>
				<p className="text-sm text-muted-foreground">
					Fill out the form below to create your account
				</p>
			</div>
			<RegistrationForm />
		</div>
	);
}
