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
import ErrorPage from "@/components/ErrorPage";
import { EventDetailsModal } from "@/components/events/eventDetailsModal";
// import { EventModal } from "@/components/events/eventModal"; // Assuming this is for creation, keep commented if not used yet
import PendingPage from "@/components/PendingPage";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card"; // Added CardContent
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { allNavigation } from "@/lib/navigation";
import { searchEventsQueryOptions } from "@/lib/query";
import type { EventDTO, UserRole } from "@/lib/types"; // Use the shared Event type
import { cn, getStatusColor } from "@/lib/utils";

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
				if (key === "calendarCurrentDate" && typeof parsed === "string") {
					const date = parseISO(parsed);
					if (isValid(date)) {
						return date as unknown as T;
					}
				}
				return parsed;
			}
			return initialValue;
		} catch (error) {
			console.error("Error reading from localStorage for key:", key, error);
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

const calculateDayLayout = (
	events: EventDTO[],
	currentDate: Date,
): EventWithLayout[] => {
	if (!events || events.length === 0) return [];

	// Define view window anchored to the active day
	const viewStartHour = 6; // 6:00 AM
	const dayStart = new Date(currentDate);
	dayStart.setHours(viewStartHour, 0, 0, 0);
	// End at 11:30 PM (23:30)
	const dayEnd = new Date(currentDate);
	dayEnd.setHours(23, 30, 0, 0);
	// Total minutes in view (e.g., 6:00–23:30 = 1050)
	const totalMinutesInView = differenceInMinutes(dayEnd, dayStart);

	// 1) Parse and compute vertical layout within [dayStart, dayEnd]
	const parsedEvents = events
		.map((event, index) => {
			const start = parseISO(event.startTime);
			const end = parseISO(event.endTime);
			if (!isValid(start) || !isValid(end)) return null;

			// Skip events that don't intersect the visible window
			if (end <= dayStart || start >= dayEnd) return null;

			// Clamp to visible window for top/height calculations
			const clampedStart = maxDate([start, dayStart]);
			const clampedEnd = minDate([end, dayEnd]);
			if (!isValid(clampedStart) || !isValid(clampedEnd)) return null;

			const minutesFromViewStart = differenceInMinutes(clampedStart, dayStart);
			const rawDuration = differenceInMinutes(clampedEnd, clampedStart);
			const durationMinutes = Math.max(15, rawDuration); // ensure tap area

			const topPercent = (minutesFromViewStart / totalMinutesInView) * 100;
			const heightPercent = (durationMinutes / totalMinutesInView) * 100;

			const displayColor = getStatusColor(event.status);

			return {
				...event,
				id: event.publicId ?? `temp-${index}`,
				startDate: start, // keep originals for labels/overlap
				endDate: end,
				displayColor,
				layout: {
					top: `${Math.max(0, Math.min(100, topPercent))}%`,
					height: `${Math.max(0, heightPercent)}%`,
					minHeight: "1.5rem",
					left: "0%",
					width: "100%",
				},
				columnIndex: -1,
				numColumns: 1,
			};
		})
		.filter((event): event is NonNullable<typeof event> => event !== null);

	type ParsedEventNonNull = NonNullable<(typeof parsedEvents)[number]>;

	if (parsedEvents.length === 0) return [];

	const columns: { events: ParsedEventNonNull[] }[] = [];

	for (const event of parsedEvents) {
		let placed = false;
		for (let i = 0; i < columns.length; i++) {
			const lastEventInColumn = columns[i].events[columns[i].events.length - 1];
			if (lastEventInColumn && event.startDate >= lastEventInColumn.endDate) {
				event.columnIndex = i;
				columns[i].events.push(event);
				placed = true;
				break;
			}
		}
		if (!placed) {
			event.columnIndex = columns.length;
			columns.push({ events: [event] });
		}
	}

	// 3) Determine overlap-based column counts per event
	for (const event of parsedEvents) {
		const overlappingEvents = parsedEvents.filter(
			(otherEvent) =>
				event.publicId !== otherEvent.publicId &&
				event.startDate < otherEvent.endDate &&
				event.endDate > otherEvent.startDate,
		);

		const group = [event, ...overlappingEvents];
		const tempColumns: Date[] = [];

		group.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

		for (const ev of group) {
			let placed = false;
			for (let i = 0; i < tempColumns.length; i++) {
				if (ev.startDate >= tempColumns[i]) {
					tempColumns[i] = ev.endDate;
					ev.columnIndex = i;
					placed = true;
					break;
				}
			}
			if (!placed) {
				ev.columnIndex = tempColumns.length;
				tempColumns.push(ev.endDate);
			}
		}
		event.numColumns = tempColumns.length;
	}

	// 4) Compute final left/width
	const horizontalPadding = 0.5;
	const finalLayoutEvents = parsedEvents.map((event) => {
		const numCols = event.numColumns || 1;
		const colWidth = 100 / numCols;
		const effectiveWidth = colWidth - 2 * horizontalPadding;
		const effectiveLeft = event.columnIndex * colWidth + horizontalPadding;
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
	loader: async ({ context }) => {
		// Ensure data is fetched or being fetched before component renders
		context.queryClient.ensureQueryData(searchEventsQueryOptions("ALL"));
		// context.queryClient.ensureQueryData(venuesQueryOptions);
	},
	errorComponent: () => <ErrorPage />,
	pendingComponent: () => <PendingPage />,
});

function Calendar() {
	// Fetch events using useQuery
	const { data: eventsData, isLoading: isLoadingEvents } = useQuery(
		searchEventsQueryOptions("ALL"),
	);
	// Adapt AppEvent[] to EventDTO[] to satisfy component's internal types
	const events: EventDTO[] = eventsData || [];

	const [currentDate, setCurrentDate] = usePersistentState<Date>(
		"calendarCurrentDate",
		new Date(),
	);
	// const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const [selectedEvent, setSelectedEvent] = useState<EventDTO | null>(null);
	const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
	type CalendarViewType = "month" | "week" | "day";
	const [calendarView, setCalendarView] = usePersistentState<CalendarViewType>(
		"calendarView",
		"month",
	);
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
						// Only show APPROVED, ONGOING, and PENDING events
						const allowed = new Set(["APPROVED", "ONGOING", "PENDING"]);
						if (!allowed.has((event.status || "").toUpperCase())) return false;

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
							startOfCalendarDay <= eventEnd && endOfCalendarDay >= eventStart
						);
					})
					// Add displayColor by status for each filtered event
					.map(
						(event: EventDTO): EventWithDisplayColor => ({
							...event,
							displayColor: getStatusColor(event.status),
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

	// Generate hours and grid positions for day view (6:00 AM – 11:30 PM)
	const generateDayHours = () => {
		const startHour = 6; // 6 AM
		const endHour = 23; // last full label at 11 PM
		const labels = [] as { label: string; topPercent: number }[];
		const gridLines = [] as { key: string; topPercent: number }[];

		// Total minutes in view must match calculateDayLayout
		const dayStart = new Date(currentDate);
		dayStart.setHours(startHour, 0, 0, 0);
		const dayEnd = new Date(currentDate);
		dayEnd.setHours(23, 30, 0, 0); // 11:30 PM
		const totalMinutes = differenceInMinutes(dayEnd, dayStart); // 1050

		for (let h = startHour; h <= endHour; h++) {
			const hour12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
			const ampm = h >= 12 ? "PM" : "AM";
			const minutesFromStart = (h - startHour) * 60;
			labels.push({
				label: `${hour12} ${ampm}`,
				topPercent: (minutesFromStart / totalMinutes) * 100,
			});
			gridLines.push({
				key: `h-${h}`,
				topPercent: (minutesFromStart / totalMinutes) * 100,
			});
		}
		// Add final half-hour line at 11:30 PM
		const halfHourFromStart = (endHour + 0.5 - startHour) * 60; // 17.5 * 60 = 1050
		gridLines.push({
			key: "h-23-30",
			topPercent: (halfHourFromStart / totalMinutes) * 100,
		});

		return { labels, gridLines, totalMinutes };
	};

	const renderLegend = () => {
		const statuses: { id: string; label: string }[] = [
			{ id: "APPROVED", label: "Approved" },
			{ id: "ONGOING", label: "Ongoing" },
			{ id: "PENDING", label: "Pending" },
		];
		return (
			<div className="mb-3 flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
				<span className="font-medium">Legend:</span>
				{statuses.map((s) => {
					const textClass =
						getStatusColor(s.id)
							.split(" ")
							.find((c) => c.startsWith("text-")) ?? "text-gray-500";
					return (
						<span key={s.id} className="inline-flex items-center gap-1">
							<span
								className={cn(
									textClass,
									"h-2.5 w-2.5 rounded-full inline-block",
								)}
								style={{ backgroundColor: "currentColor" }}
							/>
							<span>{s.label}</span>
						</span>
					);
				})}
			</div>
		);
	};

	const renderMonthView = () => {
		const monthDays = generateMonthDays();

		const formatTimeRangeCompact = (start: Date, end: Date) => {
			const sameMeridiem = format(start, "a") === format(end, "a");
			return sameMeridiem
				? `${format(start, "h:mm")}–${format(end, "h:mm a")}`
				: `${format(start, "h:mm a")}–${format(end, "h:mm a")}`;
		};

		return (
			<div className="space-y-2">
				<div className="grid grid-cols-7 auto-rows-fr gap-1 h-[calc(100vh-240px)]">
					{monthDays.map((day) => (
						<Card
							key={day.dateString}
							className={cn(
								"h-full overflow-hidden hover:shadow-sm transition-shadow relative",
								!day.isCurrentMonth && "bg-muted/30",
								day.isToday && "border-primary",
							)}
							// onClick={() => handleCellClick(day.date)}
						>
							<CardContent className="p-1 h-full flex flex-col">
								<div
									className={cn(
										"text-xs font-medium p-1 flex-shrink-0 sticky top-0 z-10 bg-card",
										!day.isCurrentMonth && "text-muted-foreground",
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
												// Color by status (bg + text)
												event.displayColor,
												"text-[11px] px-1 py-0.5 rounded block w-full text-left focus:outline-none focus:ring-1 focus:ring-ring focus:ring-offset-1 mb-0.5", // Adjusted focus ring, added margin bottom
											)}
											onClick={(e) => {
												e.stopPropagation();
												handleEventClick(event);
											}}
											onKeyDown={(e) => {
												if (e.key === "Enter" || e.key === " ") {
													e.stopPropagation();
													handleEventClick(event);
												}
											}}
											title={event.eventName}
										>
											{/* Compact time first, then name */}
											<span className="truncate block">
												{formatTimeRangeCompact(
													parseISO(event.startTime),
													parseISO(event.endTime),
												)}{" "}
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
							<div className="text-xs">{format(day.date, "EEE")}</div>
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
											"text-[11px] px-1 py-0.5 rounded block w-full text-left focus:outline-none focus:ring-1 focus:ring-ring focus:ring-offset-1", // Adjusted focus ring
										)}
										onClick={(e) => {
											e.stopPropagation();
											handleEventClick(event);
										}}
										onKeyDown={(e) => {
											if (e.key === "Enter" || e.key === " ") {
												e.stopPropagation();
												handleEventClick(event);
											}
										}}
										title={event.eventName}
									>
										<div className="font-medium">{event.eventName}</div>
										{/* Optionally display time or other info */}
										<div className="text-[10px] opacity-90">
											{format(parseISO(event.startTime), "h:mm a")} -{" "}
											{format(parseISO(event.endTime), "h:mm a")}
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
		const { labels, gridLines } = generateDayHours(); // 6:00 AM – 11:30 PM
		const dayEventsRaw = getEventsForDate(currentDate);
		const dayEventsWithLayout = calculateDayLayout(dayEventsRaw, currentDate);

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
					{/* Hour Labels */}
					<div className="relative border-r pr-2">
						{labels.map((l) => (
							<div
								key={l.label}
								className="absolute -translate-y-1/2 text-xs text-muted-foreground right-0 pr-2"
								style={{ top: `${l.topPercent}%` }}
							>
								{l.label}
							</div>
						))}
					</div>
					{/* Event Area */}
					<Card className="relative overflow-hidden p-0">
						{/* Hour Lines */}
						{gridLines.map((gl) => (
							<div
								key={gl.key}
								className="absolute w-full border-t border-border/50"
								style={{ top: `${gl.topPercent}%`, left: 0 }}
							/>
						))}
						{/* Events */}
						<div className="relative h-full w-full">
							{dayEventsWithLayout.map((event) => (
								<button
									type="button"
									key={event.publicId}
									className={cn(
										event.displayColor,
										"text-xs p-1 absolute cursor-pointer text-left block overflow-hidden rounded",
										"focus:outline-none focus:ring-1 focus:ring-ring focus:ring-offset-1",
									)}
									style={event.layout}
									onClick={() => handleEventClick(event)}
									title={`${event.eventName} (${format(event.startDate, "h:mm a")} - ${format(event.endDate, "h:mm a")})`}
								>
									<div className="h-full overflow-hidden">
										<span className="block text-[11px] leading-tight truncate whitespace-nowrap">
											{format(event.startDate, "h:mm")}–
											{format(event.endDate, "h:mm a")} {event.eventName}
										</span>
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
							variant="outline"
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
							{renderLegend()}
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
