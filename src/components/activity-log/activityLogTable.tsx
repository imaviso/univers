import {
	type ColumnDef,
	type ColumnFiltersState,
	flexRender,
	getCoreRowModel,
	getFacetedRowModel,
	getFacetedUniqueValues,
	getFilteredRowModel,
	getSortedRowModel,
	type SortingState,
	useReactTable,
	type VisibilityState,
} from "@tanstack/react-table";
import { format } from "date-fns";
import { ArrowUpDown, CalendarIcon, ChevronDown, Download } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { DateRange } from "react-day-picker";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	exportActivityLogsAsCSV,
	exportActivityLogsAsJSON,
	getActivityLogsByAction,
	getActivityLogsByDateRange,
	getActivityLogsByEntityType,
	getAllActivityLogs,
} from "@/lib/api";
import type { Page } from "@/lib/notifications";
import type { ActivityLogDTO } from "@/lib/types";
import { cn } from "@/lib/utils";

// Custom hook for persistent state
function usePersistentState<T>(
	key: string,
	initialValue: T,
): [T, (value: T | ((prevState: T) => T)) => void] {
	const [state, setState] = useState<T>(() => {
		try {
			const storedValue = localStorage.getItem(key);
			if (storedValue) {
				return JSON.parse(storedValue);
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

const ACTION_TYPES = [
	"USER_REGISTERED",
	"USER_CREATED_BY_ADMIN",
	"USER_UPDATED_BY_ADMIN",
	"USER_ACTIVATED",
	"USER_DEACTIVATED",
	"EVENT_CREATED",
	"EVENT_UPDATED",
	"EVENT_DELETED",
	"EVENT_CANCELED",
	"EVENT_APPROVAL_APPROVED",
	"EVENT_APPROVAL_REJECTED",
	"VENUE_CREATED",
	"VENUE_UPDATED",
	"VENUE_DELETED",
	"DEPARTMENT_CREATED",
	"DEPARTMENT_UPDATED",
	"DEPARTMENT_DELETED",
	"DEPARTMENT_HEAD_ASSIGNED",
	"EQUIPMENT_CREATED",
	"EQUIPMENT_UPDATED",
	"EQUIPMENT_RESERVATION_APPROVED",
	"EQUIPMENT_RESERVATION_REJECTED",
];

const ENTITY_TYPES = [
	"USER",
	"EVENT",
	"VENUE",
	"EQUIPMENT",
	"DEPARTMENT",
	"EVENT_APPROVAL",
	"EQUIPMENT_RESERVATION",
];

// Helper function to format action types into human-readable labels
const formatActionLabel = (action: string): string => {
	return action
		.split("_")
		.map((word) => word.charAt(0) + word.slice(1).toLowerCase())
		.join(" ");
};

export function ActivityLogTable() {
	const [data, setData] = useState<ActivityLogDTO[]>([]);
	const [loading, setLoading] = useState(true);
	const [totalPages, setTotalPages] = useState(0);
	const [totalElements, setTotalElements] = useState(0);
	const [currentPage, setCurrentPage] = useState(0);
	const pageSize = 20;

	// Filters
	const [actionFilter, setActionFilter] = useState<string>("all");
	const [entityTypeFilter, setEntityTypeFilter] = useState<string>("all");
	const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

	// Table state
	const [sorting, setSorting] = usePersistentState<SortingState>(
		"activity-log-table-sorting",
		[],
	);
	const [columnFilters, setColumnFilters] =
		usePersistentState<ColumnFiltersState>("activity-log-table-filters", []);
	const [columnVisibility, setColumnVisibility] =
		usePersistentState<VisibilityState>("activity-log-table-visibility", {
			entityId: false,
		});

	// Fetch data
	const fetchLogs = useCallback(async () => {
		setLoading(true);
		try {
			let result: Page<ActivityLogDTO>;

			if (dateRange?.from && dateRange?.to) {
				const startDate = format(dateRange.from, "yyyy-MM-dd'T'00:00:00");
				const endDate = format(dateRange.to, "yyyy-MM-dd'T'23:59:59");
				result = await getActivityLogsByDateRange(
					startDate,
					endDate,
					currentPage,
					pageSize,
				);
			} else if (actionFilter && actionFilter !== "all") {
				result = await getActivityLogsByAction(
					actionFilter,
					currentPage,
					pageSize,
				);
			} else if (entityTypeFilter && entityTypeFilter !== "all") {
				result = await getActivityLogsByEntityType(
					entityTypeFilter,
					currentPage,
					pageSize,
				);
			} else {
				result = await getAllActivityLogs(currentPage, pageSize);
			}

			setData(result.content);
			setTotalPages(result.totalPages);
			setTotalElements(result.totalElements);
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Failed to fetch activity logs",
			);
		} finally {
			setLoading(false);
		}
	}, [currentPage, actionFilter, entityTypeFilter, dateRange]);

	useEffect(() => {
		fetchLogs();
	}, [fetchLogs]);

	// Export handlers
	const handleExportCSV = async () => {
		try {
			const startDate = dateRange?.from
				? format(dateRange.from, "yyyy-MM-dd'T'00:00:00")
				: undefined;
			const endDate = dateRange?.to
				? format(dateRange.to, "yyyy-MM-dd'T'23:59:59")
				: undefined;

			const blob = await exportActivityLogsAsCSV(startDate, endDate);
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `activity-logs-${format(new Date(), "yyyy-MM-dd")}.csv`;
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			document.body.removeChild(a);
			toast.success("Activity logs exported as CSV successfully");
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to export CSV",
			);
		}
	};

	const handleExportJSON = async () => {
		try {
			const startDate = dateRange?.from
				? format(dateRange.from, "yyyy-MM-dd'T'00:00:00")
				: undefined;
			const endDate = dateRange?.to
				? format(dateRange.to, "yyyy-MM-dd'T'23:59:59")
				: undefined;

			const blob = await exportActivityLogsAsJSON(startDate, endDate);
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `activity-logs-${format(new Date(), "yyyy-MM-dd")}.json`;
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			document.body.removeChild(a);
			toast.success("Activity logs exported as JSON successfully");
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to export JSON",
			);
		}
	};

	// Define columns
	const columns: ColumnDef<ActivityLogDTO>[] = [
		{
			accessorKey: "createdAt",
			header: ({ column }) => {
				return (
					<Button
						variant="ghost"
						onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
					>
						Timestamp
						<ArrowUpDown className="ml-2 h-4 w-4" />
					</Button>
				);
			},
			cell: ({ row }) => {
				const date = new Date(row.getValue("createdAt"));
				return (
					<div className="flex items-center gap-2">
						<CalendarIcon className="h-4 w-4 text-muted-foreground" />
						<span>{format(date, "MMM dd, yyyy HH:mm:ss")}</span>
					</div>
				);
			},
		},
		{
			accessorKey: "action",
			header: ({ column }) => {
				return (
					<Button
						variant="ghost"
						onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
					>
						Action
						<ArrowUpDown className="ml-2 h-4 w-4" />
					</Button>
				);
			},
			cell: ({ row }) => {
				const action = row.getValue("action") as string;
				return (
					<Badge variant="outline" className="whitespace-nowrap">
						{formatActionLabel(action)}
					</Badge>
				);
			},
		},
		{
			accessorKey: "entityType",
			header: ({ column }) => {
				return (
					<Button
						variant="ghost"
						onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
					>
						Entity Type
						<ArrowUpDown className="ml-2 h-4 w-4" />
					</Button>
				);
			},
			cell: ({ row }) => {
				const entityType = row.getValue("entityType") as string;
				return (
					<Badge variant="secondary" className="whitespace-nowrap">
						{formatActionLabel(entityType)}
					</Badge>
				);
			},
		},

		{
			accessorKey: "userEmail",
			header: "User Email",
			cell: ({ row }) => {
				return <span className="font-mono">{row.getValue("userEmail")}</span>;
			},
		},
		{
			accessorKey: "entityId",
			header: "Entity ID",
			cell: ({ row }) => {
				return (
					<span className="font-mono text-xs text-muted-foreground">
						{row.getValue("entityId")}
					</span>
				);
			},
		},
		{
			accessorKey: "details",
			header: "Details",
			cell: ({ row }) => {
				const details = row.getValue("details") as string | null;
				return details ? (
					<span className="text-sm">{details}</span>
				) : (
					<span className="text-muted-foreground">-</span>
				);
			},
		},
	];

	const table = useReactTable({
		data,
		columns,
		state: {
			sorting,
			columnFilters,
			columnVisibility,
		},
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		onColumnVisibilityChange: setColumnVisibility,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFacetedRowModel: getFacetedRowModel(),
		getFacetedUniqueValues: getFacetedUniqueValues(),
		manualPagination: true,
		pageCount: totalPages,
	});

	return (
		<div className="space-y-4">
			{/* Filters and Actions */}
			<div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
				{/* Action Filter and Entity Type Filter - same row on mobile */}
				<div className="flex flex-row gap-2 sm:contents">
					{/* Action Filter */}
					<Select value={actionFilter} onValueChange={setActionFilter}>
						<SelectTrigger className="flex-1 sm:w-[200px] md:w-[240px]">
							<SelectValue placeholder="Filter by action" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Actions</SelectItem>
							{ACTION_TYPES.map((action) => (
								<SelectItem key={action} value={action}>
									{formatActionLabel(action)}
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					{/* Entity Type Filter */}
					<Select value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
						<SelectTrigger className="flex-1 sm:w-[200px] md:w-[240px]">
							<SelectValue placeholder="Filter by entity" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Entities</SelectItem>
							{ENTITY_TYPES.map((type) => (
								<SelectItem key={type} value={type}>
									{formatActionLabel(type)}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				{/* Date Range Filter */}
				<Popover>
					<PopoverTrigger asChild>
						<Button
							variant="outline"
							className={cn(
								"w-full sm:w-[240px] justify-start text-left font-normal",
								!dateRange && "text-muted-foreground",
							)}
						>
							<CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
							<span className="truncate text-xs sm:text-sm">
								{dateRange?.from ? (
									dateRange.to ? (
										<>
											<span className="hidden md:inline">
												{format(dateRange.from, "LLL dd, y")} -{" "}
												{format(dateRange.to, "LLL dd, y")}
											</span>
											<span className="md:hidden">
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

				{/* Clear Filters */}
				{(actionFilter !== "all" ||
					entityTypeFilter !== "all" ||
					dateRange) && (
					<Button
						variant="ghost"
						size="sm"
						className="w-full sm:w-auto"
						onClick={() => {
							setActionFilter("all");
							setEntityTypeFilter("all");
							setDateRange(undefined);
						}}
					>
						Clear Filters
					</Button>
				)}

				{/* Spacer to push Export/Columns to the right on desktop */}
				<div className="hidden sm:block sm:flex-1" />

				{/* Export and Columns - same row on mobile */}
				<div className="flex flex-row gap-2 sm:contents">
					{/* Export Dropdown */}
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="outline"
								size="sm"
								className="flex-1 sm:flex-none sm:w-[130px]"
							>
								<Download className="mr-2 h-4 w-4" />
								<span className="truncate">Export</span>
								<ChevronDown className="ml-2 h-4 w-4 flex-shrink-0" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuLabel>Export Format</DropdownMenuLabel>
							<DropdownMenuSeparator />
							<DropdownMenuItem onClick={handleExportCSV}>
								Export as CSV
							</DropdownMenuItem>
							<DropdownMenuItem onClick={handleExportJSON}>
								Export as JSON
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>

					{/* Column Visibility */}
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="outline"
								size="sm"
								className="flex-1 sm:flex-none sm:w-[120px]"
							>
								<span className="truncate">Columns</span>
								<ChevronDown className="ml-2 h-4 w-4 flex-shrink-0" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							{table
								.getAllColumns()
								.filter((column) => column.getCanHide())
								.map((column) => {
									return (
										<DropdownMenuCheckboxItem
											key={column.id}
											className="capitalize"
											checked={column.getIsVisible()}
											onCheckedChange={(value) =>
												column.toggleVisibility(!!value)
											}
										>
											{column.id}
										</DropdownMenuCheckboxItem>
									);
								})}
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>

			{/* Table */}
			<div className="rounded-md border">
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => {
									return (
										<TableHead key={header.id}>
											{header.isPlaceholder
												? null
												: flexRender(
														header.column.columnDef.header,
														header.getContext(),
													)}
										</TableHead>
									);
								})}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{loading ? (
							<TableRow>
								<TableCell
									colSpan={columns.length}
									className="h-24 text-center"
								>
									Loading...
								</TableCell>
							</TableRow>
						) : table.getRowModel().rows?.length ? (
							table.getRowModel().rows.map((row) => (
								<TableRow
									key={row.id}
									data-state={row.getIsSelected() && "selected"}
								>
									{row.getVisibleCells().map((cell) => (
										<TableCell key={cell.id}>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext(),
											)}
										</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell
									colSpan={columns.length}
									className="h-24 text-center"
								>
									No activity logs found.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			{/* Pagination */}
			<div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-2">
				<div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
					Showing {currentPage * pageSize + 1} to{" "}
					{Math.min((currentPage + 1) * pageSize, totalElements)} of{" "}
					{totalElements} entries
				</div>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
						disabled={currentPage === 0}
						className="text-xs sm:text-sm"
					>
						Previous
					</Button>
					<span className="text-xs sm:text-sm whitespace-nowrap">
						Page {currentPage + 1} of {totalPages || 1}
					</span>
					<Button
						variant="outline"
						size="sm"
						onClick={() => setCurrentPage((prev) => prev + 1)}
						disabled={currentPage >= totalPages - 1}
						className="text-xs sm:text-sm"
					>
						Next
					</Button>
				</div>
			</div>
		</div>
	);
}
