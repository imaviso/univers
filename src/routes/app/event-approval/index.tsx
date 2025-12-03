import type { QueryFunction, UseQueryOptions } from "@tanstack/react-query";
import {
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import {
	createFileRoute,
	redirect,
	useNavigate,
	useRouteContext,
} from "@tanstack/react-router";
import {
	type ColumnDef,
	type ColumnMeta,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getSortedRowModel,
	type RowSelectionState,
	type SortingState,
	useReactTable,
	type VisibilityState,
} from "@tanstack/react-table";
import { format } from "date-fns";
import {
	ArrowUpDown,
	Building,
	Calendar,
	Check,
	CheckCircle2,
	ChevronDown,
	Clock,
	Eye,
	FileText,
	HelpCircle,
	MoreHorizontal,
	Tag,
	UserCheck,
	UserCircle,
	X,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { DataTableFilter } from "@/components/data-table-filter";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { approveEvent, rejectEvent } from "@/lib/api";
import { defineMeta, filterFn } from "@/lib/filters";
import { allNavigation } from "@/lib/navigation";
import { eventsQueryKeys, searchEventsQueryOptions } from "@/lib/query";
import type { EventApprovalDTO, EventDTO, UserRole } from "@/lib/types";
import { getApproverStatusBadge } from "@/lib/utils";

// Define approval types
type ApprovalType = "VENUE_OWNER" | "DEPT_HEAD" | "ADMIN";

// ApprovalEvent will be simplified to EventDTO directly
type ApprovalEvent = EventDTO;

interface ApprovalConfig {
	type: ApprovalType;
	title: string;
	description: string;
	getQueryOptions: () => UseQueryOptions<
		ApprovalEvent[],
		Error,
		ApprovalEvent[],
		readonly unknown[]
	>;
	isApprover: (
		event: ApprovalEvent,
		currentUserId: string | undefined,
	) => boolean;
	getApprovalStatus: (
		event: ApprovalEvent,
		currentUserId: string | undefined,
	) => EventApprovalDTO | undefined;
}

const approvalConfigs: Record<ApprovalType, ApprovalConfig> = {
	VENUE_OWNER: {
		type: "VENUE_OWNER",
		title: "Venue Event Approval",
		description: "Approve or reject events for your venues",
		getQueryOptions: () => searchEventsQueryOptions("related", undefined),
		isApprover: (event, currentUserId) =>
			!!currentUserId &&
			event.eventVenue?.venueOwner?.publicId === currentUserId,
		getApprovalStatus: (event, currentUserId) => {
			if (!currentUserId || !event.approvals) return undefined;
			return event.approvals.find(
				(approval) =>
					approval.signedByUser.publicId === currentUserId &&
					approval.signedByUser.roles.includes("VENUE_OWNER"),
			);
		},
	},
	DEPT_HEAD: {
		type: "DEPT_HEAD",
		title: "Department Event Approval",
		description: "Approve or reject events for your department",
		getQueryOptions: () => searchEventsQueryOptions("related", undefined),
		isApprover: (event, currentUserId) =>
			!!currentUserId && event.department?.deptHead?.publicId === currentUserId,
		getApprovalStatus: (event, currentUserId) => {
			if (!currentUserId || !event.approvals) return undefined;
			return event.approvals.find(
				(approval) =>
					approval.signedByUser.publicId === currentUserId &&
					approval.signedByUser.roles.includes("DEPT_HEAD"),
			);
		},
	},
	ADMIN: {
		type: "ADMIN",
		title: "Event Approval",
		description: "Approve or reject events",
		getQueryOptions: () => searchEventsQueryOptions("related", undefined),
		isApprover: (_event: ApprovalEvent, _currentUserId?: string) => true,
		getApprovalStatus: (event, currentUserId) => {
			if (!currentUserId || !event.approvals) return undefined;
			return event.approvals.find(
				(approval) =>
					approval.signedByUser.publicId === currentUserId &&
					(approval.signedByUser.roles.includes("ADMIN") ||
						approval.signedByUser.roles.includes("SUPER_ADMIN")),
			);
		},
	},
};

// Custom hook for persistent state
function usePersistentState<T>(
	key: string,
	initialValue: T,
): [T, (value: T | ((prevState: T) => T)) => void] {
	const [state, setState] = useState<T>(() => {
		try {
			const storedValue = localStorage.getItem(key);
			if (storedValue) {
				return JSON.parse(storedValue);
			}
			return initialValue;
		} catch (error) {
			console.error("Error reading from localStorage for key", key, error);
			return initialValue;
		}
	});

	useEffect(() => {
		try {
			localStorage.setItem(key, JSON.stringify(state));
		} catch (error) {
			console.error("Error writing to localStorage for key", key, error);
		}
	}, [key, state]);

	return [state, setState];
}

export const Route = createFileRoute("/app/event-approval/")({
	component: EventApproval,
	beforeLoad: async ({ location, context }) => {
		const navigationItem = allNavigation.find(
			(item) => item.href === location.pathname,
		);
		const allowedRoles: string[] = navigationItem ? navigationItem.roles : [];
		if (!context.authState) {
			throw redirect({ to: "/login", replace: true });
		}
		const isAuthorized = allowedRoles.some((role) =>
			context.authState?.roles.includes(role as UserRole),
		);
		if (!isAuthorized) {
			throw redirect({
				to: "/app/dashboard",
				replace: true,
			});
		}

		// Determine approval type based on user roles
		const userRoles = context.authState.roles;
		let approvalType: ApprovalType | null = null;

		if (userRoles.includes("VENUE_OWNER")) {
			approvalType = "VENUE_OWNER";
		} else if (userRoles.includes("DEPT_HEAD")) {
			approvalType = "DEPT_HEAD";
		} else if (
			userRoles.includes("ADMIN") ||
			userRoles.includes("SUPER_ADMIN")
		) {
			approvalType = "ADMIN";
		}

		if (!approvalType) {
			throw redirect({
				to: "/app/dashboard",
				replace: true,
			});
		}

		return { approvalType };
	},
	loader: async ({ context: { queryClient }, context: { approvalType } }) => {
		const config = approvalConfigs[approvalType];
		const queryOptions = config.getQueryOptions();
		await queryClient.ensureQueryData(queryOptions);
		return null;
	},
});

type SingleActionInfo = {
	eventId: string | null;
	type: "approve" | "reject" | null;
};

export function EventApproval() {
	const navigate = useNavigate();
	const context = useRouteContext({ from: "/app/event-approval/" });
	const currentUserId = context.authState?.publicId;
	const approvalType = context.approvalType as ApprovalType;
	const config = approvalConfigs[approvalType];
	const queryClient = useQueryClient();

	// Role-based label overrides for VPAA + ADMIN
	const userRoles = context.authState?.roles || [];
	const isVpaaAdmin = userRoles.includes("VPAA") && userRoles.includes("ADMIN");
	const isAccounting = userRoles.includes("ACCOUNTING");

	const approveActionLabel = isAccounting
		? "Paid"
		: isVpaaAdmin
			? "Recommend"
			: "Approve";
	const rejectActionLabel = isAccounting
		? "Unpaid"
		: isVpaaAdmin
			? "Not Recommended"
			: "Reject";
	const approveDialogTitle = isAccounting
		? "Mark as Paid"
		: isVpaaAdmin
			? "Recommend Event"
			: "Approve Event";
	const rejectDialogTitle = isAccounting
		? "Mark as Unpaid"
		: isVpaaAdmin
			? "Not Recommended"
			: "Reject Event";
	const approveBulkTitle = isAccounting
		? "Mark Selected Events as Paid"
		: isVpaaAdmin
			? "Recommend Selected Events"
			: "Approve Selected Events";
	const rejectBulkTitle = isAccounting
		? "Mark Selected Events as Unpaid"
		: isVpaaAdmin
			? "Not Recommend Selected Events"
			: "Reject Selected Events";
	const approveConfirmLabel = isAccounting
		? "Confirm Payment"
		: isVpaaAdmin
			? "Confirm Recommendation"
			: "Confirm Approval";
	const rejectConfirmLabel = isAccounting
		? "Confirm Unpaid"
		: isVpaaAdmin
			? "Confirm Not Recommendation"
			: "Confirm Rejection";
	const approvePendingLabel = isAccounting
		? "Processing..."
		: isVpaaAdmin
			? "Recommending..."
			: "Approving...";
	const rejectPendingLabel = isAccounting
		? "Processing..."
		: isVpaaAdmin
			? "Processing..."
			: "Rejecting...";

	const currentQueryOptions = config.getQueryOptions();
	const { data: fetchedEvents } = useSuspenseQuery({
		...currentQueryOptions,
		queryFn: currentQueryOptions.queryFn as QueryFunction<
			ApprovalEvent[],
			readonly unknown[]
		>,
	});

	const [searchQuery, setSearchQuery] = usePersistentState<string>(
		"venueApprovalSearchQuery_v2",
		"",
	);

	const [sorting, setSorting] = usePersistentState<SortingState>(
		"venueApprovalTableSorting_v2",
		[],
	);
	const [columnVisibility, setColumnVisibility] =
		usePersistentState<VisibilityState>(
			"venueApprovalTableColumnVisibility_v2",
			{
				createdAt: false,
				updatedAt: false,
				publicId: false,
			},
		);
	const [rowSelection, setRowSelection] = usePersistentState<RowSelectionState>(
		"venueApprovalTableRowSelection_v2",
		{},
	);

	const [singleActionInfo, setSingleActionInfo] = useState<SingleActionInfo>({
		eventId: null,
		type: null,
	});
	const [singleActionRemarks, setSingleActionRemarks] = useState("");

	const [isBulkApproveDialogOpen, setIsBulkApproveDialogOpen] = useState(false);
	const [bulkApproveRemarks, setBulkApproveRemarks] = useState("");
	const [isBulkRejectDialogOpen, setIsBulkRejectDialogOpen] = useState(false);
	const [bulkRejectionRemarks, setBulkRejectionRemarks] = useState("");

	const approveEventMutation = useMutation({
		mutationFn: approveEvent,
		onSuccess: (_message, variables: { eventId: string; remarks: string }) => {
			toast.success("Event approved successfully.");
			queryClient.invalidateQueries({
				queryKey: currentQueryOptions.queryKey,
			});
			queryClient.invalidateQueries({
				queryKey: eventsQueryKeys.detail(variables.eventId),
			});
			queryClient.invalidateQueries({
				queryKey: eventsQueryKeys.approvals(variables.eventId),
			});
			queryClient.invalidateQueries({
				queryKey: eventsQueryKeys.lists(),
			});
			queryClient.invalidateQueries({
				queryKey: eventsQueryKeys.approved(),
			});
			queryClient.invalidateQueries({
				queryKey: eventsQueryKeys.pending(),
			});
			queryClient.invalidateQueries({ queryKey: eventsQueryKeys.own() });
		},
		onError: () => {
			toast.error("Failed to approve event.");
		},
	});

	const rejectEventMutation = useMutation({
		mutationFn: rejectEvent,
		onSuccess: (_message, variables: { eventId: string; remarks: string }) => {
			toast.success("Event rejected successfully.");
			queryClient.invalidateQueries({
				queryKey: currentQueryOptions.queryKey,
			});
			queryClient.invalidateQueries({
				queryKey: eventsQueryKeys.detail(variables.eventId),
			});
			queryClient.invalidateQueries({
				queryKey: eventsQueryKeys.approvals(variables.eventId),
			});
			queryClient.invalidateQueries({
				queryKey: eventsQueryKeys.lists(),
			});
			queryClient.invalidateQueries({
				queryKey: eventsQueryKeys.approved(),
			});
			queryClient.invalidateQueries({
				queryKey: eventsQueryKeys.pending(),
			});
			queryClient.invalidateQueries({ queryKey: eventsQueryKeys.own() });
		},
		onError: () => {
			toast.error("Failed to reject event.");
		},
	});

	const eventsForUserRole = useMemo(() => {
		if (!fetchedEvents) return [];
		return fetchedEvents.filter((event: ApprovalEvent) =>
			config.isApprover(event, currentUserId),
		);
	}, [fetchedEvents, config, currentUserId]);

	const finalFilteredEvents = useMemo(() => {
		let filtered = eventsForUserRole;

		// Apply search filter
		if (searchQuery && filtered) {
			const query = searchQuery.toLowerCase();
			filtered = filtered.filter(
				(event: ApprovalEvent) =>
					event.eventName.toLowerCase().includes(query) ||
					event.eventType.toLowerCase().includes(query) ||
					event.eventVenue?.name.toLowerCase().includes(query) ||
					event.department?.name.toLowerCase().includes(query),
			);
		}

		return filtered || [];
	}, [eventsForUserRole, searchQuery]);

	const handleViewDetails = React.useCallback(
		(eventId: string) => {
			navigate({ to: `/app/events/${eventId}` });
		},
		[navigate],
	);
	const handleNavigateToVenue = React.useCallback(
		(venueId: string | undefined) => {
			if (venueId === undefined) return;
			navigate({ from: Route.fullPath, to: `/app/venues/${venueId}` });
		},
		[navigate],
	);

	const openSingleApproveDialog = React.useCallback((event: ApprovalEvent) => {
		if (!event.publicId) {
			toast.error("Event ID is missing for this event.");
			return;
		}
		setSingleActionInfo({
			eventId: event.publicId,
			type: "approve",
		});
		setSingleActionRemarks("");
	}, []);

	const openSingleRejectDialog = React.useCallback((event: ApprovalEvent) => {
		if (!event.publicId) {
			toast.error("Event ID is missing for this event.");
			return;
		}
		setSingleActionInfo({
			eventId: event.publicId,
			type: "reject",
		});
		setSingleActionRemarks("");
	}, []);

	const closeSingleActionDialog = () => {
		setSingleActionInfo({ eventId: null, type: null });
		setSingleActionRemarks("");
	};

	const confirmSingleApprove = () => {
		if (
			singleActionInfo.type !== "approve" ||
			singleActionInfo.eventId === null
		) {
			toast.error("Cannot approve: Event ID is missing.");
			return;
		}
		const payload = {
			eventId: singleActionInfo.eventId,
			remarks: singleActionRemarks,
		};
		approveEventMutation.mutate(payload, {
			onSuccess: () => {
				toast.success("Event approved.");
				setRowSelection({});
				closeSingleActionDialog();
			},
			onError: () => {
				toast.error("Failed to approve event.");
			},
		});
	};

	const confirmSingleReject = () => {
		if (
			singleActionInfo.type !== "reject" ||
			singleActionInfo.eventId === null
		) {
			toast.error("Cannot reject: Event ID is missing.");
			return;
		}
		if (!singleActionRemarks.trim()) {
			toast.warning("Please provide a reason for rejection.");
			return;
		}
		const payload = {
			eventId: singleActionInfo.eventId,
			remarks: singleActionRemarks,
		};
		rejectEventMutation.mutate(payload, {
			onSuccess: () => {
				toast.success("Event rejected.");
				setRowSelection({});
				closeSingleActionDialog();
			},
			onError: () => {
				toast.error("Failed to reject event.");
			},
		});
	};

	const confirmBulkApprove = () => {
		const selectedRows = table.getFilteredSelectedRowModel().rows;
		const eligibleEventPayloads = selectedRows
			.filter((row) => {
				const event = row.original as ApprovalEvent;
				const isOverallEventPending = event.status === "PENDING";
				const isUserTheCorrectApproverType = config.isApprover(
					event,
					currentUserId,
				);
				return (
					isOverallEventPending &&
					isUserTheCorrectApproverType &&
					event.publicId
				);
			})
			.map((row) => {
				const eventId = row.original.publicId;
				if (!eventId) return null;
				return {
					eventId: eventId,
					remarks: bulkApproveRemarks,
				};
			})
			.filter(
				(payload): payload is { eventId: string; remarks: string } =>
					payload !== null,
			);

		if (eligibleEventPayloads.length === 0) {
			toast.info("No eligible events selected for event approval.");
			setIsBulkApproveDialogOpen(false);
			setBulkApproveRemarks("");
			return;
		}

		const promises = eligibleEventPayloads.map((payload) =>
			approveEventMutation.mutateAsync(payload),
		);

		toast.promise(Promise.all(promises), {
			loading: `${isAccounting ? "Marking" : isVpaaAdmin ? "Recommending" : "Approving"} ${
				eligibleEventPayloads.length
			} event(s)...`,
			success: (_messages: string[]) => {
				setRowSelection({});
				setIsBulkApproveDialogOpen(false);
				setBulkApproveRemarks("");
				return `${eligibleEventPayloads.length} event(s) ${
					isAccounting
						? "marked as paid"
						: isVpaaAdmin
							? "recommended"
							: "approved"
				}.`;
			},
			error: (err: Error) => {
				return `Failed to ${isAccounting ? "mark as paid" : isVpaaAdmin ? "recommend" : "approve"} some events: ${err.message}`;
			},
		});
	};

	const confirmBulkReject = () => {
		const selectedRows = table.getFilteredSelectedRowModel().rows;

		if (!bulkRejectionRemarks.trim()) {
			toast.warning("Please provide a reason for rejection.");
			return;
		}

		const eligibleEventPayloads = selectedRows
			.filter((row) => {
				const event = row.original as ApprovalEvent;
				const isOverallEventPending = event.status === "PENDING";
				const isUserTheCorrectApproverType = config.isApprover(
					event,
					currentUserId,
				);
				return (
					isOverallEventPending &&
					isUserTheCorrectApproverType &&
					event.publicId
				);
			})
			.map((row) => {
				const eventId = row.original.publicId;
				if (!eventId) return null;
				return {
					eventId: eventId,
					remarks: bulkRejectionRemarks,
				};
			})
			.filter(
				(payload): payload is { eventId: string; remarks: string } =>
					payload !== null,
			);

		if (eligibleEventPayloads.length === 0) {
			toast.info("No eligible events selected for event rejection.");
			setIsBulkRejectDialogOpen(false);
			setBulkRejectionRemarks("");
			return;
		}

		const promises = eligibleEventPayloads.map((payload) =>
			rejectEventMutation.mutateAsync(payload),
		);

		toast.promise(Promise.all(promises), {
			loading: `${isAccounting ? "Marking" : isVpaaAdmin ? "Marking Not Recommended" : "Rejecting"} ${
				eligibleEventPayloads.length
			} event(s)...`,
			success: (_messages: string[]) => {
				setRowSelection({});
				setIsBulkRejectDialogOpen(false);
				setBulkRejectionRemarks("");
				return `${eligibleEventPayloads.length} event(s) ${
					isAccounting
						? "marked as unpaid"
						: isVpaaAdmin
							? "marked Not Recommended"
							: "rejected"
				}.`;
			},
			error: (err: Error) => {
				return `Failed to ${isAccounting ? "mark as unpaid" : isVpaaAdmin ? "mark Not Recommended" : "reject"} some events: ${err.message}`;
			},
		});
	};

	const columns = useMemo<ColumnDef<ApprovalEvent>[]>(
		() => [
			{
				id: "select",
				header: ({ table }) => (
					<Checkbox
						checked={
							table.getIsAllPageRowsSelected() ||
							(table.getIsSomePageRowsSelected() && "indeterminate")
						}
						onCheckedChange={(value) =>
							table.toggleAllPageRowsSelected(!!value)
						}
						aria-label="Select all"
						className="translate-y-[2px]"
					/>
				),
				cell: ({ row }) => (
					<Checkbox
						checked={row.getIsSelected()}
						onCheckedChange={(value) => row.toggleSelected(!!value)}
						aria-label="Select row"
						className="translate-y-[2px]"
					/>
				),
				enableSorting: false,
				enableHiding: false,
				meta: {
					type: "option",
					displayName: "Select",
					options: [
						{ value: "true", label: "Selected" },
						{ value: "false", label: "Not Selected" },
					],
				} as ColumnMeta<ApprovalEvent, unknown>,
			},
			{
				accessorKey: "eventName",
				header: ({ column }) => (
					<Button
						variant="ghost"
						onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
					>
						Event Name
						<ArrowUpDown className="ml-2 h-4 w-4" />
					</Button>
				),
				cell: ({ row }) => {
					const event = row.original;
					return (
						<Button
							variant="link"
							className="p-0 h-auto font-medium"
							onClick={() => handleViewDetails(event.publicId)}
						>
							{event.eventName}
						</Button>
					);
				},
				filterFn: filterFn("text"),
				meta: defineMeta((row: ApprovalEvent) => row.eventName, {
					displayName: "Event Name",
					type: "text",
					icon: FileText,
				}) as ColumnMeta<ApprovalEvent, unknown>,
			},
			{
				accessorKey: "eventType",
				header: ({ column }) => (
					<Button
						variant="ghost"
						onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
					>
						Event Type
						<ArrowUpDown className="ml-2 h-4 w-4" />
					</Button>
				),
				cell: ({ row }) => row.original.eventType,
				filterFn: filterFn("text"),
				meta: defineMeta((row: ApprovalEvent) => row.eventType, {
					displayName: "Event Type",
					type: "text",
					icon: Tag,
				}) as ColumnMeta<ApprovalEvent, unknown>,
			},
			{
				accessorKey: "venueName",
				header: ({ column }) => (
					<Button
						variant="ghost"
						onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
					>
						Venue
						<ArrowUpDown className="ml-2 h-4 w-4" />
					</Button>
				),
				cell: ({ row }) => {
					const event = row.original;
					return (
						<Button
							variant="link"
							className="p-0 h-auto font-medium"
							onClick={() => handleNavigateToVenue(event.eventVenue.publicId)}
						>
							{event.eventVenue.name}
						</Button>
					);
				},
				filterFn: filterFn("text"),
				meta: defineMeta((row: ApprovalEvent) => row.eventVenue.name, {
					displayName: "Venue",
					type: "text",
					icon: Building,
				}) as ColumnMeta<ApprovalEvent, unknown>,
			},
			{
				accessorKey: "departmentName",
				header: ({ column }) => (
					<Button
						variant="ghost"
						onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
					>
						Department
						<ArrowUpDown className="ml-2 h-4 w-4" />
					</Button>
				),
				cell: ({ row }) => row.original.department?.name ?? "N/A",
				filterFn: filterFn("text"),
				meta: defineMeta((row: ApprovalEvent) => row.department?.name ?? "", {
					displayName: "Department",
					type: "text",
					icon: Building,
				}) as ColumnMeta<ApprovalEvent, unknown>,
			},
			{
				accessorKey: "startTime",
				header: ({ column }) => (
					<Button
						variant="ghost"
						onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
					>
						Date
						<ArrowUpDown className="ml-2 h-4 w-4" />
					</Button>
				),
				cell: ({ row }) => format(row.original.startTime, "MMM d, yyyy"),
				filterFn: filterFn("date"),
				meta: defineMeta((row: ApprovalEvent) => row.startTime, {
					displayName: "Date",
					type: "date",
					icon: Calendar,
				}) as ColumnMeta<ApprovalEvent, unknown>,
			},
			{
				id: "timeRange",
				header: "Time",
				cell: ({ row }) =>
					`${format(row.original.startTime, "h:mm a")} - ${format(row.original.endTime, "h:mm a")}`,
				enableSorting: false,
				filterFn: filterFn("text"),
				meta: defineMeta(
					(row: ApprovalEvent) =>
						`${format(row.startTime, "h:mm a")} - ${format(row.endTime, "h:mm a")}`,
					{
						displayName: "Time",
						type: "text",
						icon: Clock,
					},
				) as ColumnMeta<ApprovalEvent, unknown>,
			},
			{
				id: "requesterName",
				accessorFn: (row) =>
					`${row.organizer?.firstName ?? ""} ${row.organizer?.lastName ?? ""}`.trim() ||
					"N/A",
				header: ({ column }) => (
					<Button
						variant="ghost"
						onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
					>
						Organizer
						<ArrowUpDown className="ml-2 h-4 w-4" />
					</Button>
				),
				filterFn: filterFn("text"),
				meta: defineMeta(
					(row: ApprovalEvent) =>
						`${row.organizer?.firstName ?? ""} ${row.organizer?.lastName ?? ""}`.trim() ||
						"N/A",
					{
						displayName: "Organizer",
						type: "text",
						icon: UserCircle,
					},
				) as ColumnMeta<ApprovalEvent, unknown>,
			},
			{
				id: "status",
				header: "Event Status",
				cell: ({ row }: { row: { original: ApprovalEvent } }) => {
					const event = row.original;
					return getApproverStatusBadge(event.status, userRoles);
				},
				accessorFn: (row) => row.status,
				filterFn: filterFn("option"),
				meta: defineMeta((row: ApprovalEvent) => row.status, {
					displayName: "Event Status",
					type: "option",
					icon: HelpCircle,
					options: [
						{ value: "PENDING", label: "Pending" },
						{ value: "APPROVED", label: "Reserved" },
						{ value: "REJECTED", label: "Denied Reservation" },
						{ value: "CANCELLED", label: "Cancelled" },
					],
				}) as ColumnMeta<ApprovalEvent, unknown>,
			},
			{
				id: "createdAt",
				header: "Created At",
				cell: ({ row }) => {
					const event = row.original as ApprovalEvent;
					return "createdAt" in event
						? new Date(event.createdAt).toLocaleDateString()
						: "-";
				},
				filterFn: filterFn("date"),
				meta: defineMeta((row: ApprovalEvent) => (row as EventDTO).createdAt, {
					displayName: "Created At",
					type: "date",
					icon: Calendar,
				}) as ColumnMeta<ApprovalEvent, unknown>,
			},
			{
				id: "yourAction",
				header: "Your Approval",
				cell: ({ row }) => {
					const event = row.original as ApprovalEvent;
					const currentUserApproval = config.getApprovalStatus(
						event,
						currentUserId,
					);
					const statusToDisplay = currentUserApproval?.status || "PENDING";

					return getApproverStatusBadge(statusToDisplay, userRoles);
				},
				accessorFn: (row) => {
					const event = row as ApprovalEvent;
					const currentUserApproval = config.getApprovalStatus(
						event,
						currentUserId,
					);
					return currentUserApproval?.status || "PENDING";
				},
				enableSorting: false,
				filterFn: filterFn("option"),
				meta: defineMeta(
					(row: ApprovalEvent) =>
						config.getApprovalStatus(row, currentUserId)?.status || "PENDING",
					{
						displayName: "Your Approval",
						type: "option",
						icon: UserCheck,
						options: isAccounting
							? [
									{ value: "PENDING", label: "Pending" },
									{ value: "APPROVED", label: "Paid" },
									{ value: "REJECTED", label: "Unpaid" },
								]
							: [
									{ value: "PENDING", label: "Pending" },
									{ value: "APPROVED", label: "Reserved" },
									{ value: "REJECTED", label: "Denied Reservation" },
								],
					},
				) as ColumnMeta<ApprovalEvent, unknown>,
			},
			{
				id: "actions",
				header: () => <div className="text-center">Actions</div>,
				cell: ({ row }) => {
					const event = row.original as ApprovalEvent;
					const isPending = event.status === "PENDING";
					const isApprover = config.isApprover(event, currentUserId);
					const currentUserApproval = config.getApprovalStatus(
						event,
						currentUserId,
					);
					const canTakeAction = isPending && isApprover;
					const userApprovalStatus = currentUserApproval?.status;

					// Show approve button if user hasn't approved yet (PENDING or REJECTED)
					const canApprove = canTakeAction && userApprovalStatus !== "APPROVED";
					// Show reject button if user hasn't rejected yet (PENDING or APPROVED)
					const canReject = canTakeAction && userApprovalStatus !== "REJECTED";

					return (
						<div className="text-center">
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant="ghost" size="icon" className="h-8 w-8">
										<MoreHorizontal className="h-4 w-4" />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end">
									<DropdownMenuLabel>Actions</DropdownMenuLabel>
									<DropdownMenuItem
										onClick={() => {
											handleViewDetails(event.publicId);
										}}
									>
										<Eye className="mr-2 h-4 w-4" />
										View Event Details
									</DropdownMenuItem>
									<DropdownMenuItem
										onClick={() =>
											handleNavigateToVenue(event.eventVenue.publicId)
										}
									>
										<Calendar className="mr-2 h-4 w-4" />
										View Venue
									</DropdownMenuItem>
									{(canApprove || canReject) && (
										<>
											<DropdownMenuSeparator />
											{canApprove && (
												<DropdownMenuItem
													onClick={() => openSingleApproveDialog(event)}
													disabled={
														approveEventMutation.isPending ||
														rejectEventMutation.isPending
													}
													className="text-green-600 focus:text-green-600 focus:bg-green-100/10"
												>
													<Check className="mr-2 h-4 w-4" />
													{approveActionLabel}
												</DropdownMenuItem>
											)}
											{canReject && (
												<DropdownMenuItem
													onClick={() => openSingleRejectDialog(event)}
													disabled={
														approveEventMutation.isPending ||
														rejectEventMutation.isPending
													}
													className="text-destructive focus:text-destructive focus:bg-destructive/10"
												>
													<X className="mr-2 h-4 w-4" />
													{rejectActionLabel}
												</DropdownMenuItem>
											)}
										</>
									)}
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					);
				},
				enableSorting: false,
				enableHiding: false,
				meta: {
					type: "option",
					displayName: "Actions",
					options: [
						{ value: "view", label: "View Details" },
						{ value: "approve", label: approveActionLabel },
						{ value: "reject", label: rejectActionLabel },
					],
				} as ColumnMeta<ApprovalEvent, unknown>,
			},
		],
		[
			config,
			currentUserId,
			approveEventMutation.isPending,
			rejectEventMutation.isPending,
			handleViewDetails,
			handleNavigateToVenue,
			openSingleApproveDialog,
			openSingleRejectDialog,
			approveActionLabel,
			rejectActionLabel,
			isAccounting,
			userRoles,
		],
	);

	const table = useReactTable({
		data: finalFilteredEvents,
		columns,
		state: {
			sorting,
			columnVisibility,
			rowSelection,
			globalFilter: searchQuery,
		},
		enableRowSelection: true,
		onRowSelectionChange: setRowSelection,
		onSortingChange: setSorting,
		onColumnVisibilityChange: setColumnVisibility,
		onGlobalFilterChange: setSearchQuery,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getRowId: (row) => row.publicId.toString(),
	});

	const statistics = useMemo(() => {
		if (!fetchedEvents)
			return {
				total: 0,
				pendingAction: 0,
				userApproved: 0,
				userRejected: 0,
			};

		const eventsRelevantToView = fetchedEvents.filter((event: ApprovalEvent) =>
			config.isApprover(event, currentUserId),
		);

		return {
			total: eventsRelevantToView.length, // Total events shown in this view
			pendingAction: eventsRelevantToView.filter((event) => {
				const userApproval = config.getApprovalStatus(event, currentUserId);
				return userApproval?.status === "PENDING";
			}).length,
			userApproved: eventsRelevantToView.filter((event) => {
				const userApproval = config.getApprovalStatus(event, currentUserId);
				return userApproval?.status === "APPROVED";
			}).length,
			userRejected: eventsRelevantToView.filter((event) => {
				const userApproval = config.getApprovalStatus(event, currentUserId);
				return userApproval?.status === "REJECTED";
			}).length,
		};
	}, [fetchedEvents, config, currentUserId]);

	// const numSelected = table.getFilteredSelectedRowModel().rows.length;
	const numEligibleSelected = table
		.getFilteredSelectedRowModel()
		.rows.filter((row) => {
			const event = row.original as ApprovalEvent;
			const isPending = event.status === "PENDING";
			const isApprover = config.isApprover(event, currentUserId);
			return isPending && isApprover;
		}).length;

	return (
		<div className="bg-background">
			<div className="flex flex-col flex-1 overflow-hidden">
				<header className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-2 sm:justify-between border-b px-4 sm:px-6 py-3 sm:py-0 sm:h-[65px]">
					<div>
						<h1 className="text-lg sm:text-xl font-semibold">{config.title}</h1>
						<p className="text-xs sm:text-sm text-muted-foreground">
							{config.description}
						</p>
					</div>
					{numEligibleSelected > 0 && (
						<div className="flex items-center gap-2 w-full sm:w-auto">
							<span className="text-xs sm:text-sm text-muted-foreground">
								{numEligibleSelected} eligible event(s) selected
							</span>
							<Button
								variant="outline"
								size="sm"
								className="gap-1 border-green-600"
								onClick={() => setIsBulkApproveDialogOpen(true)}
								disabled={
									approveEventMutation.isPending ||
									rejectEventMutation.isPending
								}
							>
								<CheckCircle2 className="h-4 w-4 text-green-600" />
								<span className="hidden sm:inline">{approveActionLabel}</span>
							</Button>
							<Button
								variant="destructive"
								size="sm"
								className="gap-1"
								onClick={() => setIsBulkRejectDialogOpen(true)}
								disabled={
									approveEventMutation.isPending ||
									rejectEventMutation.isPending
								}
							>
								<X className="h-4 w-4" />
								<span className="hidden sm:inline">{rejectActionLabel}</span>
							</Button>
						</div>
					)}
				</header>

				<div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 p-4 sm:p-6 sm:pb-4 border-b">
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-xs sm:text-sm font-medium">
								Total Events for Your Approval
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-xl sm:text-2xl font-bold">
								{statistics.total}
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-xs sm:text-sm font-medium">
								Events Pending Your Action
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-xl sm:text-2xl font-bold text-yellow-500">
								{statistics.pendingAction}
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-xs sm:text-sm font-medium">
								Events You've Reserved
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-xl sm:text-2xl font-bold text-green-500">
								{statistics.userApproved}
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-xs sm:text-sm font-medium">
								Events You've Denied Reservation
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-xl sm:text-2xl font-bold text-red-500">
								{statistics.userRejected}
							</div>
						</CardContent>
					</Card>
				</div>

				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 sm:p-6 sm:pt-4 sm:pb-2 gap-3 sm:gap-4">
					<div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 flex-1">
						<DataTableFilter table={table} />
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="outline"
									size="sm"
									className="w-full sm:w-auto"
								>
									Columns <ChevronDown className="ml-2 h-4 w-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								{table
									.getAllColumns()
									.filter((column) => column.getCanHide())
									.map((column) => {
										const columnMeta = column.columnDef.meta as
											| { displayName?: string }
											| undefined;
										const displayName = columnMeta?.displayName || column.id;
										return (
											<DropdownMenuCheckboxItem
												key={column.id}
												className="capitalize"
												checked={column.getIsVisible()}
												onCheckedChange={(value) =>
													column.toggleVisibility(!!value)
												}
											>
												{displayName}
											</DropdownMenuCheckboxItem>
										);
									})}
							</DropdownMenuContent>
						</DropdownMenu>
						{/* Optional export button placeholder */}
					</div>
				</div>

				<div className="flex-1 overflow-auto p-4 sm:p-6 sm:pt-0">
					<div className="rounded-md border overflow-x-auto">
						<Table>
							<TableHeader>
								{table.getHeaderGroups().map((headerGroup) => (
									<TableRow key={headerGroup.id}>
										{headerGroup.headers.map((header) => (
											<TableHead
												key={header.id}
												colSpan={header.colSpan}
												className="text-secondary-foreground bg-secondary font-medium"
												style={{
													width:
														header.getSize() !== 150
															? `${header.getSize()}px`
															: undefined,
												}}
											>
												{header.isPlaceholder
													? null
													: flexRender(
															header.column.columnDef.header,
															header.getContext(),
														)}
											</TableHead>
										))}
									</TableRow>
								))}
							</TableHeader>
							<TableBody>
								{table.getRowModel().rows?.length ? (
									table.getRowModel().rows.map((row) => (
										<TableRow
											key={row.id}
											data-state={row.getIsSelected() && "selected"}
										>
											{row.getVisibleCells().map((cell) => (
												<TableCell
													key={cell.id}
													style={{
														width:
															cell.column.getSize() !== 150
																? `${cell.column.getSize()}px`
																: undefined,
													}}
												>
													{flexRender(
														cell.column.columnDef.cell,
														cell.getContext(),
													)}
												</TableCell>
											))}
										</TableRow>
									))
								) : (
									<TableRow>
										<TableCell
											colSpan={columns.length}
											className="h-24 text-center"
										>
											{searchQuery
												? `No events match your search query "${searchQuery}".`
												: "No events found for the selected filters."}
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</div>
				</div>
			</div>

			<Dialog
				open={singleActionInfo.type !== null}
				onOpenChange={(isOpen) => !isOpen && closeSingleActionDialog()}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{singleActionInfo.type === "approve"
								? approveDialogTitle
								: rejectDialogTitle}
						</DialogTitle>
						<DialogDescription>
							{singleActionInfo.type === "approve"
								? isAccounting
									? "You can optionally add remarks for this payment confirmation."
									: "You can optionally add remarks for this event approval."
								: isAccounting
									? "Please provide a reason for marking as unpaid. This note will be recorded for the event."
									: "Please provide a reason for rejection. This note will be recorded for the event."}
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 py-4">
						<Textarea
							placeholder={
								singleActionInfo.type === "approve"
									? isAccounting
										? "Optional payment remarks..."
										: "Optional remarks..."
									: isAccounting
										? "Enter reason for marking as unpaid..."
										: "Enter reason for rejection..."
							}
							value={singleActionRemarks}
							onChange={(e) => setSingleActionRemarks(e.target.value)}
							rows={5}
						/>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={closeSingleActionDialog}
							disabled={
								approveEventMutation.isPending || rejectEventMutation.isPending
							}
						>
							Cancel
						</Button>
						{singleActionInfo.type === "approve" && (
							<Button
								onClick={confirmSingleApprove}
								disabled={approveEventMutation.isPending}
							>
								{approveEventMutation.isPending
									? approvePendingLabel
									: approveConfirmLabel}
							</Button>
						)}
						{singleActionInfo.type === "reject" && (
							<Button
								variant="destructive"
								onClick={confirmSingleReject}
								disabled={
									!singleActionRemarks.trim() || rejectEventMutation.isPending
								}
							>
								{rejectEventMutation.isPending
									? rejectPendingLabel
									: rejectConfirmLabel}
							</Button>
						)}
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog
				open={isBulkApproveDialogOpen}
				onOpenChange={setIsBulkApproveDialogOpen}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{approveBulkTitle}</DialogTitle>
						<DialogDescription>
							Optionally add remarks for{" "}
							{isAccounting
								? "marking as paid"
								: isVpaaAdmin
									? "recommending"
									: "approving"}{" "}
							the selected {numEligibleSelected} eligible event(s). This note
							will be recorded for all of them.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 py-4">
						<Textarea
							placeholder={
								isAccounting
									? "Optional payment remarks..."
									: "Optional remarks..."
							}
							value={bulkApproveRemarks}
							onChange={(e) => setBulkApproveRemarks(e.target.value)}
							rows={5}
						/>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => {
								setIsBulkApproveDialogOpen(false);
								setBulkApproveRemarks("");
							}}
							disabled={approveEventMutation.isPending}
						>
							Cancel
						</Button>
						<Button
							onClick={confirmBulkApprove}
							disabled={
								approveEventMutation.isPending || numEligibleSelected === 0
							}
						>
							{approveEventMutation.isPending
								? approvePendingLabel
								: `${approveConfirmLabel} (${numEligibleSelected})`}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog
				open={isBulkRejectDialogOpen}
				onOpenChange={setIsBulkRejectDialogOpen}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{rejectBulkTitle}</DialogTitle>
						<DialogDescription>
							Provide a reason for{" "}
							{isAccounting
								? "marking as unpaid"
								: isVpaaAdmin
									? "marking Not Recommended"
									: "rejecting"}{" "}
							the selected {numEligibleSelected} eligible event(s). This note
							will be recorded for all of them.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 py-4">
						<Textarea
							placeholder={
								isAccounting
									? "Enter reason for marking as unpaid..."
									: "Enter reason for rejection..."
							}
							value={bulkRejectionRemarks}
							onChange={(e) => setBulkRejectionRemarks(e.target.value)}
							rows={5}
						/>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => {
								setIsBulkRejectDialogOpen(false);
								setBulkRejectionRemarks("");
							}}
							disabled={rejectEventMutation.isPending}
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={confirmBulkReject}
							disabled={
								!bulkRejectionRemarks.trim() ||
								rejectEventMutation.isPending ||
								numEligibleSelected === 0
							}
						>
							{rejectEventMutation.isPending
								? rejectPendingLabel
								: `${rejectConfirmLabel} (${numEligibleSelected})`}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
