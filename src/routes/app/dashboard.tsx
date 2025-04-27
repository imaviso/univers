import { ApprovalTimeChart } from "@/components/dashboard/approvalTimeChart";
import { CancellationRateChart } from "@/components/dashboard/cancellationRateChart";
import { EquipmentReservationsChart } from "@/components/dashboard/equipmentReservationsChart";
import { EventAttendanceChart } from "@/components/dashboard/eventAttendanceChart";
import { EventCategoriesChart } from "@/components/dashboard/eventCategoriesChart";
import { EventsOverviewChart } from "@/components/dashboard/eventOverviewChart";
import { EventsPerVenueChart } from "@/components/dashboard/eventsPerVenueChart";
import { PeakReservationHoursChart } from "@/components/dashboard/peakReservationHoursChart";
import { RecentActivity } from "@/components/dashboard/recentActivity";
import { ReservationOverlapChart } from "@/components/dashboard/reservationOverlapChart";
import { TopEquipmentChart } from "@/components/dashboard/topEquipmentChart";
import { TopVenuesChart } from "@/components/dashboard/topVenuesChart";
import { UpcomingEvents } from "@/components/dashboard/upcomingEvents";
import { UserActivityChart } from "@/components/dashboard/userActivityChart";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { allNavigation } from "@/lib/navigation";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { Calendar, CalendarDays, TrendingUp, Users } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/dashboard")({
    component: Dashboard,
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
        const isAuthorized = allowedRoles.includes(context.authState.role);

        if (!isAuthorized) {
            throw redirect({
                to: "/login",
                search: {
                    redirect: location.href,
                },
            });
        }
    },
});

function Dashboard() {
    type Period = "day" | "week" | "month" | "year";
    const [period, setPeriod] = useState<Period>("month");

    // Sample stats data
    const stats = {
        totalEvents: 24,
        upcomingEvents: 8,
        totalAttendees: 3450,
        averageAttendance: 143,
        completionRate: 92,
        growthRate: 18,
    };
    return (
        <div className="bg-background">
            <div className="flex flex-col flex-1 overflow-hidden">
                <header className="flex items-center justify-between border-b px-6 py-3.5">
                    <div className="flex items-center gap-4">
                        <h1 className="text-xl font-semibold">Dashboard</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <Tabs
                            defaultValue="month"
                            onValueChange={(value) =>
                                setPeriod(value as Period)
                            }
                        >
                            <TabsList>
                                <TabsTrigger value="day">Day</TabsTrigger>
                                <TabsTrigger value="week">Week</TabsTrigger>
                                <TabsTrigger value="month">Month</TabsTrigger>
                                <TabsTrigger value="year">Year</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                </header>
                <main className="flex-1 overflow-auto p-6">
                    <div className="grid gap-6">
                        {/* Stats Overview */}
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium">
                                        Total Events
                                    </CardTitle>
                                    <Calendar className="h-4 w-4 text-muted-foreground">
                                        <title>Total Events Icon</title>
                                    </Calendar>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {stats.totalEvents}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        +{stats.growthRate}% from last {period}
                                    </p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium">
                                        Upcoming Events
                                    </CardTitle>
                                    <CalendarDays className="h-4 w-4 text-muted-foreground">
                                        <title>Upcoming Events Icon</title>
                                    </CalendarDays>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {stats.upcomingEvents}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Next 30 days
                                    </p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium">
                                        Total Attendees
                                    </CardTitle>
                                    <Users className="h-4 w-4 text-muted-foreground">
                                        <title>Total Attendees Icon</title>
                                    </Users>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {stats.totalAttendees.toLocaleString()}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        ~{stats.averageAttendance} per event
                                    </p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium">
                                        Completion Rate
                                    </CardTitle>
                                    <TrendingUp className="h-4 w-4 text-muted-foreground">
                                        <title>Completion Rate Icon</title>
                                    </TrendingUp>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {stats.completionRate}%
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Events completed successfully
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Events per Venue</CardTitle>
                                    <CardDescription>
                                        Number of events per month per venue
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <EventsPerVenueChart />
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle>
                                        Equipment Reservations
                                    </CardTitle>
                                    <CardDescription>
                                        Number of equipment reservations per
                                        month
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <EquipmentReservationsChart />
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle>
                                        Peak Reservation Hours
                                    </CardTitle>
                                    <CardDescription>
                                        Most common times for venue and
                                        equipment bookings
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <PeakReservationHoursChart />
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Top Venues</CardTitle>
                                    <CardDescription>
                                        Most frequently used venues
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <TopVenuesChart />
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Top Equipment</CardTitle>
                                    <CardDescription>
                                        Most reserved equipment
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <TopEquipmentChart />
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle>
                                        Approval Time Analysis
                                    </CardTitle>
                                    <CardDescription>
                                        Average time for reservation approvals
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ApprovalTimeChart />
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Cancellation Rate</CardTitle>
                                    <CardDescription>
                                        Cancellation rate per month
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <CancellationRateChart />
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle>
                                        User Reservation Activity
                                    </CardTitle>
                                    <CardDescription>
                                        Most active organizers
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <UserActivityChart />
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Reservation Overlap</CardTitle>
                                    <CardDescription>
                                        Time slots with highest scheduling
                                        conflicts
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ReservationOverlapChart />
                                </CardContent>
                            </Card>
                        </div>
                        {/* Charts */}
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                            <Card className="col-span-4">
                                <CardHeader>
                                    <CardTitle>Events Overview</CardTitle>
                                    <CardDescription>
                                        Number of events over time
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="pl-2">
                                    <EventsOverviewChart />
                                </CardContent>
                            </Card>
                            <Card className="col-span-3">
                                <CardHeader>
                                    <CardTitle>Event Categories</CardTitle>
                                    <CardDescription>
                                        Distribution by category
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <EventCategoriesChart />
                                </CardContent>
                            </Card>
                        </div>

                        {/* Bottom Row */}
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                            <Card className="col-span-4">
                                <CardHeader>
                                    <CardTitle>Attendance Trends</CardTitle>
                                    <CardDescription>
                                        Average attendance by event type
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="pl-2">
                                    <EventAttendanceChart />
                                </CardContent>
                            </Card>
                            <Card className="col-span-3">
                                <CardHeader>
                                    <CardTitle>Upcoming Events</CardTitle>
                                    <CardDescription>
                                        Your next scheduled events
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <UpcomingEvents />
                                </CardContent>
                            </Card>
                        </div>

                        {/* Recent Activity */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Recent Activity</CardTitle>
                                <CardDescription>
                                    Latest updates and changes
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <RecentActivity />
                            </CardContent>
                        </Card>
                    </div>
                </main>
            </div>
        </div>
    );
}
