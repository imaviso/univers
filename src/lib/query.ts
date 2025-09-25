import {
	queryOptions,
	type UseMutationOptions, // Added for typed mutation options
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { type AnyRoute, useRouteContext } from "@tanstack/react-router"; // Added AnyRoute import
import {
	// Personnel API imports
	addEventPersonnel,
	approveEquipmentReservation,
	bulkDeactivateUsersAsAdmin, // Added for bulk user deactivation by admin
	bulkDeleteDepartments,
	cancelEquipmentReservation,
	// Equipment Category API imports
	createEquipmentCategory,
	createEquipmentReservation,
	deleteEquipmentCategory,
	deleteEquipmentReservation,
	deleteEventPersonnel,
	deleteNotifications,
	getAllDepartments,
	getAllEquipmentCategories,
	getAllEquipmentOwnerReservations,
	getAllEquipmentReservations,
	getAllEquipmentsAdmin,
	getAllEquipmentsByOwner,
	getAllUsers,
	getAllVenues,
	getApprovalsForEquipmentReservation,
	getCancellationRates,
	getEquipmentCategoryByPublicId,
	getEquipmentReservationById,
	getEquipmentReservationsByEventId,
	getEventById,
	getEventsOverview,
	getEventTypesSummary,
	getNotifications,
	getOwnEquipmentReservations,
	getPeakReservationHours,
	getPendingEquipmentOwnerReservations,
	getRecentActivityApi,
	getTimelineEventsByDateRange,
	getTopEquipment,
	// Dashboard API imports
	getTopVenues,
	getUnreadNotificationCount,
	getUpcomingApprovedEventsApi,
	getUpcomingApprovedEventsCountNextDaysApi,
	getUserActivity,
	getUserReservationActivity,
	markAllNotificationsRead,
	markNotificationsRead,
	rejectEquipmentReservation,
	searchEvents,
	updateEquipmentCategory,
} from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import type {
	Event as AppEvent, // Alias Event to AppEvent
	CancellationRateDTO,
	CreateEquipmentReservationInput, // Added import
	DepartmentDTO, // Added import
	Equipment, // Added import
	EquipmentActionInput, // Add this import
	EquipmentApprovalDTO,
	EquipmentCategoryDTO, // Import EquipmentCategoryDTO
	EquipmentReservationDTO,
	EventCountDTO,
	EventDTO,
	EventPersonnelDTO,
	EventTypeStatusDistributionDTO, // For event types chart with status breakdown
	PeakHourDTO,
	RecentActivityItemDTO,
	TopEquipmentDTO,
	// Dashboard DTO imports
	TopVenueDTO,
	UserActivityDTO,
	UserDTO,
	UserReservationActivityDTO,
	UserRole,
} from "@/lib/types"; // Import UserRole and Event (aliased)

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
	listsRelated: () => [...eventsQueryKeys.all, "list", "related"] as const,
	list: (filters: string) => [...eventsQueryKeys.lists(), { filters }] as const,
	details: () => [...eventsQueryKeys.all, "detail"] as const,
	detail: (id: number | string) => [...eventsQueryKeys.details(), id] as const,
	approvals: (id: number | string) =>
		[...eventsQueryKeys.detail(id), "approvals"] as const,
	pending: () => [...eventsQueryKeys.all, "pending"] as const,
	pendingVenueOwner: () =>
		[...eventsQueryKeys.pending(), "venueOwner"] as const,
	pendingDeptHead: () => [...eventsQueryKeys.pending(), "deptHead"] as const,
	requiringApproval: () =>
		[...eventsQueryKeys.all, "requiringApproval"] as const,
	own: () => [...eventsQueryKeys.all, "own"] as const,
	approved: () => [...eventsQueryKeys.all, "approved"] as const,
	approvedByVenue: (venueId: string) =>
		[...eventsQueryKeys.approved(), "byVenue", venueId] as const,
	ongoingAndApprovedByVenue: (venueId: string) =>
		[...eventsQueryKeys.all, "ongoingAndApprovedByVenue", venueId] as const,
};

