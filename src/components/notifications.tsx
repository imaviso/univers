import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { useAtom } from "jotai";
import {
	AlertTriangle,
	Bell,
	Calendar, // Added for event name
	CheckCircle2,
	Hash, // Added for eventId
	Info,
	type LucideIcon,
	User, // Added for approver
	XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { NotificationDTO } from "@/lib/notifications"; // Update import path if needed
import { webSocketStatusAtom } from "@/lib/notifications";
import {
	notificationsQueryOptions,
	unreadNotificationsCountQueryOptions,
	useMarkAllNotificationsReadMutation,
	useMarkNotificationsReadMutation,
} from "@/lib/query";
import { formatDateTime } from "@/lib/utils";

/**
 * Formats ISO date strings found within notification message text
 * Replaces patterns like "2025-12-04T11:40:00Z" with formatted dates
 */
const formatDatesInMessage = (message: string): string => {
	// Match ISO 8601 date strings (e.g., 2025-12-04T11:40:00Z or 2025-12-04T11:40:00)
	const isoDateRegex =
		/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?/g;

	return message.replace(isoDateRegex, (dateStr) => {
		try {
			return formatDateTime(dateStr);
		} catch {
			// If formatting fails, return original string
			return dateStr;
		}
	});
};

// Helper function to generate a title
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

// Helper function to map notification to icon and color
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

	if (messageText.includes("error") || type.includes("error")) {
		return { Icon: XCircle, color: "text-red-500" };
	}
	if (
		messageText.includes("success") ||
		messageText.includes("approved") ||
		type.includes("success") ||
		type.includes("approval")
	) {
		return { Icon: CheckCircle2, color: "text-green-500" };
	}
	if (messageText.includes("warning") || type.includes("warning")) {
		return { Icon: AlertTriangle, color: "text-yellow-500" };
	}

	return { Icon: Info, color: "text-blue-500" }; // Default
};

