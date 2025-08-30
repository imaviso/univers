import ErrorPage from "@/components/ErrorPage";
import PendingPage from "@/components/PendingPage";
import { CancellationRateChart } from "@/components/dashboard/cancellationRateChart";
import { EventTypesChart } from "@/components/dashboard/eventTypesChart";
import { EventsOverviewChart } from "@/components/dashboard/eventsOverviewChart";
import { EventsPerVenueChart } from "@/components/dashboard/eventsPerVenueChart";
import { PeakReservationHoursChart } from "@/components/dashboard/peakReservationHoursChart";
import { RecentActivity } from "@/components/dashboard/recentActivity";
import { TopEquipmentChart } from "@/components/dashboard/topEquipmentChart";
import { UpcomingEvents } from "@/components/dashboard/upcomingEvents";
import { UserActivityChart } from "@/components/dashboard/userActivityChart";
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
import { createFileRoute, redirect } from "@tanstack/react-router";
import { addDays, format } from "date-fns";
import { Calendar as CalendarIcon, ListFilter } from "lucide-react"; // Added ListFilter
import { useEffect, useState } from "react";
import type { DateRange } from "react-day-picker";

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
		<div className="bg-background">
			<div className="flex flex-col flex-1 overflow-hidden">
				<header className="flex items-center justify-between border-b px-6 h-[65px]">
					<div className="flex items-center gap-4">
						<h1 className="text-xl font-semibold">Dashboard</h1>
					</div>
					<div className="flex items-center gap-2">
						{/* Date Range Picker */}
						<Popover>
							<PopoverTrigger asChild>
								<Button
									id="date"
									variant={"outline"}
									className={cn(
										"w-fit justify-start text-left font-normal",
										!dateRange && "text-muted-foreground",
									)}
								>
									<CalendarIcon className="mr-2 h-4 w-4" />
									{dateRange?.from ? (
										dateRange.to ? (
											<>
												{format(dateRange.from, "LLL dd, y")} -{" "}
												{format(dateRange.to, "LLL dd, y")}
											</>
										) : (
											format(dateRange.from, "LLL dd, y")
										)
									) : (
										<span>Pick a date range</span>
									)}
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-auto p-0" align="end">
								<Select
									onValueChange={(value) => {
										const now = new Date();
										if (value === "custom") {
											// For custom, we allow DayPicker to handle it, or set a default.
											// Ensure dateRange is an object, even if dates are undefined initially
											setDateRange((prevRange: DateRange | undefined) => ({
												from: prevRange?.from ?? addDays(now, -7),
												to: prevRange?.to ?? now,
											}));
										} else {
											setDateRange({
												from: addDays(now, -Number.parseInt(value)),
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
									numberOfMonths={1} // shadcn Calendar typically shows 1 month by default for range
								/>
							</PopoverContent>
						</Popover>

						{/* <Popover>
							<PopoverTrigger asChild>
								<Button variant="outline" className="ml-auto">
									<FilterIcon className="mr-2 h-4 w-4" />
									Filters
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-80 p-4" align="end">
								<div className="grid gap-4">
									<div className="space-y-2">
										<h4 className="font-medium leading-none">
											Additional Filters
										</h4>
										<p className="text-sm text-muted-foreground">
											Refine dashboard data.
										</p>
									</div>
									<div className="grid gap-2">
										<div className="grid grid-cols-3 items-center gap-4">
											<Label htmlFor="venue-filter">Venue</Label>
											<Select
												value={venueFilter}
												onValueChange={(value) => setVenueFilter(value)}
											>
												<SelectTrigger id="venue-filter" className="col-span-2 h-8 w-full">
													<SelectValue placeholder="Select venue">
														{venueFilter === "ALL_VENUES"
															? "All Venues"
															: venues.find((v) => v.publicId === venueFilter)?.name || "Select venue"}
													</SelectValue>
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="ALL_VENUES">All Venues</SelectItem>
													{venues.map((venue) => (
														<SelectItem key={venue.publicId} value={venue.name}>
															{venue.name}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
										<div className="grid grid-cols-3 items-center gap-4">
											<Label htmlFor="event-type-filter">Event Type</Label>
											<Select
												value={eventTypeFilter}
												onValueChange={(value) => setEventTypeFilter(value === "ALL_EVENT_TYPES" ? "" : value)}
											>
												<SelectTrigger id="event-type-filter" className="col-span-2 h-8 w-full">
													<SelectValue placeholder="Select event type" />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="ALL_EVENT_TYPES">All Event Types</SelectItem>
													{eventTypes.map((type) => (
														<SelectItem key={type} value={type}>
															{type}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
										{/* <div className="grid grid-cols-3 items-center gap-4">
											<Label htmlFor="equipment-filter">Equipment Type</Label>
											<Input
												id="equipment-filter"
												placeholder="Enter equipment type"
												className="col-span-2 h-8"
												value={equipmentTypeFilter}
												onChange={(e) => setEquipmentTypeFilter(e.target.value)}
											/>
										</div>
									</div>
								</div>
							</PopoverContent>
						</Popover>  */}
					</div>
				</header>
				<main className="flex-1 overflow-auto p-6">
					<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
						<div className="grid gap-6 col-span-2">
							<Card>
								<CardHeader>
									<CardTitle>Recent Activity</CardTitle>
									<CardDescription>Latest updates and changes</CardDescription>
								</CardHeader>
								<CardContent>
									<RecentActivity />
								</CardContent>
							</Card>
						</div>
						<Card>
							<CardHeader>
								<CardTitle>Upcoming Events</CardTitle>
								<CardDescription>Scheduled events</CardDescription>
							</CardHeader>
							<CardContent>
								<UpcomingEvents />
							</CardContent>
						</Card>
						<Card className="col-span-3">
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<div>
									<CardTitle>Events Overview</CardTitle>
									<CardDescription>
										Toggle event statuses to filter the chart below.
									</CardDescription>
								</div>
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button variant="outline" size="sm" className="h-8 gap-1">
											<ListFilter className="h-3.5 w-3.5" />
											<span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
												Status
											</span>
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
						<Card className="col-span-2">
							<CardHeader>
								<CardTitle>Event Types</CardTitle>
								<CardDescription>Distribution by event type</CardDescription>
							</CardHeader>
							<CardContent>
								<EventTypesChart dateRange={dateRange} />
							</CardContent>
						</Card>
						<Card>
							<CardHeader>
								<CardTitle>Peak Reservation Hours</CardTitle>
								<CardDescription>
									Most common times for event reservations
								</CardDescription>
							</CardHeader>
							<CardContent>
								<PeakReservationHoursChart
									dateRange={dateRange}
									// venueFilter={
									//     venueFilter === "ALL_VENUES"
									//         ? undefined
									//         : venueFilter
									// }
									// equipmentTypeFilter={equipmentTypeFilter}
								/>
							</CardContent>
						</Card>

						<div className="grid gap-6 col-span-3">
							<Card>
								<CardHeader>
									<CardTitle>Cancellation Rate</CardTitle>
									<CardDescription>
										Cancellation rate based on given date range
									</CardDescription>
								</CardHeader>
								<CardContent>
									<CancellationRateChart
										dateRange={dateRange}
										// venueFilter={
										//     venueFilter === "ALL_VENUES"
										//         ? undefined
										//         : venueFilter
										// }
										// equipmentTypeFilter={
										//     equipmentTypeFilter
										// }
									/>
								</CardContent>
							</Card>
						</div>
						<Card>
							<CardHeader>
								<CardTitle>Events per Venue</CardTitle>
								<CardDescription>Number of events per venue</CardDescription>
							</CardHeader>
							<CardContent>
								<EventsPerVenueChart
									dateRange={dateRange}
									// venueFilter={venueFilter === "ALL_VENUES" ? undefined : venueFilter}
								/>
							</CardContent>
						</Card>
						<Card>
							<CardHeader>
								<CardTitle>Top Equipment</CardTitle>
								<CardDescription>Most reserved equipment</CardDescription>
							</CardHeader>
							<CardContent>
								<TopEquipmentChart
									dateRange={dateRange}
									// equipmentTypeFilter={equipmentTypeFilter}
								/>
							</CardContent>
						</Card>
						<Card>
							<CardHeader>
								<CardTitle>User Reservation Activity</CardTitle>
								<CardDescription>Most active organizers</CardDescription>
							</CardHeader>
							<CardContent>
								<UserActivityChart dateRange={dateRange} />
							</CardContent>
						</Card>
					</div>
				</main>
			</div>
		</div>
	);
}