export const eventByIdQueryOptions = (eventId: number | string) =>
	queryOptions<EventDTO>({
		// Specify return type
		queryKey: eventsQueryKeys.detail(eventId), // Use the new key structure
		queryFn: () => getEventById(String(eventId)), // Ensure ID is string if needed by API
		staleTime: 1000 * 60 * 5,
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

export const useBulkDeleteDepartmentsMutation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: bulkDeleteDepartments,
		onSuccess: (_data) => {
			// data here will be the array of strings (messages) from the backend
			// Invalidate the departments query to refetch the list
			queryClient.invalidateQueries({ queryKey: ["departments"] });
			// Optionally, you can show a success notification with messages from `data`
			// For example, using a toast library:
			// data.forEach(message => toast.success(message));
			// If some deletions failed, they might be in `data` too, or handle errors in onError
		},
		onError: (_error) => {
			// Handle any errors from the API call
			// For example, show an error notification
			// toast.error(error.message || "Failed to delete departments.");
			console.error("Bulk delete departments error:", _error);
		},
	});
};

export const useBulkDeactivateUsersAsAdminMutation = (
	options?: Omit<
		UseMutationOptions<
			string[],
			Error,
			string[],
			{ previousUsers?: UserDTO[] }
		>,
		"mutationFn"
	>,
) => {
	const queryClient = useQueryClient();
	return useMutation<string[], Error, string[], { previousUsers?: UserDTO[] }>({
		mutationFn: bulkDeactivateUsersAsAdmin,
		onSettled: (data, error, variables, context) => {
			// Always invalidate users query on settlement
			queryClient.invalidateQueries({
				queryKey: usersQueryOptions.queryKey,
			});
			// Call component's onSettled if provided
			options?.onSettled?.(data, error, variables, context);
		},
		// Spread all other options from the component, including onSuccess, onError, onMutate
		...options,
	});
};

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

