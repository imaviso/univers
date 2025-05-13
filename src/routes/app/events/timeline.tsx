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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Import Tabs
import { useCurrentUser, venuesQueryOptions } from "@/lib/query"; // Import useCurrentUser
import { cn } from "@/lib/utils"; // Added cn
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { endOfDay, format, formatISO, startOfDay } from "date-fns"; // Added date-fns functions
import { CalendarIcon, ListFilter } from "lucide-react"; // Added ListFilter icon, Added CalendarIcon
import { useEffect, useState } from "react";
import type { DateRange } from "react-day-picker"; // Added DateRange

// Custom hook for persistent state
function usePersistentState<T>(
    key: string,
    initialValue: T,
): [T, (value: T) => void] {
    const [state, setState] = useState<T>(() => {
        try {
            const storedValue = localStorage.getItem(key);
            return storedValue ? JSON.parse(storedValue) : initialValue;
        } catch (error) {
            console.error("Error reading from localStorage", error);
            return initialValue;
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem(key, JSON.stringify(state));
        } catch (error) {
            console.error("Error writing to localStorage", error);
        }
    }, [key, state]);

    return [state, setState];
}

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
    const [activeTab, setActiveTab] = usePersistentState<"all" | "mine">(
        "eventActiveTab",
        currentUser?.role === "SUPER_ADMIN" ||
            currentUser?.role === "VP_ADMIN" ||
            currentUser?.role === "MSDO" ||
            currentUser?.role === "OPC" ||
            currentUser?.role === "SSD" ||
            currentUser?.role === "FAO" ||
            currentUser?.role === "VPAA" ||
            currentUser?.role === "DEPT_HEAD" ||
            currentUser?.role === "VENUE_OWNER"
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
    const [dateRangeFilter, setDateRangeFilter] = usePersistentState<string>(
        "eventDateRangeFilter",
        "allTime",
    ); // Added state for date range filter, default to All Time
    const [displayView, setDisplayView] = usePersistentState<"list" | "card">(
        "eventDisplayView",
        "card",
    ); // State for display view
    const [selectedDateRange, setSelectedDateRange] = usePersistentState<
        DateRange | undefined
    >(
        "eventTimelineParentDateRange_v1", // New key for date range in parent
        undefined,
    );

    const isAuthorized =
        currentUser?.role === "SUPER_ADMIN" ||
        currentUser?.role === "VP_ADMIN" ||
        currentUser?.role === "MSDO" ||
        currentUser?.role === "OPC" ||
        currentUser?.role === "SSD" ||
        currentUser?.role === "FAO" ||
        currentUser?.role === "DEPT_HEAD" ||
        currentUser?.role === "VPAA" ||
        currentUser?.role === "VENUE_OWNER";

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
                    <header className="flex items-center justify-between border-b px-6 py-3.5">
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
                        <div className="flex items-center gap-4">
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

                            {/* Date Range Filter Dropdown - always shown if view is list */}
                            {view === "list" && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline">
                                            Date:{" "}
                                            {dateRangeFilter === "allTime"
                                                ? "All Time"
                                                : dateRangeFilter === "pastDay"
                                                  ? "Past Day"
                                                  : dateRangeFilter ===
                                                      "pastWeek"
                                                    ? "Past Week"
                                                    : dateRangeFilter ===
                                                        "pastMonth"
                                                      ? "Past Month"
                                                      : "All Time"}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuRadioGroup
                                            value={dateRangeFilter}
                                            onValueChange={setDateRangeFilter}
                                        >
                                            <DropdownMenuRadioItem value="allTime">
                                                All Time
                                            </DropdownMenuRadioItem>
                                            <DropdownMenuRadioItem value="pastDay">
                                                Past Day
                                            </DropdownMenuRadioItem>
                                            <DropdownMenuRadioItem value="pastWeek">
                                                Past Week
                                            </DropdownMenuRadioItem>
                                            <DropdownMenuRadioItem value="pastMonth">
                                                Past Month
                                            </DropdownMenuRadioItem>
                                        </DropdownMenuRadioGroup>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}

                            {/* TabsList only shown for these authorized roles in list view */}
                            <TabsList className="grid grid-cols-2">
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
                                dateRangeFilter={dateRangeFilter}
                                displayView={displayView}
                            />
                        </TabsContent>
                        <TabsContent value="mine" className="mt-0 h-full">
                            <EventList
                                activeTab="mine"
                                eventStatusFilter={eventStatusFilter}
                                sortBy={sortBy}
                                dateRangeFilter={dateRangeFilter}
                                displayView={displayView}
                            />
                        </TabsContent>
                    </main>
                </Tabs>
            ) : (
                // Non-SUPER_ADMIN or timeline view structure
                <div className="flex flex-col flex-1 overflow-hidden">
                    <header className="flex items-center justify-between border-b px-6 py-4">
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
                        <div className="flex items-center gap-4">
                            {/* Date Range Filter for TIMELINE VIEW */}
                            {view === "timeline" && (
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className={cn(
                                                "w-fit justify-start text-left font-normal",
                                                !selectedDateRange &&
                                                    "text-muted-foreground",
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {selectedDateRange?.from ? (
                                                selectedDateRange.to ? (
                                                    <>
                                                        {format(
                                                            selectedDateRange.from,
                                                            "LLL dd, y",
                                                        )}{" "}
                                                        -{" "}
                                                        {format(
                                                            selectedDateRange.to,
                                                            "LLL dd, y",
                                                        )}
                                                    </>
                                                ) : (
                                                    format(
                                                        selectedDateRange.from,
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
                                        <Calendar
                                            initialFocus
                                            mode="range"
                                            defaultMonth={
                                                selectedDateRange?.from
                                            }
                                            selected={selectedDateRange}
                                            onSelect={setSelectedDateRange}
                                            numberOfMonths={1}
                                        />
                                        <div className="p-2 border-t flex justify-end">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                    setSelectedDateRange(
                                                        undefined,
                                                    )
                                                }
                                                disabled={!selectedDateRange}
                                            >
                                                Clear
                                            </Button>
                                        </div>
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
                                dateRangeFilter={dateRangeFilter}
                                displayView={displayView}
                            />
                        ) : (
                            <EventTimeline
                                startDateISO={
                                    selectedDateRange?.from
                                        ? formatISO(
                                              startOfDay(
                                                  selectedDateRange.from,
                                              ),
                                          )
                                        : undefined
                                }
                                endDateISO={
                                    selectedDateRange?.to
                                        ? formatISO(
                                              endOfDay(selectedDateRange.to),
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
