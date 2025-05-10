import {
    approveEquipmentReservation,
    approveReservation,
    cancelEquipmentReservation,
    cancelReservation,
    createEquipmentReservation,
    createVenueReservation,
    deleteEquipmentReservation,
    deleteNotifications,
    deleteReservation,
    getAllApprovalsOfEvent,
    getAllDepartments,
    getAllEquipmentOwnerReservations,
    getAllEquipmentReservations,
    getAllEquipmentsAdmin,
    getAllEquipmentsByOwner,
    getAllEvents,
    getAllReservations,
    getAllUsers,
    getAllVenueOwnerReservations,
    getAllVenues,
    getApprovalsForEquipmentReservation,
    getApprovalsForReservation,
    getApprovedEvents,
    getEquipmentReservationById,
    getEquipmentReservationsByEventId,
    getEventById,
    getNotifications,
    getOwnEquipmentReservations,
    getOwnEvents,
    getOwnReservations,
    getPendingDeptHeadEvents,
    getPendingEquipmentOwnerReservations,
    getPendingVenueOwnerEvents,
    getPendingVenueOwnerReservations,
    getReservationById,
    getUnreadNotificationCount,
    markAllNotificationsRead,
    markNotificationsRead,
    rejectEquipmentReservation,
    rejectReservation,
} from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import {
    queryOptions,
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";
import { type AnyRoute, useRouteContext } from "@tanstack/react-router"; // Added AnyRoute import
import type {
    Event as AppEvent, // Alias Event to AppEvent
    EquipmentApprovalDTO,
    EquipmentReservationDTO,
    EventApprovalDTO,
    EventDTO,
    UserDTO,
    UserRole,
    VenueApprovalDTO,
    VenueReservationDTO,
} from "./types"; // Import UserRole and Event (aliased)

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

export const eventsQueryKeys = {
    all: ["events"] as const,
    lists: () => [...eventsQueryKeys.all, "list"] as const,
    list: (filters: string) =>
        [...eventsQueryKeys.lists(), { filters }] as const, // Example filter structure
    details: () => [...eventsQueryKeys.all, "detail"] as const,
    detail: (id: number | string) =>
        [...eventsQueryKeys.details(), id] as const,
    approvals: (id: number | string) =>
        [...eventsQueryKeys.detail(id), "approvals"] as const,
    pending: () => [...eventsQueryKeys.all, "pending"] as const,
    pendingVenueOwner: () =>
        [...eventsQueryKeys.pending(), "venueOwner"] as const,
    pendingDeptHead: () => [...eventsQueryKeys.pending(), "deptHead"] as const,
    own: () => [...eventsQueryKeys.all, "own"] as const,
    approved: () => [...eventsQueryKeys.all, "approved"] as const,
    approvedByVenue: (venueId: string) =>
        [...eventsQueryKeys.approved(), "byVenue", venueId] as const,
    ongoingAndApprovedByVenue: (venueId: string) =>
        [...eventsQueryKeys.all, "ongoingAndApprovedByVenue", venueId] as const,
};

export const allEventsQueryOptions = queryOptions<AppEvent[]>({
    queryKey: eventsQueryKeys.lists(),
    queryFn: getAllEvents,
    staleTime: 1000 * 60 * 5,
});

// Replaces old getOwnEventsQueryOptions export
export const ownEventsQueryOptions = queryOptions<AppEvent[]>({
    queryKey: eventsQueryKeys.own(),
    queryFn: getOwnEvents,
    staleTime: 1000 * 60 * 5,
});

// Replaces old getApprovedEventsQuery export
export const approvedEventsQueryOptions = queryOptions<AppEvent[]>({
    queryKey: eventsQueryKeys.approved(),
    queryFn: getApprovedEvents,
    staleTime: 1000 * 60 * 5,
});

// Updated pendingVenueOwnerEventsQueryOptions
export const pendingVenueOwnerEventsQueryOptions = queryOptions<AppEvent[]>({
    queryKey: eventsQueryKeys.pendingVenueOwner(),
    queryFn: getPendingVenueOwnerEvents,
    staleTime: 1000 * 60 * 2,
});

// Updated pendingDeptHeadEventsQueryOptions
export const pendingDeptHeadEventsQueryOptions = queryOptions<AppEvent[]>({
    queryKey: eventsQueryKeys.pendingDeptHead(),
    queryFn: getPendingDeptHeadEvents,
    staleTime: 1000 * 60 * 2,
});

// Updated eventQueryOptions (now eventByIdQueryOptions for clarity)
export const eventByIdQueryOptions = (eventId: number | string) =>
    queryOptions<EventDTO>({
        // Specify return type
        queryKey: eventsQueryKeys.detail(eventId), // Use the new key structure
        queryFn: () => getEventById(String(eventId)), // Ensure ID is string if needed by API
        staleTime: 1000 * 60 * 5,
    });

// Updated eventApprovalsQueryOptions
export const eventApprovalsQueryOptions = (eventId: number | string) =>
    queryOptions<EventApprovalDTO[]>({
        // Specify return type
        queryKey: eventsQueryKeys.approvals(eventId), // Use the new key structure
        queryFn: () => getAllApprovalsOfEvent(String(eventId)),
        staleTime: 1000 * 60 * 2, // 2 minutes stale time
    });

export const venuesQueryOptions = {
    queryKey: ["venues"],
    queryOptions: {
        staleTime: 1000 * 60 * 60,
    },
    queryFn: async () => {
        const venues = await getAllVenues();
        return venues;
    },
};

export const equipmentsQueryOptions = (user: UserDTO | null | undefined) =>
    queryOptions({
        // Include role in query key if fetch logic depends on it, or just userId if sufficient
        queryKey: ["equipments", user?.publicId, user?.role],
        queryFn: async () => {
            if (!user) return []; // Don't fetch if no user

            if (user.role === "SUPER_ADMIN") {
                return await getAllEquipmentsAdmin();
            }
            if (
                user.role === "EQUIPMENT_OWNER" ||
                user.role === "MSDO" ||
                user.role === "OPC"
            ) {
                return await getAllEquipmentsByOwner(user.publicId);
            }
            // Other roles (like ORGANIZER) might need all available equipment?
            // Adjust this logic based on requirements. Fetching all for now.
            // Consider if non-owners should see only 'available' equipment via a different endpoint/filter.
            return await getAllEquipmentsByOwner(user.publicId);
        },
        enabled: !!user,
        staleTime: 1000 * 60 * 2, // 2 minutes stale time
    });

export const departmentsQueryOptions = queryOptions({
    queryKey: ["departments"],
    queryFn: getAllDepartments,
    staleTime: 1000 * 60 * 60,
});

export const notificationsQueryKeys = {
    all: ["notifications"] as const,
    lists: () => [...notificationsQueryKeys.all, "list"] as const,
    list: (page: number, size: number) =>
        [...notificationsQueryKeys.lists(), page, size] as const,
    count: () => [...notificationsQueryKeys.all, "count"] as const,
};

export const notificationsQueryOptions = (params: {
    page: number;
    size: number;
    enabled?: boolean;
}) =>
    queryOptions({
        queryKey: notificationsQueryKeys.list(params.page, params.size),
        queryFn: () => getNotifications(params.page, params.size),
        enabled: params.enabled,
        placeholderData: (previousData) => previousData, // Keep previous data while loading next page
        staleTime: 1000 * 60 * 1, // 1 minute stale time
    });

export const unreadNotificationsCountQueryOptions = queryOptions({
    queryKey: notificationsQueryKeys.count(),
    queryFn: getUnreadNotificationCount,
    staleTime: 1000 * 30, // 30 seconds stale time
});

// --- Notification Mutations ---

export const useMarkNotificationsReadMutation = () => {
    const context = useRouteContext({ from: "/app" });
    const queryClient = context.queryClient;
    return useMutation({
        mutationFn: markNotificationsRead,
        onSuccess: () => {
            // Invalidate both the list and the count
            queryClient.invalidateQueries({
                queryKey: notificationsQueryKeys.lists(),
            });
            queryClient.invalidateQueries({
                queryKey: notificationsQueryKeys.count(),
            });
        },
        // Optional: Add onMutate for optimistic updates
    });
};

export const useMarkAllNotificationsReadMutation = () => {
    const context = useRouteContext({ from: "/app" });
    const queryClient = context.queryClient;
    return useMutation({
        mutationFn: markAllNotificationsRead,
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: notificationsQueryKeys.lists(),
            });
            queryClient.invalidateQueries({
                queryKey: notificationsQueryKeys.count(),
            });
        },
        // Optional: Add onMutate for optimistic updates
    });
};

