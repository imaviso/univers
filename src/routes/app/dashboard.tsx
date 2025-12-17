import { createFileRoute, redirect } from "@tanstack/react-router";
import { addDays, format } from "date-fns";
import { Calendar as CalendarIcon, ListFilter } from "lucide-react"; // Added ListFilter
import { useEffect, useId, useState } from "react";
import type { DateRange } from "react-day-picker";
import { CancellationRateChart } from "@/components/dashboard/cancellationRateChart";
import { EventsOverviewChart } from "@/components/dashboard/eventsOverviewChart";
import { EventsPerVenueChart } from "@/components/dashboard/eventsPerVenueChart";
import { EventTypesChart } from "@/components/dashboard/eventTypesChart";
import { PeakReservationHoursChart } from "@/components/dashboard/peakReservationHoursChart";
import { RecentActivity } from "@/components/dashboard/recentActivity";
import { TopDepartmentsChart } from "@/components/dashboard/topDepartmentsChart";
import { TopEquipmentChart } from "@/components/dashboard/topEquipmentChart";
import { UpcomingEvents } from "@/components/dashboard/upcomingEvents";
import { UserActivityChart } from "@/components/dashboard/userActivityChart";
import ErrorPage from "@/components/ErrorPage";
import PendingPage from "@/components/PendingPage";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"; // Added DropdownMenu components
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { EVENT_STATUSES } from "@/lib/constants"; // Added EVENT_STATUSES
import { allNavigation } from "@/lib/navigation";
import type { UserRole } from "@/lib/types";
import { cn } from "@/lib/utils";

function usePersistentState<T>(
	key: string,
	defaultValue: T,
	parseISO?: boolean,
) {
	const getInitialValue = (): T => {
		const storedValue = localStorage.getItem(key);
		if (storedValue) {
			try {
				const parsed = JSON.parse(storedValue);
				if (parseISO && typeof parsed === "string") {
					const date = new Date(parsed);
					if (!Number.isNaN(date.getTime())) {
						return date as unknown as T;
					}
				} else if (
					parseISO &&
					typeof parsed === "object" &&
					parsed !== null &&
					"from" in parsed // Condition simplified: only check for 'from' key existence
				) {
					// Handle DateRange object with string dates
					const fromValue = (parsed as { from?: string | null }).from;
					const toValue = (parsed as { to?: string | null }).to;

					const fromDate = fromValue ? new Date(fromValue) : undefined;
					const toDate = toValue ? new Date(toValue) : undefined;

					if (fromDate && !Number.isNaN(fromDate.getTime())) {
						return {
							from: fromDate,
							to:
								toDate && !Number.isNaN(toDate.getTime()) ? toDate : undefined,
						} as unknown as T;
					}
				}
				return parsed as T;
			} catch (error) {
				console.error(`Error parsing localStorage key "${key}":`, error);
				return defaultValue;
			}
		}
		return defaultValue;
	};

	const [value, setValue] = useState<T>(getInitialValue);

	useEffect(() => {
		localStorage.setItem(key, JSON.stringify(value));
	}, [key, value]);

	return [value, setValue] as const;
}

