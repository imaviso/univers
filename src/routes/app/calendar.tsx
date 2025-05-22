import ErrorPage from "@/components/ErrorPage";
// import { EventModal } from "@/components/events/eventModal"; // Assuming this is for creation, keep commented if not used yet
import PendingPage from "@/components/PendingPage";
import { EventDetailsModal } from "@/components/events/eventDetailsModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card"; // Added CardContent
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { allNavigation } from "@/lib/navigation";
import { approvedEventsQueryOptions } from "@/lib/query";
import type { EventDTO, UserRole } from "@/lib/types"; // Use the shared Event type
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query"; // Import useQuery
import { createFileRoute, redirect } from "@tanstack/react-router";
import {
    addDays,
    addMonths,
    differenceInMinutes,
    eachDayOfInterval, // Use for multi-day events
    endOfDay, // Use for date comparisons
    format,
    isSameDay,
    isSameMonth,
    isValid, // Check if date parsing is valid
    max as maxDate,
    min as minDate,
    parseISO, // Parse ISO strings from backend
    startOfDay, // Use for date comparisons
    startOfMonth,
    startOfWeek,
    subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react"; // Import useMemo

// Custom hook for persistent state
function usePersistentState<T>(
    key: string,
    initialValue: T,
): [T, (value: T | ((prevState: T) => T)) => void] {
    const [state, setState] = useState<T>(() => {
        try {
            const storedValue = localStorage.getItem(key);
            if (storedValue) {
                const parsed = JSON.parse(storedValue);
                // Special handling for dates stored as ISO strings
                if (
                    key === "calendarCurrentDate" &&
                    typeof parsed === "string"
                ) {
                    const date = parseISO(parsed);
                    if (isValid(date)) {
                        return date as unknown as T;
                    }
                }
                return parsed;
            }
            return initialValue;
        } catch (error) {
            console.error(
                "Error reading from localStorage for key:",
                key,
                error,
            );
            return initialValue;
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem(key, JSON.stringify(state));
        } catch (error) {
            console.error("Error writing to localStorage for key:", key, error);
        }
    }, [key, state]);

    return [state, setState];
}

const eventColorClasses = [
    "bg-blue-500",
    "bg-indigo-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-teal-500",
    "bg-cyan-500",
    "bg-orange-500",
    "bg-lime-500",
];

const simpleHash = (str: string): number => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0;
    }
    return Math.abs(hash);
};

// Get a deterministic color based on event ID
const getRandomColorForEvent = (
    eventId: string | number | undefined,
): string => {
    if (eventId === undefined) {
        return eventColorClasses[0];
    }
    const idString = String(eventId);
    const hash = simpleHash(idString);
    const index = hash % eventColorClasses.length;
    return eventColorClasses[index];
};

interface EventWithDisplayColor extends EventDTO {
    displayColor: string;
}

interface EventWithLayout extends EventWithDisplayColor {
    layout: {
        top: string;
        height: string;
        left: string;
        width: string;
        minHeight: string;
    };
    startDate: Date;
    endDate: Date;
    columnIndex: number;
    numColumns: number;
}