export const useCreateEquipmentReservationMutation = () => {
	const queryClient = useQueryClient();

	return useMutation<
		EquipmentReservationDTO[], // Expected response from API
		Error, // Error type
		CreateEquipmentReservationInput[], // Variables type
		// Context type for onMutate, onError, onSettled
		{
			previousLists?: EquipmentReservationDTO[];
			previousOwn?: EquipmentReservationDTO[];
			previousEventApprovals?: EventDTO[];
		}
	>({
		mutationFn: createEquipmentReservation,
		onMutate: async (newReservationsInput) => {
			// Get the event ID from the first reservation (assuming all reservations are for the same event)
			const eventId = newReservationsInput[0]?.event?.publicId;
			if (!eventId) {
				throw new Error("Event ID is required for equipment reservation");
			}

			// 1. Cancel ongoing queries to prevent them from overwriting our optimistic update
			await queryClient.cancelQueries({
				queryKey: equipmentReservationKeys.lists(),
			});
			await queryClient.cancelQueries({
				queryKey: equipmentReservationKeys.own(),
			});
			await queryClient.cancelQueries({
				queryKey: eventsQueryKeys.approvals(eventId),
			});

			// 2. Snapshot the previous values
			const previousLists = queryClient.getQueryData<EquipmentReservationDTO[]>(
				equipmentReservationKeys.lists(),
			);
			const previousOwn = queryClient.getQueryData<EquipmentReservationDTO[]>(
				equipmentReservationKeys.own(),
			);
			const previousEventApprovals = queryClient.getQueryData<EventDTO[]>(
				eventsQueryKeys.approvals(eventId),
			);

			// 3. Optimistically update to the new value
			const currentUser = queryClient.getQueryData<UserDTO>(
				userQueryOptions.queryKey,
			);

			const optimisticReservations: EquipmentReservationDTO[] =
				newReservationsInput.map((input, index) => {
					const tempId = `temp-${Date.now()}-${index}`;
					return {
						publicId: tempId,
						event: {
							publicId: input.event.publicId,
							eventName: "Processing...", // Placeholder, consider fetching/passing more data
							startTime: input.startTime,
							endTime: input.endTime,
							// Ensure this matches EventDTO structure, even if partial
						} as EventDTO,
						equipment: {
							publicId: input.equipment.publicId,
							name: "Processing...", // Placeholder
							// Ensure this matches Equipment structure, even if partial
						} as Equipment,
						department: {
							publicId: input.department.publicId,
							name: currentUser?.department?.name || "Processing...",
							// Ensure this matches DepartmentDTO, even if partial
						} as DepartmentDTO,
						requestingUser: currentUser || ({} as UserDTO), // Provide a fallback empty object if currentUser is null
						quantity: input.quantity,
						startTime: input.startTime,
						endTime: input.endTime,
						status: "PENDING_OPTIMISTIC", // Custom status for optimistic items
						approvals: [],
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					};
				});

			// Update the cache for lists
			if (previousLists) {
				queryClient.setQueryData<EquipmentReservationDTO[]>(
					equipmentReservationKeys.lists(),
					[...optimisticReservations, ...previousLists],
				);
			} else {
				queryClient.setQueryData<EquipmentReservationDTO[]>(
					equipmentReservationKeys.lists(),
					optimisticReservations,
				);
			}

			// Update the cache for 'own' reservations list
			if (previousOwn) {
				queryClient.setQueryData<EquipmentReservationDTO[]>(
					equipmentReservationKeys.own(),
					[...optimisticReservations, ...previousOwn],
				);
			} else {
				queryClient.setQueryData<EquipmentReservationDTO[]>(
					equipmentReservationKeys.own(),
					optimisticReservations,
				);
			}

			// Return a context object with all snapshotted values
			return { previousLists, previousOwn, previousEventApprovals };
		},
		onError: (err, _newReservations, context) => {
			if (context?.previousLists) {
				queryClient.setQueryData<EquipmentReservationDTO[]>(
					equipmentReservationKeys.lists(),
					context.previousLists,
				);
			}
			if (context?.previousOwn) {
				queryClient.setQueryData<EquipmentReservationDTO[]>(
					equipmentReservationKeys.own(),
					context.previousOwn,
				);
			}
			if (context?.previousEventApprovals) {
				const eventId = _newReservations[0]?.event?.publicId;
				if (eventId) {
					queryClient.setQueryData<EventDTO[]>(
						eventsQueryKeys.approvals(eventId),
						context.previousEventApprovals,
					);
				}
			}
			console.error(
				"Error creating equipment reservations (optimistic update failed):",
				err,
			);
		},
		onSuccess: (newlyCreatedReservations, _variables, _context) => {
			// Get the event ID from the first reservation
			const eventId = newlyCreatedReservations[0]?.event?.publicId;
			if (eventId) {
				// Invalidate event approvals
				queryClient.invalidateQueries({
					queryKey: eventsQueryKeys.approvals(eventId),
				});
				// Also invalidate the event details since approvals are part of the event
				queryClient.invalidateQueries({
					queryKey: eventsQueryKeys.detail(eventId),
				});
			}

			// Invalidate equipment reservation queries
			queryClient.invalidateQueries({
				queryKey: equipmentReservationKeys.lists(),
			});
			queryClient.invalidateQueries({
				queryKey: equipmentReservationKeys.own(),
			});

			// Update details cache with server-confirmed data
			for (const reservation of newlyCreatedReservations) {
				queryClient.setQueryData(
					equipmentReservationKeys.detail(reservation.publicId),
					reservation,
				);
			}
		},
		onSettled: (_data, _error, variables, _context) => {
			const eventId = variables[0]?.event?.publicId;
			if (eventId) {
				// Final invalidation to ensure all related queries are fresh
				queryClient.invalidateQueries({
					queryKey: eventsQueryKeys.approvals(eventId),
				});
				queryClient.invalidateQueries({
					queryKey: eventsQueryKeys.detail(eventId),
				});
			}
			queryClient.invalidateQueries({
				queryKey: equipmentReservationKeys.all,
			});
		},
	});
};

