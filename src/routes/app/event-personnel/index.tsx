import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
	addDays,
	endOfDay,
	endOfMonth,
	endOfWeek,
	format,
	startOfDay,
	startOfMonth,
	startOfWeek,
} from "date-fns";
import { useAtom } from "jotai";
import {
	CalendarDays,
	CalendarIcon,
	ListFilter,
	MapPin,
	Phone,
	Users,
} from "lucide-react";
import type { DateRange } from "react-day-picker";

import { ManageAssignmentsDialog } from "@/components/event-staffing/manageAssignmentsDialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
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
import { Separator } from "@/components/ui/separator";
import {
	manageAssignmentsDialogAtom,
	selectedEventForAssignmentAtom,
} from "@/lib/atoms";
import { EVENT_STATUSES } from "@/lib/constants";
import { searchEventsQueryOptions } from "@/lib/query";
import {
	cn,
	formatDateTime,
	getApproverStatusBadge,
	getInitials,
	usePersistentState,
} from "@/lib/utils";

export const Route = createFileRoute("/app/event-personnel/")({
	component: EventStaff,
});

// Define EventStatus constants locally
const EventStatus = {
	PENDING: EVENT_STATUSES.pending.label,
	APPROVED: EVENT_STATUSES.approved.label,
	ONGOING: EVENT_STATUSES.ongoing.label,
	COMPLETED: EVENT_STATUSES.completed.label,
	REJECTED: EVENT_STATUSES.rejected.label,
	CANCELED: EVENT_STATUSES.canceled.label,
} as const;

