import { DataTableFilter } from "@/components/data-table-filter";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { filterFn } from "@/lib/filters";
import type { UserDTO, VenueDTO } from "@/lib/types";
import {
    type ColumnDef,
    type ColumnFiltersState,
    type SortingState,
    type VisibilityState,
    flexRender,
    getCoreRowModel,
    getFacetedRowModel,
    getFacetedUniqueValues,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table";
import {
    ArrowUpDown,
    Building,
    CalendarDays,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Edit,
    Eye,
    MapPin,
    MoreHorizontal,
    Trash2,
    UsersIcon,
} from "lucide-react";
import { useMemo, useState } from "react";

// Helper function (can be kept here or moved to utils if used elsewhere)
const formatDateTime = (dateString: string | null | undefined): string => {
    if (!dateString) return "—";
    try {
        // Assuming date-fns is available or replace with native Date formatting
        // import { format } from "date-fns";
        return new Date(dateString).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
        });
    } catch (e) {
        console.error("Error formatting date:", dateString, e);
        return "Invalid Date";
    }
};

interface VenueTableProps {
    venues: VenueDTO[];
    role: UserDTO["role"] | undefined;
    isMutating: boolean;
    onNavigate: (id: string) => void;
    onEdit: (venue: VenueDTO) => void;
    onDelete: (id: string) => void;
}