export const Route = createFileRoute("/app/dashboard")({
	component: Dashboard,
	errorComponent: () => <ErrorPage />,
	pendingComponent: () => <PendingPage />,
	// loader: async ({ context }) => {
	// 	await context.queryClient.ensureQueryData(venuesQueryOptions);
	// 	await context.queryClient.ensureQueryData(
	// 		equipmentsQueryOptions(context.authState),
	// 	);
	// },
	beforeLoad: async ({ location, context }) => {
		const navigationItem = allNavigation.find((item) => {
			return (
				location.pathname === item.href ||
				location.pathname.startsWith(`${item.href}/`)
			);
		});
		const allowedRoles: string[] = navigationItem ? navigationItem.roles : [];

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
});

function Dashboard() {
	const dateButtonId = useId();
	const [visibleEventStatuses, setVisibleEventStatuses] = usePersistentState<
		Record<string, boolean>
	>(
		"eventsOverviewVisibleStatuses", // Key for localStorage
		{
			approved: true,
			pending: false,
			canceled: false,
			rejected: false,
			ongoing: true,
			completed: true,
		},
	);

	const handleEventStatusToggle = (statusKey: string) => {
		setVisibleEventStatuses((prev) => ({
			...prev,
			[statusKey]: !prev[statusKey],
		}));
	};

	// const context = useRouteContext({ from: "/app/dashboard" });
	// const { data: venues } = useSuspenseQuery(venuesQueryOptions);
	const [dateRange, setDateRange] = usePersistentState<DateRange | undefined>(
		"dashboardDateRange",
		{
			from: addDays(new Date(), -30),
			to: new Date(),
		},
		true,
	);
	// const [venueFilter, setVenueFilter] = usePersistentState<string>(
	//     "dashboardVenueFilter",
	//     "",
	// );
	// const [equipmentTypeFilter, setEquipmentTypeFilter] =
	//     usePersistentState<string>("dashboardEquipmentTypeFilter", "");

	// const [eventTypeFilter, setEventTypeFilter] = usePersistentState<string>(
	//     "dashboardEventTypeFilter",
	//     "",
	// );

	return (
		<div className="flex flex-col flex-1 overflow-hidden bg-background">
			{/* Header */}
			<header className="border-b bg-background sticky top-0 z-10">
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
					<h1 className="text-xl sm:text-2xl font-semibold">Dashboard</h1>
					{/* Date Range Picker - Full width on mobile */}
					<Popover>
						<PopoverTrigger asChild>
							<Button
								id={dateButtonId}
								variant="outline"
								className={cn(
									"w-full sm:w-auto justify-start text-left font-normal",
									!dateRange && "text-muted-foreground",
								)}
							>
								<CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
								<span className="truncate text-xs sm:text-sm">
									{dateRange?.from ? (
										dateRange.to ? (
											<>
												<span className="hidden sm:inline">
													{format(dateRange.from, "LLL dd, y")} -{" "}
													{format(dateRange.to, "LLL dd, y")}
												</span>
												<span className="sm:hidden">
													{format(dateRange.from, "MM/dd")} -{" "}
													{format(dateRange.to, "MM/dd")}
												</span>
											</>
										) : (
											format(dateRange.from, "LLL dd, y")
										)
									) : (
										"Pick a date range"
									)}
								</span>
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-auto p-0" align="start">
							<Select
								onValueChange={(value) => {
									const now = new Date();
									if (value === "custom") {
										setDateRange((prevRange: DateRange | undefined) => ({
											from: prevRange?.from ?? addDays(now, -7),
											to: prevRange?.to ?? now,
										}));
									} else {
										setDateRange({
											from: addDays(now, -Number.parseInt(value, 10)),
											to: now,
										});
									}
								}}
							>
								<SelectTrigger className="m-2 mb-0 w-[calc(100%-1rem)]">
									<SelectValue placeholder="Select quick range" />
								</SelectTrigger>
								<SelectContent position="popper">
									<SelectItem value="7">Last 7 days</SelectItem>
									<SelectItem value="30">Last 30 days</SelectItem>
									<SelectItem value="90">Last 90 days</SelectItem>
									<SelectItem value="365">Last 365 days</SelectItem>
								</SelectContent>
							</Select>
							<Calendar
								initialFocus
								mode="range"
								defaultMonth={dateRange?.from}
								selected={dateRange}
								onSelect={setDateRange}
								numberOfMonths={1}
							/>
						</PopoverContent>
					</Popover>
				</div>
			</header>

			{/* Main Content */}
			<main className="flex-1 overflow-auto">
				<div className="container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
					{/* Top Section - Activity & Events */}
					<div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
						{/* Recent Activity - 2/3 width on large screens */}
						<Card className="lg:col-span-2">
							<CardHeader className="pb-3">
								<CardTitle className="text-lg sm:text-xl">
									Recent Activity
								</CardTitle>
								<CardDescription className="text-xs sm:text-sm">
									Latest updates and changes
								</CardDescription>
							</CardHeader>
							<CardContent>
								<RecentActivity />
							</CardContent>
						</Card>

						{/* Upcoming Events - 1/3 width on large screens */}
						<Card>
							<CardHeader className="pb-3">
								<CardTitle className="text-lg sm:text-xl">
									Upcoming Events
								</CardTitle>
								<CardDescription className="text-xs sm:text-sm">
									Scheduled events
								</CardDescription>
							</CardHeader>
							<CardContent>
								<UpcomingEvents />
							</CardContent>
						</Card>
					</div>

					{/* Events Overview - Full width */}
					<Card>
						<CardHeader className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 pb-3">
							<div className="space-y-1">
								<CardTitle className="text-lg sm:text-xl">
									Events Overview
								</CardTitle>
								<CardDescription className="text-xs sm:text-sm">
									Toggle event statuses to filter the chart below.
								</CardDescription>
							</div>
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										variant="outline"
										size="sm"
										className="h-8 gap-1 self-start sm:self-auto"
									>
										<ListFilter className="h-3.5 w-3.5" />
										<span className="sm:whitespace-nowrap">Status</span>
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end">
									<DropdownMenuLabel>Toggle event statuses</DropdownMenuLabel>
									<DropdownMenuSeparator />
									{Object.entries(EVENT_STATUSES).map(
										([statusKey, statusConfig]) => (
											<DropdownMenuCheckboxItem
												key={statusKey}
												checked={visibleEventStatuses[statusKey]}
												onCheckedChange={() =>
													handleEventStatusToggle(statusKey)
												}
											>
												{statusConfig.label}
											</DropdownMenuCheckboxItem>
										),
									)}
								</DropdownMenuContent>
							</DropdownMenu>
						</CardHeader>
						<CardContent className="pl-2">
							<EventsOverviewChart
								dateRange={dateRange}
								visibleStatuses={visibleEventStatuses}
								onToggleStatus={handleEventStatusToggle}
							/>
						</CardContent>
					</Card>

					{/* Event Types & Peak Hours */}
					<div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
						<Card className="lg:col-span-2">
							<CardHeader className="pb-3">
								<CardTitle className="text-lg sm:text-xl">
									Event Types
								</CardTitle>
								<CardDescription className="text-xs sm:text-sm">
									Distribution by event type
								</CardDescription>
							</CardHeader>
							<CardContent>
								<EventTypesChart dateRange={dateRange} />
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="pb-3">
								<CardTitle className="text-lg sm:text-xl">Peak Hours</CardTitle>
								<CardDescription className="text-xs sm:text-sm">
									Most common reservation times
								</CardDescription>
							</CardHeader>
							<CardContent>
								<PeakReservationHoursChart dateRange={dateRange} />
							</CardContent>
						</Card>
					</div>

					{/* Cancellation Rate - Full width */}
					<Card>
						<CardHeader className="pb-3">
							<CardTitle className="text-lg sm:text-xl">
								Cancellation Rate
							</CardTitle>
							<CardDescription className="text-xs sm:text-sm">
								Cancellation rate based on given date range
							</CardDescription>
						</CardHeader>
						<CardContent>
							<CancellationRateChart dateRange={dateRange} />
						</CardContent>
					</Card>

					{/* Bottom Grid - 2 columns on larger screens */}
					<div className="grid gap-4 sm:gap-6 md:grid-cols-2">
						<Card>
							<CardHeader className="pb-3">
								<CardTitle className="text-lg sm:text-xl">
									Events per Venue
								</CardTitle>
								<CardDescription className="text-xs sm:text-sm">
									Number of events per venue
								</CardDescription>
							</CardHeader>
							<CardContent>
								<EventsPerVenueChart dateRange={dateRange} />
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="pb-3">
								<CardTitle className="text-lg sm:text-xl">
									Top Equipment
								</CardTitle>
								<CardDescription className="text-xs sm:text-sm">
									Most reserved equipment
								</CardDescription>
							</CardHeader>
							<CardContent>
								<TopEquipmentChart dateRange={dateRange} />
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="pb-3">
								<CardTitle className="text-lg sm:text-xl">
									Top Departments
								</CardTitle>
								<CardDescription className="text-xs sm:text-sm">
									Departments ranked by reservation rate
								</CardDescription>
							</CardHeader>
							<CardContent>
								<TopDepartmentsChart dateRange={dateRange} />
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="pb-3">
								<CardTitle className="text-lg sm:text-xl">
									User Activity
								</CardTitle>
								<CardDescription className="text-xs sm:text-sm">
									Most active organizers
								</CardDescription>
							</CardHeader>
							<CardContent>
								<UserActivityChart dateRange={dateRange} />
							</CardContent>
						</Card>
					</div>
				</div>
			</main>
		</div>
	);
}