export const useDeleteNotificationsMutation = () => {
    const context = useRouteContext({ from: "/app" });
    const queryClient = context.queryClient;
    return useMutation({
        mutationFn: deleteNotifications,
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: notificationsQueryKeys.lists(),
            });
            queryClient.invalidateQueries({
                queryKey: notificationsQueryKeys.count(),
            });
        },
        // Optional: Add onMutate for optimistic updates
    });
};

export const venueReservationKeys = {
    all: ["venueReservations"] as const,
    lists: () => [...venueReservationKeys.all, "list"] as const,
    list: (filters: string) =>
        [...venueReservationKeys.lists(), { filters }] as const,
    details: () => [...venueReservationKeys.all, "detail"] as const,
    detail: (id: number | string) =>
        [...venueReservationKeys.details(), id] as const,
    approvals: (id: number | string) =>
        [...venueReservationKeys.detail(id), "approvals"] as const,
    pending: () => [...venueReservationKeys.all, "pending"] as const,
    pendingVenueOwner: () =>
        [...venueReservationKeys.pending(), "venueOwner"] as const,
    allVenueOwnerReservations: () =>
        [...venueReservationKeys.all, "venueOwner"] as const,
    own: () => [...venueReservationKeys.all, "own"] as const,
};

export const allReservationsQueryOptions = queryOptions<VenueReservationDTO[]>({
    queryKey: venueReservationKeys.lists(),
    queryFn: getAllReservations,
    staleTime: 1000 * 60 * 5,
});

