import {
    getAllApprovalsOfEvent,
    getAllDepartments,
    getAllEquipments,
    getAllEquipmentsAdmin,
    getAllEquipmentsByOwner,
    getAllEvents,
    getAllUsers,
    getAllVenues,
    getEventById,
} from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { queryOptions, useQuery } from "@tanstack/react-query";
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

export const eventQueryOptions = (eventId: string) =>
    queryOptions({
        queryKey: ["events", eventId],
        queryFn: () => getEventById(eventId),
        staleTime: 1000 * 60 * 5, // 5 minutes
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

export const departmentsQueryOptions = {
    queryKey: ["departments"],
    queryFn: async () => {
        const departments = await getAllDepartments();
        return departments;
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
