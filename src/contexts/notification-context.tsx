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
import { webSocketStatusAtom } from "@/lib/notifications"; // Adjust path if needed
import type { NotificationDTO } from "@/lib/notifications"; // Import DTO type
import {
    notificationsQueryOptions,
    unreadNotificationsCountQueryOptions,
    useMarkAllNotificationsReadMutation,
    useMarkNotificationsReadMutation,
} from "@/lib/query";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useAtom } from "jotai";
import { Bell, Calendar, User } from "lucide-react"; // Import necessary icons

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

export function NotificationCenter() {
    const [connectionStatus] = useAtom(webSocketStatusAtom);
    const queryClient = useQueryClient();

    // Fetch unread count
    const { data: countData } = useQuery(unreadNotificationsCountQueryOptions);
    const unreadCount = countData?.unreadCount ?? 0;

    const params = { page: 0, size: 7 } as const;
    const { data: notificationsData, isLoading: isLoadingNotifications } =
        useQuery(notificationsQueryOptions(params));

    const notifications = notificationsData?.content ?? [];

    // Mutations
    const markReadMutation = useMarkNotificationsReadMutation();
    const markAllReadMutation = useMarkAllNotificationsReadMutation();

    const handleMarkRead = (id: number) => {
        if (id) {
            markReadMutation.mutate([id]);
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
    else if (connectionStatus === "closed")
        statusIndicatorColor = "bg-gray-400";

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
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
            <DropdownMenuContent className="w-60 md:w-76" align="end">
                {" "}
                {/* Consistent width */}
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                            Notifications ({connectionStatus})
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
                            // --- Generate title using helper ---
                            const title =
                                generateNotificationTitle(notification);
                            return (
                                <DropdownMenuItem
                                    key={notification.id}
                                    onSelect={(e) => {
                                        e.preventDefault();
                                        if (!notification.read) {
                                            handleMarkRead(notification.id);
                                        }
                                    }}
                                    // --- Use items-start like the other dropdown ---
                                    className={`cursor-pointer items-start space-x-3 ${notification.read ? "opacity-60" : ""}`}
                                >
                                    {/* --- Add Icon (optional but consistent) --- */}
                                    {/* <div className={`mt-1 p-1 rounded-full ${color} bg-opacity-10`}>
                                        <Icon className={`h-4 w-4 ${color}`} />
                                    </div> */}

                                    {/* --- Use flex-1 space-y-0.5 like the other dropdown --- */}
                                    <div className="flex-1 space-y-0.5">
                                        {/* --- Use generated title --- */}
                                        <p className="text-sm font-medium leading-snug line-clamp-1">
                                            {title}
                                        </p>
                                        {/* --- Access nested message string --- */}
                                        <p className="text-sm text-muted-foreground leading-snug line-clamp-2">
                                            {typeof notification.message
                                                ?.message === "string"
                                                ? notification.message.message
                                                : "Invalid content format."}
                                        </p>
                                        {/* --- Add condensed additional fields (optional) --- */}
                                        {/* ... similar to NotificationDropdown ... */}
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
                    onSelect={handleMarkAllRead}
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
