import { CreateEventButton } from "@/components/events/createEventButton";
import { EventDetailsModal } from "@/components/events/eventDetailsModal";
import { EventModal } from "@/components/events/eventModal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { createFileRoute, redirect } from "@tanstack/react-router";
import {
    addDays,
    addMonths,
    format,
    getDay,
    getDaysInMonth,
    isSameDay,
    isSameMonth,
    startOfMonth,
    startOfWeek,
    subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight, Filter, Plus } from "lucide-react";
import { useState } from "react";

const allowedRoles: string[] = [
    "SUPER_ADMIN",
    "ORGANIZER",
    "VPAA",
    "EQUIPMENT_OWNER",
    "VENUE_OWNER",
    "VP_ADMIN",
];
export const Route = createFileRoute("/app/calendar")({
    component: Calendar,
    beforeLoad: async ({ location, context }) => {
        if (!allowedRoles.includes(context.role)) {
            throw redirect({
                to: "/auth/login",
                search: {
                    redirect: location.href,
                },
            });
        }
    },
});
// Sample events data
const events = [
    {
        id: 1,
        title: "Annual Tech Conference",
        date: "2025-03-15",
        endDate: "2025-03-17",
        location: "San Francisco, CA",
        status: "planning",
        color: "blue",
        workspace: "conferences",
    },
    {
        id: 2,
        title: "Product Launch: Version 2.0",
        date: "2025-03-05",
        location: "Virtual Event",
        status: "confirmed",
        color: "green",
        workspace: "product-launches",
    },
    {
        id: 3,
        title: "Quarterly Team Building",
        date: "2025-03-22",
        location: "Central Park, NY",
        status: "completed",
        color: "purple",
        workspace: "team-building",
    },
    {
        id: 4,
        title: "Marketing Strategy Workshop",
        date: "2025-03-03",
        location: "Chicago, IL",
        status: "planning",
        color: "blue",
        workspace: "marketing-events",
    },
    {
        id: 5,
        title: "Customer Appreciation Day",
        date: "2025-03-15",
        location: "Boston, MA",
        status: "planning",
        color: "orange",
        workspace: "marketing-events",
    },
    {
        id: 6,
        title: "Board Meeting",
        date: "2025-03-10",
        location: "New York, NY",
        status: "confirmed",
        color: "green",
        workspace: "conferences",
    },
    {
        id: 7,
        title: "Sales Team Training",
        date: "2025-03-08",
        location: "Atlanta, GA",
        status: "planning",
        color: "blue",
        workspace: "team-building",
    },
    {
        id: 8,
        title: "Website Redesign Kickoff",
        date: "2025-03-12",
        location: "Remote",
        status: "confirmed",
        color: "green",
        workspace: "marketing-events",
    },
];

// Workspace data
const workspaces = [
    { id: "marketing-events", name: "Marketing Events", color: "bg-blue-500" },
    { id: "product-launches", name: "Product Launches", color: "bg-green-500" },
    { id: "team-building", name: "Team Building", color: "bg-purple-500" },
    { id: "conferences", name: "Conferences", color: "bg-orange-500" },
];

// Status filters
const statusFilters = [
    { id: "planning", name: "Planning", color: "bg-blue-500" },
    { id: "confirmed", name: "Confirmed", color: "bg-green-500" },
    { id: "completed", name: "Completed", color: "bg-purple-500" },
];

// Helper function to get events for a specific date
const getEventsForDate = (
    date: string,
    filters: { workspaces: string[]; statuses: string[] },
) => {
    return events.filter((event) => {
        // Apply workspace and status filters
        const workspaceMatch =
            filters.workspaces.length === 0 ||
            filters.workspaces.includes(event.workspace);
        const statusMatch =
            filters.statuses.length === 0 ||
            filters.statuses.includes(event.status);

        if (!workspaceMatch || !statusMatch) return false;

        // Handle multi-day events
        if (event.endDate) {
            return date >= event.date && date <= event.endDate;
        }
        return event.date === date;
    });
};

// Helper function to get color for event status
const getStatusColor = (status: string) => {
    switch (status) {
        case "planning":
            return "bg-blue-500";
        case "confirmed":
            return "bg-green-500";
        case "completed":
            return "bg-purple-500";
        default:
            return "bg-gray-500";
    }
};