function EventStaff() {
	const [, setManageAssignmentsDialogOpen] = useAtom(
		manageAssignmentsDialogAtom,
	);
	const [, setSelectedEventId] = useAtom(selectedEventForAssignmentAtom);

	// Filter state
	const [eventStatusFilter, setEventStatusFilter] = usePersistentState<string>(
		"staffEventStatusFilter",
		"ALL",
	);
	const [sortBy, setSortBy] = usePersistentState<string>(
		"staffEventSortBy",
		"startTime",
	);
	const [selectedDateRange, setSelectedDateRange] = usePersistentState<
		DateRange | undefined
	>("staffEventDateRange_v1", undefined);
	const [displayView, setDisplayView] = usePersistentState<"list" | "card">(
		"staffEventDisplayView",
		"card",
	);

	const { data: eventsData = [], isLoading: eventsLoading } = useQuery(
		searchEventsQueryOptions("ALL", "ALL", "startTime", undefined, undefined),
	);

	// Filter events by status and date range
	const filteredEvents = eventsData.filter((event) => {
		// Status filter
		if (eventStatusFilter !== "ALL" && event.status !== eventStatusFilter) {
			return false;
		}

		// Date range filter
		if (selectedDateRange?.from && selectedDateRange?.to) {
			const eventStart = new Date(event.startTime);
			const rangeStart = startOfDay(selectedDateRange.from);
			const rangeEnd = endOfDay(selectedDateRange.to);
			if (eventStart < rangeStart || eventStart > rangeEnd) {
				return false;
			}
		}

		return true;
	});

	// Sort events
	const sortedEvents = [...filteredEvents].sort((a, b) => {
		if (sortBy === "recency") {
			return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
		}
		// Default: sort by startTime (date)
		return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
	});

	const allPersonnel = sortedEvents.flatMap(
		(event) => event.assignedPersonnel || [],
	);

	const uniquePersonnel = allPersonnel.reduce<typeof allPersonnel>(
		(acc, person) => {
			if (!acc.some((p) => p.publicId === person.publicId)) {
				acc.push(person);
			}
			return acc;
		},
		[],
	);

	const upcomingEvents = sortedEvents.filter((event) =>
		["APPROVED", "ONGOING"].includes(event.status),
	);

	if (eventsLoading) {
		return (
			<div className="bg-background">
				<div className="flex flex-col flex-1 overflow-hidden">
					<header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 border-b px-4 sm:px-6 py-3 sm:py-0 sm:h-[65px]">
						<h1 className="text-xl font-semibold">Event Personnel</h1>
					</header>
					<div className="p-4 sm:p-6">
						<div className="text-center">Loading...</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="bg-background flex flex-col overflow-hidden h-full">
			<div className="flex flex-col flex-1 overflow-hidden">
				<header className="sticky top-0 z-10 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-0 justify-between border-b px-4 sm:px-6 py-3 sm:py-0 sm:h-[65px] bg-background">
					<h1 className="text-xl font-semibold">Event Personnel</h1>
					<div className="flex flex-row items-center gap-2 w-full sm:w-auto">
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="outline"
									className="flex-1 sm:flex-initial sm:w-auto"
								>
									<ListFilter className="mr-2 h-4 w-4" />
									Display
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuRadioGroup
									value={displayView}
									onValueChange={(value) =>
										setDisplayView(value as "list" | "card")
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
									<DropdownMenuRadioItem value="PENDING">
										{EventStatus.PENDING}
									</DropdownMenuRadioItem>
									<DropdownMenuRadioItem value="APPROVED">
										{EventStatus.APPROVED}
									</DropdownMenuRadioItem>
									<DropdownMenuRadioItem value="ONGOING">
										{EventStatus.ONGOING}
									</DropdownMenuRadioItem>
									<DropdownMenuRadioItem value="COMPLETED">
										{EventStatus.COMPLETED}
									</DropdownMenuRadioItem>
									<DropdownMenuRadioItem value="REJECTED">
										{EventStatus.REJECTED}
									</DropdownMenuRadioItem>
									<DropdownMenuRadioItem value="CANCELED">
										{EventStatus.CANCELED}
									</DropdownMenuRadioItem>
								</DropdownMenuRadioGroup>
								<DropdownMenuSeparator />
								<Label className="px-2 py-1.5 text-sm font-semibold">
									Sort
								</Label>
								<DropdownMenuCheckboxItem
									checked={sortBy === "startTime"}
									onCheckedChange={(checked) => {
										setSortBy(checked ? "startTime" : "recency");
									}}
								>
									Event Date
								</DropdownMenuCheckboxItem>
								<DropdownMenuCheckboxItem
									checked={sortBy === "recency"}
									onCheckedChange={(checked) => {
										setSortBy(checked ? "recency" : "startTime");
									}}
								>
									Most Recent
								</DropdownMenuCheckboxItem>
							</DropdownMenuContent>
						</DropdownMenu>
						<Popover>
							<PopoverTrigger asChild>
								<Button
									variant="outline"
									className={cn(
										"flex-1 sm:flex-initial sm:w-auto justify-start text-left font-normal",
										!selectedDateRange && "text-muted-foreground",
									)}
								>
									<CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
									<span className="truncate text-xs sm:text-sm">
										{selectedDateRange?.from ? (
											selectedDateRange.to ? (
												<>
													<span className="hidden sm:inline">
														{format(selectedDateRange.from, "MMM dd")} -{" "}
														{format(selectedDateRange.to, "MMM dd, y")}
													</span>
													<span className="sm:hidden">
														{format(selectedDateRange.from, "MM/dd")} -{" "}
														{format(selectedDateRange.to, "MM/dd")}
													</span>
												</>
											) : (
												format(selectedDateRange.from, "LLL dd, y")
											)
										) : (
											"Pick a date range"
										)}
									</span>
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-auto p-0" align="end">
								<Select
									onValueChange={(value) => {
										const now = new Date();
										if (value === "custom") {
											setSelectedDateRange(
												(prevRange: DateRange | undefined) => ({
													from: prevRange?.from ?? startOfDay(addDays(now, -7)),
													to: prevRange?.to ?? endOfDay(now),
												}),
											);
										} else if (value === "all") {
											setSelectedDateRange(undefined);
										} else if (value === "today") {
											setSelectedDateRange({
												from: startOfDay(now),
												to: endOfDay(now),
											});
										} else if (value === "thisWeek") {
											setSelectedDateRange({
												from: startOfWeek(now, {
													weekStartsOn: 1,
												}),
												to: endOfWeek(now, {
													weekStartsOn: 1,
												}),
											});
										} else if (value === "thisMonth") {
											setSelectedDateRange({
												from: startOfMonth(now),
												to: endOfMonth(now),
											});
										} else {
											const numDays = Number.parseInt(value, 10);
											if (!Number.isNaN(numDays)) {
												setSelectedDateRange({
													from: startOfDay(addDays(now, -numDays)),
													to: endOfDay(now),
												});
											} else {
												setSelectedDateRange(undefined);
											}
										}
									}}
								>
									<SelectTrigger className="m-2 mb-0 w-[calc(100%-1rem)]">
										<SelectValue placeholder="Select quick range" />
									</SelectTrigger>
									<SelectContent position="popper">
										<SelectItem value="all">All Time</SelectItem>
										<SelectItem value="today">Today</SelectItem>
										<SelectItem value="thisWeek">This Week</SelectItem>
										<SelectItem value="thisMonth">This Month</SelectItem>
										<SelectItem value="7">Last 7 days</SelectItem>
										<SelectItem value="30">Last 30 days</SelectItem>
									</SelectContent>
								</Select>
								<Calendar
									initialFocus
									mode="range"
									defaultMonth={selectedDateRange?.from}
									selected={selectedDateRange}
									onSelect={setSelectedDateRange}
									numberOfMonths={1}
								/>
							</PopoverContent>
						</Popover>
					</div>
				</header>

				<div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 p-4 sm:p-6">
					<Card>
						<CardContent className="p-4 sm:p-6">
							<div className="flex items-center space-x-2">
								<Users className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
								<div>
									<p className="text-xl sm:text-2xl font-bold">
										{uniquePersonnel.length}
									</p>
									<p className="text-xs sm:text-sm text-muted-foreground">
										Total Personnel
									</p>
								</div>
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardContent className="p-4 sm:p-6">
							<div className="flex items-center space-x-2">
								<CalendarDays className="w-4 h-4 sm:w-5 sm:h-5 text-accent flex-shrink-0" />
								<div>
									<p className="text-xl sm:text-2xl font-bold">
										{upcomingEvents.length}
									</p>
									<p className="text-xs sm:text-sm text-muted-foreground">
										Upcoming Events
									</p>
								</div>
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardContent className="p-4 sm:p-6">
							<div className="flex items-center space-x-2">
								<MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500 flex-shrink-0" />
								<div>
									<p className="text-xl sm:text-2xl font-bold">
										{sortedEvents.length}
									</p>
									<p className="text-xs sm:text-sm text-muted-foreground">
										Total Events
									</p>
								</div>
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardContent className="p-4 sm:p-6">
							<div className="flex items-center space-x-2">
								<MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-destructive flex-shrink-0" />
								<div>
									<p className="text-xl sm:text-2xl font-bold">
										{allPersonnel.length}
									</p>
									<p className="text-xs sm:text-sm text-muted-foreground">
										Assignments
									</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>

				<Separator className="my-2 sm:my-4" />

				<div className="p-4 sm:p-6 overflow-y-auto flex-1">
					{sortedEvents.length > 0 ? (
						displayView === "card" ? (
							<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
								{sortedEvents.map((event) => (
									<Card key={event.publicId}>
										<CardHeader>
											<div className="flex items-center justify-between">
												<div>
													<CardTitle className="text-xl">
														{event.eventName}
													</CardTitle>
													<CardDescription className="flex items-center space-x-4 mt-2">
														<span className="flex items-center space-x-1">
															<CalendarDays className="w-4 h-4" />
															<span>
																{formatDateTime(event.startTime)} -{" "}
																{formatDateTime(event.endTime)}
															</span>
														</span>
														<span className="flex items-center space-x-1">
															<MapPin className="w-4 h-4" />
															<span>
																{event.eventVenue.name}
																{event.eventVenue.location
																	? ` • ${event.eventVenue.location}`
																	: ""}
															</span>
														</span>
													</CardDescription>
												</div>
												{getApproverStatusBadge(event.status)}
											</div>
										</CardHeader>
										<CardContent className="flex flex-col h-full">
											<div className="flex-1 space-y-4">
												<div className="flex items-center justify-between">
													<span className="text-sm font-medium">
														Assigned Personnel(
														{event.assignedPersonnel?.length || 0})
													</span>
												</div>
												{event.assignedPersonnel?.length ? (
													<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
														{event.assignedPersonnel.map((staff) => (
															<div
																key={staff.publicId}
																className="flex items-center space-x-2 p-2 rounded-lg bg-muted/30"
															>
																<Avatar className="h-8 w-8">
																	<AvatarFallback className="text-xs">
																		{getInitials(
																			`${staff.personnel.firstName} ${staff.personnel.lastName}`,
																		)}
																	</AvatarFallback>
																</Avatar>
																<div className="flex-1 min-w-0">
																	<div className="font-medium text-sm truncate">
																		{staff.personnel.firstName}{" "}
																		{staff.personnel.lastName}
																	</div>
																	<div className="text-xs text-muted-foreground flex items-center gap-1">
																		<Phone className="w-3 h-3" />
																		<span className="truncate">
																			{staff.phoneNumber}
																		</span>
																	</div>
																</div>
															</div>
														))}
													</div>
												) : (
													<div className="text-sm text-muted-foreground">
														No personnel assigned.
													</div>
												)}
											</div>
											<Button
												className="w-full bg-transparent mt-4"
												variant="outline"
												onClick={() => {
													setSelectedEventId(event.publicId);
													setManageAssignmentsDialogOpen(true);
												}}
											>
												Manage Assignments
											</Button>
										</CardContent>
									</Card>
								))}
							</div>
						) : (
							<div className="border rounded-lg overflow-hidden">
								<div className="flex flex-col">
									{sortedEvents.map((event) => (
										<div
											key={event.publicId}
											className="flex items-center justify-between p-3 sm:p-4 border-b last:border-b-0 hover:bg-muted/50 transition-colors gap-2"
										>
											<div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
												<div className="flex-1 min-w-0">
													<p
														className="text-sm sm:text-base font-medium truncate"
														title={event.eventName}
													>
														{event.eventName}
													</p>
													<div className="text-xs sm:text-sm text-muted-foreground flex items-center gap-2 mt-1">
														<CalendarDays className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
														<span className="truncate">
															{formatDateTime(event.startTime)}
														</span>
													</div>
												</div>
											</div>

											<div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground mx-2 lg:mx-4 flex-shrink-0">
												<MapPin className="h-4 w-4" />
												<span
													className="truncate"
													title={event.eventVenue.name}
												>
													{event.eventVenue.name}
												</span>
											</div>

											<div className="hidden lg:flex items-center gap-2 text-sm text-muted-foreground mx-4 flex-shrink-0">
												<Users className="h-4 w-4" />
												<span>
													{event.assignedPersonnel?.length || 0} Personnel
												</span>
											</div>

											<div className="flex-shrink-0">
												{getApproverStatusBadge(event.status)}
											</div>

											<Button
												variant="outline"
												size="sm"
												onClick={() => {
													setSelectedEventId(event.publicId);
													setManageAssignmentsDialogOpen(true);
												}}
												className="flex-shrink-0"
											>
												Manage
											</Button>
										</div>
									))}
								</div>
							</div>
						)
					) : (
						<div className="text-center text-muted-foreground py-8">
							No events found.
						</div>
					)}
				</div>
			</div>

			{/* Dialogs */}
			<ManageAssignmentsDialog />
		</div>
	);
}
