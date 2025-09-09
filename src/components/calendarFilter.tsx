import { CalendarIcon } from "lucide-react";
import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
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

const categories = [
	{ id: "personal", name: "Personal", color: "bg-yellow-500" },
	{ id: "work", name: "Work", color: "bg-blue-500" },
	{ id: "family", name: "Family", color: "bg-green-500" },
];

export type FilterState = {
	categories: string[];
	dateRange: DateRange | undefined;
	timeRange: {
		start: string | undefined;
		end: string | undefined;
	};
};

type FilterProps = {
	onFilterChange: (filters: FilterState) => void;
};

export default function Filter({ onFilterChange }: FilterProps) {
	const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
	const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
	const [timeRange, setTimeRange] = useState<{
		start: string | undefined;
		end: string | undefined;
	}>({
		start: undefined,
		end: undefined,
	});

	const handleCategoryChange = (categoryId: string, checked: boolean) => {
		setSelectedCategories((prev) =>
			checked ? [...prev, categoryId] : prev.filter((id) => id !== categoryId),
		);
	};

	const handleApplyFilters = () => {
		onFilterChange({
			categories: selectedCategories,
			dateRange: dateRange || { from: undefined, to: undefined },
			timeRange,
		});
	};

	return (
		<div className="space-y-4">
			<h2 className="font-semibold">Filters</h2>
			<div>
				<h3 className="mb-2 text-sm font-medium">Categories</h3>
				{categories.map((category) => (
					<div key={category.id} className="flex items-center space-x-2">
						<Checkbox
							id={category.id}
							checked={selectedCategories.includes(category.id)}
							onCheckedChange={(checked) =>
								handleCategoryChange(category.id, checked as boolean)
							}
						/>
						<label
							htmlFor={category.id}
							className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
						>
							{category.name}
						</label>
					</div>
				))}
			</div>
			<div>
				<h3 className="mb-2 text-sm font-medium">Date Range</h3>
				<Popover>
					<PopoverTrigger asChild>
						<Button
							variant="outline"
							className="w-full justify-start text-left font-normal"
						>
							<CalendarIcon className="mr-2 h-4 w-4" />
							{dateRange?.from ? (
								dateRange.to ? (
									<>
										{dateRange.from.toDateString()} -{" "}
										{dateRange.to.toDateString()}
									</>
								) : (
									dateRange.from.toDateString()
								)
							) : (
								<span>Pick a date range</span>
							)}
						</Button>
					</PopoverTrigger>
					<PopoverContent className="w-auto p-0" align="start">
						<Calendar
							initialFocus
							mode="range"
							defaultMonth={dateRange?.from}
							selected={dateRange}
							onSelect={setDateRange}
							numberOfMonths={2}
						/>
					</PopoverContent>
				</Popover>
			</div>
			<div>
				<h3 className="mb-2 text-sm font-medium">Time Range</h3>
				<div className="flex space-x-2">
					<Select
						onValueChange={(value) =>
							setTimeRange((prev) => ({ ...prev, start: value }))
						}
					>
						<SelectTrigger className="w-full">
							<SelectValue placeholder="Start time" />
						</SelectTrigger>
						<SelectContent>
							{Array.from({ length: 24 }).map((_, i) => (
								<SelectItem
									key={`${i.toString().padStart(2, "0")}:00`}
									value={`${i.toString().padStart(2, "0")}:00`}
								>
									{`${i.toString().padStart(2, "0")}:00`}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Select
						onValueChange={(value) =>
							setTimeRange((prev) => ({ ...prev, end: value }))
						}
					>
						<SelectTrigger className="w-full">
							<SelectValue placeholder="End time" />
						</SelectTrigger>
						<SelectContent>
							{Array.from({ length: 24 }).map((_, i) => (
								<SelectItem
									key={`${i.toString().padStart(2, "0")}:00`}
									value={`${i.toString().padStart(2, "0")}:00`}
								>
									{`${i.toString().padStart(2, "0")}:00`}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>
			<Button onClick={handleApplyFilters} className="w-full">
				Apply Filters
			</Button>
		</div>
	);
}
