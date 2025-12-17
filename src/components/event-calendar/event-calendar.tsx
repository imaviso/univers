"use client";

import {
	addDays,
	addMonths,
	addWeeks,
	endOfWeek,
	format,
	isSameMonth,
	startOfWeek,
	subMonths,
	subWeeks,
} from "date-fns";
import {
	ChevronDownIcon,
	ChevronLeftIcon,
	ChevronRightIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuShortcut,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
	EventGap,
	EventHeight,
	type StatusLegendItem,
	WeekCellsHeight,
} from "./constants";
import { DayView } from "./day-view";
import { MonthView } from "./month-view";
import type { CalendarEvent, CalendarView } from "./types";
import { getEventDotBgClass } from "./utils";
import { WeekView } from "./week-view";

export interface EventCalendarProps {
	events?: CalendarEvent[];
	onEventClick?: (event: CalendarEvent) => void;
	className?: string;
	initialView?: CalendarView;
	legendItems?: StatusLegendItem[];
	additionalFilters?: React.ReactNode;
}

export function EventCalendar({
	events = [],
	onEventClick,
	className,
	initialView = "month",
	legendItems = [],
	additionalFilters,
}: EventCalendarProps) {
	const [currentDate, setCurrentDate] = useState(new Date());
	const [view, setView] = useState<CalendarView>(initialView);

	// Add keyboard shortcuts for view switching
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			// Skip if user is typing in an input, textarea or contentEditable element
			if (
				e.target instanceof HTMLInputElement ||
				e.target instanceof HTMLTextAreaElement ||
				(e.target instanceof HTMLElement && e.target.isContentEditable)
			) {
				return;
			}

			switch (e.key.toLowerCase()) {
				case "m":
					setView("month");
					break;
				case "w":
					setView("week");
					break;
				case "d":
					setView("day");
					break;
			}
		};

		window.addEventListener("keydown", handleKeyDown);

		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, []);

	const handlePrevious = () => {
		if (view === "month") {
			setCurrentDate(subMonths(currentDate, 1));
		} else if (view === "week") {
			setCurrentDate(subWeeks(currentDate, 1));
		} else if (view === "day") {
			setCurrentDate(addDays(currentDate, -1));
		}
	};

	const handleNext = () => {
		if (view === "month") {
			setCurrentDate(addMonths(currentDate, 1));
		} else if (view === "week") {
			setCurrentDate(addWeeks(currentDate, 1));
		} else if (view === "day") {
			setCurrentDate(addDays(currentDate, 1));
		}
	};

	const handleToday = () => {
		setCurrentDate(new Date());
	};

	const handleEventSelect = (event: CalendarEvent) => {
		onEventClick?.(event);
	};

	const viewTitle = useMemo(() => {
		if (view === "month") {
			return format(currentDate, "MMMM yyyy");
		} else if (view === "week") {
			const start = startOfWeek(currentDate, { weekStartsOn: 0 });
			const end = endOfWeek(currentDate, { weekStartsOn: 0 });
			if (isSameMonth(start, end)) {
				return format(start, "MMMM yyyy");
			} else {
				return `${format(start, "MMM")} - ${format(end, "MMM yyyy")}`;
			}
		} else if (view === "day") {
			return (
				<>
					<span className="min-[480px]:hidden" aria-hidden="true">
						{format(currentDate, "MMM d, yyyy")}
					</span>
					<span className="max-[479px]:hidden min-md:hidden" aria-hidden="true">
						{format(currentDate, "MMMM d, yyyy")}
					</span>
					<span className="max-md:hidden">
						{format(currentDate, "EEE MMMM d, yyyy")}
					</span>
				</>
			);
		} else {
			return format(currentDate, "MMMM yyyy");
		}
	}, [currentDate, view]);

	return (
		<div
			className="flex flex-col rounded-lg has-data-[slot=month-view]:flex-1"
			style={
				{
					"--event-height": `${EventHeight}px`,
					"--event-gap": `${EventGap}px`,
					"--week-cells-height": `${WeekCellsHeight}px`,
				} as React.CSSProperties
			}
		>
			<header
				className={cn(
					"flex flex-col border-b px-4 sm:px-6 py-3 sm:py-0 sm:h-[65px] sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0",
					className,
				)}
			>
				{/* Top row on mobile: Title and View selector */}
				<div className="flex items-center justify-between gap-4">
					<h1 className="text-xl font-semibold">Calendar</h1>

					<div className="flex items-center gap-3">
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="outline" size="sm" className="gap-1.5">
									<span className="text-xs sm:text-sm">
										{view.charAt(0).toUpperCase() + view.slice(1)}
									</span>
									<ChevronDownIcon
										className="-me-1 opacity-60"
										size={16}
										aria-hidden="true"
									/>
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="min-w-32">
								<DropdownMenuItem onClick={() => setView("month")}>
									Month <DropdownMenuShortcut>M</DropdownMenuShortcut>
								</DropdownMenuItem>
								<DropdownMenuItem onClick={() => setView("week")}>
									Week <DropdownMenuShortcut>W</DropdownMenuShortcut>
								</DropdownMenuItem>
								<DropdownMenuItem onClick={() => setView("day")}>
									Day <DropdownMenuShortcut>D</DropdownMenuShortcut>
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
						{additionalFilters}
					</div>
				</div>

				{/* Bottom row on mobile: Navigation controls and date */}
				<div className="flex items-center justify-between gap-3 sm:gap-4">
					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={handleToday}
							className="text-xs sm:text-sm"
						>
							Today
						</Button>
						<div className="flex items-center">
							<Button
								variant="ghost"
								size="icon"
								onClick={handlePrevious}
								aria-label="Previous"
								className="h-8 w-8 sm:h-9 sm:w-9"
							>
								<ChevronLeftIcon size={16} aria-hidden="true" />
							</Button>
							<Button
								variant="ghost"
								size="icon"
								onClick={handleNext}
								aria-label="Next"
								className="h-8 w-8 sm:h-9 sm:w-9"
							>
								<ChevronRightIcon size={16} aria-hidden="true" />
							</Button>
						</div>
					</div>

					<div className="flex items-center gap-2">
						<h2 className="text-sm font-semibold sm:text-base md:text-lg">
							{viewTitle}
						</h2>

						{/* Legend (hidden on small screens) */}
						{legendItems.length > 0 && (
							<div className="hidden lg:flex items-center gap-3 ms-4 flex-wrap">
								{legendItems.map((item) => (
									<div
										key={item.key}
										className="flex items-center gap-1.5 text-xs text-muted-foreground"
										title={item.label}
									>
										<span
											className={cn(
												"size-2 rounded-full",
												getEventDotBgClass(item.color),
											)}
											aria-hidden="true"
										/>
										<span className="capitalize leading-none">
											{item.label}
										</span>
									</div>
								))}
							</div>
						)}
					</div>
				</div>
			</header>

			<div className="flex flex-1 flex-col p-6">
				{view === "month" && (
					<MonthView
						currentDate={currentDate}
						events={events}
						onEventSelect={handleEventSelect}
					/>
				)}
				{view === "week" && (
					<WeekView
						currentDate={currentDate}
						events={events}
						onEventSelect={handleEventSelect}
					/>
				)}
				{view === "day" && (
					<DayView
						currentDate={currentDate}
						events={events}
						onEventSelect={handleEventSelect}
					/>
				)}
			</div>
		</div>
	);
}