export const useApproveEquipmentReservationMutation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: approveEquipmentReservation,
		onMutate: async (variables: EquipmentActionInput) => {
			// Get the event ID from the reservation
			const reservation = await getEquipmentReservationById(
				variables.reservationPublicId,
			);
			const eventId = reservation?.event?.publicId;

			// Cancel any outgoing refetches
			await queryClient.cancelQueries({
				queryKey: equipmentReservationKeys.allEquipmentOwner(),
			});
			await queryClient.cancelQueries({
				queryKey: equipmentReservationKeys.detail(
					variables.reservationPublicId,
				),
			});
			if (eventId) {
				await queryClient.cancelQueries({
					queryKey: eventsQueryKeys.approvals(eventId),
				});
				await queryClient.cancelQueries({
					queryKey: eventsQueryKeys.detail(eventId),
				});
			}

			// Snapshot the previous values
			const previousReservations = queryClient.getQueryData<
				EquipmentReservationDTO[]
			>(equipmentReservationKeys.allEquipmentOwner());
			const previousEventApprovals = eventId
				? queryClient.getQueryData<EventDTO[]>(
						eventsQueryKeys.approvals(eventId),
					)
				: undefined;

			// Rest of the optimistic update code remains the same...
			const currentUser = queryClient.getQueryData<UserDTO>(
				userQueryOptions.queryKey,
			);

			if (previousReservations && currentUser) {
				queryClient.setQueryData<EquipmentReservationDTO[]>(
					equipmentReservationKeys.allEquipmentOwner(),
					(oldData = []) =>
						oldData.map((reservation) => {
							if (reservation.publicId === variables.reservationPublicId) {
								const newApproval: EquipmentApprovalDTO = {
									publicId: `optimistic-approval-${Date.now()}`,
									status: "APPROVED",
									remarks:
										variables.remarks === undefined ? null : variables.remarks,
									signedByUser: currentUser,
									dateSigned: new Date().toISOString(),
									equipmentReservationPublicId: reservation.publicId,
									userRole: currentUser.roles[0],
								};
								return {
									...reservation,
									status: "APPROVED",
									approvals: [...(reservation.approvals || []), newApproval],
								};
							}
							return reservation;
						}),
				);
			}
			return { previousReservations, previousEventApprovals, eventId };
		},
		onError: (_err, _variables, context) => {
			if (context?.previousReservations) {
				queryClient.setQueryData(
					equipmentReservationKeys.allEquipmentOwner(),
					context.previousReservations,
				);
			}
			if (context?.previousEventApprovals && context?.eventId) {
				queryClient.setQueryData(
					eventsQueryKeys.approvals(context.eventId),
					context.previousEventApprovals,
				);
			}
		},
		onSuccess: (_data, variables, context) => {
			// Invalidate and refetch
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

			// Invalidate event-related queries if we have an event ID
			if (context?.eventId) {
				queryClient.invalidateQueries({
					queryKey: eventsQueryKeys.approvals(context.eventId),
				});
				queryClient.invalidateQueries({
					queryKey: eventsQueryKeys.detail(context.eventId),
				});
			}
		},
	});
};

export const useRejectEquipmentReservationMutation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: rejectEquipmentReservation,
		onMutate: async (variables: EquipmentActionInput) => {
			// Get the event ID from the reservation
			const reservation = await getEquipmentReservationById(
				variables.reservationPublicId,
			);
			const eventId = reservation?.event?.publicId;

			await queryClient.cancelQueries({
				queryKey: equipmentReservationKeys.allEquipmentOwner(),
			});
			await queryClient.cancelQueries({
				queryKey: equipmentReservationKeys.detail(
					variables.reservationPublicId,
				),
			});
			if (eventId) {
				await queryClient.cancelQueries({
					queryKey: eventsQueryKeys.approvals(eventId),
				});
				await queryClient.cancelQueries({
					queryKey: eventsQueryKeys.detail(eventId),
				});
			}

			const previousReservations = queryClient.getQueryData<
				EquipmentReservationDTO[]
			>(equipmentReservationKeys.allEquipmentOwner());
			const previousEventApprovals = eventId
				? queryClient.getQueryData<EventDTO[]>(
						eventsQueryKeys.approvals(eventId),
					)
				: undefined;

			const currentUser = queryClient.getQueryData<UserDTO>(
				userQueryOptions.queryKey,
			);

			if (previousReservations && currentUser) {
				queryClient.setQueryData<EquipmentReservationDTO[]>(
					equipmentReservationKeys.allEquipmentOwner(),
					(oldData = []) =>
						oldData.map((reservation) => {
							if (reservation.publicId === variables.reservationPublicId) {
								const newApproval: EquipmentApprovalDTO = {
									publicId: `optimistic-rejection-${Date.now()}`,
									status: "REJECTED",
									remarks:
										variables.remarks === undefined ? null : variables.remarks,
									signedByUser: currentUser,
									dateSigned: new Date().toISOString(),
									equipmentReservationPublicId: reservation.publicId,
									userRole: currentUser.roles[0],
								};
								return {
									...reservation,
									status: "REJECTED",
									approvals: [...(reservation.approvals || []), newApproval],
								};
							}
							return reservation;
						}),
				);
			}
			return { previousReservations, previousEventApprovals, eventId };
		},
		onError: (_err, _variables, context) => {
			if (context?.previousReservations) {
				queryClient.setQueryData(
					equipmentReservationKeys.allEquipmentOwner(),
					context.previousReservations,
				);
			}
			if (context?.previousEventApprovals && context?.eventId) {
				queryClient.setQueryData(
					eventsQueryKeys.approvals(context.eventId),
					context.previousEventApprovals,
				);
			}
		},
		onSuccess: (_data, variables, context) => {
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

			// Invalidate event-related queries if we have an event ID
			if (context?.eventId) {
				queryClient.invalidateQueries({
					queryKey: eventsQueryKeys.approvals(context.eventId),
				});
				queryClient.invalidateQueries({
					queryKey: eventsQueryKeys.detail(context.eventId),
				});
			}
		},
	});
};

