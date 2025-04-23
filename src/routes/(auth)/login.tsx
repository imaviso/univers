import LoginForm from "@/components/auth/loginForm";
import { authNavigation } from "@/lib/navigation";
import { createFileRoute, redirect } from "@tanstack/react-router";
export const Route = createFileRoute("/(auth)/login")({
    component: LoginPage,
    beforeLoad: async ({ location, context }) => {
        const navigationItem = authNavigation.find((item) => {
            // Allow exact match or any sub-route after the base path, e.g. "/app/notifications/..."
            return (
                location.pathname === item.href ||
                location.pathname.startsWith(`${item.href}/`)
            );
        });
        const allowedRoles: string[] = navigationItem
            ? navigationItem.roles
            : [];

        const isAuthorized =
            context.authState?.role != null &&
            allowedRoles.includes(context.authState.role);

        if (isAuthorized) {
            throw redirect({
                to: "/app/calendar",
                search: {
                    redirect: location.href,
                },
            });
        }
    },
});

function LoginPage() {
    return (
        <div className="w-full max-w-md space-y-6">
            <div className="flex flex-col space-y-2 text-center">
                <h1 className="text-2xl font-semibold tracking-tight">
                    Login to your account
                </h1>
                <p className="text-sm text-muted-foreground">
                    Enter your credentials below to access your account
                </p>
            </div>
            <LoginForm />
        </div>
    );
}
