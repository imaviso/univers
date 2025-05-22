import { CreateEventButton } from "@/components/events/createEventButton";
import { EventList } from "@/components/events/eventList";
import { EventModal } from "@/components/events/eventModal";
import { EventTimeline } from "@/components/events/eventTimeline";
import { Button } from "@/components/ui/button"; // Added Button import
import { Calendar } from "@/components/ui/calendar"; // Added Calendar
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"; // Added Dropdown imports
import { Label } from "@/components/ui/label";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"; // Added Popover
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"; // ADDED Select components
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Import Tabs
import { useCurrentUser, venuesQueryOptions } from "@/lib/query"; // Import useCurrentUser
import { cn, usePersistentState } from "@/lib/utils"; // Added cn
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
    addDays,
    endOfDay,
    endOfMonth,
    endOfWeek,
    format,
    formatISO,
    startOfDay,
    startOfMonth,
    startOfWeek,
} from "date-fns"; // Added date-fns functions, ADDED addDays
import { CalendarIcon, ListFilter } from "lucide-react"; // Added ListFilter icon, Added CalendarIcon
import { useState } from "react";
import type { DateRange } from "react-day-picker"; // Added DateRange

export const Route = createFileRoute("/app/events/timeline")({
    component: Events,
});

// Define EventStatus constants locally
const EventStatus = {
    PENDING: "Pending",
    APPROVED: "Approved",
    ONGOING: "Ongoing",
    COMPLETED: "Completed",
    REJECTED: "Rejected",
    CANCELED: "Canceled",
} as const;

