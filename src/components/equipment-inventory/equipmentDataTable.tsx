import { DataTableFilter } from "@/components/data-table-filter";
import { Badge } from "@/components/ui/badge";
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
import { DeleteConfirmDialog } from "@/components/user-management/deleteConfirmDialog";
import { bulkDeleteEquipment } from "@/lib/api";
import { type FilterValue, defineMeta, filterFn } from "@/lib/filters";
import type { Equipment, UserDTO } from "@/lib/types";
import { usePersistentState } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";
import {
	type ColumnDef,
	type ColumnFiltersState,
	type Row,
	type RowSelectionState,
	type SortingState,
	type VisibilityState,
	flexRender,
	getCoreRowModel,
	getFacetedRowModel,
	getFacetedUniqueValues,
	getFilteredRowModel,
	getSortedRowModel,
	useReactTable,
} from "@tanstack/react-table";
import type { ColumnMeta } from "@tanstack/react-table";
import {
	AlertTriangle,
	CheckSquare,
	ChevronDown,
	Edit,
	Fingerprint,
	IdCardIcon,
	InfoIcon,
	ListFilter,
	MoreHorizontal,
	Package,
	Trash2,
	Users,
	Wrench,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { Checkbox } from "../ui/checkbox";

function categoryTextArrayFilterFn<TData>(
	row: Row<TData>,
	columnId: string,
	filterInputValue: FilterValue<"text", TData>,
) {
	if (
		!filterInputValue ||
		!filterInputValue.values ||
		filterInputValue.values.length === 0 ||
		!filterInputValue.values[0]
	) {
		return true;
	}
	const actualFilterText = filterInputValue.values[0];

	const rowValue = row.getValue<{ name: string; id: string }[]>(columnId);
	if (!Array.isArray(rowValue)) {
		return false;
	}

	const lowerCaseFilterValue = actualFilterText.toLowerCase().trim();
	if (lowerCaseFilterValue === "") {
		return true;
	}

	return rowValue.some((category) =>
		category.name.toLowerCase().includes(lowerCaseFilterValue),
	);
}

interface EquipmentDataTableProps {
	data: Equipment[];
	isPrivilegedUser: boolean;
	currentUser?: UserDTO | null;
	handleEditEquipment: (equipment: Equipment) => void;
	isEditMutating: boolean;
	isDeleteMutating: boolean;
	deleteMutationVariables?: { equipmentIds: string[]; userId: string } | null;
}

export function EquipmentDataTable({
	data,
	isPrivilegedUser,
	currentUser,
	handleEditEquipment,
	isEditMutating,
	isDeleteMutating,
	deleteMutationVariables,
}: EquipmentDataTableProps) {
	const context = useRouteContext({ from: "/app/equipments" });
	const queryClient = context.queryClient;
	const [sorting, setSorting] = usePersistentState<SortingState>(
		"equipmentTableSorting_v2",
		[],
	);
	const [columnFilters, setColumnFilters] =
		usePersistentState<ColumnFiltersState>(
			"equipmentTableColumnFilters_v2",
			[],
		);
	const [columnVisibility, setColumnVisibility] =
		usePersistentState<VisibilityState>(
			"equipmentTableColumnVisibility_v2",
			{},
		);
	const [rowSelection, setRowSelection] = usePersistentState<RowSelectionState>(
		"equipmentTableRowSelection_v2",
		{},
	);

	// State for bulk delete confirmation dialog
	const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);

	// Bulk delete mutation
	const bulkDeleteMutation = useMutation<
		Record<string, string>,
		Error,
		{ equipmentIds: string[]; userId: string },
		{ previousEquipment: Equipment[] | undefined }
	>({
		mutationFn: bulkDeleteEquipment,
		onMutate: async ({ equipmentIds }) => {
			await queryClient.cancelQueries({
				queryKey: ["equipments", currentUser?.publicId],
			});
			const previousEquipment = queryClient.getQueryData<Equipment[]>([
				"equipments",
				currentUser?.publicId,
			]);

			queryClient.setQueryData<Equipment[]>(
				["equipments", currentUser?.publicId],
				(old = []) =>
					old.filter((equipment) => !equipmentIds.includes(equipment.publicId)),
			);
			return { previousEquipment };
		},
		onError: (error, _variables, context) => {
			if (context?.previousEquipment) {
				queryClient.setQueryData(
					["equipments", currentUser?.publicId],
					context.previousEquipment,
				);
			}
			toast.error(`Failed to delete equipment: ${error.message}`);
			setIsBulkDeleteDialogOpen(false);
		},
		onSuccess: (results: Record<string, string>) => {
			const successCount = Object.values(results).filter(
				(result) => result === "Successfully deleted",
			).length;
			const errorCount = Object.keys(results).length - successCount;

			if (successCount > 0) {
				toast.success(`Successfully deleted ${successCount} equipment(s).`);
			}
			if (errorCount > 0) {
				toast.error(`Failed to delete ${errorCount} equipment(s).`);
			}
			setIsBulkDeleteDialogOpen(false);
			setRowSelection({}); // Clear selection
		},
		onSettled: () => {
			queryClient.invalidateQueries({
				queryKey: ["equipments", currentUser?.publicId],
			});
		},
	});

	const handleBulkDelete = () => {
		if (!currentUser || table.getSelectedRowModel().rows.length === 0) return;

		const selectedIds = table
			.getSelectedRowModel()
			.rows.map((row) => row.original.publicId);

		bulkDeleteMutation.mutate({
			equipmentIds: selectedIds,
			userId: currentUser.publicId,
		});
	};

	const getStatusBadge = useCallback((status: Equipment["status"]) => {
		switch (status) {
			case "NEW":
				return (
					<Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20 capitalize">
						{status.toLowerCase()}
					</Badge>
				);
			case "MAINTENANCE":
				return (
					<Badge className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 capitalize">
						{status.toLowerCase()}
					</Badge>
				);
			case "DEFECT":
			case "NEED_REPLACEMENT":
				return (
					<Badge className="bg-red-500/10 text-red-500 hover:bg-red-500/20 capitalize">
						{status.replace("_", " ").toLowerCase()}
					</Badge>
				);
			default: {
				const exhaustiveCheck: never = status;
				return (
					<Badge variant="outline" className="capitalize">
						{exhaustiveCheck}
					</Badge>
				);
			}
		}
	}, []);

	const AVAILABILITY_OPTIONS = useMemo(
		() => [
			{ value: "true", label: "Yes", icon: CheckSquare },
			{ value: "false", label: "No", icon: AlertTriangle },
		],
		[],
	);

	const STATUS_OPTIONS = useMemo(
		() => [
			{ value: "NEW", label: "New", icon: Package },
			{ value: "MAINTENANCE", label: "Maintenance", icon: Wrench },
			{ value: "DEFECT", label: "Defect", icon: AlertTriangle },
			{
				value: "NEED_REPLACEMENT",
				label: "Need Replacement",
				icon: Trash2,
			},
		],
		[],
	);

	const columns: ColumnDef<Equipment>[] = useMemo(
		() => [
			...(isPrivilegedUser
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
									disabled={
										!(
											currentUser?.roles?.includes("SUPER_ADMIN") ||
											(["EQUIPMENT_OWNER", "MSDO", "OPC"].includes(
												currentUser?.roles?.[0] ?? "",
											) &&
												row.original.equipmentOwner?.publicId ===
													currentUser?.publicId)
										)
									}
								/>
							),
							enableSorting: false,
							enableHiding: false,
						} as ColumnDef<Equipment>,
					]
				: []),
			{
				accessorKey: "name",
				header: "Name",
				cell: ({ row }) => {
					const item = row.original;
					const imageUrl = item.imagePath;
					return (
						<div className="flex items-center gap-3">
							<img
								src={imageUrl}
								alt={item.name}
								className="h-10 w-10 rounded object-cover"
								loading="lazy"
							/>
							<div className="flex-1 text-center">
								<div className="font-medium">{item.name}</div>
							</div>
						</div>
					);
				},
				filterFn: filterFn("text"),
				meta: defineMeta((row: Equipment) => row.name, {
					displayName: "Name",
					type: "text",
					icon: Fingerprint,
				}) as ColumnMeta<Equipment, unknown>,
			},
			{
				accessorKey: "brand",
				header: "Brand",
				cell: ({ row }) => (
					<div className="text-center w-full">{row.getValue("brand")}</div>
				),
				filterFn: filterFn("text"),
				meta: defineMeta((row: Equipment) => row.brand, {
					displayName: "Brand",
					type: "text",
					icon: InfoIcon,
				}) as ColumnMeta<Equipment, unknown>,
			},
			{
				accessorKey: "serialNo",
				header: "Serial Number",
				filterFn: filterFn("text"),
				meta: defineMeta((row: Equipment) => row.serialNo, {
					displayName: "Serial Number",
					type: "text",
					icon: IdCardIcon,
				}) as ColumnMeta<Equipment, unknown>,
			},
			{
				id: "categories",
				accessorFn: (row: Equipment) =>
					row.categories.map((cat) => ({
						name: cat.name,
						id: cat.publicId,
					})),
				header: "Categories",
				cell: ({ row }) => {
					const categoriesArray = row.original.categories.map((cat) => ({
						name: cat.name,
						id: cat.publicId,
					}));
					return (
						<div className="flex flex-wrap gap-1 justify-center w-full">
							{categoriesArray.map((category) => (
								<Badge
									key={category.id}
									variant="secondary"
									className="font-base"
								>
									{category.name}
								</Badge>
							))}
						</div>
					);
				},
				filterFn: categoryTextArrayFilterFn,
				meta: defineMeta(
					(row: Equipment) => row.categories.map((cat) => cat.name),
					{
						displayName: "Categories",
						type: "text",
						icon: ListFilter,
					},
				) as ColumnMeta<Equipment, unknown>,
			},
			{
				accessorKey: "quantity",
				header: "Quantity",
				filterFn: filterFn("number"),
				meta: defineMeta((row: Equipment) => row.quantity, {
					displayName: "Quantity",
					type: "number",
					icon: Package,
				}) as ColumnMeta<Equipment, unknown>,
			},
			{
				accessorKey: "availability",
				accessorFn: (row: Equipment) => String(row.availability),
				header: "Available",
				cell: ({ row }) => (row.original.availability ? "Yes" : "No"),
				filterFn: filterFn("option"),
				meta: defineMeta((row: Equipment) => String(row.availability), {
					displayName: "Available",
					type: "option",
					icon: CheckSquare,
					options: AVAILABILITY_OPTIONS,
				}) as ColumnMeta<Equipment, unknown>,
			},
			{
				accessorKey: "status",
				header: "Status",
				cell: ({ row }) => getStatusBadge(row.original.status),
				filterFn: filterFn("option"),
				meta: defineMeta((row: Equipment) => row.status, {
					displayName: "Status",
					type: "option",
					icon: ListFilter,
					options: STATUS_OPTIONS,
				}) as ColumnMeta<Equipment, unknown>,
			},
			...(currentUser?.roles?.includes("SUPER_ADMIN")
				? [
						{
							accessorFn: (row: Equipment) =>
								row.equipmentOwner?.email ?? "N/A",
							id: "ownerEmail",
							header: "Owner",
							cell: ({ row }: { row: Row<Equipment> }) => {
								const owner = row.original.equipmentOwner;
								return owner ? (
									<div>
										{owner.firstName} {owner.lastName}
										<div className="text-xs text-muted-foreground">
											{owner.email}
										</div>
									</div>
								) : (
									<span className="text-muted-foreground">N/A</span>
								);
							},
							filterFn: filterFn("text"),
							meta: defineMeta(
								(row: Equipment) => row.equipmentOwner?.email ?? "",
								{
									displayName: "Owner",
									type: "text",
									icon: Users,
								},
							) as ColumnMeta<Equipment, unknown>,
						} as ColumnDef<Equipment>,
					]
				: []),
			...(isPrivilegedUser
				? [
						{
							id: "actions",
							cell: ({ row }) => {
								const item = row.original;
								const canManage =
									currentUser?.roles?.includes("SUPER_ADMIN") ||
									(currentUser?.roles?.some((role) =>
										["EQUIPMENT_OWNER", "MSDO", "OPC"].includes(role),
									) &&
										item.equipmentOwner?.publicId === currentUser?.publicId);

								if (!canManage) {
									return null;
								}

								const isMutatingThisItem =
									(isDeleteMutating &&
										deleteMutationVariables?.equipmentIds.includes(
											item.publicId,
										)) ||
									(isEditMutating &&
										/* logic to check if this item is being edited, needs editingEquipment prop */ false);

								return (
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button
												variant="ghost"
												size="icon"
												className="h-8 w-8"
												disabled={isMutatingThisItem}
											>
												<MoreHorizontal className="h-4 w-4" />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end">
											<DropdownMenuItem
												onClick={() => handleEditEquipment(item)}
												disabled={isEditMutating}
											>
												<Edit className="mr-2 h-4 w-4" />
												Edit
											</DropdownMenuItem>
											<DropdownMenuSeparator />
											<DropdownMenuItem
												className="text-destructive"
												onClick={() => {
													if (currentUser) {
														// Select only this row
														const newSelection: RowSelectionState = {};
														newSelection[row.id] = true;
														setRowSelection(newSelection);
														setIsBulkDeleteDialogOpen(true);
													}
												}}
												disabled={bulkDeleteMutation.isPending}
											>
												<Trash2 className="mr-2 h-4 w-4" />
												Delete
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								);
							},
						} as ColumnDef<Equipment>,
					]
				: []),
		],
		[
			isPrivilegedUser,
			currentUser,
			getStatusBadge,
			handleEditEquipment,
			AVAILABILITY_OPTIONS,
			STATUS_OPTIONS,
			isEditMutating,
			isDeleteMutating,
			deleteMutationVariables,
			bulkDeleteMutation,
			setRowSelection,
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
		enableRowSelection: isPrivilegedUser,
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

	return (
		<div className="w-full space-y-4">
			<div className="flex items-center justify-between">
				<DataTableFilter table={table} />
				<div className="flex items-center space-x-2">
					{isPrivilegedUser && table.getSelectedRowModel().rows.length > 0 && (
						<Button
							variant="destructive"
							size="sm"
							onClick={() => setIsBulkDeleteDialogOpen(true)}
							disabled={bulkDeleteMutation.isPending}
						>
							<Trash2 className="mr-2 h-4 w-4" />
							Delete ({table.getSelectedRowModel().rows.length})
						</Button>
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
			</div>
			<div className="rounded-md border overflow-y-auto max-h-[58vh]">
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => (
									<TableHead
										key={header.id}
										colSpan={header.colSpan}
										className="text-secondary-foreground   bg-secondary text-center font-medium"
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
											className="text-center"
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
									No equipment found.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
			{isPrivilegedUser && (
				<DeleteConfirmDialog
					isOpen={isBulkDeleteDialogOpen}
					onClose={() => {
						setIsBulkDeleteDialogOpen(false);
						setRowSelection({}); // Clear selection when dialog is closed
					}}
					onConfirm={handleBulkDelete}
					isLoading={bulkDeleteMutation.isPending}
					title={`Delete ${table.getSelectedRowModel().rows.length} Equipment Item(s)`}
					description={`Are you sure you want to permanently delete ${table.getSelectedRowModel().rows.length} selected equipment item(s)? This action cannot be undone.`}
				/>
			)}
		</div>
	);
}
