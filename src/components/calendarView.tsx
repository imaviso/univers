import type { FilterState } from "@/components/calendarFilter";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Updated event structure with start and end times
type Event = {
	id: number;
	title: string;
	category: string;
	date: Date;
	startTime: string;
	endTime: string;
};

// Simulated events with start and end times
const events: Event[] = [
	{
		id: 1,
		title: "Team Meeting",
		category: "work",
		date: new Date(2025, 1, 20),
		startTime: "09:00",
		endTime: "10:00",
	},
	{
		id: 2,
		title: "Family Dinner",
		category: "family",
		date: new Date(2025, 1, 22),
		startTime: "18:00",
		endTime: "20:00",
	},
	{
		id: 3,
		title: "Gym Session",
		category: "personal",
		date: new Date(2025, 1, 25),
		startTime: "07:00",
		endTime: "08:30",
	},
	{
		id: 4,
		title: "Project Deadline",
		category: "work",
		date: new Date(2025, 1, 28),
		startTime: "14:00",
		endTime: "15:00",
	},
];

type CalendarViewProps = {
	filters: FilterState;
};

export default function CalendarView({ filters }: CalendarViewProps) {
	const [currentDate, setCurrentDate] = useState(new Date(2025, 1, 1)); // Set to February 2025 for demonstration
	const [filteredEvents, setFilteredEvents] = useState(events);

	useEffect(() => {
		const filtered = events.filter((event) => {
			const categoryMatch =
				filters.categories.length === 0 ||
				filters.categories.includes(event.category);
			const dateMatch =
				!filters.dateRange ||
				((!filters.dateRange.from || event.date >= filters.dateRange.from) &&
					(!filters.dateRange.to || event.date <= filters.dateRange.to));
			return categoryMatch && dateMatch;
		});
		setFilteredEvents(filtered);
	}, [filters]);

	const getDaysInMonth = (date: Date) => {
		const year = date.getFullYear();
		const month = date.getMonth();
		const daysInMonth = new Date(year, month + 1, 0).getDate();
		const firstDayOfMonth = new Date(year, month, 1).getDay();
		return { daysInMonth, firstDayOfMonth };
	};

	const { daysInMonth, firstDayOfMonth } = getDaysInMonth(currentDate);

	const prevMonth = () => {
		setCurrentDate(
			new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
		);
	};

	const nextMonth = () => {
		setCurrentDate(
			new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
		);
	};

	const getEventColor = (category: string) => {
		switch (category) {
			case "work":
				return "bg-blue-100 text-blue-800 border-blue-300";
			case "family":
				return "bg-green-100 text-green-800 border-green-300";
			case "personal":
				return "bg-yellow-100 text-yellow-800 border-yellow-300";
			default:
				return "bg-gray-100 text-gray-800 border-gray-300";
		}
	};

	return (
		<div className="m-12">
			<div className="mb-4 flex items-center justify-between">
				<h2 className="text-2xl font-semibold">
					{currentDate.toLocaleString("default", {
						month: "long",
						year: "numeric",
					})}
				</h2>
				<div>
					<Button variant="outline" size="icon" onClick={prevMonth}>
						<ChevronLeft className="h-4 w-4" />
					</Button>
					<Button
						variant="outline"
						size="icon"
						onClick={nextMonth}
						className="ml-2"
					>
						<ChevronRight className="h-4 w-4" />
					</Button>
				</div>
			</div>
			<div className="grid grid-cols-7 gap-1">
				{daysOfWeek.map((day) => (
					<div key={day} className="text-center font-semibold">
						{day}
					</div>
				))}
				{Array.from({ length: firstDayOfMonth }).map((_, index) => (
					<div
						// biome-ignore lint/suspicious/noArrayIndexKey: Index is acceptable for static placeholder divs
						key={`calendar-start-placeholder-${index}`}
						className="h-32 border"
					/>
				))}
				{Array.from({ length: daysInMonth }).map((_, index) => {
					const day = index + 1;
					const isToday =
						day === new Date().getDate() &&
						currentDate.getMonth() === new Date().getMonth() &&
						currentDate.getFullYear() === new Date().getFullYear();
					const dayEvents = filteredEvents.filter(
						(event) =>
							event.date.getDate() === day &&
							event.date.getMonth() === currentDate.getMonth(),
					);
					return (
						<div
							key={day}
							className={cn(
								"h-32 border p-1 overflow-y-auto",
								isToday && "bg-blue-50",
							)}
						>
							<span
								className={cn(
									"text-sm font-semibold",
									isToday && "text-blue-600",
								)}
							>
								{day}
							</span>
							{dayEvents.map((event) => (
								<div
									key={event.id}
									className={cn(
										"mt-1 text-xs p-1 rounded border",
										getEventColor(event.category),
									)}
								>
									<div className="font-semibold">{event.title}</div>
									<div>
										{event.startTime} - {event.endTime}
									</div>
								</div>
							))}
						</div>
					);
				})}
			</div>
		</div>
	);
}
