import { DataTableFilter } from "@/components/data-table-filter";
import { Button } from "@/components/ui/button";
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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { DeleteConfirmDialog } from "@/components/user-management/deleteConfirmDialog";
import { deleteDepartment } from "@/lib/api";
import {
    deleteDepartmentDialogAtom,
    editDepartmentDialogAtom,
    selectedDepartmentAtom,
} from "@/lib/atoms";
import { defineMeta, filterFn } from "@/lib/filters";
import { departmentsQueryOptions, usersQueryOptions } from "@/lib/query";
import type { DepartmentDTO } from "@/lib/types";
import {
    useMutation,
    useQueryClient,
    useSuspenseQuery,
} from "@tanstack/react-query";
import {
    type ColumnDef,
    type ColumnFiltersState,
    type ColumnMeta,
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
import { useAtom } from "jotai";
import {
    ArrowUpDown,
    Building,
    CalendarIcon,
    ChevronDown,
    MoreHorizontal,
    TextIcon, // For Description
    Trash2, // For Assign Head
    UserIcon,
} from "lucide-react";
import * as React from "react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { EditDepartmentFormDialog } from "./editDepartmentFormDialog";

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
            console.error(
                "Error reading from localStorage for key:",
                key,
                error,
            );
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

export function DepartmentDataTable() {
    const queryClient = useQueryClient();
    const [sorting, setSorting] = usePersistentState<SortingState>(
        "departmentTableSorting_v1",
        [],
    );
    const [columnFilters, setColumnFilters] =
        usePersistentState<ColumnFiltersState>(
            "departmentTableColumnFilters_v1",
            [],
        );
    const [columnVisibility, setColumnVisibility] =
        usePersistentState<VisibilityState>(
            "departmentTableColumnVisibility_v1",
            {},
        );
    const [rowSelection, setRowSelection] = React.useState({});

    const [editDialogOpen, setEditDialogOpen] = useAtom(
        editDepartmentDialogAtom,
    );
    const [deleteDialogOpen, setDeleteDialogOpen] = useAtom(
        deleteDepartmentDialogAtom,
    );
    // const [assignHeadOpen, setAssignHeadOpen] = useAtom(assignHeadDialogAtom);
    const [selectedDepartment, setSelectedDepartment] = useAtom(
        selectedDepartmentAtom,
    );

    // Persistent pagination state
    // const [pageSize, setPageSize] = usePersistentState<number>(
    //     "departmentTablePageSize_v1",
    //     10,
    // );
    // const [pageIndex, setPageIndex] = usePersistentState<number>(
    //     "departmentTablePageIndex_v1",
    //     0,
    // );

    // Fetch departments and users
    const { data: departmentsData } = useSuspenseQuery(departmentsQueryOptions);
    const { data: usersData } = useSuspenseQuery(usersQueryOptions);

    const deleteDepartmentMutation = useMutation({
        mutationFn: deleteDepartment, // Expects departmentId (number)
        onMutate: async (departmentId: string) => {
            await queryClient.cancelQueries({
                queryKey: departmentsQueryOptions.queryKey,
            });
            const previousDepartments = queryClient.getQueryData<
                DepartmentDTO[]
            >(departmentsQueryOptions.queryKey);
            queryClient.setQueryData<DepartmentDTO[]>(
                departmentsQueryOptions.queryKey,
                (old = []) =>
                    old.filter((dept) => dept.publicId !== departmentId),
            );
            return { previousDepartments };
        },
        onError: (err, _departmentId, context) => {
            if (context?.previousDepartments) {
                queryClient.setQueryData(
                    departmentsQueryOptions.queryKey,
                    context.previousDepartments,
                );
            }
            toast.error(
                err instanceof Error
                    ? err.message
                    : "Failed to delete department",
            );
        },
        onSuccess: (data) => {
            toast.success(data || "Department deleted successfully");
            setDeleteDialogOpen(false);
            setSelectedDepartment(null);
        },
        onSettled: () => {
            queryClient.invalidateQueries({
                queryKey: departmentsQueryOptions.queryKey,
            });
        },
    });

    // const assignHeadMutation = useMutation({
    // 	mutationFn: ({
    // 		departmentId,
    // 		userId,
    // 	}: {
    // 		departmentId: number;
    // 		userId: number;
    // 	}) => assignDepartmentHead(departmentId, userId),
    // 	// Optimistic update for assign head
    // 	onMutate: async ({ departmentId, userId }) => {
    // 		await queryClient.cancelQueries({
    // 			queryKey: departmentsQueryOptions.queryKey,
    // 		});
    // 		const previousDepartments = queryClient.getQueryData<DepartmentType[]>(
    // 			departmentsQueryOptions.queryKey,
    // 		);

    // 		const deptHeadUser = usersData?.find((u: UserType) => Number(u.id) === userId);
    // 		const deptHeadName = deptHeadUser
    // 			? `${deptHeadUser.firstName} ${deptHeadUser.lastName}`
    // 			: null;

    // 		queryClient.setQueryData<DepartmentType[]>(
    // 			departmentsQueryOptions.queryKey,
    // 			(old = []) =>
    // 				old.map((dept) =>
    // 					dept.id === departmentId
    // 						? {
    // 								...dept,
    // 								deptHeadId: userId,
    // 								deptHeadName: deptHeadName,
    // 								updatedAt: new Date().toISOString(),
    // 							}
    // 						: dept,
    // 				),
    // 		);
    // 		return { previousDepartments };
    // 	},
    // 	onError: (err, _variables, context) => {
    // 		if (context?.previousDepartments) {
    // 			queryClient.setQueryData(
    // 				departmentsQueryOptions.queryKey,
    // 				context.previousDepartments,
    // 			);
    // 		}
    // 		toast.error(
    // 			err instanceof Error ? err.message : "Failed to assign department head",
    // 		);
    // 	},
    // 	onSuccess: (data) => {
    // 		toast.success(data || "Department head assigned successfully");
    // 		setAssignHeadOpen(false);
    // 		setSelectedDepartment(null);
    // 	},
    // 	onSettled: () => {
    // 		queryClient.invalidateQueries({
    // 			queryKey: departmentsQueryOptions.queryKey,
    // 		});
    // 		// Invalidate users query if head assignment might change user roles/data shown elsewhere
    // 		queryClient.invalidateQueries({
    // 			queryKey: usersQueryOptions.queryKey,
    // 		});
    // 	},
    // });

    // --- Event Handlers ---
    const handleDeleteDepartment = () => {
        if (selectedDepartment) {
            deleteDepartmentMutation.mutate(selectedDepartment.publicId);
        }
    };

    // Handler for Assign Head Dialog submission
    // const handleAssignHead = (userId: number) => {
    // 	if (selectedDepartment) {
    // 		assignHeadMutation.mutate({
    // 			departmentId: selectedDepartment.id,
    // 			userId,
    // 		});
    // 	}
    // };

    // --- Columns ---
    const columns = React.useMemo<ColumnDef<DepartmentDTO>[]>(
        () => [
            // Optional: Select column for bulk actions
            // {
            //     id: "select",
            //     header: ({ table }) => (...),
            //     cell: ({ row }) => (...),
            //     enableSorting: false,
            //     enableHiding: false,
            // },
            {
                id: "id",
                accessorFn: (row: DepartmentDTO) => String(row.publicId),
                header: ({ column }) => (
                    <Button
                        variant="ghost"
                        onClick={() =>
                            column.toggleSorting(column.getIsSorted() === "asc")
                        }
                    >
                        ID
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                ),
                cell: ({ row }) => <div>{row.getValue("id")}</div>,
                filterFn: filterFn("text"),
                meta: defineMeta((row: DepartmentDTO) => String(row.publicId), {
                    displayName: "ID",
                    type: "text",
                    icon: Building,
                }) as ColumnMeta<DepartmentDTO, unknown>,
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
                cell: ({ row }) => (
                    <div className="font-medium">{row.getValue("name")}</div>
                ),
                filterFn: filterFn("text"),
                meta: defineMeta((row: DepartmentDTO) => row.name, {
                    displayName: "Name",
                    type: "text",
                    icon: Building,
                }) as ColumnMeta<DepartmentDTO, unknown>,
            },
            {
                accessorKey: "description",
                header: "Description",
                cell: ({ row }) => (
                    <div className="text-sm text-muted-foreground truncate max-w-xs">
                        {row.getValue("description") || "-"}
                    </div>
                ),
                filterFn: filterFn("text"),
                meta: defineMeta((row: DepartmentDTO) => row.description, {
                    displayName: "Description",
                    type: "text",
                    icon: TextIcon,
                }) as ColumnMeta<DepartmentDTO, unknown>,
            },
            {
                accessorKey: "deptHead",
                id: "deptHead",
                header: ({ column }) => (
                    <Button
                        variant="ghost"
                        onClick={() =>
                            column.toggleSorting(column.getIsSorted() === "asc")
                        }
                    >
                        Department Head
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                ),
                accessorFn: (row: DepartmentDTO) => {
                    const deptHeadUser = row.deptHead;
                    return deptHeadUser
                        ? `${deptHeadUser.firstName} ${deptHeadUser.lastName}`
                        : "Unassigned";
                },
                cell: ({ row }) => {
                    const deptHeadUser = row.original.deptHead;
                    return (
                        <div>
                            {deptHeadUser ? (
                                `${deptHeadUser.firstName} ${deptHeadUser.lastName}`
                            ) : (
                                <span className="text-muted-foreground">
                                    Unassigned
                                </span>
                            )}
                        </div>
                    );
                },
                filterFn: filterFn("text"),
                meta: defineMeta(
                    (row: DepartmentDTO) => {
                        const deptHeadUser = row.deptHead;
                        return deptHeadUser
                            ? `${deptHeadUser.firstName} ${deptHeadUser.lastName}`
                            : "Unassigned";
                    },
                    {
                        displayName: "Department Head",
                        type: "text",
                        icon: UserIcon,
                    },
                ) as ColumnMeta<DepartmentDTO, unknown>,
            },
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
                cell: ({ row }) => {
                    const date = new Date(row.getValue("createdAt"));
                    const formatted = new Intl.DateTimeFormat("en-US", {
                        dateStyle: "medium",
                        timeStyle: "short",
                    }).format(date);
                    return <div className="text-right">{formatted}</div>;
                },
                filterFn: filterFn("date"),
                meta: defineMeta(
                    (row: DepartmentDTO) => new Date(row.createdAt),
                    {
                        displayName: "Created At",
                        type: "date",
                        icon: CalendarIcon,
                    },
                ) as ColumnMeta<DepartmentDTO, unknown>,
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
                cell: ({ row }) => {
                    const date = new Date(row.getValue("updatedAt"));
                    const formatted = new Intl.DateTimeFormat("en-US", {
                        dateStyle: "medium",
                        timeStyle: "short",
                    }).format(date);
                    return <div className="text-right">{formatted}</div>;
                },
                filterFn: filterFn("date"),
                meta: defineMeta(
                    (row: DepartmentDTO) => new Date(row.updatedAt),
                    {
                        displayName: "Updated At",
                        type: "date",
                        icon: CalendarIcon,
                    },
                ) as ColumnMeta<DepartmentDTO, unknown>,
            },
            {
                id: "actions",
                cell: ({ row }) => {
                    const department = row.original;
                    return (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Open menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem
                                    onClick={() => {
                                        setSelectedDepartment(department);
                                        setEditDialogOpen(true);
                                    }}
                                >
                                    <Building className="mr-2 h-4 w-4" /> Edit
                                </DropdownMenuItem>
                                {/* <DropdownMenuItem
									onClick={() => {
										setSelectedDepartment(department);
										setAssignHeadOpen(true);
									}}
								>
									<UserCog className="mr-2 h-4 w-4" /> Assign Head
								</DropdownMenuItem> */}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => {
                                        setSelectedDepartment(department);
                                        setDeleteDialogOpen(true);
                                    }}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    );
                },
                enableHiding: false,
            },
        ],
        [setEditDialogOpen, setDeleteDialogOpen, setSelectedDepartment],
    );

    // --- Table Instance ---
    const table = useReactTable({
        data: departmentsData ?? [],
        columns,
        state: {
            sorting,
            columnVisibility,
            rowSelection,
            columnFilters,
            // pagination: {
            //     pageIndex,
            //     pageSize,
            // },
        },
        enableRowSelection: true, // Enable if using select column
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        // getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
        // manualPagination: false,
        // pageCount: -1,
        // onPaginationChange: (updater) => {
        //     if (typeof updater === "function") {
        //         const newPaginationState = updater(table.getState().pagination);
        //         setPageIndex(newPaginationState.pageIndex);
        //         setPageSize(newPaginationState.pageSize);
        //     } else {
        //         setPageIndex(updater.pageIndex);
        //         setPageSize(updater.pageSize);
        //     }
        // },
    });

    // --- Render ---
    return (
        <div className="w-full space-y-4">
            {/* Filters */}
            <div className="flex items-center justify-between">
                <DataTableFilter table={table} />
                {/* Column Visibility Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="h-8 gap ml-2">
                            Columns <ChevronDown className="ml-2 h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {table
                            .getAllColumns()
                            .filter((column) => column.getCanHide())
                            .map((column) => {
                                const displayName =
                                    (
                                        column.columnDef.meta as
                                            | { displayName?: string }
                                            | undefined
                                    )?.displayName || column.id;
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

            {/* Table */}
            <div className="rounded-md border overflow-y-auto max-h-[80vh]">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead
                                        key={header.id}
                                        colSpan={header.colSpan}
                                        className="text-secondary-foreground bg-secondary text-center font-medium"
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
                                    No departments found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {/* <div className="flex items-center justify-between space-x-2 py-4">
                <div className="flex-1 text-sm text-muted-foreground">
                    {table.getFilteredSelectedRowModel().rows.length} of{" "}
                    {table.getFilteredRowModel().rows.length} row(s) selected.
                </div>
                <div className="flex items-center space-x-6 lg:space-x-8">
                    <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium">Rows per page</p>
                        <Select
                            value={`${pageSize}`}
                            onValueChange={(value) => {
                                table.setPageSize(Number(value));
                            }}
                        >
                            <SelectTrigger className="h-8 w-[70px]">
                                <SelectValue placeholder={pageSize} />
                            </SelectTrigger>
                            <SelectContent side="top">
                                {[10, 20, 30, 40, 50].map((pageSize) => (
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
                        Page {pageIndex + 1} of {table.getPageCount()}
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
            </div> */}

            {selectedDepartment && (
                <EditDepartmentFormDialog
                    isOpen={editDialogOpen}
                    onClose={() => {
                        setEditDialogOpen(false);
                        setSelectedDepartment(null);
                    }}
                    department={selectedDepartment}
                    users={usersData ?? []}
                />
            )}
            {selectedDepartment && (
                <DeleteConfirmDialog
                    isOpen={deleteDialogOpen}
                    onClose={() => {
                        setDeleteDialogOpen(false);
                        setSelectedDepartment(null);
                    }}
                    title="Delete Department"
                    description={`Are you sure you want to delete the department "${selectedDepartment.name}"? This action cannot be undone.`}
                    onConfirm={handleDeleteDepartment}
                    isLoading={deleteDepartmentMutation.isPending}
                />
            )}
            {/* {selectedDepartment && (
				<AssignHeadDialog
					isOpen={assignHeadOpen}
					onClose={() => {
						setAssignHeadOpen(false);
						setSelectedDepartment(null);
					}}
					departmentName={selectedDepartment.name}
					currentHeadId={selectedDepartment.deptHead?.id}
					users={usersData ?? []}
					onAssign={handleAssignHead}
					isLoading={assignHeadMutation.isPending}
				/>
			)} */}
        </div>
    );
}