const calculateDayLayout = (events: EventDTO[]): EventWithLayout[] => {
    if (!events || events.length === 0) return [];

    // --- Define View Hours (Widened) ---
    const viewStartHour = 6; // Start at 6 AM
    const viewEndHour = 22; // End boundary for 9 PM - 10 PM slot (total view ends at 10 PM)
    const totalMinutesInView = (viewEndHour - viewStartHour) * 60;

    // 1. Parse dates, calculate initial vertical layout, and sort
    const parsedEvents = events
        .map((event, index) => {
            const start = parseISO(event.startTime);
            const end = parseISO(event.endTime);
            if (!isValid(start) || !isValid(end)) return null;

            // Clamp times to the viewable range (e.g., 6 AM to 10 PM)
            const dayStart = new Date(start);
            dayStart.setHours(viewStartHour, 0, 0, 0);
            const dayEnd = new Date(start);
            dayEnd.setHours(viewEndHour, 0, 0, 0);

            // FIX: Pass dates as an array to maxDate and minDate
            const clampedStart = maxDate([start, dayStart]);
            const clampedEnd = minDate([end, dayEnd]);

            // Ensure clamped dates are valid before proceeding
            if (!isValid(clampedStart) || !isValid(clampedEnd)) return null;

            const minutesFromViewStart = differenceInMinutes(
                clampedStart,
                dayStart,
            );
            // Ensure duration calculation uses valid dates and handles edge cases
            const durationMinutes = Math.max(
                15, // Minimum duration
                differenceInMinutes(clampedEnd, clampedStart) > 0
                    ? differenceInMinutes(clampedEnd, clampedStart)
                    : 0, // Avoid negative duration if end is before start after clamping
            );

            const topPercent =
                (minutesFromViewStart / totalMinutesInView) * 100;
            const heightPercent = (durationMinutes / totalMinutesInView) * 100;

            const displayColor = getRandomColorForEvent(event.publicId);

            return {
                ...event,
                id: event.publicId ?? `temp-${index}`, // Ensure unique key if id is missing
                startDate: start, // Keep original start/end for display
                endDate: end,
                displayColor,
                layout: {
                    // Ensure percentages are non-negative and finite
                    top: `${Math.max(0, topPercent)}%`,
                    height: `${Math.max(0, heightPercent)}%`,
                    minHeight: "1.5rem",
                    left: "0%",
                    width: "100%",
                },
                columnIndex: -1,
                numColumns: 1,
            };
        })
        .filter((event): event is NonNullable<typeof event> => event !== null); // Filter out nulls and assert non-null type

    type ParsedEventNonNull = NonNullable<(typeof parsedEvents)[number]>;

    if (parsedEvents.length === 0) return [];

    const columns: { events: ParsedEventNonNull[] }[] = [];

    for (const event of parsedEvents) {
        let placed = false;
        // Find the first column where this event doesn't overlap with the last event placed
        for (let i = 0; i < columns.length; i++) {
            const lastEventInColumn =
                columns[i].events[columns[i].events.length - 1];
            // Check if lastEventInColumn exists before accessing its properties
            if (
                lastEventInColumn &&
                event.startDate >= lastEventInColumn.endDate
            ) {
                event.columnIndex = i;
                columns[i].events.push(event);
                placed = true;
                break;
            }
        }
        // If not placed, start a new column
        if (!placed) {
            event.columnIndex = columns.length;
            columns.push({ events: [event] });
        }
    }

    // const totalColumns = columns.length;

    // 3. Refine layout based on columns (apply width/left)
    // Calculate the number of columns needed for each event based on actual overlaps.
    for (const event of parsedEvents) {
        // Use for...of loop
        // Find events that *actually* overlap with this one
        const overlappingEvents = parsedEvents.filter(
            (otherEvent) =>
                // No need for null checks here as parsedEvents is filtered
                event.publicId !== otherEvent.publicId &&
                event.startDate < otherEvent.endDate &&
                event.endDate > otherEvent.startDate,
        );

        // Determine the number of columns required for this event's overlapping group
        // using a greedy approach on the group.
        const group = [event, ...overlappingEvents];
        const tempColumns: Date[] = []; // Tracks the end time of the last event in each temporary column

        // Sort the group - no null checks needed for a and b
        group.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

        // Process events in the sorted group using for...of
        for (const ev of group) {
            // Use for...of loop
            let placed = false;
            // Try to place the event in an existing temporary column
            for (let i = 0; i < tempColumns.length; i++) {
                if (ev.startDate >= tempColumns[i]) {
                    // Found a column where it fits without overlapping the last event
                    tempColumns[i] = ev.endDate; // Update the end time for this column
                    ev.columnIndex = i; // Assign column index relative to the group
                    placed = true;
                    break;
                }
            }
            // If it couldn't be placed in an existing column, create a new one
            if (!placed) {
                ev.columnIndex = tempColumns.length; // Assign new column index
                tempColumns.push(ev.endDate); // Add end time to the new column tracker
            }
        }
        // The number of columns needed for this event is the total number of temporary columns created for its group
        event.numColumns = tempColumns.length;
    }

    // 4. Calculate final left and width
    const horizontalPadding = 0.5; // Percentage padding between events (e.g., 0.5% on each side = 1% total gap)

    const finalLayoutEvents = parsedEvents.map((event) => {
        // No null checks needed for event here
        const numCols = event.numColumns || 1; // Use calculated overlap columns
        const colWidth = 100 / numCols;
        const effectiveWidth = colWidth - 2 * horizontalPadding; // Width minus padding on both sides
        const effectiveLeft = event.columnIndex * colWidth + horizontalPadding; // Left offset plus padding

        return {
            ...event,
            layout: {
                ...event.layout,
                width: `${effectiveWidth}%`,
                left: `${effectiveLeft}%`,
            },
        };
    });

    return finalLayoutEvents;
};

