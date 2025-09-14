import { useNavigate } from "@tanstack/react-router"; // For navigation
import type { ColumnMeta } from "@tanstack/react-table";
import {
	type ColumnDef,
	type ColumnFiltersState,
	flexRender,
	getCoreRowModel,
	getFacetedRowModel,
	getFacetedUniqueValues,
	getFilteredRowModel,
	getSortedRowModel,
	type RowSelectionState,
	type SortingState,
	useReactTable,
	type VisibilityState,
} from "@tanstack/react-table";
import { format } from "date-fns"; // For date formatting
import {
	Building, // Added MapPin, Building
	ChevronDown,
	Edit,
	Eye,
	MapPin,
	MoreHorizontal,
	Trash2,
	Users,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DataTableFilter } from "@/components/data-table-filter";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { DEFAULT_VENUE_IMAGE_URL } from "@/lib/constants";
import { defineMeta, filterFn } from "@/lib/filters";
import type { UserDTO, VenueDTO } from "@/lib/types";
import { Checkbox } from "../ui/checkbox";

// Custom hook for persistent state (can be moved to a shared utility)
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

interface VenueDataTableProps {
	data: VenueDTO[];
	currentUser?: UserDTO | null;
	venueOwners: UserDTO[]; // For owner filter options
	handleEditVenue: (venue: VenueDTO) => void;
	setVenueToDelete: (id: string | null) => void;
	setIsDeleteDialogOpen: (isOpen: boolean) => void;
	isDeletingVenue: boolean; // To disable actions during delete
	venueToDeleteId?: string | null; // Added to know which item is pending deletion
	onBulkDelete?: (ids: string[]) => void; // Add bulk delete handler
}