export const ownReservationsQueryOptions = queryOptions<VenueReservationDTO[]>({
    queryKey: venueReservationKeys.own(),
    queryFn: getOwnReservations,
    staleTime: 1000 * 60 * 2,
});

export const reservationByIdQueryOptions = (reservationId: number | string) =>
    queryOptions<VenueReservationDTO>({
        queryKey: venueReservationKeys.detail(reservationId),
        queryFn: () => getReservationById(String(reservationId)),
        staleTime: 1000 * 60 * 5,
    });

export const reservationApprovalsQueryOptions = (reservationId: string) =>
    queryOptions<VenueApprovalDTO[]>({
        queryKey: venueReservationKeys.approvals(reservationId),
        queryFn: () => getApprovalsForReservation(reservationId),
        staleTime: 1000 * 60 * 2, // 2 minutes
    });

export const pendingVenueOwnerReservationsQueryOptions = queryOptions<
    VenueReservationDTO[]
>({
    queryKey: venueReservationKeys.pendingVenueOwner(),
    queryFn: getPendingVenueOwnerReservations,
    staleTime: 1000 * 60 * 2, // 2 minutes
});

export const allVenueOwnerReservationsQueryOptions = queryOptions<
    VenueReservationDTO[]
>({
    queryKey: venueReservationKeys.allVenueOwnerReservations(),
    queryFn: getAllVenueOwnerReservations,
    staleTime: 1000 * 60 * 2, // 2 minutes
});

