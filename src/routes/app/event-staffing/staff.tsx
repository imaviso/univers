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

export const Route = createFileRoute("/app/event-staffing/staff")({
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
					<header className="flex items-center justify-between border-b px-6 h-[65px]">
						<h1 className="text-xl font-semibold">Event Staffing</h1>
					</header>
					<div className="p-6">
						<div className="text-center">Loading...</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="bg-background flex flex-col overflow-hidden h-full">
			<div className="flex flex-col flex-1 overflow-hidden">
				<header className="sticky top-0 z-10 flex items-center justify-between border-b px-6 h-[65px] bg-background">
					<h1 className="text-xl font-semibold">Event Staffing</h1>
					<div className="flex items-center gap-4 h-full">
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="outline">
									<ListFilter className="mr-2 h-4 w-4" />
									Filter
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
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
										"w-fit justify-start text-left font-normal",
										!selectedDateRange && "text-muted-foreground",
									)}
								>
									<CalendarIcon className="mr-2 h-4 w-4" />
									{selectedDateRange?.from ? (
										selectedDateRange.to ? (
											<>
												{format(selectedDateRange.from, "LLL dd, y")} -{" "}
												{format(selectedDateRange.to, "LLL dd, y")}
											</>
										) : (
											format(selectedDateRange.from, "LLL dd, y")
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

				<div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6">
					<Card>
						<CardContent className="p-6">
							<div className="flex items-center space-x-2">
								<Users className="w-5 h-5 text-primary" />
								<div>
									<p className="text-2xl font-bold">{uniquePersonnel.length}</p>
									<p className="text-sm text-muted-foreground">
										Total Personnel
									</p>
								</div>
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardContent className="p-6">
							<div className="flex items-center space-x-2">
								<CalendarDays className="w-5 h-5 text-accent" />
								<div>
									<p className="text-2xl font-bold">{upcomingEvents.length}</p>
									<p className="text-sm text-muted-foreground">
										Upcoming Events
									</p>
								</div>
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardContent className="p-6">
							<div className="flex items-center space-x-2">
								<MapPin className="w-5 h-5 text-yellow-500" />
								<div>
									<p className="text-2xl font-bold">{sortedEvents.length}</p>
									<p className="text-sm text-muted-foreground">Total Events</p>
								</div>
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardContent className="p-6">
							<div className="flex items-center space-x-2">
								<MapPin className="w-5 h-5 text-destructive" />
								<div>
									<p className="text-2xl font-bold">{allPersonnel.length}</p>
									<p className="text-sm text-muted-foreground">Assignments</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>

				<Separator className="my-4" />

				<div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6">
					{sortedEvents.length > 0 ? (
						sortedEvents.map((event) => (
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
												Assigned Staff ({event.assignedPersonnel?.length || 0})
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
												No staff assigned.
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
						))
					) : (
						<div className="text-center text-muted-foreground py-8 col-span-full">
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
