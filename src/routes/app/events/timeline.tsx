import { CreateEventButton } from "@/components/events/createEventButton";
import { EventList } from "@/components/events/eventList";
import { EventModal } from "@/components/events/eventModal";
import { EventTimeline } from "@/components/events/eventTimeline";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Import Tabs
import { venuesQueryOptions } from "@/lib/query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useRouteContext } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/app/events/timeline")({
    component: Events,
});

function Events() {
    const context = useRouteContext({ from: "/app/events" });

    const { data: venues = [] } = useSuspenseQuery(venuesQueryOptions);
    const [view, setView] = useState<"list" | "timeline">("list");
    const [activeTab, setActiveTab] = useState<"all" | "mine">("mine");
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <div className="bg-background">
            <Tabs
                value={activeTab}
                onValueChange={(value) => setActiveTab(value as "all" | "mine")}
                className="flex flex-col flex-1 overflow-hidden"
            >
                <header className="flex items-center justify-between border-b px-6 py-4">
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
                        {view === "list" && (
                            <TabsList className="grid grid-cols-2">
                                <TabsTrigger value="mine">
                                    My Events
                                </TabsTrigger>
                                <TabsTrigger value="all">
                                    All Events
                                </TabsTrigger>
                            </TabsList>
                        )}
                        <CreateEventButton
                            onClick={() => setIsModalOpen(true)}
                        />
                    </div>
                </header>

                <main className="flex-1 overflow-auto p-6">
                    {view === "list" && (
                        <>
                            <TabsContent value="all" className="mt-0">
                                <EventList activeTab="all" />
                            </TabsContent>
                            <TabsContent value="mine" className="mt-0">
                                <EventList activeTab="mine" />
                            </TabsContent>
                        </>
                    )}

                    {view === "timeline" && <EventTimeline />}
                </main>
            </Tabs>
            <EventModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                venues={venues}
            />
        </div>
    );
}
