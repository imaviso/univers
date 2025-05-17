import NotFound from "@/components/404NotFound";
import { Toaster } from "@/components/ui/sonner";
import { ApiError } from "@/lib/api";
// import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { userQueryOptions } from "@/lib/query";
import type { QueryClient } from "@tanstack/react-query";
import {
    Outlet,
    createRootRouteWithContext,
    redirect,
} from "@tanstack/react-router";

export const Route = createRootRouteWithContext<{
    queryClient: QueryClient;
}>()({
    notFoundComponent: () => <NotFound />,
    beforeLoad: async ({ context }) => {
        try {
            const authState =
                await context.queryClient.ensureQueryData(userQueryOptions);
            return { authState };
        } catch (error) {
            if (
                error instanceof ApiError &&
                (error.message.startsWith("REFRESH_FAILED") ||
                    error.message.startsWith("POST_REFRESH_AUTH_FAILED") ||
                    error.message.startsWith("REFRESH_UNEXPECTED_ERROR") ||
                    error.message.startsWith("REFRESH_PROPAGATION_ERROR"))
            ) {
                console.warn(
                    "Critical auth error in root loader, redirecting to login:",
                    error.message,
                );
                await context.queryClient.removeQueries({
                    queryKey: userQueryOptions.queryKey,
                });

                throw redirect({
                    to: "/login",
                    replace: true,
                });
            }
            console.error(
                "Non-critical or unhandled error in root loader:",
                error,
            );
            return { authState: null };
        }
    },
    component: () => {
        return (
            <>
                <Outlet />
                <Toaster />
            </>
        );
    },
});
