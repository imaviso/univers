import ForgotPasswordForm from "@/components/auth/forgotPassword";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(auth)/forgot-password")({
    component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
    return (
        <div className="w-full max-w-md space-y-6">
            <ForgotPasswordForm />
        </div>
    );
}