// Generate week days
const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function Calendar() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<any>(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [calendarView, setCalendarView] = useState<"month" | "week" | "day">(
        "month",
    );
    const [filters, setFilters] = useState({
        workspaces: [] as string[],
        statuses: [] as string[],
    });
    const [createEventDate, setCreateEventDate] = useState<Date | null>(null);

    // Handle workspace filter toggle
    const toggleWorkspaceFilter = (workspaceId: string) => {
        setFilters((prev) => {
            const workspaces = prev.workspaces.includes(workspaceId)
                ? prev.workspaces.filter((id) => id !== workspaceId)
                : [...prev.workspaces, workspaceId];
            return { ...prev, workspaces };
        });
    };

    // Handle status filter toggle
    const toggleStatusFilter = (statusId: string) => {
        setFilters((prev) => {
            const statuses = prev.statuses.includes(statusId)
                ? prev.statuses.filter((id) => id !== statusId)
                : [...prev.statuses, statusId];
            return { ...prev, statuses };
        });
    };

    // Previous month/week/day
    const handlePrev = () => {
        if (calendarView === "month") {
            setCurrentDate(subMonths(currentDate, 1));
        } else if (calendarView === "week") {
            setCurrentDate(addDays(currentDate, -7));
        } else {
            setCurrentDate(addDays(currentDate, -1));
        }
    };

    // Next month/week/day
    const handleNext = () => {
        if (calendarView === "month") {
            setCurrentDate(addMonths(currentDate, 1));
        } else if (calendarView === "week") {
            setCurrentDate(addDays(currentDate, 7));
        } else {
            setCurrentDate(addDays(currentDate, 1));
        }
    };

    // Open event details
    const handleEventClick = (event: any) => {
        setSelectedEvent(event);
        setIsDetailsModalOpen(true);
    };

    // Create event from calendar cell
    const handleCellClick = (date: Date) => {
        setCreateEventDate(date);
        setIsCreateModalOpen(true);
    };

    // Generate days for month view
    const generateMonthDays = () => {
        const daysInMonth = getDaysInMonth(currentDate);
        const firstDayOfMonth = getDay(startOfMonth(currentDate));

        // Generate days array for the calendar
        const days = Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const date = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            return {
                day,
                date,
                events: getEventsForDate(date, filters),
            };
        });

        return { days, firstDayOfMonth };
    };

    // Generate days for week view
    const generateWeekDays = () => {
        const startDate = startOfWeek(currentDate);

        // Generate 7 days starting from the start of the week
        const days = Array.from({ length: 7 }, (_, i) => {
            const date = addDays(startDate, i);
            const dateString = format(date, "yyyy-MM-dd");
            return {
                day: date.getDate(),
                date: dateString,
                fullDate: date,
                events: getEventsForDate(dateString, filters),
                isCurrentMonth: isSameMonth(date, currentDate),
            };
        });

        return days;
    };

    // Generate hours for day view
    const generateDayHours = () => {
        // Generate hours from 8 AM to 8 PM
        const hours = Array.from({ length: 13 }, (_, i) => {
            const hour = i + 8;
            return {
                hour: hour > 12 ? hour - 12 : hour,
                ampm: hour >= 12 ? "PM" : "AM",
                label: `${hour > 12 ? hour - 12 : hour} ${hour >= 12 ? "PM" : "AM"}`,
            };
        });

        const dateString = format(currentDate, "yyyy-MM-dd");
        const dayEvents = getEventsForDate(dateString, filters);

        return { hours, dayEvents };
    };

    // Render month view
    const renderMonthView = () => {
        const { days, firstDayOfMonth } = generateMonthDays();

        return (
            <div className="space-y-2">
                <div className="grid grid-cols-7 gap-1 text-center text-sm font-medium">
                    {weekDays.map((day) => (
                        <div key={day} className="py-2">
                            {day}
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                    {/* Empty cells for days before the first day of the month */}
                    {Array.from({ length: firstDayOfMonth }).map((_, index) => (
                        <div key={`empty-${index}`} className="h-32 p-1" />
                    ))}

                    {/* Calendar days */}
                    {days.map((day) => (
                        <Card
                            key={day.date}
                            className="h-32 overflow-hidden hover:shadow-sm transition-shadow relative"
                            onClick={() => handleCellClick(new Date(day.date))}
                        >
                            <div className="p-1 h-full">
                                <div className="text-xs font-medium p-1">
                                    {day.day}
                                </div>
                                <div className="space-y-1 overflow-auto max-h-[calc(100%-24px)]">
                                    {day.events.map((event) => (
                                        <div
                                            key={event.id}
                                            className={`${getStatusColor(event.status)} text-white text-xs p-1 rounded truncate cursor-pointer`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleEventClick(event);
                                            }}
                                        >
                                            {event.title}
                                        </div>
                                    ))}
                                </div>
                                {day.events.length === 0 && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 hover:opacity-100"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleCellClick(new Date(day.date));
                                        }}
                                    >
                                        <Plus className="h-3 w-3" />
                                    </Button>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        );
    };

    // Render week view
    const renderWeekView = () => {
        const weekDays = generateWeekDays();

        return (
            <div className="space-y-2">
                <div className="grid grid-cols-7 gap-1">
                    {weekDays.map((day, index) => (
                        <div
                            key={day.date}
                            className={cn(
                                "text-center p-2 font-medium text-sm rounded-md",
                                !day.isCurrentMonth && "text-muted-foreground",
                                isSameDay(day.fullDate, new Date()) &&
                                    "bg-primary/10 text-primary",
                            )}
                        >
                            <div>{weekDays[index].fullDate.getDate()}</div>
                            <div className="text-xs">
                                {format(weekDays[index].fullDate, "EEE")}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-1 h-[calc(100vh-240px)]">
                    {weekDays.map((day) => (
                        <Card
                            key={day.date}
                            className={cn(
                                "overflow-auto p-2 hover:shadow-sm transition-shadow",
                                !day.isCurrentMonth && "bg-muted/50",
                            )}
                            onClick={() => handleCellClick(day.fullDate)}
                        >
                            <div className="space-y-1">
                                {day.events.map((event) => (
                                    <div
                                        key={event.id}
                                        className={`${getStatusColor(event.status)} text-white text-xs p-2 rounded cursor-pointer`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleEventClick(event);
                                        }}
                                    >
                                        <div className="font-medium">
                                            {event.title}
                                        </div>
                                        <div className="text-[10px] opacity-90">
                                            {event.location}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        );
    };

    // Render day view
    const renderDayView = () => {
        const { hours, dayEvents } = generateDayHours();

        return (
            <div className="space-y-4">
                <div className="text-center">
                    <h3 className="text-lg font-medium">
                        {format(currentDate, "EEEE, MMMM d, yyyy")}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        {dayEvents.length}{" "}
                        {dayEvents.length === 1 ? "event" : "events"}
                    </p>
                </div>

                <div className="grid grid-cols-[80px_1fr] gap-2 h-[calc(100vh-240px)]">
                    <div className="space-y-8 pt-8">
                        {hours.map((hour) => (
                            <div
                                key={hour.label}
                                className="text-xs text-muted-foreground text-right pr-2"
                            >
                                {hour.label}
                            </div>
                        ))}
                    </div>

                    <Card className="relative overflow-hidden p-2">
                        {hours.map((hour, index) => (
                            <div
                                key={hour.label}
                                className="absolute w-full border-t border-border"
                                style={{
                                    top: `${(index / hours.length) * 100}%`,
                                }}
                            />
                        ))}

                        {dayEvents.map((event) => {
                            // For demo purposes, position events randomly within the day view
                            // In a real app, you would calculate position based on event start/end times
                            const top = Math.floor(Math.random() * 70) + 5;
                            const height = Math.floor(Math.random() * 10) + 5;

                            return (
                                <div
                                    key={event.id}
                                    className={`${getStatusColor(event.status)} text-white text-xs p-2 rounded absolute left-2 right-2 cursor-pointer`}
                                    style={{
                                        top: `${top}%`,
                                        height: `${height}%`,
                                    }}
                                    onClick={() => handleEventClick(event)}
                                >
                                    <div className="font-medium">
                                        {event.title}
                                    </div>
                                    <div className="text-[10px] opacity-90">
                                        {event.location}
                                    </div>
                                </div>
                            );
                        })}
                    </Card>
                </div>
            </div>
        );
    };

    return (
        <>
            <div className="flex flex-col flex-1 overflow-hidden">
                <header className="flex items-center justify-between border-b px-6 py-3.5">
                    <div className="flex items-center gap-4">
                        <h1 className="text-xl font-semibold">Calendar</h1>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handlePrev}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="text-sm font-medium">
                                {calendarView === "day"
                                    ? format(currentDate, "MMMM d, yyyy")
                                    : calendarView === "week"
                                      ? `Week of ${format(startOfWeek(currentDate), "MMM d")}`
                                      : format(currentDate, "MMMM yyyy")}
                            </span>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleNext}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setCurrentDate(new Date())}
                        >
                            Today
                        </Button>
                    </div>
                    <div className="flex items-center gap-2">
                        <Tabs
                            value={calendarView}
                            onValueChange={(value) =>
                                setCalendarView(
                                    value as "month" | "week" | "day",
                                )
                            }
                            className="mr-2"
                        >
                            <TabsList className="grid w-[180px] grid-cols-3">
                                <TabsTrigger value="month">Month</TabsTrigger>
                                <TabsTrigger value="week">Week</TabsTrigger>
                                <TabsTrigger value="day">Day</TabsTrigger>
                            </TabsList>
                        </Tabs>

                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-1"
                                >
                                    <Filter className="h-4 w-4" />
                                    Filter
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64" align="end">
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="font-medium mb-2">
                                            Workspaces
                                        </h3>
                                        <div className="space-y-2">
                                            {workspaces.map((workspace) => (
                                                <div
                                                    key={workspace.id}
                                                    className="flex items-center space-x-2"
                                                >
                                                    <Checkbox
                                                        id={`workspace-${workspace.id}`}
                                                        checked={filters.workspaces.includes(
                                                            workspace.id,
                                                        )}
                                                        onCheckedChange={() =>
                                                            toggleWorkspaceFilter(
                                                                workspace.id,
                                                            )
                                                        }
                                                    />
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className={`h-3 w-3 rounded-full ${workspace.color}`}
                                                        />
                                                        <Label
                                                            htmlFor={`workspace-${workspace.id}`}
                                                            className="text-sm font-normal"
                                                        >
                                                            {workspace.name}
                                                        </Label>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <Separator />

                                    <div>
                                        <h3 className="font-medium mb-2">
                                            Status
                                        </h3>
                                        <div className="space-y-2">
                                            {statusFilters.map((status) => (
                                                <div
                                                    key={status.id}
                                                    className="flex items-center space-x-2"
                                                >
                                                    <Checkbox
                                                        id={`status-${status.id}`}
                                                        checked={filters.statuses.includes(
                                                            status.id,
                                                        )}
                                                        onCheckedChange={() =>
                                                            toggleStatusFilter(
                                                                status.id,
                                                            )
                                                        }
                                                    />
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className={`h-3 w-3 rounded-full ${status.color}`}
                                                        />
                                                        <Label
                                                            htmlFor={`status-${status.id}`}
                                                            className="text-sm font-normal"
                                                        >
                                                            {status.name}
                                                        </Label>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex justify-between">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                setFilters({
                                                    workspaces: [],
                                                    statuses: [],
                                                })
                                            }
                                        >
                                            Reset
                                        </Button>
                                        <Button size="sm">Apply Filters</Button>
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>

                        <CreateEventButton
                            onClick={() => setIsCreateModalOpen(true)}
                        />
                    </div>
                </header>
                <main className="flex-1 overflow-auto p-6">
                    {calendarView === "month" && renderMonthView()}
                    {calendarView === "week" && renderWeekView()}
                    {calendarView === "day" && renderDayView()}
                </main>
            </div>
            <EventModal
                isOpen={isCreateModalOpen}
                onClose={() => {
                    setIsCreateModalOpen(false);
                    setCreateEventDate(null);
                }}
                initialDate={createEventDate}
            />
            <EventDetailsModal
                isOpen={isDetailsModalOpen}
                onClose={() => setIsDetailsModalOpen(false)}
                event={selectedEvent}
            />
        </>
    );
}
