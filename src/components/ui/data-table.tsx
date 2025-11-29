import {
	type ColumnDef,
	type ColumnFiltersState,
	flexRender,
	getCoreRowModel,
	getFacetedRowModel,
	getFacetedUniqueValues,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	type OnChangeFn, // Import OnChangeFn
	type RowSelectionState, // Import RowSelectionState
	type SortingState,
	useReactTable,
	type VisibilityState,
} from "@tanstack/react-table";
import {
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
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

interface DataTableProps<TData, TValue> {
	columns: ColumnDef<TData, TValue>[];
	data: TData[];
	searchColumn?: string;
	searchPlaceholder?: string;
	showColumnToggle?: boolean;
	showPagination?: boolean;
	// Add props for controlled row selection
	rowSelection?: RowSelectionState;
	onRowSelectionChange?: OnChangeFn<RowSelectionState>;
	// Add props for filtering
	columnFilters?: ColumnFiltersState;
	onColumnFiltersChange?: OnChangeFn<ColumnFiltersState>;
	enableFacetedFilter?: boolean;
}

export function DataTable<TData, TValue>({
	columns,
	data,
	searchColumn,
	searchPlaceholder = "Search...",
	showColumnToggle = true,
	showPagination = true,
	// Destructure new props
	rowSelection,
	onRowSelectionChange,
	// Destructure filter props
	columnFilters: externalColumnFilters,
	onColumnFiltersChange: externalOnColumnFiltersChange,
	enableFacetedFilter,
}: DataTableProps<TData, TValue>) {
	const [sorting, setSorting] = useState<SortingState>([]);
	// Use controlled columnFilters if provided, otherwise internal state
	const [internalColumnFilters, setInternalColumnFilters] =
		useState<ColumnFiltersState>([]);
	const columnFilters = externalColumnFilters ?? internalColumnFilters;
	const onColumnFiltersChange =
		externalOnColumnFiltersChange ?? setInternalColumnFilters;

	const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
	// Remove internal row selection state
	// const [rowSelection, setRowSelection] = useState({});

	const table = useReactTable({
		data,
		columns,
		onSortingChange: setSorting,
		onColumnFiltersChange: onColumnFiltersChange, // Use the determined handler
		onColumnVisibilityChange: setColumnVisibility,
		// Use props for row selection
		onRowSelectionChange: onRowSelectionChange,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		// Conditionally add faceted models if enabled
		getFacetedRowModel: enableFacetedFilter ? getFacetedRowModel() : undefined,
		getFacetedUniqueValues: enableFacetedFilter
			? getFacetedUniqueValues()
			: undefined,
		state: {
			sorting,
			columnFilters, // Use the determined state
			columnVisibility,
			// Use prop for row selection state
			rowSelection,
		},
		// Conditionally enable row selection features if handler is provided
		enableRowSelection: !!onRowSelectionChange,
		// enableMultiRowSelection: true, // Optional: Keep default or make configurable
		// enableSubRowSelection: false, // Optional: Keep default or make configurable
	});

	return (
		<div className="space-y-4">
			{(searchColumn || showColumnToggle) && (
				<div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
					{searchColumn && (
						<div className="flex items-center gap-2 flex-1">
							<Input
								placeholder={searchPlaceholder}
								value={
									(table.getColumn(searchColumn)?.getFilterValue() as string) ??
									""
								}
								onChange={(event) =>
									table
										.getColumn(searchColumn)
										?.setFilterValue(event.target.value)
								}
								className="w-full sm:max-w-sm"
							/>
						</div>
					)}
					{showColumnToggle && (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="outline" className="w-full sm:w-auto sm:ml-auto">
									Columns <ChevronDown className="ml-2 h-4 w-4" />
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
					)}
				</div>
			)}
			<div className="rounded-md border overflow-x-auto">
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
						{table.getRowModel().rows?.length ? (
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
									No results.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
			{showPagination && (
				<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
					<div className="flex items-center gap-2 flex-wrap">
						<p className="text-sm text-muted-foreground">
							Showing{" "}
							<strong>
								{table.getState().pagination.pageIndex *
									table.getState().pagination.pageSize +
									1}
								-
								{Math.min(
									(table.getState().pagination.pageIndex + 1) *
										table.getState().pagination.pageSize,
									table.getFilteredRowModel().rows.length,
								)}
							</strong>{" "}
							of <strong>{table.getFilteredRowModel().rows.length}</strong>{" "}
							results
						</p>
						<Select
							value={table.getState().pagination.pageSize.toString()}
							onValueChange={(value) => {
								table.setPageSize(Number(value));
							}}
						>
							<SelectTrigger className="h-8 w-[70px]">
								<SelectValue
									placeholder={table.getState().pagination.pageSize}
								/>
							</SelectTrigger>
							<SelectContent side="top">
								{[5, 10, 20, 30, 40, 50].map((pageSize) => (
									<SelectItem key={pageSize} value={pageSize.toString()}>
										{pageSize}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="flex items-center space-x-2">
						<Button
							variant="outline"
							className="h-8 w-8 p-0"
							onClick={() => table.setPageIndex(0)}
							disabled={!table.getCanPreviousPage()}
						>
							<span className="sr-only">Go to first page</span>
							<ChevronsLeft className="h-4 w-4" />
						</Button>
						<Button
							variant="outline"
							className="h-8 w-8 p-0"
							onClick={() => table.previousPage()}
							disabled={!table.getCanPreviousPage()}
						>
							<span className="sr-only">Go to previous page</span>
							<ChevronLeft className="h-4 w-4" />
						</Button>
						<Button
							variant="outline"
							className="h-8 w-8 p-0"
							onClick={() => table.nextPage()}
							disabled={!table.getCanNextPage()}
						>
							<span className="sr-only">Go to next page</span>
							<ChevronRight className="h-4 w-4" />
						</Button>
						<Button
							variant="outline"
							className="h-8 w-8 p-0"
							onClick={() => table.setPageIndex(table.getPageCount() - 1)}
							disabled={!table.getCanNextPage()}
						>
							<span className="sr-only">Go to last page</span>
							<ChevronsRight className="h-4 w-4" />
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}
