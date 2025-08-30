import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
	Pagination,
	PaginationContent,
	// PaginationEllipsis, // Not used currently
	PaginationItem,
	// PaginationLink, // Not used currently
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination";
import type { NotificationDTO } from "@/lib/notifications";
import {
	notificationsQueryOptions,
	useDeleteNotificationsMutation,
	useMarkAllNotificationsReadMutation,
	useMarkNotificationsReadMutation,
} from "@/lib/query";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router"; // Import useNavigate
import {
	AlertTriangle,
	// Bell, // Not used here
	Calendar,
	Check,
	CheckCircle2,
	Filter,
	Info,
	Loader2,
	type LucideIcon,
	// Tag, // Not used here
	Trash2,
	User,
	XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/notifications")({
	component: NotificationsPage,
	beforeLoad: async ({ location, context }) => {
		if (context.authState == null) {
			throw redirect({
				to: "/login",
				search: {
					redirect: location.href,
				},
			});
		}
	},
});

// --- Helper Functions (Consistent with Dropdown) ---
const generateNotificationTitle = (notification: NotificationDTO): string => {
	// Access nested fields
	if (notification.message?.eventName) {
		return `Event: ${notification.message.eventName}`;
	}
	if (notification.message?.type) {
		return notification.message.type
			.replace(/_/g, " ")
			.replace(/\b\w/g, (l) => l.toUpperCase());
	}
	// Fallback to top-level relatedEntityType
	if (notification.relatedEntityType) {
		return notification.relatedEntityType
			.replace(/_/g, " ")
			.replace(/\b\w/g, (l) => l.toUpperCase());
	}
	return "Notification Update";
};

const getNotificationStyle = (
	notification: NotificationDTO,
): { Icon: LucideIcon; color: string } => {
	// Check nested message object
	const rawMessage = notification.message?.message;
	const messageText =
		typeof rawMessage === "string" ? rawMessage.toLowerCase() : "";

	// Check nested type and fallback to relatedEntityType
	const type =
		notification.message?.type?.toLowerCase() ||
		notification.relatedEntityType?.toLowerCase() ||
		"";

	if (
		messageText.includes("error") ||
		type.includes("error") ||
		type.includes("reject") // Include reject for error style
	) {
		return { Icon: XCircle, color: "text-red-500" };
	}
	if (
		messageText.includes("success") ||
		messageText.includes("approved") ||
		type.includes("success") ||
		type.includes("approved") // Include approved for success style
	) {
		return { Icon: CheckCircle2, color: "text-green-500" };
	}
	if (
		messageText.includes("warning") ||
		type.includes("warning") ||
		type.includes("request") // Include request for warning style
	) {
		return { Icon: AlertTriangle, color: "text-yellow-500" };
	}

	return { Icon: Info, color: "text-blue-500" }; // Default
};
// --- End Helper Functions ---

