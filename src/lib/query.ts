import { getCurrentUser } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import type { UserType } from "./types";

export const userQueryOptions = {
    queryKey: ["currentUser"],
    queryFn: async () => {
        const user = await getCurrentUser();
        return user;
    },
    // staleTime: 600 * 1000, // 60 seconds - Adjust as needed
    retry: false, // Prevent automatic retries, handle errors explicitly
};

export const useCurrentUser = () => {
    const query = useQuery(userQueryOptions);
    return query;
};

export const isAuthenticated = async (
    requiredRoles?: (
        | "ORGANIZER"
        | "SUPER_ADMIN"
        | "EQUIPMENT_OWNER"
        | "VPAA"
        | "VP_ADMIN"
        | "VENUE_OWNER"
    )[], // Array of roles
    route?: any,
): Promise<boolean> => {
    try {
        if (route?.options?.skipAuth) {
            return true;
        }

        // Use the query function directly to check authentication
        const user = await userQueryOptions.queryFn();

        if (!user) {
            return false; // Not authenticated
        }

        if (requiredRoles && !requiredRoles.includes(user.role)) {
            return false; // Does not have any of the required roles
        }

        return true; // Authenticated and has the required role (if specified)
    } catch (error) {
        console.error("Error checking authentication:", error);
        return false;
    }
};
