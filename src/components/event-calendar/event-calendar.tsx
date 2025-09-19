"use client";

import { RiCalendarCheckLine } from "@remixicon/react";
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

import {
	EventGap,
	EventHeight,
	WeekCellsHeight,
	type StatusLegendItem,
} from "./constants";
import type { CalendarEvent, CalendarView } from "./types";
import { DayView } from "./day-view";
import { MonthView } from "./month-view";
import { WeekView } from "./week-view";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuShortcut,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { getEventDotBgClass } from "./utils";

export interface EventCalendarProps {
	events?: CalendarEvent[];
	onEventClick?: (event: CalendarEvent) => void;
	className?: string;
	initialView?: CalendarView;
	legendItems?: StatusLegendItem[];
}

export function EventCalendar({
	events = [],
	onEventClick,
	className,
	initialView = "month",
	legendItems = [],
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
					"flex items-center border-b justify-between p-2 sm:p-4 h-[65px]",
					className,
				)}
			>
				<div className="flex items-center gap-1 sm:gap-4">
					<h1 className="text-xl font-semibold">Calendar</h1>
					<Button
						variant="outline"
						className="max-[479px]:aspect-square max-[479px]:p-0!"
						onClick={handleToday}
					>
						<RiCalendarCheckLine
							className="min-[480px]:hidden"
							size={16}
							aria-hidden="true"
						/>
						<span className="max-[479px]:sr-only">Today</span>
					</Button>
					<div className="flex items-center sm:gap-2">
						<Button
							variant="ghost"
							size="icon"
							onClick={handlePrevious}
							aria-label="Previous"
						>
							<ChevronLeftIcon size={16} aria-hidden="true" />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							onClick={handleNext}
							aria-label="Next"
						>
							<ChevronRightIcon size={16} aria-hidden="true" />
						</Button>
					</div>
					<h2 className="text-sm font-semibold sm:text-lg md:text-xl">
						{viewTitle}
					</h2>
				</div>
				<div className="flex items-center gap-2">
					{/* Legend (hidden on small screens) */}
					{legendItems.length > 0 && (
						<div className="hidden md:flex items-center gap-3 me-1 flex-wrap">
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
									<span className="capitalize leading-none">{item.label}</span>
								</div>
							))}
						</div>
					)}

					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline" className="gap-1.5 max-[479px]:h-8">
								<span>
									<span className="min-[480px]:hidden" aria-hidden="true">
										{view.charAt(0).toUpperCase()}
									</span>
									<span className="max-[479px]:sr-only">
										{view.charAt(0).toUpperCase() + view.slice(1)}
									</span>
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
