import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
	addDays,
	endOfDay,
	endOfMonth,
	endOfWeek,
	format,
	formatISO,
	startOfDay,
	startOfMonth,
	startOfWeek,
} from "date-fns"; // Added date-fns functions, ADDED addDays
import { CalendarIcon, ListFilter } from "lucide-react"; // Added ListFilter icon, Added CalendarIcon
import { useState } from "react";
import type { DateRange } from "react-day-picker"; // Added DateRange
import { CreateEventButton } from "@/components/events/createEventButton";
import { EventList } from "@/components/events/eventList";
import { EventModal } from "@/components/events/eventModal";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"; // ADDED Select components
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Import Tabs
import { EVENT_STATUSES } from "@/lib/constants";
import { useCurrentUser, venuesQueryOptions } from "@/lib/query"; // Import useCurrentUser
import { cn, usePersistentState } from "@/lib/utils"; // Added cn

export const Route = createFileRoute("/app/events/timeline")({
	component: Events,
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

function Events() {
	const { data: venues = [] } = useSuspenseQuery(venuesQueryOptions);
	const { data: currentUser } = useCurrentUser();
	const userRoles = currentUser?.roles || [];

	const isSuperAdmin =
		userRoles.includes("SUPER_ADMIN") ||
		userRoles.includes("ASSIGNED_PERSONNEL");
	const isAdmin =
		userRoles.includes("VP_ADMIN") ||
		userRoles.includes("ADMIN") ||
		userRoles.includes("DEPT_HEAD") ||
		userRoles.includes("VENUE_OWNER") ||
		userRoles.includes("EQUIPMENT_OWNER");

	let defaultActiveTab: "all" | "mine" | "related";
	if (isSuperAdmin) {
		defaultActiveTab = "all";
	} else if (isAdmin) {
		defaultActiveTab = "related";
	} else {
		defaultActiveTab = "mine";
	}

	const [activeTab, setActiveTab] = usePersistentState<
		"all" | "mine" | "related"
	>(
		"eventActiveTab_v3", // Updated key for new default logic
		defaultActiveTab,
	);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [eventStatusFilter, setEventStatusFilter] = usePersistentState<string>(
		"eventStatusFilter",
		"ALL",
	); // Added state for status filter, default to ALL
	const [sortBy, setSortBy] = usePersistentState<string>(
		"eventSortBy",
		"recency",
	); // Added state for sort order, default to recency
	const [listSelectedDateRange, setListSelectedDateRange] = usePersistentState<
		DateRange | undefined
	>("eventListDateRange_v1", undefined);
	const [displayView, setDisplayView] = usePersistentState<"list" | "card">(
		"eventDisplayView",
		"card",
	); // State for display view

	const isAuthorized = isSuperAdmin || isAdmin; // Simplified: SUPER_ADMIN or any other Admin role can see tabs

	return (
		<div className="bg-background flex flex-col overflow-hidden h-full">
			{/* Show Tabs if user is SUPER_ADMIN or an Admin */}
			{isAuthorized ? (
				<Tabs
					value={activeTab}
					onValueChange={(value) =>
						setActiveTab(value as "all" | "mine" | "related")
					}
					className="flex flex-col flex-1 overflow-hidden"
				>
					<header className="flex items-center justify-between border-b px-6 h-[65px]">
						<div className="flex items-center gap-4">
							<h1 className="text-xl font-semibold">Events</h1>
							<div className="flex items-center gap-2"></div>
						</div>
						<div className="flex items-center gap-4 h-full">
							<DropdownMenu>
								{" "}
								{/* Only show filter dropdown in list view */}
								<DropdownMenuTrigger asChild>
									<Button variant="outline" className="ml-auto">
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
										checked={sortBy === "recency"}
										onCheckedChange={(checked) => {
											setSortBy(checked ? "recency" : "default");
										}}
									>
										Most Recent
									</DropdownMenuCheckboxItem>
									<DropdownMenuCheckboxItem
										checked={sortBy === "date"}
										onCheckedChange={(checked) => {
											setSortBy(checked ? "date" : "default");
										}}
									>
										Event Date
									</DropdownMenuCheckboxItem>
								</DropdownMenuContent>
							</DropdownMenu>
							<Popover>
								<PopoverTrigger asChild>
									<Button
										variant="outline"
										className={cn(
											"w-fit justify-start text-left font-normal",
											!listSelectedDateRange && "text-muted-foreground",
										)}
									>
										<CalendarIcon className="mr-2 h-4 w-4" />
										{listSelectedDateRange?.from ? (
											listSelectedDateRange.to ? (
												<>
													{format(listSelectedDateRange.from, "LLL dd, y")} -{" "}
													{format(listSelectedDateRange.to, "LLL dd, y")}
												</>
											) : (
												format(listSelectedDateRange.from, "LLL dd, y")
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
												setListSelectedDateRange(
													(prevRange: DateRange | undefined) => ({
														from:
															prevRange?.from ?? startOfDay(addDays(now, -7)),
														to: prevRange?.to ?? endOfDay(now),
													}),
												);
											} else if (value === "all") {
												setListSelectedDateRange(undefined);
											} else if (value === "today") {
												setListSelectedDateRange({
													from: startOfDay(now),
													to: endOfDay(now),
												});
											} else if (value === "thisWeek") {
												setListSelectedDateRange({
													from: startOfWeek(now, {
														weekStartsOn: 1,
													}),
													to: endOfWeek(now, {
														weekStartsOn: 1,
													}),
												});
											} else if (value === "thisMonth") {
												setListSelectedDateRange({
													from: startOfMonth(now),
													to: endOfMonth(now),
												});
											} else {
												const numDays = Number.parseInt(value, 10);
												if (!Number.isNaN(numDays)) {
													setListSelectedDateRange({
														from: startOfDay(addDays(now, -numDays)),
														to: endOfDay(now),
													});
												} else {
													setListSelectedDateRange(undefined);
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
										defaultMonth={listSelectedDateRange?.from}
										selected={listSelectedDateRange}
										onSelect={setListSelectedDateRange}
										numberOfMonths={1}
									/>
								</PopoverContent>
							</Popover>

							{/* TabsList for authorized users */}
							<TabsList className={cn("h-9 grid grid-cols-2")}>
								{isSuperAdmin && (
									<TabsTrigger value="all">All Events</TabsTrigger>
								)}
								{!isSuperAdmin && isAdmin && (
									<TabsTrigger value="related">Related Events</TabsTrigger>
								)}
								<TabsTrigger value="mine">My Events</TabsTrigger>
							</TabsList>
							<CreateEventButton onClick={() => setIsModalOpen(true)} />
						</div>
					</header>

					<main className="flex-1 pl-6 pr-6 overflow-hidden">
						{isSuperAdmin && (
							<TabsContent value="all" className="mt-0 h-full">
								<EventList
									activeTab="all"
									eventStatusFilter={eventStatusFilter}
									sortBy={sortBy}
									startDateISO={
										listSelectedDateRange?.from
											? formatISO(startOfDay(listSelectedDateRange.from))
											: undefined
									}
									endDateISO={
										listSelectedDateRange?.to
											? formatISO(endOfDay(listSelectedDateRange.to))
											: undefined
									}
									displayView={displayView}
								/>
							</TabsContent>
						)}
						{!isSuperAdmin && isAdmin && (
							<TabsContent value="related" className="mt-0 h-full">
								<EventList
									activeTab="related"
									eventStatusFilter={eventStatusFilter}
									sortBy={sortBy}
									startDateISO={
										listSelectedDateRange?.from
											? formatISO(startOfDay(listSelectedDateRange.from))
											: undefined
									}
									endDateISO={
										listSelectedDateRange?.to
											? formatISO(endOfDay(listSelectedDateRange.to))
											: undefined
									}
									displayView={displayView}
								/>
							</TabsContent>
						)}
						<TabsContent value="mine" className="mt-0 h-full">
							<EventList
								activeTab="mine"
								eventStatusFilter={eventStatusFilter}
								sortBy={sortBy}
								startDateISO={
									listSelectedDateRange?.from
										? formatISO(startOfDay(listSelectedDateRange.from))
										: undefined
								}
								endDateISO={
									listSelectedDateRange?.to
										? formatISO(endOfDay(listSelectedDateRange.to))
										: undefined
								}
								displayView={displayView}
							/>
						</TabsContent>
					</main>
				</Tabs>
			) : (
				// Non-Authorized users (Organizers) or timeline view structure
				<div className="flex flex-col flex-1 overflow-hidden">
					<header className="flex items-center justify-between border-b px-6 h-[65px]">
						<div className="flex items-center gap-4">
							<h1 className="text-xl font-semibold">Events</h1>
							{/* View switcher still available */}
							<div className="flex items-center gap-2"></div>
						</div>
						<div className="flex items-center gap-4 h-full">
							<Popover>
								<PopoverTrigger asChild>
									<Button
										variant="outline"
										className={cn(
											"w-fit justify-start text-left font-normal",
											!listSelectedDateRange && "text-muted-foreground",
										)}
									>
										<CalendarIcon className="mr-2 h-4 w-4" />
										{listSelectedDateRange?.from ? (
											listSelectedDateRange.to ? (
												<>
													{format(listSelectedDateRange.from, "LLL dd, y")} -{" "}
													{format(listSelectedDateRange.to, "LLL dd, y")}
												</>
											) : (
												format(listSelectedDateRange.from, "LLL dd, y")
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
												setListSelectedDateRange(
													(prevRange: DateRange | undefined) => ({
														from:
															prevRange?.from ?? startOfDay(addDays(now, -7)),
														to: prevRange?.to ?? endOfDay(now),
													}),
												);
											} else if (value === "all") {
												setListSelectedDateRange(undefined);
											} else if (value === "today") {
												setListSelectedDateRange({
													from: startOfDay(now),
													to: endOfDay(now),
												});
											} else if (value === "thisWeek") {
												setListSelectedDateRange({
													from: startOfWeek(now, {
														weekStartsOn: 1,
													}),
													to: endOfWeek(now, {
														weekStartsOn: 1,
													}),
												});
											} else if (value === "thisMonth") {
												setListSelectedDateRange({
													from: startOfMonth(now),
													to: endOfMonth(now),
												});
											} else {
												const numDays = Number.parseInt(value, 10);
												if (!Number.isNaN(numDays)) {
													setListSelectedDateRange({
														from: startOfDay(addDays(now, -numDays)),
														to: endOfDay(now),
													});
												} else {
													setListSelectedDateRange(undefined);
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
										defaultMonth={listSelectedDateRange?.from}
										selected={listSelectedDateRange}
										onSelect={setListSelectedDateRange}
										numberOfMonths={1}
									/>
								</PopoverContent>
							</Popover>
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant="outline" className="ml-auto">
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
										checked={sortBy === "recency"}
										onCheckedChange={(checked) => {
											setSortBy(checked ? "recency" : "default");
										}}
									>
										Most Recent
									</DropdownMenuCheckboxItem>
									<DropdownMenuCheckboxItem
										checked={sortBy === "date"}
										onCheckedChange={(checked) => {
											setSortBy(checked ? "date" : "default");
										}}
									>
										Event Date
									</DropdownMenuCheckboxItem>
								</DropdownMenuContent>
							</DropdownMenu>
							<CreateEventButton onClick={() => setIsModalOpen(true)} />
						</div>
					</header>
					<main className="flex-1 p-6 overflow-hidden">
						<EventList
							activeTab="mine" // Default to 'mine' for organizers
							eventStatusFilter={eventStatusFilter}
							sortBy={sortBy}
							startDateISO={
								listSelectedDateRange?.from
									? formatISO(startOfDay(listSelectedDateRange.from))
									: undefined
							}
							endDateISO={
								listSelectedDateRange?.to
									? formatISO(endOfDay(listSelectedDateRange.to))
									: undefined
							}
							displayView={displayView}
						/>
						)
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
