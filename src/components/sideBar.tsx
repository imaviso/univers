import { Button, buttonVariants } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { NotificationCenter } from "@/contexts/notification-context";
import { userDetailsAtom } from "@/lib/atoms";
import { isAuthenticated, useCurrentUser } from "@/lib/query";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import { useRouterState } from "@tanstack/react-router";
import { useAtom } from "jotai";
import {
    BookCheck,
    BookText,
    Building,
    CalendarDays,
    ChevronLeft,
    Home,
    LayoutGrid,
    Menu,
    Package,
    PackageCheck,
    PackagePlus,
    Settings,
    Users,
} from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";

const mainNavigation = [
    { name: "Dashboard", href: "/app/dashboard", icon: Home },
    { name: "Calendar", href: "/app/calendar", icon: CalendarDays },
    { name: "Events", href: "/app/events/timeline", icon: LayoutGrid },
    { name: "Venues", href: "/app/venues/management", icon: Building },
    {
        name: "Venue Approval",
        href: "/app/venue-approval/approval",
        icon: BookCheck,
    },
    {
        name: "Venue Reservation",
        href: "/app/venue-reservation",
        icon: BookText,
    },
    { name: "Users", href: "/app/user-management/users", icon: Users },
    { name: "Equipments", href: "/app/equipments", icon: Package },
    {
        name: "Equipment Approval",
        href: "/app/equipment-approval/approval",
        icon: PackageCheck,
    },
    {
        name: "Equipment Reservation",
        href: "/app/equipment-reservation",
        icon: PackagePlus,
    },
];

export function Sidebar() {
    const pathname = useRouterState({ select: (s) => s.location.pathname });
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const { data: user, isLoading, isError } = useCurrentUser();
    const initials = user
        ? `${user.firstName?.charAt(0)}${user.lastName?.charAt(0)}`
        : "UV"; // Default initials
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
                                    <span className="text-lg">UniVERS</span>
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
                                {mainNavigation.map((item) => (
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
                                ))}
                            </div>
                            <Separator className="my-4" />
                        </ScrollArea>
                    </div>
                    {isCollapsed ? (
                        <div className="flex flex-col gap-1 border-t border-r border-border p-4">
                            <div className="flex justify-center">
                                <NotificationCenter />
                            </div>
                            <div className="flex justify-center">
                                <Link
                                    to="/app/settings"
                                    className={cn(
                                        buttonVariants({
                                            variant: "ghost",
                                            size: "icon",
                                        }),
                                    )}
                                >
                                    <Settings className="h-4 w-4" />
                                </Link>
                            </div>
                            <div className="flex justify-center">
                                <Tooltip delayDuration={0}>
                                    <TooltipTrigger asChild>
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src="/placeholder.svg?height=32&width=32" />
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
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <div className="flex items-center gap-2">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src="/placeholder.svg?height=32&width=32" />
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
                            <Link
                                to="/app/settings"
                                className={cn(
                                    buttonVariants({
                                        variant: "ghost",
                                        size: "icon",
                                    }),
                                    "ml-auto",
                                )}
                            >
                                <Settings className="h-4 w-4" />
                            </Link>
                        </div>
                    )}
                </div>
            </>
        </TooltipProvider>
    );
}
