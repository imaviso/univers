import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { NotificationCenter } from "@/contexts/notification-context";
import { userSignOut } from "@/lib/auth";
import { allNavigation } from "@/lib/navigation";
import { useCurrentUser } from "@/lib/query";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { useRouterState } from "@tanstack/react-router";
import { Bell, ChevronLeft, LogOut, Menu, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";

export function Sidebar() {
    const pathname = useRouterState({ select: (s) => s.location.pathname });
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const { data: user, isLoading, isError } = useCurrentUser();
    const [navigation, setNavigation] = useState(allNavigation);
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const initials = user
        ? `${user.firstName?.charAt(0)}${user.lastName?.charAt(0)}`
        : "UV"; // Default initials

    useEffect(() => {
        if (user) {
            const filteredNavigation = allNavigation.filter((item) =>
                item.roles.includes(user.role),
            );
            setNavigation(filteredNavigation);
        }
    }, [user]);

    const handleLogout = async () => {
        try {
            await userSignOut();
            queryClient.clear();
            navigate({ to: "/login" });
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    return (
        <TooltipProvider>
            <>
                <Button
                    className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-primary rounded-md shadow-md"
                    onClick={() => setIsMobileOpen(!isMobileOpen)}
                    aria-label="Toggle sidebar"
                >
                    <Menu className="text-foreground h-6 w-6" />
                </Button>
                <div
                    className={cn(
                        "fixed inset-y-0 z-20 flex flex-col bg-card transition-all duration-300 ease-in-out lg:static",
                        isCollapsed ? "w-[72px]" : "w-72",
                        isMobileOpen
                            ? "translate-x-0"
                            : "-translate-x-full lg:translate-x-0",
                    )}
                >
                    <div className="border-b border-r border-border">
                        <div
                            className={cn(
                                "flex h-16 items-center px-4",
                                isCollapsed
                                    ? "flex-col gap-1 justify-center"
                                    : "justify-between",
                            )}
                        >
                            {!isCollapsed && (
                                <Link
                                    to="/"
                                    className="flex items-center font-semibold"
                                >
                                    <span className="text-primary">Uni</span>
                                    <span className="relative">
                                        <span className="bg-primary text-white px-1">
                                            VERS
                                        </span>
                                    </span>
                                </Link>
                            )}
                            <div
                                className={cn(
                                    isCollapsed
                                        ? "flex flex-col items-center gap-1"
                                        : "flex items-center gap-2",
                                )}
                            >
                                {!isCollapsed && <NotificationCenter />}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={cn(
                                        "h-8 w-8",
                                        !isCollapsed && "ml-auto",
                                    )}
                                    onClick={() => setIsCollapsed(!isCollapsed)}
                                >
                                    <ChevronLeft
                                        className={cn(
                                            "h-4 w-4 transition-transform",
                                            isCollapsed && "rotate-180",
                                        )}
                                    />
                                    <span className="sr-only">
                                        {isCollapsed ? "Expand" : "Collapse"}{" "}
                                        Sidebar
                                    </span>
                                </Button>
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 border-r">
                        <ScrollArea className="flex-1 px-2 py-4">
                            <div className="space-y-1">
                                {navigation.map((item) =>
                                    isCollapsed ? (
                                        <Tooltip
                                            key={item.name}
                                            delayDuration={700}
                                        >
                                            <TooltipTrigger asChild>
                                                <Link
                                                    to={item.href}
                                                    className={cn(
                                                        "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                                                        pathname === item.href
                                                            ? "bg-primary text-primary-foreground"
                                                            : "text-foreground hover:bg-secondary hover:text-secondary-foreground",
                                                        "justify-center px-2",
                                                    )}
                                                >
                                                    <item.icon className="h-4 w-4" />
                                                </Link>
                                            </TooltipTrigger>
                                            <TooltipContent side="right">
                                                {item.name}
                                            </TooltipContent>
                                        </Tooltip>
                                    ) : (
                                        <Link
                                            key={item.name}
                                            to={item.href}
                                            className={cn(
                                                "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                                                pathname === item.href
                                                    ? "bg-primary text-primary-foreground"
                                                    : "text-foreground hover:bg-secondary hover:text-secondary-foreground",
                                                isCollapsed &&
                                                    "justify-center px-2",
                                            )}
                                        >
                                            <item.icon
                                                className={cn(
                                                    "h-4 w-4",
                                                    !isCollapsed && "mr-1",
                                                )}
                                            />
                                            {!isCollapsed && (
                                                <span>{item.name}</span>
                                            )}
                                        </Link>
                                    ),
                                )}
                            </div>
                            <Separator className="my-4" />
                        </ScrollArea>
                    </div>
                    {isCollapsed ? (
                        <div className="flex flex-col gap-1 border-t border-r border-border p-4">
                            <div className="flex justify-center">
                                <Tooltip delayDuration={700}>
                                    <TooltipTrigger asChild>
                                        <div>
                                            <NotificationCenter />
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="right">
                                        Notifications
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                            <div className="flex justify-center">
                                <DropdownMenu>
                                    <Tooltip delayDuration={700}>
                                        <TooltipTrigger asChild>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                >
                                                    <Settings className="h-4 w-4" />
                                                    <span className="sr-only">
                                                        Settings
                                                    </span>
                                                </Button>
                                            </DropdownMenuTrigger>
                                        </TooltipTrigger>
                                        <TooltipContent side="right">
                                            Settings
                                        </TooltipContent>
                                    </Tooltip>
                                    <DropdownMenuContent
                                        align="end"
                                        className="w-56"
                                    >
                                        <DropdownMenuLabel>
                                            Settings
                                        </DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem asChild>
                                            <Link
                                                to="/app/settings/account"
                                                className="flex w-full items-center gap-2"
                                            >
                                                <Settings className="h-4 w-4" />
                                                <span>Account</span>
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link
                                                to="/app/settings/notifications"
                                                className="flex w-full items-center gap-2"
                                            >
                                                <Bell className="h-4 w-4" />
                                                <span>Notifications</span>
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            className="text-destructive focus:text-destructive cursor-pointer"
                                            onClick={handleLogout}
                                        >
                                            <LogOut className="h-4 w-4 mr-2" />
                                            <span>Logout</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            <div className="flex justify-center">
                                <Tooltip delayDuration={700}>
                                    <TooltipTrigger asChild>
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage
                                                src={
                                                    user?.profileImagePath ||
                                                    undefined
                                                }
                                            />
                                            <AvatarFallback>JD</AvatarFallback>
                                        </Avatar>
                                    </TooltipTrigger>
                                    <TooltipContent
                                        side="top"
                                        className="flex flex-col gap-1"
                                    >
                                        <span className="font-medium">
                                            {user?.firstName} {user?.lastName}
                                        </span>
                                        <span className="text-xs">
                                            {user?.email}
                                        </span>
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center border-t border-r border-border gap-2 p-4">
                            <Tooltip delayDuration={700}>
                                <TooltipTrigger asChild>
                                    <div className="flex items-center gap-2">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage
                                                src={
                                                    user?.profileImagePath ||
                                                    undefined
                                                }
                                            />
                                            <AvatarFallback>
                                                {initials}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium">
                                                {user?.firstName}{" "}
                                                {user?.lastName}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {user?.email}
                                            </span>
                                        </div>
                                    </div>
                                </TooltipTrigger>
                            </Tooltip>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="ml-auto h-8 w-8"
                                    >
                                        <Settings className="h-4 w-4" />
                                        <span className="sr-only">
                                            Settings
                                        </span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    align="end"
                                    className="w-56"
                                >
                                    <DropdownMenuLabel>
                                        Settings
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem asChild>
                                        <Link
                                            to="/app/settings/account"
                                            className="flex w-full items-center gap-2"
                                        >
                                            <Settings className="h-4 w-4" />
                                            <span>Account</span>
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link
                                            to="/app/settings/notifications"
                                            className="flex w-full items-center gap-2"
                                        >
                                            <Bell className="h-4 w-4" />
                                            <span>Notifications</span>
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        className="text-destructive focus:text-destructive cursor-pointer"
                                        onClick={handleLogout}
                                    >
                                        <LogOut className="h-4 w-4 mr-2" />
                                        <span>Logout</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    )}
                </div>
            </>
        </TooltipProvider>
    );
}
