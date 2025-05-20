import {
    approveEquipmentReservation,
    cancelEquipmentReservation,
    createEquipmentReservation,
    deleteEquipmentReservation,
    deleteNotifications,
    getAllApprovalsOfEvent,
    getAllDepartments,
    getAllEquipmentOwnerReservations,
    getAllEquipmentReservations,
    getAllEquipmentsAdmin,
    getAllEquipmentsByOwner,
    getAllEvents,
    getAllUsers,
    getAllVenues,
    getApprovalsForEquipmentReservation,
    getApprovedEvents,
    getCancellationRates,
    getEquipmentReservationById,
    getEquipmentReservationsByEventId,
    getEventById,
    getEventTypesSummary,
    getEventsOverview,
    getNotifications,
    getOwnEquipmentReservations,
    getOwnEvents,
    getPeakReservationHours,
    getPendingDeptHeadEvents,
    getPendingEquipmentOwnerReservations,
    getPendingVenueOwnerEvents,
    getRecentActivityApi,
    getTimelineEventsByDateRange,
    getTopEquipment,
    // Dashboard API imports
    getTopVenues,
    getUnreadNotificationCount,
    getUpcomingApprovedEventsApi,
    getUpcomingApprovedEventsCountNextDaysApi,
    getUserActivity,
    markAllNotificationsRead,
    markNotificationsRead,
    rejectEquipmentReservation,
    searchEvents,
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
    CancellationRateDTO,
    EquipmentApprovalDTO,
    EquipmentReservationDTO,
    EventApprovalDTO,
    EventCountDTO,
    EventDTO,
    EventTypeSummaryDTO,
    PeakHourDTO,
    RecentActivityItemDTO,
    TopEquipmentDTO,
    // Dashboard DTO imports
    TopVenueDTO,
    UserActivityDTO,
    UserDTO,
    UserRole,
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

        if (
            requiredRoles &&
            !requiredRoles.some((role) => user.roles.includes(role))
        ) {
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
export const pendingVenueOwnerEventsQueryOptions = queryOptions<EventDTO[]>({
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
        // Include roles in query key if fetch logic depends on it, or just userId if sufficient
        queryKey: ["equipments", user?.publicId, user?.roles],
        queryFn: async () => {
            if (!user) return []; // Don't fetch if no user
            if (user.roles.includes("EQUIPMENT_OWNER")) {
                return await getAllEquipmentsByOwner(user.publicId);
            }
            // Other roles (like ORGANIZER) might need all available equipment?
            // Adjust this logic based on requirements. Fetching all for now.
            // Consider if non-owners should see only 'available' equipment via a different endpoint/filter.
            return await getAllEquipmentsAdmin();
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
        onMutate: async (variables: {
            reservationPublicId: string;
            remarks?: string;
        }) => {
            // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
            await queryClient.cancelQueries({
                queryKey: equipmentReservationKeys.allEquipmentOwner(),
            });
            await queryClient.cancelQueries({
                queryKey: equipmentReservationKeys.detail(
                    variables.reservationPublicId,
                ),
            });

            // Snapshot the previous value
            const previousReservations = queryClient.getQueryData<
                EquipmentReservationDTO[]
            >(equipmentReservationKeys.allEquipmentOwner());
            const currentUser = queryClient.getQueryData<UserDTO>(
                userQueryOptions.queryKey,
            );

            // Optimistically update to the new value
            if (previousReservations && currentUser) {
                queryClient.setQueryData<EquipmentReservationDTO[]>(
                    equipmentReservationKeys.allEquipmentOwner(),
                    (oldData = []) =>
                        oldData.map((reservation) => {
                            if (
                                reservation.publicId ===
                                variables.reservationPublicId
                            ) {
                                const newApproval: EquipmentApprovalDTO = {
                                    publicId: `optimistic-approval-${Date.now()}`, // Temporary client-side ID
                                    status: "APPROVED",
                                    remarks: variables.remarks ?? null,
                                    signedByUser: currentUser,
                                    dateSigned: new Date().toISOString(),
                                    equipmentReservationPublicId:
                                        reservation.publicId,
                                    userRole: currentUser.roles[0],
                                };
                                return {
                                    ...reservation,
                                    status: "APPROVED",
                                    approvals: [
                                        ...(reservation.approvals || []),
                                        newApproval,
                                    ],
                                };
                            }
                            return reservation;
                        }),
                );
            }
            return { previousReservations };
        },
        onError: (_err, _variables, context) => {
            if (context?.previousReservations) {
                queryClient.setQueryData(
                    equipmentReservationKeys.allEquipmentOwner(),
                    context.previousReservations,
                );
            }
        },
        onSuccess: (_message, variables) => {
            queryClient.invalidateQueries({
                queryKey: equipmentReservationKeys.allEquipmentOwner(),
            });
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
        onMutate: async (variables: {
            reservationPublicId: string;
            remarks: string;
        }) => {
            await queryClient.cancelQueries({
                queryKey: equipmentReservationKeys.allEquipmentOwner(),
            });
            await queryClient.cancelQueries({
                queryKey: equipmentReservationKeys.detail(
                    variables.reservationPublicId,
                ),
            });

            const previousReservations = queryClient.getQueryData<
                EquipmentReservationDTO[]
            >(equipmentReservationKeys.allEquipmentOwner());
            const currentUser = queryClient.getQueryData<UserDTO>(
                userQueryOptions.queryKey,
            );

            if (previousReservations && currentUser) {
                queryClient.setQueryData<EquipmentReservationDTO[]>(
                    equipmentReservationKeys.allEquipmentOwner(),
                    (oldData = []) =>
                        oldData.map((reservation) => {
                            if (
                                reservation.publicId ===
                                variables.reservationPublicId
                            ) {
                                const newApproval: EquipmentApprovalDTO = {
                                    publicId: `optimistic-rejection-${Date.now()}`,
                                    status: "REJECTED",
                                    remarks: variables.remarks,
                                    signedByUser: currentUser,
                                    dateSigned: new Date().toISOString(),
                                    equipmentReservationPublicId:
                                        reservation.publicId,
                                    userRole: currentUser.roles[0],
                                };
                                return {
                                    ...reservation,
                                    status: "REJECTED",
                                    approvals: [
                                        ...(reservation.approvals || []),
                                        newApproval,
                                    ],
                                };
                            }
                            return reservation;
                        }),
                );
            }
            return { previousReservations };
        },
        onError: (_err, _variables, context) => {
            if (context?.previousReservations) {
                queryClient.setQueryData(
                    equipmentReservationKeys.allEquipmentOwner(),
                    context.previousReservations,
                );
            }
        },
        onSuccess: (_message, variables) => {
            queryClient.invalidateQueries({
                queryKey: equipmentReservationKeys.allEquipmentOwner(),
            });
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
        onError: (context?: {
            previousReservations?: EquipmentReservationDTO[];
            eventId?: string;
        }) => {
            // Rollback to the previous value if mutation fails
            if (context?.previousReservations && context?.eventId) {
                queryClient.setQueryData(
                    equipmentReservationKeys.byEvent(context.eventId),
                    context.previousReservations,
                );
            }
            // Consider showing an error toast here if not handled by the component
        },
        onSuccess: (_data, _error, variables) => {
            // `data` is the result of `cancelEquipmentReservation`
            // `variables` is { reservationId, eventId }
            // Invalidate related queries to ensure data consistency
            // The specific event's list is already optimistically updated,
            // but invalidating ensures it refetches if needed, or if other views depend on it.
            queryClient.invalidateQueries({
                queryKey: equipmentReservationKeys.byEvent(variables.eventId),
            });
        },
        onSettled: (_data, _error, variables) => {
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

export const searchEventsQueryOptions = (
    scope: string,
    status?: string,
    sortBy?: string,
    startDate?: string,
    endDate?: string,
) =>
    queryOptions<EventDTO[]>({
        queryKey: [
            ...eventsQueryKeys.lists(),
            {
                scope,
                status: status ?? "ALL",
                sortBy: sortBy ?? "default",
                startDate: startDate ?? "allTime",
                endDate: endDate ?? "allTime",
            },
        ],
        queryFn: () => searchEvents(scope, status, sortBy, startDate, endDate),
        staleTime: 1000 * 60 * 2,
    });

export const timelineEventsByDateRangeQueryOptions = (
    startDate?: string,
    endDate?: string,
) =>
    queryOptions<AppEvent[]>({
        queryKey: ["events", "timelineByDate", { startDate, endDate }],
        queryFn: () => getTimelineEventsByDateRange(startDate, endDate),
        staleTime: 1000 * 60 * 2, // 2 minutes stale time
    });

// Dashboard Query Keys and Options

export const dashboardQueryKeys = {
    all: ["dashboardData"] as const,
    topVenues: (startDate?: string, endDate?: string, limit?: number) =>
        [
            ...dashboardQueryKeys.all,
            "topVenues",
            { startDate, endDate, limit },
        ] as const,
    topEquipment: (
        startDate?: string,
        endDate?: string,
        equipmentTypeFilter?: string,
        limit?: number,
    ) =>
        [
            ...dashboardQueryKeys.all,
            "topEquipment",
            { startDate, endDate, equipmentTypeFilter, limit },
        ] as const,
    eventsOverview: (startDate?: string, endDate?: string) =>
        [
            ...dashboardQueryKeys.all,
            "eventsOverview",
            { startDate, endDate },
        ] as const,
    cancellationRates: (startDate?: string, endDate?: string) =>
        [
            ...dashboardQueryKeys.all,
            "cancellationRates",
            { startDate, endDate },
        ] as const,
    peakReservationHours: (startDate?: string, endDate?: string) =>
        [
            ...dashboardQueryKeys.all,
            "peakReservationHours",
            { startDate, endDate },
        ] as const,
    userActivity: (startDate?: string, endDate?: string, limit?: number) =>
        [
            ...dashboardQueryKeys.all,
            "userActivity",
            { startDate, endDate, limit },
        ] as const,
    recentActivity: (limit = 10) => [
        ...dashboardQueryKeys.all,
        "recentActivity",
        { limit },
    ],
    upcomingApprovedEvents: (limit = 5) => [
        ...dashboardQueryKeys.all,
        "upcomingApprovedEvents",
        { limit },
    ],
    upcomingApprovedEventsCountNextDays: (days = 30) => [
        ...dashboardQueryKeys.all,
        "upcomingApprovedEventsCountNextDays",
        { days },
    ],
    eventTypesSummary: (startDate?: string, endDate?: string, limit?: number) =>
        [
            ...dashboardQueryKeys.all,
            "eventTypesSummary",
            { startDate, endDate, limit },
        ] as const,
};

export const topVenuesQueryOptions = (
    startDate?: string,
    endDate?: string,
    limit = 5,
) =>
    queryOptions<TopVenueDTO[]>({
        queryKey: dashboardQueryKeys.topVenues(startDate, endDate, limit),
        queryFn: () => {
            if (!startDate || !endDate) return Promise.resolve([]);
            return getTopVenues(startDate, endDate, limit);
        },
        enabled: !!startDate && !!endDate,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

export const topEquipmentQueryOptions = (
    startDate?: string,
    endDate?: string,
    equipmentTypeFilter?: string,
    limit = 5,
) =>
    queryOptions<TopEquipmentDTO[]>({
        queryKey: dashboardQueryKeys.topEquipment(
            startDate,
            endDate,
            equipmentTypeFilter,
            limit,
        ),
        queryFn: () => {
            if (!startDate || !endDate) return Promise.resolve([]);
            return getTopEquipment(
                startDate,
                endDate,
                equipmentTypeFilter,
                limit,
            );
        },
        enabled: !!startDate && !!endDate,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

export const eventsOverviewQueryOptions = (
    startDate?: string,
    endDate?: string,
) =>
    queryOptions<EventCountDTO[]>({
        queryKey: dashboardQueryKeys.eventsOverview(startDate, endDate),
        queryFn: () => {
            if (!startDate || !endDate) return Promise.resolve([]);
            return getEventsOverview(startDate, endDate);
        },
        enabled: !!startDate && !!endDate,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

export const cancellationRatesQueryOptions = (
    startDate?: string,
    endDate?: string,
) =>
    queryOptions<CancellationRateDTO[]>({
        queryKey: dashboardQueryKeys.cancellationRates(startDate, endDate),
        queryFn: () => {
            if (!startDate || !endDate) return Promise.resolve([]);
            return getCancellationRates(startDate, endDate);
        },
        enabled: !!startDate && !!endDate,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

export const peakReservationHoursQueryOptions = (
    startDate?: string,
    endDate?: string,
) =>
    queryOptions<PeakHourDTO[]>({
        queryKey: dashboardQueryKeys.peakReservationHours(startDate, endDate),
        queryFn: () => {
            if (!startDate || !endDate) return Promise.resolve([]);
            return getPeakReservationHours(startDate, endDate);
        },
        enabled: !!startDate && !!endDate,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

export const userActivityQueryOptions = (
    startDate?: string,
    endDate?: string,
    limit = 5,
) =>
    queryOptions<UserActivityDTO[]>({
        queryKey: dashboardQueryKeys.userActivity(startDate, endDate, limit),
        queryFn: () => {
            if (!startDate || !endDate) return Promise.resolve([]);
            return getUserActivity(startDate, endDate, limit);
        },
        enabled: !!startDate && !!endDate,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

export const recentActivityQueryOptions = (limit = 10) =>
    queryOptions<RecentActivityItemDTO[]>({
        queryKey: [...dashboardQueryKeys.all, "recentActivity", { limit }],
        queryFn: () => getRecentActivityApi(limit),
        staleTime: 1000 * 60 * 1, // 1 minute, as activity changes often
    });

export const upcomingApprovedEventsQueryOptions = (limit = 5) =>
    queryOptions<EventDTO[]>({
        queryKey: [
            ...dashboardQueryKeys.all,
            "upcomingApprovedEvents",
            { limit },
        ],
        queryFn: () => getUpcomingApprovedEventsApi(limit),
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

export const upcomingApprovedEventsCountNextDaysQueryOptions = (days = 30) =>
    queryOptions<number>({
        queryKey: dashboardQueryKeys.upcomingApprovedEventsCountNextDays(days),
        queryFn: () => getUpcomingApprovedEventsCountNextDaysApi(days),
        staleTime: 1000 * 60 * 15, // Stale for 15 minutes
    });

export const eventTypeSummaryQueryOptions = (
    startDate?: string,
    endDate?: string,
    limit = 10, // Default limit, consistent with API
) =>
    queryOptions<EventTypeSummaryDTO[]>({
        queryKey: dashboardQueryKeys.eventTypesSummary(
            startDate,
            endDate,
            limit,
        ),
        queryFn: () => {
            if (!startDate || !endDate) return Promise.resolve([]);
            return getEventTypesSummary(startDate, endDate, limit);
        },
        enabled: !!startDate && !!endDate,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
