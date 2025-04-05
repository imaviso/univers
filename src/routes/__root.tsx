import NotFound from "@/components/404NotFound";
import { Toaster } from "@/components/ui/sonner";
// import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { userQueryOptions } from "@/lib/query";
import type { QueryClient } from "@tanstack/react-query";
import { Outlet, createRootRouteWithContext } from "@tanstack/react-router";
export const Route = createRootRouteWithContext<{
    queryClient: QueryClient;
}>()({
    notFoundComponent: () => <NotFound />,
    beforeLoad: async ({ context }) => {
        const authState =
            await context.queryClient.ensureQueryData(userQueryOptions);
        return authState;
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
