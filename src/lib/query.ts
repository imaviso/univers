import {
    getAllApprovalsOfEvent,
    getAllDepartments,
    // getAllEquipments, // Removed unused/incorrect import
    getAllEquipmentsAdmin,
    getAllEquipmentsByOwner,
    getAllEvents,
    getAllUsers,
    getAllVenues,
    getApprovedEvents,
    getEventById,
    getOwnEvents,
} from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { queryOptions, useQuery } from "@tanstack/react-query";
import type { AnyRoute } from "@tanstack/react-router"; // Added AnyRoute import
import type { UserRole, UserType } from "./types"; // Import UserRole

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

// Define a type for route options that includes skipAuth
type RouteOptionsWithAuth = {
    skipAuth?: boolean;
    // Add other potential properties from RouteOptions if known/needed
};

export const isAuthenticated = async (
    requiredRoles?: UserRole[], // Allow any UserRole in the array
    route?: AnyRoute, // Keep AnyRoute type
): Promise<boolean> => {
    try {
        if ((route?.options as RouteOptionsWithAuth)?.skipAuth) {
            // Cast to the defined type
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

export const usersQueryOptions = {
    queryKey: ["users"],
    queryFn: async () => {
        const users = await getAllUsers();
        return users;
    },
};

export const eventsQueryOptions = {
    queryKey: ["events"],
    queryFn: async () => {
        const events = await getAllEvents();
        return events;
    },
};

export const getOwnEventsQueryOptions = {
    queryKey: ["ownEvents"],
    queryFn: async () => {
        const ownEvents = await getOwnEvents();
        return ownEvents;
    },
    staleTime: 1000 * 60 * 5,
};

export const getApprovedEventsQuery = {
    queryKey: ["approvedEvents"],
    queryFn: async () => {
        const approvedEvents = await getApprovedEvents();
        return approvedEvents;
    },
    staleTime: 1000 * 60 * 5,
};

export const eventQueryOptions = (eventId: string) =>
    queryOptions({
        queryKey: ["events", eventId],
        queryFn: () => getEventById(eventId),
        staleTime: 1000 * 60 * 5,
    });

export const eventApprovalsQueryOptions = (eventId: number) =>
    queryOptions({
        queryKey: ["eventApprovals", eventId],
        queryFn: () => getAllApprovalsOfEvent(eventId),
        staleTime: 1000 * 60 * 2, // 2 minutes stale time
    });

export const venuesQueryOptions = {
    queryKey: ["venues"],
    queryFn: async () => {
        const venues = await getAllVenues();
        return venues;
    },
};

export const equipmentsQueryOptions = (user: UserType | null | undefined) =>
    queryOptions({
        // Include role in query key if fetch logic depends on it, or just userId if sufficient
        queryKey: ["equipments", user?.id, user?.role],
        queryFn: async () => {
            if (!user) return []; // Don't fetch if no user

            if (user.role === "SUPER_ADMIN") {
                return await getAllEquipmentsAdmin();
            }
            if (user.role === "EQUIPMENT_OWNER") {
                return await getAllEquipmentsByOwner(Number(user.id));
            }
            // Other roles (like ORGANIZER) might need all available equipment?
            // Adjust this logic based on requirements. Fetching all for now.
            // Consider if non-owners should see only 'available' equipment via a different endpoint/filter.
            return await getAllEquipmentsAdmin(); // Defaulting to all for other roles for now
        },
        enabled: !!user,
        staleTime: 1000 * 60 * 2, // 2 minutes stale time
    });

export const departmentsQueryOptions = queryOptions({
    queryKey: ["departments"],
    queryFn: getAllDepartments,
    staleTime: 1000 * 60 * 5,
});