export const useCreateReservationMutation = () => {
    const context = useRouteContext({ from: "/app" }); // Adjust route context if needed
    const queryClient = context.queryClient;
    return useMutation({
        mutationFn: createVenueReservation,
        onSuccess: (newReservation) => {
            // Invalidate lists or add to cache optimistically
            queryClient.invalidateQueries({
                queryKey: venueReservationKeys.lists(),
            });
            // Optionally, set the data for the new reservation's detail query
            queryClient.setQueryData(
                venueReservationKeys.detail(newReservation.publicId),
                newReservation,
            );
            queryClient.invalidateQueries({
                queryKey: ownReservationsQueryOptions.queryKey,
            });
            // Navigate or show success message
        },
        onError: (error) => {
            console.error("Error creating reservation:", error);
            // Show error toast/message
        },
    });
};

export const useApproveReservationMutation = () => {
    const context = useRouteContext({ from: "/app" }); // Adjust route context
    const queryClient = context.queryClient;
    return useMutation({
        mutationFn: approveReservation,
        onSuccess: (_message, variables) => {
            // Invalidate the specific reservation and potentially lists
            queryClient.invalidateQueries({
                queryKey: venueReservationKeys.detail(
                    variables.reservationPublicId,
                ),
            });
            queryClient.invalidateQueries({
                queryKey: venueReservationKeys.lists(),
            });
            queryClient.invalidateQueries({
                queryKey: venueReservationKeys.pending(),
            }); // Invalidate pending lists
            // Show success message
        },
        onError: (error) => {
            console.error("Error approving reservation:", error);
            // Show error toast/message
        },
    });
};

export const useRejectReservationMutation = () => {
    const context = useRouteContext({ from: "/app" }); // Adjust route context
    const queryClient = context.queryClient;
    return useMutation({
        mutationFn: rejectReservation,
        onSuccess: (_message, variables) => {
            // Invalidate the specific reservation and potentially lists
            queryClient.invalidateQueries({
                queryKey: venueReservationKeys.detail(
                    variables.reservationPublicId,
                ),
            });
            queryClient.invalidateQueries({
                queryKey: venueReservationKeys.lists(),
            });
            queryClient.invalidateQueries({
                queryKey: venueReservationKeys.pending(),
            }); // Invalidate pending lists
            // Show success message
        },
        onError: (error) => {
            console.error("Error rejecting reservation:", error);
            // Show error toast/message
        },
    });
};

export const useCancelReservationMutation = () => {
    const context = useRouteContext({ from: "/app" }); // Adjust route context
    const queryClient = context.queryClient;
    return useMutation({
        mutationFn: cancelReservation,
        onSuccess: (_message, reservationId) => {
            // Invalidate the specific reservation and potentially lists
            queryClient.invalidateQueries({
                queryKey: venueReservationKeys.detail(reservationId),
            });
            queryClient.invalidateQueries({
                queryKey: venueReservationKeys.lists(),
            });
            queryClient.invalidateQueries({
                queryKey: venueReservationKeys.pending(),
            });
            // Show success message
        },
        onError: (error) => {
            console.error("Error cancelling reservation:", error);
            // Show error toast/message
        },
    });
};

export const useDeleteReservationMutation = () => {
    const context = useRouteContext({ from: "/app" }); // Adjust route context
    const queryClient = context.queryClient;
    return useMutation({
        mutationFn: deleteReservation,
        onSuccess: (_message, reservationId) => {
            // Remove the specific reservation from cache and invalidate lists
            queryClient.removeQueries({
                queryKey: venueReservationKeys.detail(reservationId),
            });
            queryClient.invalidateQueries({
                queryKey: venueReservationKeys.lists(),
            });
            queryClient.invalidateQueries({
                queryKey: venueReservationKeys.pending(),
            });
            // Navigate away or show success message
        },
        onError: (error) => {
            console.error("Error deleting reservation:", error);
            // Show error toast/message
        },
    });
};

