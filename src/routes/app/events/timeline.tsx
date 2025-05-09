import { CreateEventButton } from "@/components/events/createEventButton";
import { EventList } from "@/components/events/eventList";
import { EventModal } from "@/components/events/eventModal";
import { EventTimeline } from "@/components/events/eventTimeline";
import { Button } from "@/components/ui/button"; // Added Button import
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"; // Added Dropdown imports
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Import Tabs
import { useCurrentUser, venuesQueryOptions } from "@/lib/query"; // Import useCurrentUser
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ListFilter } from "lucide-react"; // Added ListFilter icon
import { useState } from "react";

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
    const [view, setView] = useState<"list" | "timeline">("list");
    const [activeTab, setActiveTab] = useState<"all" | "mine">(
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
    const [eventStatusFilter, setEventStatusFilter] = useState<string>("ALL"); // Added state for status filter, default to ALL

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
        <div className="bg-background">
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
                                    List
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
                            {/* Condition for isAuthorized is handled by the parent conditional rendering of this header block */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="ml-auto"
                                    >
                                        <ListFilter className="mr-2 h-4 w-4" />
                                        Filter (
                                        {eventStatusFilter === "ALL"
                                            ? "All"
                                            : eventStatusFilter
                                                  .charAt(0)
                                                  .toUpperCase() +
                                              eventStatusFilter
                                                  .slice(1)
                                                  .toLowerCase()}
                                        )
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuRadioGroup
                                        value={eventStatusFilter}
                                        onValueChange={setEventStatusFilter}
                                    >
                                        <DropdownMenuRadioItem value="ALL">
                                            All
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
                                </DropdownMenuContent>
                            </DropdownMenu>

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

                    <main className="flex-1 overflow-auto pl-6 pr-6">
                        {/* Both TabsContent rendered for SUPER_ADMIN */}
                        <TabsContent value="all" className="mt-0">
                            <EventList
                                activeTab="all"
                                eventStatusFilter={eventStatusFilter}
                            />
                        </TabsContent>
                        <TabsContent value="mine" className="mt-0">
                            <EventList
                                activeTab="mine"
                                eventStatusFilter={eventStatusFilter}
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
                                    List
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
                            {/* Status Filter Dropdown for non-authorized users in list view */}
                            {view === "list" && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="ml-auto"
                                        >
                                            <ListFilter className="mr-2 h-4 w-4" />
                                            Filter (
                                            {eventStatusFilter === "ALL"
                                                ? "All"
                                                : eventStatusFilter
                                                      .charAt(0)
                                                      .toUpperCase() +
                                                  eventStatusFilter
                                                      .slice(1)
                                                      .toLowerCase()}
                                            )
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuRadioGroup
                                            value={eventStatusFilter}
                                            onValueChange={setEventStatusFilter}
                                        >
                                            <DropdownMenuRadioItem value="ALL">
                                                All
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
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                            <CreateEventButton
                                onClick={() => setIsModalOpen(true)}
                            />
                        </div>
                    </header>
                    <main className="flex-1 overflow-auto p-6">
                        {/* Conditionally render based on view */}
                        {view === "list" ? (
                            // Non-SUPER_ADMIN only sees 'mine'
                            <EventList
                                activeTab="mine"
                                eventStatusFilter={eventStatusFilter}
                            />
                        ) : (
                            <EventTimeline />
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