function Events() {
    const { data: venues = [] } = useSuspenseQuery(venuesQueryOptions);
    const { data: currentUser } = useCurrentUser(); // Get current user
    const [view, setView] = usePersistentState<"list" | "timeline">(
        "eventView",
        "list",
    );
    const userRoles = currentUser?.roles || [];
    const [activeTab, setActiveTab] = usePersistentState<"all" | "mine">(
        "eventActiveTab",
        userRoles.includes("SUPER_ADMIN") ||
            userRoles.includes("VP_ADMIN") ||
            userRoles.includes("ADMIN") ||
            userRoles.includes("DEPT_HEAD") ||
            userRoles.includes("VENUE_OWNER")
            ? "all"
            : "mine",
    );
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [eventStatusFilter, setEventStatusFilter] =
        usePersistentState<string>("eventStatusFilter", "ALL"); // Added state for status filter, default to ALL
    const [sortBy, setSortBy] = usePersistentState<string>(
        "eventSortBy",
        "recency",
    ); // Added state for sort order, default to recency
    const [listSelectedDateRange, setListSelectedDateRange] =
        usePersistentState<DateRange | undefined>(
            "eventListDateRange_v1",
            undefined,
        );
    const [timelineSelectedDateRange, setTimelineSelectedDateRange] =
        usePersistentState<DateRange | undefined>(
            "eventTimelineParentDateRange_v1",
            undefined,
        );
    const [displayView, setDisplayView] = usePersistentState<"list" | "card">(
        "eventDisplayView",
        "card",
    ); // State for display view

    const isAuthorized =
        userRoles.includes("SUPER_ADMIN") ||
        userRoles.includes("VP_ADMIN") ||
        userRoles.includes("ADMIN") ||
        userRoles.includes("DEPT_HEAD") ||
        userRoles.includes("VENUE_OWNER");

    return (
        <div className="bg-background flex flex-col overflow-hidden h-full">
            {/* Use Tabs only if SUPER_ADMIN and view is list, otherwise just render content */}
            {isAuthorized && view === "list" ? (
                <Tabs
                    value={activeTab}
                    onValueChange={(value) =>
                        setActiveTab(value as "all" | "mine")
                    }
                    className="flex flex-col flex-1 overflow-hidden"
                >
                    <header className="flex items-center justify-between border-b px-6 h-[65px]">
                        <div className="flex items-center gap-4">
                            <h1 className="text-xl font-semibold">Events</h1>
                            <div className="flex items-center gap-2">
                                {/* biome-ignore lint/a11y/useButtonType: <explanation> */}
                                <button
                                    onClick={() => setView("list")}
                                    className={`px-3 py-1 text-sm rounded-md ${
                                        view === "list"
                                            ? "bg-primary/10 text-primary"
                                            : "text-muted-foreground hover:bg-muted"
                                    }`}
                                >
                                    Overview
                                </button>
                                {/* biome-ignore lint/a11y/useButtonType: <explanation> */}
                                <button
                                    onClick={() => setView("timeline")}
                                    className="px-3 py-1 text-sm rounded-md text-muted-foreground hover:bg-muted"
                                >
                                    Timeline
                                </button>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 h-full">
                            {/* Status Filter Dropdown - only for list view */}
                            {view === "list" && (
                                <DropdownMenu>
                                    {" "}
                                    {/* Only show filter dropdown in list view */}
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="ml-auto"
                                        >
                                            <ListFilter className="mr-2 h-4 w-4" />
                                            Display
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuRadioGroup
                                            value={displayView}
                                            onValueChange={(value) =>
                                                setDisplayView(
                                                    value as "list" | "card",
                                                )
                                            }
                                        >
                                            <Label className="px-2 py-1.5 text-sm font-semibold">
                                                View As
                                            </Label>
                                            <DropdownMenuRadioItem value="card">
                                                Card View
                                            </DropdownMenuRadioItem>
                                            <DropdownMenuRadioItem value="list">
                                                List View
                                            </DropdownMenuRadioItem>
                                        </DropdownMenuRadioGroup>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuRadioGroup
                                            value={eventStatusFilter}
                                            onValueChange={setEventStatusFilter}
                                        >
                                            <Label className="px-2 py-1.5 text-sm font-semibold">
                                                Status
                                            </Label>
                                            <DropdownMenuRadioItem value="ALL">
                                                All Statuses
                                            </DropdownMenuRadioItem>
                                            <DropdownMenuRadioItem
                                                value={EventStatus.PENDING}
                                            >
                                                {EventStatus.PENDING}
                                            </DropdownMenuRadioItem>
                                            <DropdownMenuRadioItem
                                                value={EventStatus.APPROVED}
                                            >
                                                {EventStatus.APPROVED}
                                            </DropdownMenuRadioItem>
                                            <DropdownMenuRadioItem
                                                value={EventStatus.ONGOING}
                                            >
                                                {EventStatus.ONGOING}
                                            </DropdownMenuRadioItem>
                                            <DropdownMenuRadioItem
                                                value={EventStatus.COMPLETED}
                                            >
                                                {EventStatus.COMPLETED}
                                            </DropdownMenuRadioItem>
                                            <DropdownMenuRadioItem
                                                value={EventStatus.REJECTED}
                                            >
                                                {EventStatus.REJECTED}
                                            </DropdownMenuRadioItem>
                                            <DropdownMenuRadioItem
                                                value={EventStatus.CANCELED}
                                            >
                                                {EventStatus.CANCELED}
                                            </DropdownMenuRadioItem>
                                        </DropdownMenuRadioGroup>
                                        <DropdownMenuSeparator />
                                        <Label className="px-2 py-1.5 text-sm font-semibold">
                                            Sort
                                        </Label>
                                        <DropdownMenuCheckboxItem
                                            checked={sortBy === "recency"}
                                            onCheckedChange={(checked) => {
                                                setSortBy(
                                                    checked
                                                        ? "recency"
                                                        : "default",
                                                ); // Toggle between recency and default
                                            }}
                                        >
                                            Most Recent
                                        </DropdownMenuCheckboxItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}

                            {/* Date Range Popover for LIST VIEW (replaces old DropdownMenu) */}
                            {view === "list" && (
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                "w-fit justify-start text-left font-normal",
                                                !listSelectedDateRange &&
                                                    "text-muted-foreground",
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {listSelectedDateRange?.from ? (
                                                listSelectedDateRange.to ? (
                                                    <>
                                                        {format(
                                                            listSelectedDateRange.from,
                                                            "LLL dd, y",
                                                        )}{" "}
                                                        -{" "}
                                                        {format(
                                                            listSelectedDateRange.to,
                                                            "LLL dd, y",
                                                        )}
                                                    </>
                                                ) : (
                                                    format(
                                                        listSelectedDateRange.from,
                                                        "LLL dd, y",
                                                    )
                                                )
                                            ) : (
                                                <span>Pick a date range</span>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent
                                        className="w-auto p-0"
                                        align="end"
                                    >
                                        <Select
                                            onValueChange={(value) => {
                                                const now = new Date();
                                                if (value === "custom") {
                                                    setListSelectedDateRange(
                                                        (
                                                            prevRange:
                                                                | DateRange
                                                                | undefined,
                                                        ) => ({
                                                            from:
                                                                prevRange?.from ??
                                                                startOfDay(
                                                                    addDays(
                                                                        now,
                                                                        -7,
                                                                    ),
                                                                ),
                                                            to:
                                                                prevRange?.to ??
                                                                endOfDay(now),
                                                        }),
                                                    );
                                                } else if (value === "all") {
                                                    setListSelectedDateRange(
                                                        undefined,
                                                    );
                                                } else if (value === "today") {
                                                    setListSelectedDateRange({
                                                        from: startOfDay(now),
                                                        to: endOfDay(now),
                                                    });
                                                } else if (
                                                    value === "thisWeek"
                                                ) {
                                                    setListSelectedDateRange({
                                                        from: startOfWeek(now, {
                                                            weekStartsOn: 1,
                                                        }),
                                                        to: endOfWeek(now, {
                                                            weekStartsOn: 1,
                                                        }),
                                                    });
                                                } else if (
                                                    value === "thisMonth"
                                                ) {
                                                    setListSelectedDateRange({
                                                        from: startOfMonth(now),
                                                        to: endOfMonth(now),
                                                    });
                                                } else {
                                                    const numDays =
                                                        Number.parseInt(value);
                                                    if (
                                                        !Number.isNaN(numDays)
                                                    ) {
                                                        setListSelectedDateRange(
                                                            {
                                                                from: startOfDay(
                                                                    addDays(
                                                                        now,
                                                                        -numDays,
                                                                    ),
                                                                ),
                                                                to: endOfDay(
                                                                    now,
                                                                ),
                                                            },
                                                        );
                                                    } else {
                                                        setListSelectedDateRange(
                                                            undefined,
                                                        );
                                                    }
                                                }
                                            }}
                                        >
                                            <SelectTrigger className="m-2 mb-0 w-[calc(100%-1rem)]">
                                                <SelectValue placeholder="Select quick range" />
                                            </SelectTrigger>
                                            <SelectContent position="popper">
                                                <SelectItem value="all">
                                                    All Time
                                                </SelectItem>
                                                <SelectItem value="today">
                                                    Today
                                                </SelectItem>
                                                <SelectItem value="thisWeek">
                                                    This Week
                                                </SelectItem>
                                                <SelectItem value="thisMonth">
                                                    This Month
                                                </SelectItem>
                                                <SelectItem value="7">
                                                    Last 7 days
                                                </SelectItem>
                                                <SelectItem value="30">
                                                    Last 30 days
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Calendar
                                            initialFocus
                                            mode="range"
                                            defaultMonth={
                                                listSelectedDateRange?.from
                                            }
                                            selected={listSelectedDateRange}
                                            onSelect={setListSelectedDateRange}
                                            numberOfMonths={1}
                                        />
                                    </PopoverContent>
                                </Popover>
                            )}

                            {/* TabsList only shown for these authorized roles in list view */}
                            <TabsList className="grid grid-cols-2 h-9">
                                <TabsTrigger value="all">Events</TabsTrigger>
                                <TabsTrigger value="mine">
                                    My Events
                                </TabsTrigger>
                            </TabsList>
                            <CreateEventButton
                                onClick={() => setIsModalOpen(true)}
                            />
                        </div>
                    </header>

                    <main className="flex-1 pl-6 pr-6 overflow-hidden">
                        {/* Both TabsContent rendered for SUPER_ADMIN */}
                        <TabsContent value="all" className="mt-0 h-full">
                            <EventList
                                activeTab="all"
                                eventStatusFilter={eventStatusFilter}
                                sortBy={sortBy}
                                startDateISO={
                                    listSelectedDateRange?.from
                                        ? formatISO(
                                              startOfDay(
                                                  listSelectedDateRange.from,
                                              ),
                                          )
                                        : undefined
                                }
                                endDateISO={
                                    listSelectedDateRange?.to
                                        ? formatISO(
                                              endOfDay(
                                                  listSelectedDateRange.to,
                                              ),
                                          )
                                        : undefined
                                }
                                displayView={displayView}
                            />
                        </TabsContent>
                        <TabsContent value="mine" className="mt-0 h-full">
                            <EventList
                                activeTab="mine"
                                eventStatusFilter={eventStatusFilter}
                                sortBy={sortBy}
                                startDateISO={
                                    listSelectedDateRange?.from
                                        ? formatISO(
                                              startOfDay(
                                                  listSelectedDateRange.from,
                                              ),
                                          )
                                        : undefined
                                }
                                endDateISO={
                                    listSelectedDateRange?.to
                                        ? formatISO(
                                              endOfDay(
                                                  listSelectedDateRange.to,
                                              ),
                                          )
                                        : undefined
                                }
                                displayView={displayView}
                            />
                        </TabsContent>
                    </main>
                </Tabs>
            ) : (
                // Non-SUPER_ADMIN or timeline view structure
                <div className="flex flex-col flex-1 overflow-hidden">
                    <header className="flex items-center justify-between border-b px-6 h-[65px]">
                        <div className="flex items-center gap-4">
                            <h1 className="text-xl font-semibold">Events</h1>
                            {/* View switcher still available */}
                            <div className="flex items-center gap-2">
                                {/* biome-ignore lint/a11y/useButtonType: <explanation> */}
                                <button
                                    onClick={() => setView("list")}
                                    className={`px-3 py-1 text-sm rounded-md ${
                                        view === "list"
                                            ? "bg-primary/10 text-primary"
                                            : "text-muted-foreground hover:bg-muted"
                                    }`}
                                >
                                    Overview
                                </button>
                                {/* biome-ignore lint/a11y/useButtonType: <explanation> */}
                                <button
                                    onClick={() => setView("timeline")}
                                    className={`px-3 py-1 text-sm rounded-md ${
                                        view === "timeline"
                                            ? "bg-primary/10 text-primary"
                                            : "text-muted-foreground hover:bg-muted"
                                    }`}
                                >
                                    Timeline
                                </button>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 h-full">
                            {/* Date Range Filter for TIMELINE VIEW */}
                            {view === "timeline" && (
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className={cn(
                                                "w-fit justify-start text-left font-normal",
                                                !timelineSelectedDateRange &&
                                                    "text-muted-foreground",
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {timelineSelectedDateRange?.from ? (
                                                timelineSelectedDateRange.to ? (
                                                    <>
                                                        {format(
                                                            timelineSelectedDateRange.from,
                                                            "LLL dd, y",
                                                        )}{" "}
                                                        -{" "}
                                                        {format(
                                                            timelineSelectedDateRange.to,
                                                            "LLL dd, y",
                                                        )}
                                                    </>
                                                ) : (
                                                    format(
                                                        timelineSelectedDateRange.from,
                                                        "LLL dd, y",
                                                    )
                                                )
                                            ) : (
                                                <span>Pick a date range</span>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent
                                        className="w-auto p-0"
                                        align="end"
                                    >
                                        <Select
                                            onValueChange={(value) => {
                                                const now = new Date();
                                                if (value === "custom") {
                                                    setTimelineSelectedDateRange(
                                                        (
                                                            prevRange:
                                                                | DateRange
                                                                | undefined,
                                                        ) => ({
                                                            from:
                                                                prevRange?.from ??
                                                                startOfDay(
                                                                    addDays(
                                                                        now,
                                                                        -7,
                                                                    ),
                                                                ),
                                                            to:
                                                                prevRange?.to ??
                                                                endOfDay(now),
                                                        }),
                                                    );
                                                } else if (value === "all") {
                                                    setTimelineSelectedDateRange(
                                                        undefined,
                                                    );
                                                } else if (value === "today") {
                                                    setTimelineSelectedDateRange(
                                                        {
                                                            from: startOfDay(
                                                                now,
                                                            ),
                                                            to: endOfDay(now),
                                                        },
                                                    );
                                                } else if (
                                                    value === "thisWeek"
                                                ) {
                                                    setTimelineSelectedDateRange(
                                                        {
                                                            from: startOfWeek(
                                                                now,
                                                                {
                                                                    weekStartsOn: 1,
                                                                },
                                                            ),
                                                            to: endOfWeek(now, {
                                                                weekStartsOn: 1,
                                                            }),
                                                        },
                                                    );
                                                } else if (
                                                    value === "thisMonth"
                                                ) {
                                                    setTimelineSelectedDateRange(
                                                        {
                                                            from: startOfMonth(
                                                                now,
                                                            ),
                                                            to: endOfMonth(now),
                                                        },
                                                    );
                                                } else {
                                                    const numDays =
                                                        Number.parseInt(value);
                                                    if (
                                                        !Number.isNaN(numDays)
                                                    ) {
                                                        setTimelineSelectedDateRange(
                                                            {
                                                                from: startOfDay(
                                                                    addDays(
                                                                        now,
                                                                        -numDays,
                                                                    ),
                                                                ),
                                                                to: endOfDay(
                                                                    now,
                                                                ),
                                                            },
                                                        );
                                                    } else {
                                                        setTimelineSelectedDateRange(
                                                            undefined,
                                                        );
                                                    }
                                                }
                                            }}
                                        >
                                            <SelectTrigger className="m-2 mb-0 w-[calc(100%-1rem)]">
                                                <SelectValue placeholder="Select quick range" />
                                            </SelectTrigger>
                                            <SelectContent position="popper">
                                                <SelectItem value="all">
                                                    All Time
                                                </SelectItem>
                                                <SelectItem value="today">
                                                    Today
                                                </SelectItem>
                                                <SelectItem value="thisWeek">
                                                    This Week
                                                </SelectItem>
                                                <SelectItem value="thisMonth">
                                                    This Month
                                                </SelectItem>
                                                {/* Retaining Last X Days for flexibility, can be removed if not desired */}
                                                <SelectItem value="7">
                                                    Last 7 days
                                                </SelectItem>
                                                <SelectItem value="30">
                                                    Last 30 days
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Calendar
                                            initialFocus
                                            mode="range"
                                            defaultMonth={
                                                timelineSelectedDateRange?.from
                                            }
                                            selected={timelineSelectedDateRange}
                                            onSelect={
                                                setTimelineSelectedDateRange
                                            }
                                            numberOfMonths={1}
                                        />
                                    </PopoverContent>
                                </Popover>
                            )}
                            {/* Date Range Popover for LIST VIEW (now also for non-authorized users in list view) */}
                            {view === "list" && (
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                "w-fit justify-start text-left font-normal",
                                                !listSelectedDateRange &&
                                                    "text-muted-foreground",
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {listSelectedDateRange?.from ? (
                                                listSelectedDateRange.to ? (
                                                    <>
                                                        {format(
                                                            listSelectedDateRange.from,
                                                            "LLL dd, y",
                                                        )}{" "}
                                                        -{" "}
                                                        {format(
                                                            listSelectedDateRange.to,
                                                            "LLL dd, y",
                                                        )}
                                                    </>
                                                ) : (
                                                    format(
                                                        listSelectedDateRange.from,
                                                        "LLL dd, y",
                                                    )
                                                )
                                            ) : (
                                                <span>Pick a date range</span>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent
                                        className="w-auto p-0"
                                        align="end"
                                    >
                                        <Select
                                            onValueChange={(value) => {
                                                const now = new Date();
                                                if (value === "custom") {
                                                    setListSelectedDateRange(
                                                        (
                                                            prevRange:
                                                                | DateRange
                                                                | undefined,
                                                        ) => ({
                                                            from:
                                                                prevRange?.from ??
                                                                startOfDay(
                                                                    addDays(
                                                                        now,
                                                                        -7,
                                                                    ),
                                                                ),
                                                            to:
                                                                prevRange?.to ??
                                                                endOfDay(now),
                                                        }),
                                                    );
                                                } else if (value === "all") {
                                                    setListSelectedDateRange(
                                                        undefined,
                                                    );
                                                } else if (value === "today") {
                                                    setListSelectedDateRange({
                                                        from: startOfDay(now),
                                                        to: endOfDay(now),
                                                    });
                                                } else if (
                                                    value === "thisWeek"
                                                ) {
                                                    setListSelectedDateRange({
                                                        from: startOfWeek(now, {
                                                            weekStartsOn: 1,
                                                        }),
                                                        to: endOfWeek(now, {
                                                            weekStartsOn: 1,
                                                        }),
                                                    });
                                                } else if (
                                                    value === "thisMonth"
                                                ) {
                                                    setListSelectedDateRange({
                                                        from: startOfMonth(now),
                                                        to: endOfMonth(now),
                                                    });
                                                } else {
                                                    const numDays =
                                                        Number.parseInt(value);
                                                    if (
                                                        !Number.isNaN(numDays)
                                                    ) {
                                                        setListSelectedDateRange(
                                                            {
                                                                from: startOfDay(
                                                                    addDays(
                                                                        now,
                                                                        -numDays,
                                                                    ),
                                                                ),
                                                                to: endOfDay(
                                                                    now,
                                                                ),
                                                            },
                                                        );
                                                    } else {
                                                        setListSelectedDateRange(
                                                            undefined,
                                                        );
                                                    }
                                                }
                                            }}
                                        >
                                            <SelectTrigger className="m-2 mb-0 w-[calc(100%-1rem)]">
                                                <SelectValue placeholder="Select quick range" />
                                            </SelectTrigger>
                                            <SelectContent position="popper">
                                                <SelectItem value="all">
                                                    All Time
                                                </SelectItem>
                                                <SelectItem value="today">
                                                    Today
                                                </SelectItem>
                                                <SelectItem value="thisWeek">
                                                    This Week
                                                </SelectItem>
                                                <SelectItem value="thisMonth">
                                                    This Month
                                                </SelectItem>
                                                <SelectItem value="7">
                                                    Last 7 days
                                                </SelectItem>
                                                <SelectItem value="30">
                                                    Last 30 days
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Calendar
                                            initialFocus
                                            mode="range"
                                            defaultMonth={
                                                listSelectedDateRange?.from
                                            }
                                            selected={listSelectedDateRange}
                                            onSelect={setListSelectedDateRange}
                                            numberOfMonths={1}
                                        />
                                    </PopoverContent>
                                </Popover>
                            )}
                            {/* Status Filter Dropdown for LIST VIEW */}
                            {view === "list" && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="ml-auto"
                                        >
                                            <ListFilter className="mr-2 h-4 w-4" />
                                            Display
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuRadioGroup
                                            value={displayView}
                                            onValueChange={(value) =>
                                                setDisplayView(
                                                    value as "list" | "card",
                                                )
                                            }
                                        >
                                            <Label className="px-2 py-1.5 text-sm font-semibold">
                                                View As
                                            </Label>
                                            <DropdownMenuRadioItem value="card">
                                                Card View
                                            </DropdownMenuRadioItem>
                                            <DropdownMenuRadioItem value="list">
                                                List View
                                            </DropdownMenuRadioItem>
                                        </DropdownMenuRadioGroup>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuRadioGroup
                                            value={eventStatusFilter}
                                            onValueChange={setEventStatusFilter}
                                        >
                                            <Label className="px-2 py-1.5 text-sm font-semibold">
                                                Status
                                            </Label>
                                            <DropdownMenuRadioItem value="ALL">
                                                All Statuses
                                            </DropdownMenuRadioItem>
                                            <DropdownMenuRadioItem
                                                value={EventStatus.PENDING}
                                            >
                                                {EventStatus.PENDING}
                                            </DropdownMenuRadioItem>
                                            <DropdownMenuRadioItem
                                                value={EventStatus.APPROVED}
                                            >
                                                {EventStatus.APPROVED}
                                            </DropdownMenuRadioItem>
                                            <DropdownMenuRadioItem
                                                value={EventStatus.ONGOING}
                                            >
                                                {EventStatus.ONGOING}
                                            </DropdownMenuRadioItem>
                                            <DropdownMenuRadioItem
                                                value={EventStatus.COMPLETED}
                                            >
                                                {EventStatus.COMPLETED}
                                            </DropdownMenuRadioItem>
                                            <DropdownMenuRadioItem
                                                value={EventStatus.REJECTED}
                                            >
                                                {EventStatus.REJECTED}
                                            </DropdownMenuRadioItem>
                                            <DropdownMenuRadioItem
                                                value={EventStatus.CANCELED}
                                            >
                                                {EventStatus.CANCELED}
                                            </DropdownMenuRadioItem>
                                        </DropdownMenuRadioGroup>
                                        <DropdownMenuSeparator />
                                        <Label className="px-2 py-1.5 text-sm font-semibold">
                                            Sort
                                        </Label>
                                        <DropdownMenuCheckboxItem
                                            checked={sortBy === "recency"}
                                            onCheckedChange={(checked) => {
                                                setSortBy(
                                                    checked
                                                        ? "recency"
                                                        : "default",
                                                ); // Toggle between recency and default
                                            }}
                                        >
                                            Most Recent
                                        </DropdownMenuCheckboxItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                            <CreateEventButton
                                onClick={() => setIsModalOpen(true)}
                            />
                        </div>
                    </header>
                    <main className="flex-1 p-6 overflow-hidden">
                        {/* Conditionally render based on view */}
                        {view === "list" ? (
                            // Non-SUPER_ADMIN only sees 'mine'
                            <EventList
                                activeTab="mine"
                                eventStatusFilter={eventStatusFilter}
                                sortBy={sortBy}
                                startDateISO={
                                    listSelectedDateRange?.from
                                        ? formatISO(
                                              startOfDay(
                                                  listSelectedDateRange.from,
                                              ),
                                          )
                                        : undefined
                                }
                                endDateISO={
                                    listSelectedDateRange?.to
                                        ? formatISO(
                                              endOfDay(
                                                  listSelectedDateRange.to,
                                              ),
                                          )
                                        : undefined
                                }
                                displayView={displayView}
                            />
                        ) : (
                            <EventTimeline
                                startDateISO={
                                    timelineSelectedDateRange?.from
                                        ? formatISO(
                                              startOfDay(
                                                  timelineSelectedDateRange.from,
                                              ),
                                          )
                                        : undefined
                                }
                                endDateISO={
                                    timelineSelectedDateRange?.to
                                        ? formatISO(
                                              endOfDay(
                                                  timelineSelectedDateRange.to,
                                              ),
                                          )
                                        : undefined
                                }
                            />
                        )}
                    </main>
                </div>
            )}
            {/* Modal remains outside the conditional rendering */}
            <EventModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                venues={venues}
            />
        </div>
    );
}