export const useCancelEquipmentReservationMutation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (variables: { reservationId: string; eventId: string }) =>
			cancelEquipmentReservation(variables.reservationId),
		onMutate: async (variables: { reservationId: string; eventId: string }) => {
			const { reservationId, eventId } = variables;

			// Cancel any outgoing refetches
			await queryClient.cancelQueries({
				queryKey: equipmentReservationKeys.byEvent(eventId),
			});
			await queryClient.cancelQueries({
				queryKey: eventsQueryKeys.approvals(eventId),
			});
			await queryClient.cancelQueries({
				queryKey: eventsQueryKeys.detail(eventId),
			});

			// Snapshot the previous values
			const previousReservations = queryClient.getQueryData<
				EquipmentReservationDTO[]
			>(equipmentReservationKeys.byEvent(eventId));
			const previousEventApprovals = queryClient.getQueryData<EventDTO[]>(
				eventsQueryKeys.approvals(eventId),
			);

			// Optimistically update to the new value
			if (previousReservations) {
				queryClient.setQueryData<EquipmentReservationDTO[]>(
					equipmentReservationKeys.byEvent(eventId),
					(oldData = []) =>
						oldData.map((reservation) => {
							if (reservation.publicId === reservationId) {
								return {
									...reservation,
									status: "CANCELED",
								};
							}
							return reservation;
						}),
				);
			}
			return { previousReservations, previousEventApprovals, eventId };
		},
		onError: (_err, _variables, context) => {
			if (context?.previousReservations && context?.eventId) {
				queryClient.setQueryData(
					equipmentReservationKeys.byEvent(context.eventId),
					context.previousReservations,
				);
			}
			if (context?.previousEventApprovals && context?.eventId) {
				queryClient.setQueryData(
					eventsQueryKeys.approvals(context.eventId),
					context.previousEventApprovals,
				);
			}
		},
		onSuccess: (_data, variables) => {
			const { reservationId, eventId } = variables;
			// Invalidate and refetch
			queryClient.invalidateQueries({
				queryKey: equipmentReservationKeys.byEvent(eventId),
			});
			queryClient.invalidateQueries({
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

			// Invalidate event-related queries
			queryClient.invalidateQueries({
				queryKey: eventsQueryKeys.approvals(eventId),
			});
			queryClient.invalidateQueries({
				queryKey: eventsQueryKeys.detail(eventId),
			});
		},
	});
};

export const useDeleteEquipmentReservationMutation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (reservationId: string) => {
			// Get the reservation first to get the event ID
			const reservation = await getEquipmentReservationById(reservationId);
			const eventId = reservation?.event?.publicId;
			await deleteEquipmentReservation(reservationId);
			return { eventId };
		},
		onSuccess: (_data, reservationId) => {
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

			// If we have an event ID, invalidate event-related queries
			if (_data.eventId) {
				queryClient.invalidateQueries({
					queryKey: eventsQueryKeys.approvals(_data.eventId),
				});
				queryClient.invalidateQueries({
					queryKey: eventsQueryKeys.detail(_data.eventId),
				});
			}
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
			...eventsQueryKeys.listsRelated(),
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
	userReservationActivity: (
		startDate?: string,
		endDate?: string,
		userFilter?: string,
		limit?: number,
	) =>
		[
			...dashboardQueryKeys.all,
			"userReservationActivity",
			{ startDate, endDate, userFilter, limit },
		] as const,
};

