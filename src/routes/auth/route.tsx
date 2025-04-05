import NotFound from "@/components/404NotFound";
import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/auth")({
    component: AuthRoute,
    notFoundComponent: () => <NotFound />,
});

function AuthRoute() {
    return (
        <div className="flex min-h-screen items-center justify-center px-4 py-12">
            <Outlet />
        </div>
    );
}
