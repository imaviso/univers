import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox"; // Import Checkbox
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
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination"; // Import Pagination
import type { NotificationDTO } from "@/lib/notifications"; // Import DTO type
import {
    notificationsQueryOptions,
    useDeleteNotificationsMutation,
    useMarkAllNotificationsReadMutation,
    useMarkNotificationsReadMutation,
} from "@/lib/query"; // Import query hooks and options
import { useQuery } from "@tanstack/react-query"; // Import useQuery
// import { useAtom, useSetAtom } from "jotai";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { format } from "date-fns";
import {
    AlertTriangle,
    Bell,
    Calendar,
    Check,
    CheckCircle2,
    Filter,
    Hash,
    Info,
    Loader2,
    type LucideIcon,
    Tag, // Loading icon
    Trash2,
    User,
    XCircle,
} from "lucide-react";
import { useMemo, useState } from "react"; // Import useMemo
import { toast } from "sonner";

export const Route = createFileRoute("/app/notifications")({
    component: NotificationsPage, // Rename component
    beforeLoad: async ({ location, context }) => {
        // Auth check remains the same
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

// Rename component
function NotificationsPage() {
    // State for pagination, filtering, search, and selection
    const [currentPage, setCurrentPage] = useState(0); // 0-indexed page
    const [filter, setFilter] = useState<"all" | "unread">("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const notificationsPerPage = 10; // Or make this configurable

    // Fetch notifications using React Query
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

    // Extract notifications content or default to empty array
    const notifications = useMemo(
        () => notificationsData?.content ?? [],
        [notificationsData],
    );
    const totalPages = useMemo(
        () => notificationsData?.totalPages ?? 0,
        [notificationsData],
    );

    // Mutations
    const markReadMutation = useMarkNotificationsReadMutation();
    const markAllReadMutation = useMarkAllNotificationsReadMutation();
    const deleteNotificationsMutation = useDeleteNotificationsMutation();

    const filteredNotifications = useMemo(() => {
        return notifications
            .filter((notification) => {
                if (filter === "unread") return !notification.read; // Use 'read' field
                return true;
            })
            .filter((notification) => {
                const searchLower = searchQuery.toLowerCase();
                // Search within the nested message text and top-level entity type
                return (
                    (typeof notification.message?.message === "string" &&
                        notification.message.message
                            .toLowerCase()
                            .includes(searchLower)) ||
                    notification.relatedEntityType
                        ?.toLowerCase()
                        .includes(searchLower) ||
                    notification.message?.eventName // Also search event name
                        ?.toLowerCase()
                        .includes(searchLower)
                );
            });
    }, [notifications, filter, searchQuery]);

    // --- Action Handlers ---
    const handleMarkRead = (id: number) => {
        markReadMutation.mutate([id]);
    };

    const handleMarkAllAsRead = () => {
        markAllReadMutation.mutate();
    };

    const handleDeleteSelected = () => {
        if (selectedIds.size > 0) {
            deleteNotificationsMutation.mutate([...selectedIds], {
                onSuccess: () => {
                    setSelectedIds(new Set()); // Clear selection on success
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

    // --- Selection Logic ---
    const handleSelectAll = (checked: boolean | "indeterminate") => {
        if (checked === true) {
            setSelectedIds(new Set(filteredNotifications.map((n) => n.id)));
        } else {
            setSelectedIds(new Set());
        }
    };

    const handleSelectOne = (
        id: number,
        checked: boolean | "indeterminate",
    ) => {
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

    // --- Icon Logic --- (Similar to Dropdown)
    const getNotificationIcon = (
        notification: NotificationDTO,
    ): { Icon: LucideIcon; color: string } => {
        // Use nested type and message, fallback to top-level entity type
        const type =
            notification.message?.type?.toLowerCase() ||
            notification.relatedEntityType?.toLowerCase() ||
            "";
        const messageText =
            typeof notification.message?.message === "string"
                ? notification.message.message.toLowerCase()
                : "";

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

    // --- Pagination Logic ---
    const handlePageChange = (page: number) => {
        if (page >= 0 && page < totalPages) {
            setCurrentPage(page);
            setSelectedIds(new Set()); // Clear selection when changing page
        }
    };

    // --- JSX ---
    return (
        <div className="flex h-screen flex-col bg-background">
            {" "}
            {/* Ensure vertical flex */}
            {/* Header */}
            <header className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3 md:px-6 md:py-3.5">
                {" "}
                {/* Flex wrap for smaller screens */}
                <h1 className="text-xl font-semibold">Notifications</h1>
                <div className="flex flex-wrap items-center gap-2">
                    {" "}
                    {/* Flex wrap */}
                    {/* Search Input */}
                    <Input
                        type="search"
                        placeholder="Search..."
                        className="w-full sm:w-48 md:w-64" // Responsive width
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {/* Filter Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-1"
                            >
                                {" "}
                                {/* Smaller button */}
                                <Filter className="h-4 w-4" />
                                <span>
                                    {filter === "unread" ? "Unread" : "All"}
                                </span>
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
                            <DropdownMenuItem
                                onSelect={() => setFilter("unread")}
                            >
                                <Check
                                    className={`mr-2 h-4 w-4 ${filter === "unread" ? "opacity-100" : "opacity-0"}`}
                                />
                                Unread notifications
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    {/* Mark All Read Button */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleMarkAllAsRead}
                        disabled={markAllReadMutation.isPending || isLoading}
                    >
                        <Check className="mr-1.5 h-4 w-4" />
                        Mark all read
                    </Button>
                    {/* Delete Selected Button */}
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
                {" "}
                {/* Allow vertical scroll */}
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
                            Error loading notifications:{" "}
                            {error?.message || "Unknown error"}
                        </div>
                    )}

                    {/* Empty State */}
                    {!isLoading &&
                        !isError &&
                        filteredNotifications.length === 0 && (
                            <div className="text-center text-muted-foreground py-10">
                                {searchQuery || filter === "unread"
                                    ? "No matching notifications found."
                                    : "You have no notifications."}
                            </div>
                        )}

                    {/* Notification List */}
                    {!isError &&
                        filteredNotifications.map((notification) => {
                            const { Icon, color } =
                                getNotificationIcon(notification);
                            const title =
                                generateNotificationTitle(notification);
                            return (
                                <div
                                    key={notification.id}
                                    className={`flex items-start gap-4 p-4 rounded-lg border ${
                                        notification.read // Use 'read' field
                                            ? "bg-background"
                                            : "bg-muted"
                                    }`}
                                >
                                    {/* Checkbox */}
                                    <Checkbox
                                        id={`select-${notification.id}`}
                                        checked={selectedIds.has(
                                            notification.id,
                                        )}
                                        onCheckedChange={(checked) =>
                                            handleSelectOne(
                                                notification.id,
                                                checked,
                                            )
                                        }
                                        className="mt-1"
                                        aria-labelledby={`notification-title-${notification.id}`}
                                    />
                                    {/* Icon */}
                                    <div className={`mt-1 ${color}`}>
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    {/* Content */}
                                    <div className="flex-1 space-y-1">
                                        {" "}
                                        {/* Add space-y-1 for better spacing */}
                                        <h3
                                            id={`notification-title-${notification.id}`}
                                            className="text-sm font-medium"
                                        >
                                            {title} {/* Use generated title */}
                                        </h3>
                                        {/* Main Message */}
                                        <p className="text-sm text-muted-foreground">
                                            {typeof notification.message
                                                ?.message === "object"
                                                ? JSON.stringify(
                                                      notification.message
                                                          ?.message,
                                                  )
                                                : (notification.message
                                                      ?.message ??
                                                  "No content.")}
                                        </p>
                                        {/* Timestamp */}
                                        <p className="text-xs text-muted-foreground pt-1">
                                            {" "}
                                            {/* Add padding-top */}
                                            {format(
                                                new Date(
                                                    notification.createdAt,
                                                ),
                                                "MMM d, yyyy 'at' h:mm a",
                                            )}
                                        </p>
                                    </div>
                                    {/* Mark as Read Button */}
                                    {!notification.read && ( // Use 'read' field
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                                handleMarkRead(notification.id)
                                            }
                                            disabled={
                                                markReadMutation.isPending
                                            }
                                            className="self-start" // Align button to top
                                        >
                                            Mark read
                                        </Button>
                                    )}
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
                                        currentPage === 0
                                            ? "pointer-events-none opacity-50"
                                            : ""
                                    }
                                />
                            </PaginationItem>
                            {/* Basic Page Number Display - Can be enhanced */}
                            <PaginationItem>
                                <span className="px-4 text-sm">
                                    Page {currentPage + 1} of {totalPages}
                                </span>
                            </PaginationItem>
                            {/* Add more complex pagination links if needed */}
                            <PaginationItem>
                                <PaginationNext
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handlePageChange(currentPage + 1);
                                    }}
                                    aria-disabled={
                                        currentPage >= totalPages - 1
                                    }
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