export const userReservationActivityQueryOptions = (
	startDate?: string,
	endDate?: string,
	userFilter?: string,
	limit = 10,
) =>
	queryOptions<UserReservationActivityDTO[]>({
		queryKey: dashboardQueryKeys.userReservationActivity(
			startDate,
			endDate,
			userFilter,
			limit,
		),
		queryFn: () => {
			if (!startDate || !endDate) return Promise.resolve([]); // Or handle error appropriately
			return getUserReservationActivity(startDate, endDate, userFilter, limit);
		},
		enabled: !!startDate && !!endDate, // Only enable if dates are provided
		staleTime: 1000 * 60 * 5, // 5 minutes
	});

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
			return getTopEquipment(startDate, endDate, equipmentTypeFilter, limit);
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
		queryKey: [...dashboardQueryKeys.all, "upcomingApprovedEvents", { limit }],
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
	queryOptions<EventTypeStatusDistributionDTO[]>({
		queryKey: dashboardQueryKeys.eventTypesSummary(startDate, endDate, limit),
		queryFn: () => {
			if (!startDate || !endDate) return Promise.resolve([]);
			return getEventTypesSummary(startDate, endDate, limit);
		},
		enabled: !!startDate && !!endDate,
		staleTime: 1000 * 60 * 5, // 5 minutes
	});

// --- Equipment Category Query Keys and Options ---

export const equipmentCategoryKeys = {
	all: ["equipmentCategories"] as const,
	lists: () => [...equipmentCategoryKeys.all, "list"] as const,
	list: (filters: string) =>
		[...equipmentCategoryKeys.lists(), { filters }] as const,
	details: () => [...equipmentCategoryKeys.all, "detail"] as const,
	detail: (id: string) => [...equipmentCategoryKeys.details(), id] as const,
};

export const allEquipmentCategoriesQueryOptions = queryOptions<
	EquipmentCategoryDTO[]
>({
	queryKey: equipmentCategoryKeys.lists(),
	queryFn: getAllEquipmentCategories,
	staleTime: 1000 * 60 * 5, // 5 minutes
});

export const equipmentCategoryByIdQueryOptions = (publicId: string) =>
	queryOptions<EquipmentCategoryDTO>({
		queryKey: equipmentCategoryKeys.detail(publicId),
		queryFn: () => getEquipmentCategoryByPublicId(publicId),
		staleTime: 1000 * 60 * 5, // 5 minutes
	});

// --- Equipment Category Mutations ---

export const useCreateEquipmentCategoryMutation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: createEquipmentCategory,
		onSuccess: (newCategory) => {
			queryClient.invalidateQueries({
				queryKey: equipmentCategoryKeys.lists(),
			});
			queryClient.setQueryData(
				equipmentCategoryKeys.detail(newCategory.publicId),
				newCategory,
			);
		},
	});
};

export const useUpdateEquipmentCategoryMutation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (variables: {
			publicId: string;
			data: Partial<
				Omit<EquipmentCategoryDTO, "publicId" | "createdAt" | "updatedAt">
			>;
		}) => updateEquipmentCategory(variables.publicId, variables.data),
		onSuccess: (updatedCategory, variables) => {
			queryClient.invalidateQueries({
				queryKey: equipmentCategoryKeys.lists(),
			});
			queryClient.setQueryData(
				equipmentCategoryKeys.detail(variables.publicId),
				updatedCategory,
			);
			// Optionally invalidate other related queries if needed
		},
	});
};

export const useDeleteEquipmentCategoryMutation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: deleteEquipmentCategory,
		onSuccess: (_message, publicId) => {
			queryClient.removeQueries({
				queryKey: equipmentCategoryKeys.detail(publicId),
			});
			queryClient.invalidateQueries({
				queryKey: equipmentCategoryKeys.lists(),
			});
			// Optionally invalidate other related queries if needed
		},
	});
};

// --- Personnel Query Keys and Options ---

export const personnelQueryKeys = {
	all: ["personnel"] as const,
	byEvent: (eventId: string) =>
		[...personnelQueryKeys.all, "event", eventId] as const,
};

// --- Personnel Mutations ---

