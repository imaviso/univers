import {
    getAllDepartments,
    getAllEquipments,
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

export const equipmentsQueryOptions = (userId: number | undefined) =>
    queryOptions({
        queryKey: ["equipments", userId],
        queryFn: async () => {
            if (!userId) return []; // Don't fetch if userId is not available
            const equipments = await getAllEquipments(userId);
            return equipments;
        },
        enabled: !!userId, // Only run the query if userId is available
        staleTime: 1000 * 60 * 5, // 5 minutes stale time
    });