function NotificationsPage() {
	const navigate = useNavigate(); // Get navigation function
	const [currentPage, setCurrentPage] = useState(0);
	const [filter, setFilter] = useState<"all" | "unread">("all");
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const notificationsPerPage = 10;

	const {
		data: notificationsData,
		isLoading,
		isError,
		error,
	} = useQuery(
		notificationsQueryOptions({
			page: currentPage,
			size: notificationsPerPage,
		}),
	);

	const notifications = useMemo(
		() => notificationsData?.content ?? [],
		[notificationsData],
	);
	const totalPages = useMemo(
		() => notificationsData?.totalPages ?? 0,
		[notificationsData],
	);

	const markReadMutation = useMarkNotificationsReadMutation();
	const markAllReadMutation = useMarkAllNotificationsReadMutation();
	const deleteNotificationsMutation = useDeleteNotificationsMutation();

	const filteredNotifications = useMemo(() => {
		return notifications
			.filter((notification) => {
				if (filter === "unread") return !notification.isRead;
				return true;
			})
			.filter((notification) => {
				const searchLower = searchQuery.toLowerCase();
				// Enhanced search: check title, message content, entity type, event name, etc.
				const title = generateNotificationTitle(notification).toLowerCase();
				const messageContent =
					typeof notification.message?.message === "string"
						? notification.message.message.toLowerCase()
						: "";
				const entityType = notification.relatedEntityType?.toLowerCase() || "";
				const eventName = notification.message?.eventName?.toLowerCase() || "";
				const requesterName =
					notification.message?.requesterName?.toLowerCase() || "";
				const actorName = notification.message?.approver?.toLowerCase() || "";

				return (
					title.includes(searchLower) ||
					messageContent.includes(searchLower) ||
					entityType.includes(searchLower) ||
					eventName.includes(searchLower) ||
					requesterName.includes(searchLower) ||
					actorName.includes(searchLower)
				);
			});
	}, [notifications, filter, searchQuery]);

	const handleMarkRead = (id: string) => {
		markReadMutation.mutate([id]);
	};

	const handleMarkAllAsRead = () => {
		markAllReadMutation.mutate();
	};

	const handleDeleteSelected = () => {
		if (selectedIds.size > 0) {
			deleteNotificationsMutation.mutate([...selectedIds], {
				onSuccess: () => {
					setSelectedIds(new Set());
					toast.success("Selected notifications deleted.");
				},
				onError: (err) => {
					toast.error("Failed to delete notifications.", {
						description: err.message,
					});
				},
			});
		}
	};

	const handleSelectAll = (checked: boolean | "indeterminate") => {
		if (checked === true) {
			setSelectedIds(new Set(filteredNotifications.map((n) => n.publicId)));
		} else {
			setSelectedIds(new Set());
		}
	};

	const handleSelectOne = (id: string, checked: boolean | "indeterminate") => {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			if (checked === true) {
				next.add(id);
			} else {
				next.delete(id);
			}
			return next;
		});
	};

	const isAllSelected =
		filteredNotifications.length > 0 &&
		selectedIds.size === filteredNotifications.length;
	const isSomeSelected =
		selectedIds.size > 0 && selectedIds.size < filteredNotifications.length;
	const selectAllCheckedState = isAllSelected
		? true
		: isSomeSelected
			? "indeterminate"
			: false;

	const handlePageChange = (page: number) => {
		if (page >= 0 && page < totalPages) {
			setCurrentPage(page);
			setSelectedIds(new Set());
		}
	};

	return (
		<div className="flex h-screen flex-col bg-background">
			{/* Header */}
			<header className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3 md:px-6 md:py-3.5">
				<h1 className="text-xl font-semibold">Notifications</h1>
				<div className="flex flex-wrap items-center gap-2">
					<Input
						type="search"
						placeholder="Search..."
						className="w-full sm:w-48 md:w-64"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
					/>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline" size="sm" className="gap-1">
								<Filter className="h-4 w-4" />
								<span>{filter === "unread" ? "Unread" : "All"}</span>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuLabel>Filter by</DropdownMenuLabel>
							<DropdownMenuSeparator />
							<DropdownMenuItem onSelect={() => setFilter("all")}>
								<Check
									className={`mr-2 h-4 w-4 ${filter === "all" ? "opacity-100" : "opacity-0"}`}
								/>
								All notifications
							</DropdownMenuItem>
							<DropdownMenuItem onSelect={() => setFilter("unread")}>
								<Check
									className={`mr-2 h-4 w-4 ${filter === "unread" ? "opacity-100" : "opacity-0"}`}
								/>
								Unread notifications
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
					<Button
						variant="outline"
						size="sm"
						onClick={handleMarkAllAsRead}
						disabled={markAllReadMutation.isPending || isLoading}
					>
						<Check className="mr-1.5 h-4 w-4" />
						Mark all read
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={handleDeleteSelected}
						disabled={
							selectedIds.size === 0 ||
							deleteNotificationsMutation.isPending ||
							isLoading
						}
						className="text-red-600 hover:text-red-700"
					>
						<Trash2 className="mr-1.5 h-4 w-4" />
						Delete ({selectedIds.size})
					</Button>
				</div>
			</header>

			{/* Main Content */}
			<main className="flex-1 overflow-y-auto p-4 md:p-6">
				<div className="space-y-4">
					{/* Select All Checkbox */}
					{filteredNotifications.length > 0 && (
						<div className="flex items-center gap-4 px-4 py-2 border-b">
							<Checkbox
								id="select-all"
								checked={selectAllCheckedState}
								onCheckedChange={handleSelectAll}
								aria-label="Select all notifications on this page"
							/>
							<label
								htmlFor="select-all"
								className="text-sm font-medium cursor-pointer"
							>
								Select All ({selectedIds.size} selected)
							</label>
						</div>
					)}

					{/* Loading State */}
					{isLoading && (
						<div className="flex justify-center items-center py-10">
							<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
						</div>
					)}

					{/* Error State */}
					{isError && (
						<div className="text-center text-red-600 py-10">
							Error loading notifications: {error?.message || "Unknown error"}
						</div>
					)}

					{/* Empty State */}
					{!isLoading && !isError && filteredNotifications.length === 0 && (
						<div className="text-center text-muted-foreground py-10">
							{searchQuery || filter === "unread"
								? "No matching notifications found."
								: "You have no notifications."}
						</div>
					)}

					{/* Notification List */}
					{!isError &&
						filteredNotifications.map((notification) => {
							const { Icon, color } = getNotificationStyle(notification); // Use consistent style helper
							const title = generateNotificationTitle(notification); // Use consistent title helper

							// --- Navigation Logic (Consistent with Dropdown) ---
							const entityType = notification.relatedEntityType?.toUpperCase();
							// Use eventId from the message payload if available, otherwise fallback to relatedEntityId
							const eventId = notification.message?.eventId;
							const primaryEntityId = notification.relatedEntityPublicId;

							let canNavigate = false;
							let targetPath = "";

							// Prioritize eventId for navigation if present
							if (eventId != null) {
								canNavigate = true;
								targetPath = `/app/events/${eventId}`;
							} else if (primaryEntityId != null) {
								// Fallback to relatedEntityId for specific types if eventId is missing
								if (entityType === "EVENT") {
									canNavigate = true;
									targetPath = `/app/events/${primaryEntityId}`;
								} else if (entityType === "EQUIPMENT_RESERVATION") {
									// Navigate to equipment approval page using equipment reservation ID
									canNavigate = true;
									targetPath = "/app/equipment-approval/approval"; // Or use primaryEntityId if needed: `/app/equipment-approval/${primaryEntityId}`
								}
								// Add more specific fallbacks if needed
							}
							// --- End Navigation Logic ---

							const handleInteraction = () => {
								if (!notification.isRead) {
									handleMarkRead(notification.publicId);
								}
								if (canNavigate) {
									navigate({ to: targetPath });
								}
							};

							return (
								<div
									key={notification.publicId}
									role={canNavigate ? "button" : undefined} // Make it a button if navigable
									tabIndex={canNavigate ? 0 : undefined} // Make it focusable if navigable
									className={`flex items-start gap-4 p-4 rounded-lg border focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
										notification.isRead ? "bg-background" : "bg-muted/50" // Slightly different background for unread
									} ${canNavigate ? "cursor-pointer hover:bg-muted/80" : ""}`} // Add cursor and hover for navigable items
									onClick={handleInteraction}
									onKeyDown={(e) => {
										if (canNavigate && (e.key === "Enter" || e.key === " ")) {
											e.preventDefault(); // Prevent spacebar scroll
											handleInteraction();
										}
									}}
									aria-labelledby={`notification-title-${notification.publicId}`} // Link title for screen readers
								>
									{/* Checkbox */}
									<Checkbox
										id={`select-${notification.publicId}`}
										checked={selectedIds.has(notification.publicId)}
										onCheckedChange={(checked) => {
											// Stop propagation to prevent navigation when clicking checkbox
											handleSelectOne(notification.publicId, checked);
										}}
										onClick={(e) => e.stopPropagation()} // Prevent outer div click
										className="mt-1"
										aria-labelledby={`notification-title-${notification.publicId}`}
									/>
									{/* Icon (Consistent with Dropdown) */}
									<div
										className={`mt-1 p-1 rounded-full ${color} bg-opacity-10`}
									>
										<Icon className={`h-4 w-4 ${color}`} />
									</div>
									{/* Content (Consistent with Dropdown) */}
									<div className="flex-1 space-y-0.5">
										<h3
											id={`notification-title-${notification.publicId}`}
											className="text-sm font-medium leading-snug line-clamp-1"
										>
											{title}
										</h3>
										{/* Main Message */}
										<p className="text-sm text-muted-foreground leading-snug line-clamp-2">
											{
												typeof notification.message === "string"
													? notification.message // Display if notification.message itself is the string
													: typeof notification.message?.message === "string" // Check nested if message is object
														? notification.message.message
														: notification.message // Check if message object exists
															? `Details: ${JSON.stringify(notification.message).slice(0, 150)}...` // Stringify the whole message object for context
															: "No message content." // Fallback
											}
										</p>
										{/* Additional Fields (Consistent with Dropdown) */}
										{notification.message?.eventName && (
											<span className="flex items-center gap-0.5 text-xs text-muted-foreground">
												<Calendar className="h-3 w-3 opacity-70" />
												{typeof notification.message.eventName === "string"
													? notification.message.eventName
													: String(notification.message.eventName)}
											</span>
										)}
										{notification.message?.approver && ( // Show actor if available
											<span className="flex items-center gap-0.5 text-xs text-muted-foreground">
												<User className="h-3 w-3 opacity-70" />
												{typeof notification.message.approver === "string"
													? notification.message.approver
													: String(notification.message.approver)}
											</span>
										)}
										{/* Show Event ID if available and different from primary ID */}
										{/* {eventId != null && eventId !== primaryEntityId && (
											<span className="flex items-center gap-0.5 text-xs text-muted-foreground">
												<Hash className="h-3 w-3 opacity-70" />
												Event ID: {eventId}
											</span>
										)} */}
										{/* Timestamp (Consistent with Dropdown) */}
										<p className="text-xs text-muted-foreground pt-1">
											{new Date(notification.createdAt).toLocaleString([], {
												dateStyle: "short",
												timeStyle: "short",
											})}
										</p>
									</div>
									{/* Mark as Read Button (No longer needed if clicking the item marks as read) */}
									{/* {!notification.read && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation(); // Prevent navigation
                                                handleMarkRead(notification.id);
                                            }}
                                            disabled={markReadMutation.isPending}
                                            className="self-start"
                                        >
                                            Mark read
                                        </Button>
                                    )} */}
								</div>
							);
						})}
				</div>
			</main>

			{/* Footer with Pagination */}
			{!isLoading && !isError && totalPages > 1 && (
				<footer className="border-t px-4 py-3 md:px-6">
					<Pagination>
						<PaginationContent>
							<PaginationItem>
								<PaginationPrevious
									href="#"
									onClick={(e) => {
										e.preventDefault();
										handlePageChange(currentPage - 1);
									}}
									aria-disabled={currentPage === 0}
									className={
										currentPage === 0 ? "pointer-events-none opacity-50" : ""
									}
								/>
							</PaginationItem>
							<PaginationItem>
								<span className="px-4 text-sm">
									Page {currentPage + 1} of {totalPages}
								</span>
							</PaginationItem>
							<PaginationItem>
								<PaginationNext
									href="#"
									onClick={(e) => {
										e.preventDefault();
										handlePageChange(currentPage + 1);
									}}
									aria-disabled={currentPage >= totalPages - 1}
									className={
										currentPage >= totalPages - 1
											? "pointer-events-none opacity-50"
											: ""
									}
								/>
							</PaginationItem>
						</PaginationContent>
					</Pagination>
				</footer>
			)}
		</div>
	);
}
