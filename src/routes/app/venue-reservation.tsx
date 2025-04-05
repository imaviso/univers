import VenueReservationForm from "@/components/venue-reservation/venueReservationForm";
import { allNavigation } from "@/lib/navigation";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/app/venue-reservation")({
    component: VenueReservationPage,
    beforeLoad: async ({ location, context }) => {
        const navigationItem = allNavigation.find((item) => {
            // Allow exact match or any sub-route after the base path, e.g. "/app/notifications/..."
            return (
                location.pathname === item.href ||
                location.pathname.startsWith(`${item.href}/`)
            );
        });
        const allowedRoles: string[] = navigationItem
            ? navigationItem.roles
            : [];
        const isAuthorized =
            "role" in context && // <-- Check if the key 'role' exists
            context.role != null && // <-- Optional but good: ensure role isn't null/undefined
            allowedRoles.includes(context.role);

        if (!isAuthorized) {
            throw redirect({
                to: "/auth/login",
                search: {
                    redirect: location.href,
                },
            });
        }
    },
});

function VenueReservationPage() {
    return (
        <div className="bg-background">
            <div className="flex flex-col flex-1 overflow-hidden">
                <header className="flex items-center justify-between border-b px-6 py-3 h-16">
                    <div className="flex items-center gap-4">
                        <h1 className="text-xl font-semibold">
                            Venue Reservation
                        </h1>
                        <p className="text-muted-foreground">
                            Fill out the form below to reserve a venue for your
                            event
                        </p>
                    </div>
                </header>

                <main className="flex-1 overflow-auto p-6">
                    <VenueReservationForm />
                </main>
            </div>
        </div>
    );
}