export function VenueTable({
    venues,
    role,
    isMutating,
    onNavigate,
    onEdit,
    onDelete,
}: VenueTableProps) {
    // --- React Table State ---
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
        {},
    );
    const [rowSelection, setRowSelection] = useState({});

    // --- Column Definitions ---
    const venueTableColumns = useMemo<ColumnDef<VenueDTO>[]>(() => {
        const columns: ColumnDef<VenueDTO>[] = [
            {
                id: "select",
                header: ({ table }) => (
                    <Checkbox
                        checked={
                            table.getIsAllPageRowsSelected() ||
                            (table.getIsSomePageRowsSelected() &&
                                "indeterminate")
                        }
                        onCheckedChange={(value) =>
                            table.toggleAllPageRowsSelected(!!value)
                        }
                        aria-label="Select all"
                        disabled={isMutating}
                    />
                ),
                cell: ({ row }) => (
                    <Checkbox
                        checked={row.getIsSelected()}
                        onCheckedChange={(value) => row.toggleSelected(!!value)}
                        aria-label="Select row"
                        disabled={isMutating}
                    />
                ),
                enableSorting: false,
                enableHiding: false,
            },
            {
                accessorKey: "name",
                header: ({ column }) => (
                    <Button
                        variant="ghost"
                        onClick={() =>
                            column.toggleSorting(column.getIsSorted() === "asc")
                        }
                    >
                        Name
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                ),
                cell: ({ row }) => {
                    const venue = row.original;
                    return (
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-md overflow-hidden bg-muted flex-shrink-0">
                                <img
                                    src={
                                        venue.imagePath ??
                                        "https://cit.edu/wp-content/uploads/2023/07/GLE-Building.jpg"
                                    }
                                    alt={venue.name}
                                    className="h-full w-full object-cover"
                                    loading="lazy"
                                />
                            </div>
                            <Button
                                variant="link"
                                className="p-0 h-auto text-left justify-start font-medium truncate"
                                onClick={() => onNavigate(venue.publicId)}
                                title={venue.name}
                            >
                                {venue.name}
                            </Button>
                        </div>
                    );
                },
                filterFn: filterFn("text"),
                meta: {
                    displayName: "Name",
                    type: "text",
                    icon: Building,
                },
            },
            {
                accessorKey: "location",
                header: "Location",
                cell: ({ row }) => (
                    <div
                        className="truncate max-w-xs"
                        title={row.original.location}
                    >
                        {row.original.location}
                    </div>
                ),
                filterFn: filterFn("text"),
                meta: {
                    displayName: "Location",
                    type: "text",
                    icon: MapPin,
                },
            },
        ];

        if (role === "SUPER_ADMIN") {
            columns.push({
                accessorKey: "venueOwner",
                header: "Owner",
                cell: ({ row }) => {
                    const venue = row.original;
                    return venue.venueOwner ? (
                        <div
                            title={`${venue.venueOwner.firstName} ${venue.venueOwner.lastName} (${venue.venueOwner.email})`}
                        >
                            {venue.venueOwner.firstName}{" "}
                            {venue.venueOwner.lastName}
                            <div className="text-xs text-muted-foreground truncate">
                                {venue.venueOwner.email}
                            </div>
                        </div>
                    ) : (
                        <span className="text-muted-foreground">—</span>
                    );
                },
                accessorFn: (row) =>
                    row.venueOwner
                        ? `${row.venueOwner.firstName} ${row.venueOwner.lastName} ${row.venueOwner.email}`
                        : "",
                filterFn: filterFn("text"),
                meta: {
                    displayName: "Owner",
                    type: "text",
                    icon: UsersIcon,
                },
            });
        }

        columns.push(
            {
                accessorKey: "createdAt",
                header: ({ column }) => (
                    <Button
                        variant="ghost"
                        onClick={() =>
                            column.toggleSorting(column.getIsSorted() === "asc")
                        }
                    >
                        Created At
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                ),
                cell: ({ row }) => formatDateTime(row.original.createdAt),
                filterFn: filterFn("date"),
                meta: {
                    displayName: "Created At",
                    type: "date",
                    icon: CalendarDays,
                },
                sortingFn: "datetime",
            },
            {
                accessorKey: "updatedAt",
                header: ({ column }) => (
                    <Button
                        variant="ghost"
                        onClick={() =>
                            column.toggleSorting(column.getIsSorted() === "asc")
                        }
                    >
                        Updated At
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                ),
                cell: ({ row }) => formatDateTime(row.original.updatedAt),
                filterFn: filterFn("date"),
                meta: {
                    displayName: "Updated At",
                    type: "date",
                    icon: CalendarDays,
                },
                sortingFn: "datetime",
            },
            {
                id: "actions",
                cell: ({ row }) => {
                    const venue = row.original;
                    return (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    disabled={isMutating}
                                >
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">
                                        Venue Actions
                                    </span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                    onClick={() => onNavigate(venue.publicId)}
                                >
                                    <Eye className="mr-2 h-4 w-4" /> View
                                </DropdownMenuItem>
                                {role === "SUPER_ADMIN" && (
                                    <>
                                        <DropdownMenuItem
                                            onClick={() => onEdit(venue)}
                                        >
                                            <Edit className="mr-2 h-4 w-4" />{" "}
                                            Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            className="text-destructive focus:text-destructive"
                                            onClick={() =>
                                                onDelete(venue.publicId)
                                            }
                                            disabled={isMutating} // Simplified check
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" />{" "}
                                            Delete
                                        </DropdownMenuItem>
                                    </>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    );
                },
                enableHiding: false,
            },
        );
        return columns;
    }, [role, isMutating, onNavigate, onEdit, onDelete]); // Pass callback props as dependencies

    // --- Initialize Table ---
    const table = useReactTable({
        data: venues, // Use venues prop
        columns: venueTableColumns,
        state: {
            sorting,
            columnVisibility,
            rowSelection,
            columnFilters,
        },
        enableRowSelection: true,
        onRowSelectionChange: setRowSelection,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onColumnVisibilityChange: setColumnVisibility,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
    });

    return (
        <div className="space-y-4">
            {/* Filter component and column toggle */}
            <div className="flex items-center justify-between">
                <DataTableFilter table={table} />
                <div className="flex items-center space-x-2">
                    {/* Bulk delete button (optional) */}
                    {Object.keys(rowSelection).length > 0 && (
                        <Button
                            variant="destructive"
                            size="sm"
                            className="h-8"
                            // onClick={() => { /* TODO: Implement bulk delete */ }}
                        >
                            Delete ({Object.keys(rowSelection).length})
                        </Button>
                    )}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="h-8">
                                Columns <ChevronDown className="ml-2 h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {table
                                .getAllColumns()
                                .filter((column) => column.getCanHide())
                                .map((column) => {
                                    const meta = column.columnDef.meta as
                                        | { displayName?: string }
                                        | undefined;
                                    const displayName =
                                        meta?.displayName || column.id;
                                    return (
                                        <DropdownMenuCheckboxItem
                                            key={column.id}
                                            className="capitalize"
                                            checked={column.getIsVisible()}
                                            onCheckedChange={(value) =>
                                                column.toggleVisibility(!!value)
                                            }
                                        >
                                            {displayName}
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
                                {headerGroup.headers.map((header) => (
                                    <TableHead
                                        key={header.id}
                                        colSpan={header.colSpan}
                                        style={{
                                            width:
                                                header.getSize() !== 150
                                                    ? `${header.getSize()}px`
                                                    : undefined,
                                        }}
                                    >
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                  header.column.columnDef
                                                      .header,
                                                  header.getContext(),
                                              )}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={
                                        row.getIsSelected() && "selected"
                                    }
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell
                                            key={cell.id}
                                            style={{
                                                width:
                                                    cell.column.getSize() !==
                                                    150
                                                        ? `${cell.column.getSize()}px`
                                                        : undefined,
                                            }}
                                        >
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
                                    colSpan={venueTableColumns.length}
                                    className="h-24 text-center text-muted-foreground"
                                >
                                    No venues found.
                                    {columnFilters.length > 0 &&
                                        " Try adjusting your filters."}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between pt-4">
                <div className="flex-1 text-sm text-muted-foreground">
                    {table.getFilteredSelectedRowModel().rows.length} of{" "}
                    {table.getFilteredRowModel().rows.length} row(s) selected.
                </div>
                <div className="flex items-center space-x-6 lg:space-x-8">
                    <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium">Rows per page</p>
                        <Select
                            value={`${table.getState().pagination.pageSize}`}
                            onValueChange={(value) => {
                                table.setPageSize(Number(value));
                            }}
                        >
                            <SelectTrigger className="h-8 w-[70px]">
                                <SelectValue
                                    placeholder={
                                        table.getState().pagination.pageSize
                                    }
                                />
                            </SelectTrigger>
                            <SelectContent side="top">
                                {[5, 10, 20, 30, 40, 50].map((pageSize) => (
                                    <SelectItem
                                        key={pageSize}
                                        value={`${pageSize}`}
                                    >
                                        {pageSize}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                        Page {table.getState().pagination.pageIndex + 1} of{" "}
                        {table.getPageCount()}
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            className="hidden h-8 w-8 p-0 lg:flex"
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
                            className="hidden h-8 w-8 p-0 lg:flex"
                            onClick={() =>
                                table.setPageIndex(table.getPageCount() - 1)
                            }
                            disabled={!table.getCanNextPage()}
                        >
                            <span className="sr-only">Go to last page</span>
                            <ChevronsRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