export const useAddEventPersonnelMutation = () => {
	const queryClient = useQueryClient();
	return useMutation<
		EventPersonnelDTO[],
		Error,
		{ eventId: string; personnelData: Omit<EventPersonnelDTO, "publicId"> },
		{ previousPersonnel?: EventPersonnelDTO[] }
	>({
		mutationFn: ({ eventId, personnelData }) =>
			addEventPersonnel(eventId, personnelData),
		onMutate: async ({ eventId, personnelData }) => {
			await queryClient.cancelQueries({
				queryKey: personnelQueryKeys.byEvent(eventId),
			});
			await queryClient.cancelQueries({
				queryKey: eventsQueryKeys.detail(eventId),
			});
			await queryClient.cancelQueries({
				queryKey: eventsQueryKeys.listsRelated(),
			});

			const previousPersonnel = queryClient.getQueryData<EventPersonnelDTO[]>(
				personnelQueryKeys.byEvent(eventId),
			);

			const optimisticPersonnel: EventPersonnelDTO = {
				publicId: `temp-${Date.now()}`,
				...personnelData,
			};

			queryClient.setQueryData<EventPersonnelDTO[]>(
				personnelQueryKeys.byEvent(eventId),
				(old = []) => [...old, optimisticPersonnel],
			);

			// Optimistically update events list queries
			queryClient.setQueriesData<EventDTO[]>(
				{ queryKey: eventsQueryKeys.listsRelated() },
				(old) => {
					if (!old) return old;
					return old.map((event) =>
						event.publicId === eventId
							? {
									...event,
									assignedPersonnel: [
										...(event.assignedPersonnel || []),
										optimisticPersonnel,
									],
								}
							: event,
					);
				},
			);

			return { previousPersonnel };
		},
		onError: (err, variables, context) => {
			if (context?.previousPersonnel) {
				queryClient.setQueryData(
					personnelQueryKeys.byEvent(variables.eventId),
					context.previousPersonnel,
				);
			}
			// Invalidate events list queries to revert optimistic updates
			queryClient.invalidateQueries({
				queryKey: eventsQueryKeys.listsRelated(),
			});
			console.error(
				"Error adding event personnel (optimistic update failed):",
				err,
			);
		},
		onSuccess: (newPersonnelList, variables) => {
			queryClient.setQueryData(
				personnelQueryKeys.byEvent(variables.eventId),
				newPersonnelList,
			);
			queryClient.invalidateQueries({
				queryKey: eventsQueryKeys.detail(variables.eventId),
			});
			// Invalidate all events list queries to update personnel in events
			queryClient.invalidateQueries({
				queryKey: eventsQueryKeys.listsRelated(),
			});
		},
	});
};

export const useDeleteEventPersonnelMutation = () => {
	const queryClient = useQueryClient();
	return useMutation<
		string,
		Error,
		{ eventId: string; personnelPublicId: string },
		{ previousPersonnel?: EventPersonnelDTO[] }
	>({
		mutationFn: ({ eventId, personnelPublicId }) =>
			deleteEventPersonnel(eventId, personnelPublicId),
		onMutate: async ({ eventId, personnelPublicId }) => {
			await queryClient.cancelQueries({
				queryKey: personnelQueryKeys.byEvent(eventId),
			});
			await queryClient.cancelQueries({
				queryKey: eventsQueryKeys.detail(eventId),
			});
			await queryClient.cancelQueries({
				queryKey: eventsQueryKeys.listsRelated(),
			});

			const previousPersonnel = queryClient.getQueryData<EventPersonnelDTO[]>(
				personnelQueryKeys.byEvent(eventId),
			);

			queryClient.setQueryData<EventPersonnelDTO[]>(
				personnelQueryKeys.byEvent(eventId),
				(old = []) => old.filter((p) => p.publicId !== personnelPublicId),
			);

			// Optimistically update events list queries
			queryClient.setQueriesData<EventDTO[]>(
				{ queryKey: eventsQueryKeys.listsRelated() },
				(old) => {
					if (!old) return old;
					return old.map((event) =>
						event.publicId === eventId
							? {
									...event,
									assignedPersonnel: (event.assignedPersonnel || []).filter(
										(p) => p.publicId !== personnelPublicId,
									),
								}
							: event,
					);
				},
			);

			return { previousPersonnel };
		},
		onError: (err, variables, context) => {
			if (context?.previousPersonnel) {
				queryClient.setQueryData(
					personnelQueryKeys.byEvent(variables.eventId),
					context.previousPersonnel,
				);
			}
			// Invalidate events list queries to revert optimistic updates
			queryClient.invalidateQueries({
				queryKey: eventsQueryKeys.listsRelated(),
			});
			console.error(
				"Error removing event personnel (optimistic update failed):",
				err,
			);
		},
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({
				queryKey: personnelQueryKeys.byEvent(variables.eventId),
			});
			queryClient.invalidateQueries({
				queryKey: eventsQueryKeys.detail(variables.eventId),
			});
			// Invalidate all events list queries to update personnel in events
			queryClient.invalidateQueries({
				queryKey: eventsQueryKeys.listsRelated(),
			});
		},
	});
};
