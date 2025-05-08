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
import type { NotificationDTO } from "@/lib/notifications"; // Import DTO type
import {
    notificationsQueryOptions,
    unreadNotificationsCountQueryOptions,
    useMarkAllNotificationsReadMutation,
    useMarkNotificationsReadMutation,
} from "@/lib/query";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router"; // Import useNavigate
import {
    AlertTriangle, // Added
    Bell,
    CheckCircle2, // Added
    Info, // Added
    type LucideIcon, // Added
    XCircle, // Added
} from "lucide-react"; // Import necessary icons

// --- Add helper functions (or import if defined elsewhere) ---
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

// Helper function to map notification to icon and color (same as in notifications.tsx)
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

export function NotificationCenter() {
    const navigate = useNavigate();

    // Fetch unread count
    const { data: countData } = useQuery(unreadNotificationsCountQueryOptions);
    const unreadCount = countData?.unreadCount ?? 0;

    const params = { page: 0, size: 7 } as const;
    const { data: notificationsData, isLoading: isLoadingNotifications } =
        useSuspenseQuery(notificationsQueryOptions(params));

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

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
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
            {/* Adjusted width to match notifications.tsx */}
            <DropdownMenuContent className="w-80 md:w-96" align="end">
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                            Notifications{" "}
                            {/* Removed connection status from label */}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                            You have {unreadCount} unread messages
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {/* --- Use ScrollArea like the other dropdown --- */}
                <ScrollArea className="h-[300px] md:h-[400px] pr-1">
                    {isLoadingNotifications ? ( // Handle loading state
                        <DropdownMenuItem disabled>Loading...</DropdownMenuItem>
                    ) : notifications.length === 0 ? (
                        <DropdownMenuItem disabled>
                            No recent notifications
                        </DropdownMenuItem>
                    ) : (
                        notifications.map((notification: NotificationDTO) => {
                            // --- Generate title and style using helpers ---
                            const title =
                                generateNotificationTitle(notification);
                            const { Icon, color } =
                                getNotificationStyle(notification);

                            // Determine if navigation is possible
                            const entityType =
                                notification.relatedEntityType?.toUpperCase();
                            const entityId = notification.relatedEntityPublicId;
                            let canNavigate = false;
                            let targetPath = "";

                            if (entityId != null) {
                                if (
                                    entityType === "EVENT" ||
                                    entityType === "EVENT_APPROVED" ||
                                    entityType === "EVENT_REJECTED" ||
                                    entityType === "EVENT_RESERVATION" ||
                                    entityType === "VENUE_RESERVATION" ||
                                    entityType ===
                                        "VENUE_RESERVATION_APPROVED" ||
                                    entityType ===
                                        "VENUE_RESERVATION_REJECTED" ||
                                    entityType ===
                                        "VENUE_RESERVATION_REQUEST" ||
                                    entityType === "EQUIPMENT_RESERVATION" ||
                                    entityType ===
                                        "EQUIPMENT_RESERVATION_APPROVED" ||
                                    entityType ===
                                        "EQUIPMENT_RESERVATION_REJECTED" ||
                                    entityType ===
                                        "EQUIPMENT_RESERVATION_FULLY_APPROVED"
                                ) {
                                    canNavigate = true;
                                    targetPath = `/app/events/${entityId}`;
                                } else if (
                                    entityType ===
                                    "EQUIPMENT_RESERVATION_REQUEST"
                                ) {
                                    canNavigate = true;
                                    // Ensure this path matches your route definition
                                    targetPath =
                                        "/app/equipment-approval/approval";
                                }
                                // Add more 'else if' for other types if needed
                            }

                            return (
                                <DropdownMenuItem
                                    key={notification.publicId}
                                    // Use onClick for combined action
                                    onClick={() => {
                                        if (!notification.isRead) {
                                            handleMarkRead(
                                                notification.publicId,
                                            );
                                        }
                                        if (canNavigate) {
                                            navigate({ to: targetPath });
                                        }
                                        // If !canNavigate, clicking just marks as read
                                    }}
                                    // Remove onSelect
                                    // --- Use items-start like the other dropdown ---
                                    className={`items-start space-x-3 ${notification.isRead ? "opacity-60" : ""} ${canNavigate ? "cursor-pointer" : "cursor-default"}`} // Adjust cursor
                                >
                                    {/* --- Add Icon --- */}
                                    <div
                                        className={`mt-1 p-1 rounded-full ${color} bg-opacity-10`}
                                    >
                                        <Icon className={`h-4 w-4 ${color}`} />
                                    </div>

                                    {/* --- Use flex-1 space-y-0.5 like the other dropdown --- */}
                                    <div className="flex-1 space-y-0.5">
                                        {/* --- Use generated title --- */}
                                        <p className="text-sm font-medium leading-snug line-clamp-1">
                                            {title}
                                        </p>
                                        {/* --- Access nested message string --- */}
                                        <p className="text-sm text-muted-foreground leading-snug line-clamp-2">
                                            {
                                                typeof notification.message ===
                                                "string"
                                                    ? notification.message // Display if notification.message itself is the string
                                                    : typeof notification
                                                            .message
                                                            ?.message ===
                                                        "string" // Check nested if message is object
                                                      ? notification.message
                                                            .message
                                                      : notification.message // Check if message object exists
                                                        ? `Details: ${JSON.stringify(notification.message).slice(0, 100)}...` // Stringify the whole message object for context (shorter for dropdown)
                                                        : "No message content." // Fallback
                                            }
                                        </p>
                                        {/* --- Add condensed additional fields --- */}
                                        {/* {notification.message?.eventName && (
											<span className="flex items-center gap-0.5">
												<Calendar className="h-3 w-3 opacity-70" />
												{typeof notification.message.eventName === "string"
													? notification.message.eventName
													: String(notification.message.eventName)}
											</span>
										)} */}
                                        {/* {notification.message?.approver && (
											<span className="flex items-center gap-0.5">
												<User className="h-3 w-3 opacity-70" />
												{typeof notification.message.approver === "string"
													? notification.message.approver
													: String(notification.message.approver)}
											</span>
										)} */}
                                        {/* --- Use consistent timestamp format --- */}
                                        <p className="text-xs text-muted-foreground">
                                            {new Date(
                                                notification.createdAt,
                                            ).toLocaleString([], {
                                                dateStyle: "short",
                                                timeStyle: "short",
                                            })}
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
                        className="cursor-pointer w-full justify-center" // Center text
                    >
                        View all notifications
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                    onSelect={handleMarkAllRead} // Keep onSelect here
                    className="cursor-pointer justify-center" // Center text
                    disabled={
                        unreadCount === 0 || markAllReadMutation.isPending
                    }
                >
                    Mark all as read
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
