import { Button } from "@/components/ui/button";
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
    type Notification,
    useNotification,
} from "@/contexts/notification-context";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { format } from "date-fns";
import { Bell, Check, Filter, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/notifications")({
    component: Notifications,
    beforeLoad: async ({ location, context }) => {
        const isAuthorized =
            "role" in context && // <-- Check if the key 'role' exists
            context.role != null; // <-- Optional but good: ensure role isn't null/undefined

        if (!isAuthorized) {
            throw redirect({
                to: "/login",
                search: {
                    redirect: location.href,
                },
            });
        }
    },
});

export function Notifications() {
    const { notifications, markAsRead, clearNotifications } = useNotification();
    const { addNotification } = useNotification();
    const [filter, setFilter] = useState<"all" | "unread">("all");
    const [searchQuery, setSearchQuery] = useState("");

    const filteredNotifications = notifications
        .filter((notification) => {
            if (filter === "unread") return !notification.read;
            return true;
        })
        .filter(
            (notification) =>
                notification.title
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase()) ||
                notification.description
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase()),
        );

    const handleMarkAllAsRead = () => {
        notifications.forEach((notification) => markAsRead(notification.id));
    };

    const getNotificationIcon = (type: Notification["type"]) => {
        switch (type) {
            case "success":
                return <Bell className="h-6 w-6 text-green-500" />;
            case "error":
                return <Bell className="h-6 w-6 text-red-500" />;
            case "warning":
                return <Bell className="h-6 w-6 text-yellow-500" />;
            default:
                return <Bell className="h-6 w-6 text-blue-500" />;
        }
    };

    const handleShowNotification = () => {
        const types = ["default", "success", "error", "warning"] as const;
        const randomType = types[Math.floor(Math.random() * types.length)];
        addNotification({
            title: `Test ${randomType} notification`,
            description: "This is a test notification message.",
            type: randomType,
        });
        toast(`Toast ${randomType} notification`, {
            description: "This is a test notification message.",
        });
    };

    return (
        <div className="flex h-screen bg-background">
            <div className="flex flex-col flex-1 overflow-hidden">
                <header className="flex items-center justify-between border-b px-6 py-3.5">
                    <h1 className="text-xl font-semibold">Notifications</h1>
                    <div className="flex items-center gap-2">
                        <Button
                            onClick={handleShowNotification}
                            size="sm"
                            className="gap-2"
                        >
                            <Bell className="h-4 w-4" />
                            Test Notification
                        </Button>
                        <Input
                            type="search"
                            placeholder="Search notifications..."
                            className="w-64"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="icon">
                                    <Filter className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Filter by</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onSelect={() => setFilter("all")}
                                >
                                    All notifications
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onSelect={() => setFilter("unread")}
                                >
                                    Unread notifications
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleMarkAllAsRead}
                        >
                            <Check className="mr-2 h-4 w-4" />
                            Mark all as read
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={clearNotifications}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Clear all
                        </Button>
                    </div>
                </header>
                <main className="flex-1 overflow-auto p-6">
                    <div className="space-y-4">
                        {filteredNotifications.length === 0 ? (
                            <div className="text-center text-muted-foreground">
                                No notifications found.
                            </div>
                        ) : (
                            filteredNotifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`flex items-start gap-4 p-4 rounded-lg border ${
                                        notification.read
                                            ? "bg-background"
                                            : "bg-muted"
                                    }`}
                                >
                                    {getNotificationIcon(notification.type)}
                                    <div className="flex-1">
                                        <h3 className="text-sm font-medium">
                                            {notification.title}
                                        </h3>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {notification.description}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-2">
                                            {format(
                                                new Date(
                                                    notification.timestamp,
                                                ),
                                                "MMM d, yyyy 'at' h:mm a",
                                            )}
                                        </p>
                                    </div>
                                    {!notification.read && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                                markAsRead(notification.id)
                                            }
                                        >
                                            Mark as read
                                        </Button>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