export const equipmentReservationKeys = {
    all: ["equipmentReservations"] as const,
    lists: () => [...equipmentReservationKeys.all, "list"] as const,
    list: (filters: string) =>
        [...equipmentReservationKeys.lists(), { filters }] as const,
    details: () => [...equipmentReservationKeys.all, "detail"] as const,
    detail: (id: number | string) =>
        [...equipmentReservationKeys.details(), id] as const,
    approvals: (id: number | string) =>
        [...equipmentReservationKeys.detail(id), "approvals"] as const,
    pending: () => [...equipmentReservationKeys.all, "pending"] as const,
    pendingEquipmentOwner: () =>
        [...equipmentReservationKeys.pending(), "equipmentOwner"] as const,
    allEquipmentOwner: () =>
        [...equipmentReservationKeys.all, "equipmentOwner"] as const,
    own: () => [...equipmentReservationKeys.all, "own"] as const,
    byEvent: (eventId: number | string) =>
        [...equipmentReservationKeys.all, "event", eventId] as const, // New key for by event ID
};

// --- Equipment Reservation Query Options ---

export const allEquipmentReservationsQueryOptions = queryOptions<
    EquipmentReservationDTO[]
>({
    queryKey: equipmentReservationKeys.lists(),
    queryFn: getAllEquipmentReservations,
    staleTime: 1000 * 60 * 5, // 5 minutes
});

export const ownEquipmentReservationsQueryOptions = queryOptions<
    EquipmentReservationDTO[]
>({
    queryKey: equipmentReservationKeys.own(),
    queryFn: getOwnEquipmentReservations,
    staleTime: 1000 * 60 * 2, // 2 minutes
});

export const equipmentReservationsByEventIdQueryOptions = (eventId: string) =>
    queryOptions<EquipmentReservationDTO[]>({
        queryKey: equipmentReservationKeys.byEvent(eventId),
        queryFn: () => getEquipmentReservationsByEventId(eventId),
        staleTime: 1000 * 60 * 2,
    });

export const equipmentReservationByIdQueryOptions = (reservationId: string) =>
    queryOptions<EquipmentReservationDTO>({
        queryKey: equipmentReservationKeys.detail(reservationId),
        queryFn: () => getEquipmentReservationById(reservationId),
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

export const equipmentReservationApprovalsQueryOptions = (
    reservationId: string,
) =>
    queryOptions<EquipmentApprovalDTO[]>({
        queryKey: equipmentReservationKeys.approvals(reservationId),
        queryFn: () => getApprovalsForEquipmentReservation(reservationId),
        staleTime: 1000 * 60 * 2, // 2 minutes
    });

export const pendingEquipmentOwnerReservationsQueryOptions = queryOptions<
    EquipmentReservationDTO[]
>({
    queryKey: equipmentReservationKeys.pendingEquipmentOwner(),
    queryFn: getPendingEquipmentOwnerReservations,
    staleTime: 1000 * 60 * 2, // 2 minutes
});

export const allEquipmentOwnerReservationsQueryOptions = queryOptions<
    EquipmentReservationDTO[]
>({
    queryKey: equipmentReservationKeys.allEquipmentOwner(),
    queryFn: getAllEquipmentOwnerReservations,
    staleTime: 1000 * 60 * 5, // 5 minutes
});

// --- Equipment Reservation Mutations ---

export const useCreateEquipmentReservationMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createEquipmentReservation,
        onSuccess: (newReservation) => {
            queryClient.invalidateQueries({
                queryKey: equipmentReservationKeys.lists(),
            });
            queryClient.invalidateQueries({
                queryKey: equipmentReservationKeys.own(),
            });
            queryClient.setQueryData(
                equipmentReservationKeys.detail(newReservation.publicId),
                newReservation,
            );
        },
    });
};

export const useApproveEquipmentReservationMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: approveEquipmentReservation,
        onSuccess: (_message, variables) => {
            queryClient.invalidateQueries({
                queryKey: equipmentReservationKeys.detail(
                    variables.reservationPublicId,
                ),
            });
            queryClient.invalidateQueries({
                queryKey: equipmentReservationKeys.approvals(
                    variables.reservationPublicId,
                ),
            });
            queryClient.invalidateQueries({
                queryKey: equipmentReservationKeys.lists(),
            });
            queryClient.invalidateQueries({
                queryKey: equipmentReservationKeys.pending(),
            });
            queryClient.invalidateQueries({
                queryKey: equipmentReservationKeys.own(),
            });
        },
    });
};

export const useRejectEquipmentReservationMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: rejectEquipmentReservation,
        onSuccess: (_message, variables) => {
            queryClient.invalidateQueries({
                queryKey: equipmentReservationKeys.detail(
                    variables.reservationPublicId,
                ),
            });
            queryClient.invalidateQueries({
                queryKey: equipmentReservationKeys.approvals(
                    variables.reservationPublicId,
                ),
            });
            queryClient.invalidateQueries({
                queryKey: equipmentReservationKeys.lists(),
            });
            queryClient.invalidateQueries({
                queryKey: equipmentReservationKeys.pending(),
            });
            queryClient.invalidateQueries({
                queryKey: equipmentReservationKeys.own(),
            });
        },
    });
};

export const useCancelEquipmentReservationMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (variables: { reservationId: string; eventId: string }) =>
            cancelEquipmentReservation(variables.reservationId),
        onMutate: async (variables: {
            reservationId: string;
            eventId: string;
        }) => {
            const { reservationId, eventId } = variables;
            // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
            await queryClient.cancelQueries({
                queryKey: equipmentReservationKeys.byEvent(eventId),
            });

            // Snapshot the previous value
            const previousReservations = queryClient.getQueryData<
                EquipmentReservationDTO[]
            >(equipmentReservationKeys.byEvent(eventId));

            // Optimistically update to the new value
            if (previousReservations) {
                queryClient.setQueryData<EquipmentReservationDTO[]>(
                    equipmentReservationKeys.byEvent(eventId),
                    previousReservations.filter(
                        (reservation) => reservation.publicId !== reservationId,
                    ),
                );
            }

            // Return a context object with the snapshotted value
            return { previousReservations, eventId };
        },
        onError: (
            err,
            variables,
            context?: {
                previousReservations?: EquipmentReservationDTO[];
                eventId?: string;
            },
        ) => {
            // Rollback to the previous value if mutation fails
            if (context?.previousReservations && context?.eventId) {
                queryClient.setQueryData(
                    equipmentReservationKeys.byEvent(context.eventId),
                    context.previousReservations,
                );
            }
            // Consider showing an error toast here if not handled by the component
        },
        onSuccess: (data, variables) => {
            // `data` is the result of `cancelEquipmentReservation`
            // `variables` is { reservationId, eventId }
            // Invalidate related queries to ensure data consistency
            // The specific event's list is already optimistically updated,
            // but invalidating ensures it refetches if needed, or if other views depend on it.
            queryClient.invalidateQueries({
                queryKey: equipmentReservationKeys.byEvent(variables.eventId),
            });
        },
        onSettled: (data, error, variables) => {
            // This function runs after the mutation is either successful or errors.
            // Good place for invalidations that should happen regardless of outcome,
            // or to ensure specific details are fresh.
            queryClient.invalidateQueries({
                queryKey: equipmentReservationKeys.detail(
                    variables.reservationId,
                ),
            });
            queryClient.invalidateQueries({
                queryKey: equipmentReservationKeys.lists(),
            });
            queryClient.invalidateQueries({
                queryKey: equipmentReservationKeys.pending(),
            });
            queryClient.invalidateQueries({
                queryKey: equipmentReservationKeys.own(),
            });
            // Also ensure the byEvent list is refetched to be certain it's up-to-date,
            // especially if the optimistic update logic might have edge cases or server modifies data further.
            queryClient.invalidateQueries({
                queryKey: equipmentReservationKeys.byEvent(variables.eventId),
            });
        },
    });
};

export const useDeleteEquipmentReservationMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteEquipmentReservation,
        onSuccess: (_message, reservationId) => {
            queryClient.removeQueries({
                queryKey: equipmentReservationKeys.detail(reservationId),
            });
            queryClient.invalidateQueries({
                queryKey: equipmentReservationKeys.lists(),
            });
            queryClient.invalidateQueries({
                queryKey: equipmentReservationKeys.pending(),
            });
            queryClient.invalidateQueries({
                queryKey: equipmentReservationKeys.own(),
            });
        },
    });
};