export function VenueDataTable({
	data,
	currentUser,
	venueOwners,
	handleEditVenue,
	setVenueToDelete,
	setIsDeleteDialogOpen,
	isDeletingVenue,
	venueToDeleteId,
	onBulkDelete,
}: VenueDataTableProps) {
	const navigate = useNavigate();
	const [sorting, setSorting] = usePersistentState<SortingState>(
		"venueTableSorting_v1",
		[],
	);
	const [columnFilters, setColumnFilters] =
		usePersistentState<ColumnFiltersState>("venueTableColumnFilters_v1", []);
	const [columnVisibility, setColumnVisibility] =
		usePersistentState<VisibilityState>("venueTableColumnVisibility_v1", {
			// Hide IDs by default, show relevant info
			publicId: false,
			createdAt: false, // Example: hide by default
			updatedAt: false, // Example: hide by default
		});
	const [rowSelection, setRowSelection] = usePersistentState<RowSelectionState>(
		"venueTableRowSelection_v1",
		{},
	);

	const formatDateTime = useCallback(
		(dateString: string | null | undefined): string => {
			if (!dateString) return "—";
			try {
				return format(new Date(dateString), "MMM d, yyyy h:mm a");
			} catch (e) {
				console.error("Error formatting date:", dateString, e);
				return "Invalid Date";
			}
		},
		[],
	);

	const ownerOptions = useMemo(() => {
		return venueOwners.map((owner) => ({
			value: owner.email, // Using email as unique value, could be publicId
			label: `${owner.firstName} ${owner.lastName} (${owner.email})`,
			icon: Users,
		}));
	}, [venueOwners]);

	const columns: ColumnDef<VenueDTO>[] = useMemo(
		() => [
			// Select column (Only for SUPER_ADMIN for bulk actions)
			...((currentUser?.roles.includes("SUPER_ADMIN") && onBulkDelete
				? [
						{
							id: "select",
							header: ({ table }) => (
								<Checkbox
									checked={
										table.getIsAllPageRowsSelected() ||
										(table.getIsSomePageRowsSelected() && "indeterminate")
									}
									onCheckedChange={(value) =>
										table.toggleAllPageRowsSelected(!!value)
									}
									aria-label="Select all"
								/>
							),
							cell: ({ row }) => (
								<Checkbox
									checked={row.getIsSelected()}
									onCheckedChange={(value) => row.toggleSelected(!!value)}
									aria-label="Select row"
								/>
							),
							enableSorting: false,
							enableHiding: false,
						},
					]
				: []) as ColumnDef<VenueDTO>[]),
			{
				accessorKey: "name",
				header: "Name",
				cell: ({ row }) => {
					const venue = row.original;
					return (
						<div className="flex items-center gap-3">
							<div className="h-10 w-10 rounded-md overflow-hidden bg-muted flex-shrink-0">
								<img
									src={venue.imagePath ?? DEFAULT_VENUE_IMAGE_URL}
									alt={venue.name}
									className="h-full w-full object-cover"
									loading="lazy"
									onError={(e) => {
										e.currentTarget.src = DEFAULT_VENUE_IMAGE_URL;
									}}
								/>
							</div>
							<Button
								variant="link"
								className="p-0 h-auto text-left justify-start font-medium truncate"
								onClick={() =>
									navigate({
										to: `/app/venues/${venue.publicId}`,
									})
								}
								title={venue.name}
							>
								{venue.name}
							</Button>
						</div>
					);
				},
				filterFn: filterFn("text"),
				meta: defineMeta((row: VenueDTO) => row.name, {
					displayName: "Name",
					type: "text",
					icon: Building,
				}) as ColumnMeta<VenueDTO, unknown>,
			},
			{
				accessorKey: "location",
				header: "Location",
				cell: ({ row }) => (
					<span className="truncate" title={row.original.location}>
						{row.original.location}
					</span>
				),
				filterFn: filterFn("text"),
				meta: defineMeta((row: VenueDTO) => row.location, {
					displayName: "Location",
					type: "text",
					icon: MapPin,
				}) as ColumnMeta<VenueDTO, unknown>,
			},
			...((currentUser?.roles?.includes("SUPER_ADMIN")
				? [
						{
							accessorFn: (row: VenueDTO) => row.venueOwner?.email ?? "N/A",
							id: "venueOwner",
							header: "Owner",
							cell: ({ row }) => {
								const owner = row.original.venueOwner;
								return owner ? (
									<div
										title={`${owner.firstName} ${owner.lastName} (${owner.email})`}
									>
										{owner.firstName} {owner.lastName}
										<div className="text-xs text-muted-foreground truncate">
											{owner.email}
										</div>
									</div>
								) : (
									<span className="text-muted-foreground">—</span>
								);
							},
							filterFn: filterFn("option"),
							meta: defineMeta((row: VenueDTO) => row.venueOwner?.email ?? "", {
								displayName: "Owner",
								type: "option",
								icon: Users,
								options: ownerOptions,
							}) as ColumnMeta<VenueDTO, unknown>,
						},
					]
				: []) as ColumnDef<VenueDTO>[]),
			{
				accessorKey: "createdAt",
				header: "Created At",
				cell: ({ row }) => formatDateTime(row.original.createdAt),
				enableColumnFilter: false, // Date filter not implemented here yet
			},
			{
				accessorKey: "updatedAt",
				header: "Updated At",
				cell: ({ row }) => formatDateTime(row.original.updatedAt),
				enableColumnFilter: false, // Date filter not implemented here yet
			},
			{
				id: "actions",
				cell: ({ row }) => {
					const venue = row.original;
					const isCurrentRowBeingDeleted =
						isDeletingVenue && venueToDeleteId === venue.publicId;

					// Only SUPER_ADMIN can edit venues
					const canEdit = currentUser?.roles?.includes("SUPER_ADMIN");
					const canDelete = currentUser?.roles?.includes("SUPER_ADMIN");

					if (!canEdit && !currentUser?.roles?.includes("SUPER_ADMIN")) {
						// View action for non-managers or non-privileged users
						return (
							<Button
								variant="ghost"
								size="icon"
								className="h-8 w-8"
								onClick={() =>
									navigate({
										to: `/app/venues/${venue.publicId}`,
									})
								}
							>
								<Eye className="h-4 w-4" />
								<span className="sr-only">View Details</span>
							</Button>
						);
					}

					return (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									className="h-8 w-8"
									disabled={isCurrentRowBeingDeleted}
								>
									<MoreHorizontal className="h-4 w-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem
									onClick={() =>
										navigate({
											to: `/app/venues/${venue.publicId}`,
										})
									}
									disabled={isCurrentRowBeingDeleted}
								>
									<Eye className="mr-2 h-4 w-4" /> View
								</DropdownMenuItem>
								{canEdit && (
									<DropdownMenuItem
										onClick={() => handleEditVenue(venue)}
										disabled={isCurrentRowBeingDeleted}
									>
										<Edit className="mr-2 h-4 w-4" /> Edit
									</DropdownMenuItem>
								)}
								{canDelete && (
									<>
										<DropdownMenuSeparator />
										<DropdownMenuItem
											className="text-destructive focus:text-destructive"
											onClick={() => {
												setVenueToDelete(venue.publicId);
												setIsDeleteDialogOpen(true);
											}}
											disabled={isCurrentRowBeingDeleted}
										>
											<Trash2 className="mr-2 h-4 w-4" /> Delete
										</DropdownMenuItem>
									</>
								)}
							</DropdownMenuContent>
						</DropdownMenu>
					);
				},
				enableHiding: false,
			},
		],
		[
			currentUser,
			ownerOptions,
			formatDateTime,
			handleEditVenue,
			setVenueToDelete,
			setIsDeleteDialogOpen,
			isDeletingVenue,
			venueToDeleteId,
			navigate,
			onBulkDelete,
		],
	);

	const table = useReactTable({
		data,
		columns,
		state: {
			sorting,
			columnVisibility,
			rowSelection,
			columnFilters,
		},
		enableRowSelection:
			currentUser?.roles.includes("SUPER_ADMIN") && !!onBulkDelete,
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		onColumnVisibilityChange: setColumnVisibility,
		onRowSelectionChange: setRowSelection,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFacetedRowModel: getFacetedRowModel(),
		getFacetedUniqueValues: getFacetedUniqueValues(),
	});

	// Add bulk actions toolbar
	const selectedRows = table.getSelectedRowModel().rows;
	const selectedVenueIds = selectedRows.map((row) => row.original.publicId);

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between gap-2">
				<DataTableFilter table={table} />
				{currentUser?.roles.includes("SUPER_ADMIN") &&
					onBulkDelete &&
					selectedRows.length > 0 && (
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<Button
									variant="destructive"
									size="sm"
									onClick={() => onBulkDelete(selectedVenueIds)}
									disabled={isDeletingVenue}
								>
									<Trash2 className="h-4 w-4" />
									Delete ({selectedRows.length})
								</Button>
							</div>
						</div>
					)}
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="outline" className="ml-auto">
							Columns <ChevronDown className="ml-2 h-4 w-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						{table
							.getAllColumns()
							.filter((column) => column.getCanHide())
							.map((column) => {
								const columnMeta = column.columnDef.meta as
									| { displayName?: string }
									| undefined;
								const displayName = columnMeta?.displayName || column.id;
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
			<div className="rounded-md border overflow-y-auto max-h-[60vh]">
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => (
									<TableHead
										key={header.id}
										colSpan={header.colSpan}
										className="text-secondary-foreground bg-secondary font-medium"
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
													header.column.columnDef.header,
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
									data-state={row.getIsSelected() && "selected"}
								>
									{row.getVisibleCells().map((cell) => (
										<TableCell
											key={cell.id}
											style={{
												width:
													cell.column.getSize() !== 150
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
									colSpan={columns.length}
									className="h-24 text-center"
								>
									No venues found.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