export const Route = createFileRoute("/app/calendar")({
    component: Calendar,
    beforeLoad: async ({ location, context }) => {
        const navigationItem = allNavigation.find((item) => {
            return (
                location.pathname === item.href ||
                location.pathname.startsWith(`${item.href}/`)
            );
        });
        const allowedRoles: string[] = navigationItem
            ? navigationItem.roles
            : [];

        if (context.authState == null) {
            throw redirect({
                to: "/login",
                search: {
                    redirect: location.href,
                },
            });
        }
        const userRoles = context.authState?.roles || [];
        const isAuthorized = allowedRoles.some((role) =>
            userRoles.includes(role as UserRole),
        );

        if (!isAuthorized) {
            throw redirect({
                to: "/login",
                search: {
                    redirect: location.href,
                },
            });
        }
    },
    loader: async ({ context }) => {
        // Ensure data is fetched or being fetched before component renders
        context.queryClient.ensureQueryData(approvedEventsQueryOptions);
        // context.queryClient.ensureQueryData(venuesQueryOptions);
    },
    errorComponent: () => <ErrorPage />,
    pendingComponent: () => <PendingPage />,
});

function Calendar() {
    // Fetch events using useQuery
    const { data: eventsData, isLoading: isLoadingEvents } = useQuery(
        approvedEventsQueryOptions, // This returns AppEvent[] (aliased Event[])
    );
    // Adapt AppEvent[] to EventDTO[] to satisfy component's internal types
    const events: EventDTO[] = (eventsData || []).map((event) => ({
        ...event, // Spread fields from AppEvent (Event)
        approvals: null, // Add missing EventDTO fields with default values
        cancellationReason: null,
        createdAt: "", // Placeholder, ideally this comes from API
        updatedAt: "", // Placeholder, ideally this comes from API
        // severity: null, // If severity is needed, add here
    }));

    const [currentDate, setCurrentDate] = usePersistentState<Date>(
        "calendarCurrentDate",
        new Date(),
    );
    // const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<EventDTO | null>(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    type CalendarViewType = "month" | "week" | "day";
    const [calendarView, setCalendarView] =
        usePersistentState<CalendarViewType>("calendarView", "month");
    // const [filters, setFilters] = usePersistentState<{ statuses: string[] }>(
    //     "calendarFilters",
    //     {
    //         statuses: [] as string[],
    //     },
    // );
    // const [createEventDate, setCreateEventDate] = useState<Date | null>(null);

    // Memoized function to get events for a specific date, applying filters
    const getEventsForDate = useMemo(() => {
        // --- Return type updated ---
        return (calendarDay: Date): EventWithDisplayColor[] => {
            if (!events || events.length === 0) return [];

            const startOfCalendarDay = startOfDay(calendarDay);
            const endOfCalendarDay = endOfDay(calendarDay);

            return (
                events
                    .filter((event) => {
                        // const statusMatch =
                        //     filters.statuses.length === 0 ||
                        //     filters.statuses.includes(event.status);
                        // if (!statusMatch) return false;

                        // Parse event start and end times
                        const eventStart = parseISO(event.startTime);
                        const eventEnd = parseISO(event.endTime);

                        if (!isValid(eventStart) || !isValid(eventEnd)) {
                            console.warn(
                                `Invalid date format for event ID ${event.publicId}`,
                            );
                            return false; // Skip events with invalid dates
                        }

                        // Check if the calendar day falls within the event's date range (inclusive)
                        // This handles single and multi-day events
                        return (
                            startOfCalendarDay <= eventEnd &&
                            endOfCalendarDay >= eventStart
                        );
                    })
                    // --- Add displayColor to each filtered event ---
                    .map(
                        (event: EventDTO): EventWithDisplayColor => ({
                            ...event,
                            displayColor: getRandomColorForEvent(
                                event.publicId,
                            ),
                        }),
                    )
            );
        };
    }, [events]);

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

    // Open event details - No transformation needed
    const handleEventClick = (event: EventWithDisplayColor) => {
        setSelectedEvent(event);
        setIsDetailsModalOpen(true);
    };

    // Generate days for month view
    const generateMonthDays = () => {
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfDay(addDays(addMonths(monthStart, 1), -1)); // End of the last day of the month
        const displayStart = startOfWeek(monthStart);
        const displayEnd = endOfDay(startOfWeek(addDays(monthEnd, 7))); // Ensure we cover the last week fully

        const days = eachDayOfInterval({
            start: displayStart,
            end: displayEnd,
        }).map((date) => {
            const dateString = format(date, "yyyy-MM-dd");
            return {
                date,
                dateString,
                dayOfMonth: date.getDate(),
                isCurrentMonth: isSameMonth(date, currentDate),
                isToday: isSameDay(date, new Date()),
                events: getEventsForDate(date),
            };
        });

        return days;
    };

    // Generate days for week view
    const generateWeekDays = () => {
        const weekStart = startOfWeek(currentDate);
        const weekEnd = endOfDay(addDays(weekStart, 6));

        const days = eachDayOfInterval({ start: weekStart, end: weekEnd }).map(
            (date) => {
                const dateString = format(date, "yyyy-MM-dd");
                return {
                    date,
                    dateString,
                    dayOfMonth: date.getDate(),
                    isCurrentMonth: isSameMonth(date, currentDate), // Still useful for styling
                    isToday: isSameDay(date, new Date()),
                    events: getEventsForDate(date),
                };
            },
        );
        return days;
    };

    // Generate hours for day view (Widened Range)
    const generateDayHours = () => {
        const startHour = 6; // 6 AM
        const endHour = 22; // Boundary for 10 PM
        const hoursInRange = endHour - startHour; // Number of full hour intervals

        const hours = Array.from({ length: hoursInRange + 1 }, (_, i) => {
            // +1 for the labels
            const hour24 = startHour + i;
            const hour12 =
                hour24 > 12 ? hour24 - 12 : hour24 === 0 ? 12 : hour24;
            const ampm = hour24 >= 12 && hour24 < 24 ? "PM" : "AM";
            return {
                hour: hour12,
                ampm: ampm,
                label: `${hour12} ${ampm}`,
            };
        });

        // Day events fetching remains the same here, layout calculation happens elsewhere
        // const dayEvents = getEventsForDate(currentDate);

        return { hours }; // Return only hours, dayEvents are calculated in renderDayView
    };

    const renderMonthView = () => {
        const monthDays = generateMonthDays();

        return (
            <div className="space-y-2">
                <div className="grid grid-cols-7 gap-1">
                    {monthDays.map((day) => (
                        <Card
                            key={day.dateString}
                            className={cn(
                                "h-32 overflow-hidden hover:shadow-sm transition-shadow relative",
                                !day.isCurrentMonth && "bg-muted/30",
                                day.isToday && "border-primary",
                            )}
                            // onClick={() => handleCellClick(day.date)}
                        >
                            <CardContent className="p-1 h-full flex flex-col">
                                <div
                                    className={cn(
                                        "text-xs font-medium p-1 flex-shrink-0",
                                        !day.isCurrentMonth &&
                                            "text-muted-foreground",
                                    )}
                                >
                                    {day.dayOfMonth}
                                </div>
                                <div className="space-y-0.5 overflow-y-auto flex-grow min-h-0 px-0.5 pb-0.5 no-scrollbar">
                                    {day.events.map((event) => (
                                        <button
                                            key={event.publicId}
                                            type="button"
                                            // Reduced padding, adjusted line height implicitly via text size
                                            className={cn(
                                                // Use the assigned random color
                                                event.displayColor,
                                                "text-white text-[11px] px-1 py-0.5 rounded block w-full text-left focus:outline-none focus:ring-1 focus:ring-ring focus:ring-offset-1 mb-0.5", // Adjusted focus ring, added margin bottom
                                            )}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleEventClick(event);
                                            }}
                                            onKeyDown={(e) => {
                                                if (
                                                    e.key === "Enter" ||
                                                    e.key === " "
                                                ) {
                                                    e.stopPropagation();
                                                    handleEventClick(event);
                                                }
                                            }}
                                            title={event.eventName}
                                        >
                                            {/* Truncate text if it's too long */}
                                            <span className="truncate block">
                                                {event.eventName}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    };
    // Render week view
    const renderWeekView = () => {
        const weekDaysData = generateWeekDays();

        return (
            <div className="space-y-2">
                <div className="grid grid-cols-7 gap-1">
                    {weekDaysData.map((day) => (
                        <div
                            key={day.dateString}
                            className={cn(
                                "text-center p-2 font-medium text-sm rounded-md",
                                !day.isCurrentMonth && "text-muted-foreground",
                                day.isToday && "bg-primary/10 text-primary",
                            )}
                        >
                            <div>{day.dayOfMonth}</div>
                            <div className="text-xs">
                                {format(day.date, "EEE")}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-1 h-[calc(100vh-240px)]">
                    {" "}
                    {/* Adjust height as needed */}
                    {weekDaysData.map((day) => (
                        <Card
                            key={day.dateString}
                            className={cn(
                                "overflow-auto p-2 hover:shadow-sm transition-shadow",
                                !day.isCurrentMonth && "bg-muted/50",
                                day.isToday && "border-primary/50",
                            )}
                            // onClick={() => handleCellClick(day.date)}
                        >
                            <div className="space-y-1 no-scrollbar">
                                {day.events.map((event) => (
                                    <button
                                        key={event.publicId}
                                        type="button"
                                        className={cn(
                                            event.displayColor,
                                            "text-white text-[11px] px-1 py-0.5 rounded block w-full text-left focus:outline-none focus:ring-1 focus:ring-ring focus:ring-offset-1", // Adjusted focus ring
                                        )}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleEventClick(event);
                                        }}
                                        onKeyDown={(e) => {
                                            if (
                                                e.key === "Enter" ||
                                                e.key === " "
                                            ) {
                                                e.stopPropagation();
                                                handleEventClick(event);
                                            }
                                        }}
                                        title={event.eventName}
                                    >
                                        <div className="font-medium">
                                            {event.eventName}
                                        </div>
                                        {/* Optionally display time or other info */}
                                        <div className="text-[10px] opacity-90">
                                            {format(
                                                parseISO(event.startTime),
                                                "h:mm a",
                                            )}{" "}
                                            -{" "}
                                            {format(
                                                parseISO(event.endTime),
                                                "h:mm a",
                                            )}
                                        </div>
                                    </button>
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
        const { hours } = generateDayHours(); // Now generates 6 AM - 10 PM
        const dayEventsRaw = getEventsForDate(currentDate);
        // Pass the updated view hours to the layout calculation if it were parameterized
        // Since we hardcoded the wider range in calculateDayLayout, no parameters needed here yet.
        const dayEventsWithLayout = calculateDayLayout(dayEventsRaw);
        const totalHours = hours.length - 1; // Number of intervals (16 for 6AM-10PM)

        return (
            <div className="space-y-4">
                <div className="text-center">
                    <h3 className="text-lg font-medium">
                        {format(currentDate, "EEEE, MMMM d, yyyy")}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        {dayEventsWithLayout.length}{" "}
                        {dayEventsWithLayout.length === 1 ? "event" : "events"}
                    </p>
                </div>

                <div className="grid grid-cols-[60px_1fr] gap-2 h-[calc(100vh-240px)]">
                    {" "}
                    {/* Adjusted width */}
                    {/* Hour Labels */}
                    <div className="space-y-0 border-r pr-2">
                        {hours.map((hour) => (
                            <div
                                key={hour.label}
                                // Use totalHours (number of intervals) for height calculation
                                className="h-[calc(100%/var(--total-hours))] text-xs text-muted-foreground text-right relative -top-2"
                                style={
                                    {
                                        "--total-hours": totalHours,
                                    } as React.CSSProperties
                                } // Pass totalHours as CSS variable
                            >
                                {hour.label}
                            </div>
                        ))}
                    </div>
                    {/* Event Area */}
                    <Card className="relative overflow-hidden p-0">
                        {" "}
                        {/* Remove padding */}
                        {/* Hour Lines */}
                        {hours.map((hour, index) => (
                            <div
                                key={`line-${hour.label}`}
                                className="absolute w-full border-t border-border/50"
                                style={{
                                    // Use totalHours (number of intervals) for top calculation
                                    top: `${(index / totalHours) * 100}%`,
                                    left: 0,
                                }}
                            />
                        ))}
                        {/* Events */}
                        <div className="relative h-full w-full">
                            {dayEventsWithLayout.map((event) => (
                                <button
                                    type="button"
                                    key={event.publicId} // Use the potentially generated unique key
                                    className={cn(
                                        // Use the assigned random color
                                        event.displayColor,
                                        "text-white text-xs p-1 absolute cursor-pointer text-left block overflow-hidden rounded", // Added rounded
                                        "focus:outline-none focus:ring-1 focus:ring-ring focus:ring-offset-1",
                                    )}
                                    // Apply the calculated layout style object
                                    style={event.layout}
                                    onClick={() => handleEventClick(event)}
                                    title={`${event.eventName} (${format(event.startDate, "h:mm a")} - ${format(event.endDate, "h:mm a")})`}
                                >
                                    {/* Inner div for text content */}
                                    <div className="h-full overflow-hidden">
                                        <div className="font-medium text-[11px] leading-tight whitespace-normal">
                                            {event.eventName}
                                        </div>
                                        <div className="text-[9px] opacity-90 leading-tight whitespace-normal">
                                            {format(event.startDate, "h:mm a")}{" "}
                                            - {format(event.endDate, "h:mm a")}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>
        );
    };

    return (
        <>
            <div className="flex flex-col flex-1 overflow-hidden">
                <header className="flex items-center justify-between border-b px-6 h-[65px]">
                    {/* Header content remains largely the same */}
                    <div className="flex items-center gap-4">
                        <h1 className="text-xl font-semibold">Calendar</h1>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handlePrev}
                                aria-label="Previous period"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span
                                className="text-sm font-medium w-40 text-center"
                                aria-live="polite"
                            >
                                {" "}
                                {/* Added width and live region */}
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
                                aria-label="Next period"
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
                        {/* View Switcher */}
                        <Tabs
                            value={calendarView}
                            onValueChange={(value) =>
                                setCalendarView(value as CalendarViewType)
                            }
                            className="mr-2"
                        >
                            <TabsList className="grid w-[180px] grid-cols-3 bg-background">
                                <TabsTrigger
                                    value="month"
                                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                                >
                                    Month
                                </TabsTrigger>
                                <TabsTrigger
                                    value="week"
                                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                                >
                                    Week
                                </TabsTrigger>
                                <TabsTrigger
                                    value="day"
                                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                                >
                                    Day
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>

                        {/* <Popover>
							<PopoverTrigger asChild>
								<Button variant="outline" size="sm" className="gap-1">
									<Filter className="h-4 w-4" />
									Filter
									{filters.statuses.length > 0 && ( // Indicate active filters
										<span className="ml-1 h-2 w-2 rounded-full bg-primary" />
									)}
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-64" align="end">
								<div className="space-y-4">
									<div>
										<h3 className="font-medium mb-2 text-sm">Status</h3>
										<div className="space-y-2">
											{eventStatuses.map((status) => (
												<div
													key={status.id}
													className="flex items-center space-x-2"
												>
													<Checkbox
														id={`status-${status.id}`}
														checked={filters.statuses.includes(status.id)}
														onCheckedChange={() =>
															toggleStatusFilter(status.id)
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

									<div className="flex justify-between pt-2">
										<Button
											variant="ghost"
											size="sm"
											onClick={() => setFilters({ statuses: [] })}
										>
											Reset
										</Button>
									</div>
								</div>
							</PopoverContent>
						</Popover> */}
                    </div>
                </header>
                <main className="flex-1 overflow-auto p-4 md:p-6">
                    {" "}
                    {/* Adjusted padding */}
                    {isLoadingEvents ? (
                        <PendingPage /> // Show pending state while events load initially
                    ) : (
                        <>
                            {calendarView === "month" && renderMonthView()}
                            {calendarView === "week" && renderWeekView()}
                            {calendarView === "day" && renderDayView()}
                        </>
                    )}
                </main>
            </div>

            {/* Modals */}
            {/* Add EventModal back if creation logic is implemented */}
            {/* <EventModal
                isOpen={isCreateModalOpen}
                onClose={() => {
                    setIsCreateModalOpen(false);
                    setCreateEventDate(null);
                }}
                initialDate={createEventDate}
            /> */}
            {selectedEvent && (
                <EventDetailsModal
                    isOpen={isDetailsModalOpen}
                    onClose={() => {
                        setSelectedEvent(null); // Clear selected event on close
                        setIsDetailsModalOpen(false);
                    }}
                    event={selectedEvent}
                />
            )}
        </>
    );
}