export function NotificationDropdown() {
	const navigate = useNavigate();
	const [connectionStatus] = useAtom(webSocketStatusAtom);

	// Fetch unread count
	const { data: countData } = useQuery(unreadNotificationsCountQueryOptions);
	const unreadCount = countData?.unreadCount ?? 0;

	const notificationsParams = { page: 0, size: 7 } as const;

	const { data: notificationsData, isLoading: isLoadingNotifications } =
		useQuery(notificationsQueryOptions(notificationsParams));
	const notifications = notificationsData?.content ?? [];

	// Mutations
	const markReadMutation = useMarkNotificationsReadMutation();
	const markAllReadMutation = useMarkAllNotificationsReadMutation();

	const handleMarkRead = (publicId: string) => {
		if (publicId) {
			markReadMutation.mutate([publicId]);
		}
	};

	const handleMarkAllRead = () => {
		markAllReadMutation.mutate();
	};

	// --- UI Logic for status indicator ---
	let statusIndicatorColor = "bg-gray-400";
	const statusTitle = `WebSocket: ${connectionStatus}`;
	if (connectionStatus === "connected") statusIndicatorColor = "bg-green-500";
	else if (connectionStatus === "connecting")
		statusIndicatorColor = "bg-yellow-500";
	else if (connectionStatus === "error") statusIndicatorColor = "bg-red-500";
	else if (connectionStatus === "closed") statusIndicatorColor = "bg-gray-400";

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" size="icon" className="relative">
					<Bell className="h-5 w-5" />
					{/* Connection Status Indicator */}
					<span
						className={`absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ${statusIndicatorColor} ring-2 ring-white`}
						title={statusTitle}
					/>
					{unreadCount > 0 && (
						<Badge
							variant="destructive"
							className="absolute -top-1 -right-1 px-1 min-w-[1.25rem] h-5 text-xs flex items-center justify-center"
						>
							{unreadCount > 99 ? "99+" : unreadCount}
						</Badge>
					)}
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="w-80 md:w-96" align="end">
				<DropdownMenuLabel className="font-normal">
					<div className="flex flex-col space-y-1">
						<p className="text-sm font-medium leading-none">Notifications</p>
						<p className="text-xs leading-none text-muted-foreground">
							You have {unreadCount} unread messages
						</p>
					</div>
				</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<ScrollArea className="h-[300px] md:h-[400px] pr-1">
					{isLoadingNotifications ? (
						<DropdownMenuItem disabled>Loading...</DropdownMenuItem>
					) : notifications.length === 0 ? (
						<DropdownMenuItem disabled>
							No recent notifications
						</DropdownMenuItem>
					) : (
						notifications.map((notification: NotificationDTO) => {
							const { Icon, color } = getNotificationStyle(notification);
							const title = generateNotificationTitle(notification);

							const entityType = notification.relatedEntityType?.toUpperCase();
							const entityId = notification.relatedEntityPublicId;
							let canNavigate = false;
							let targetPath = "";

							if (entityId != null) {
								if (
									entityType?.includes("EVENT") ||
									entityType?.includes("VENUE")
								) {
									canNavigate = true;
									targetPath = `/app/events/${entityId}`;
								} else if (entityType === "EQUIPMENT_RESERVATION") {
									canNavigate = true;
									// Ensure this path matches your route definition
									targetPath = "/app/equipment-approval";
								}
								// Add more 'else if' for other types if needed
							}

							return (
								<DropdownMenuItem
									key={notification.publicId}
									onClick={() => {
										if (!notification.isRead) {
											handleMarkRead(notification.publicId);
										}
										if (canNavigate) {
											navigate({ to: targetPath });
										}
										// If !canNavigate, clicking just marks as read
									}}
									// Remove onSelect
									className={`items-start space-x-3 ${notification.isRead ? "opacity-60" : ""} ${canNavigate ? "cursor-pointer" : "cursor-default"}`} // Adjust cursor based on navigation
								>
									{/* Icon */}
									<div
										className={`mt-1 p-1 rounded-full ${color} bg-opacity-10`}
									>
										<Icon className={`h-4 w-4 ${color}`} />
									</div>

									{/* Content */}
									<div className="flex-1 space-y-0.5">
										{/* Title */}
										<p className="text-sm font-medium leading-snug line-clamp-1">
											{title}
										</p>

										{/* Message Text - Apply explicit type check */}
										<p className="text-sm text-muted-foreground leading-snug line-clamp-2">
											{(() => {
												let messageText: string;
												if (typeof notification.message?.message === "string") {
													messageText = notification.message.message;
												} else if (notification.message?.message) {
													messageText = JSON.stringify(
														notification.message.message,
													).slice(0, 100);
												} else {
													messageText = "No message content.";
												}
												// Format any ISO dates found in the message
												return formatDatesInMessage(messageText);
											})()}
										</p>

										{/* Additional Fields (condensed for dropdown) */}
										{notification.message?.eventName && (
											<span className="flex items-center gap-0.5">
												<Calendar className="h-3 w-3 opacity-70" />
												{typeof notification.message.eventName === "string"
													? notification.message.eventName
													: String(notification.message.eventName)}
											</span>
										)}
										{notification.message?.approver && (
											<span className="flex items-center gap-0.5">
												<User className="h-3 w-3 opacity-70" />
												{typeof notification.message.approver === "string"
													? notification.message.approver
													: String(notification.message.approver)}
											</span>
										)}
										{notification.message?.eventId && (
											<span className="flex items-center gap-0.5">
												<Hash className="h-3 w-3 opacity-70" />
												{typeof notification.message.eventId === "string"
													? notification.message.eventId
													: String(notification.message.eventId)}
											</span>
										)}

										{/* Timestamp */}
										<p className="text-xs text-muted-foreground">
											{formatDateTime(notification.createdAt)}
										</p>
									</div>
								</DropdownMenuItem>
							);
						})
					)}
				</ScrollArea>
				<DropdownMenuSeparator />
				<DropdownMenuItem asChild>
					<Link
						to="/app/notifications"
						className="cursor-pointer w-full justify-center"
					>
						View all notifications
					</Link>
				</DropdownMenuItem>
				<DropdownMenuItem
					onSelect={handleMarkAllRead}
					className="cursor-pointer justify-center"
					disabled={unreadCount === 0 || markAllReadMutation.isPending}
				>
					Mark all as read
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
