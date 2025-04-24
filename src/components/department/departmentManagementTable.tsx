import { DataTableFilter } from "@/components/data-table-filter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
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
import { DeleteConfirmDialog } from "@/components/user-management/deleteConfirmDialog"; // Assuming a generic one exists
import {
    assignDepartmentHead,
    deleteDepartment,
    updateDepartment,
} from "@/lib/api";
import {
    assignHeadDialogAtom,
    deleteDepartmentDialogAtom,
    editDepartmentDialogAtom,
    selectedDepartmentAtom,
} from "@/lib/atoms";
import { defineMeta, filterFn } from "@/lib/filters";
import { departmentsQueryOptions, usersQueryOptions } from "@/lib/query";
import type { DepartmentInput } from "@/lib/schema";
import type { DepartmentType, UserType } from "@/lib/types";
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
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table";
import { useAtom } from "jotai";
import {
    ArrowUpDown,
    Building,
    CalendarIcon,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    MoreHorizontal,
    TextIcon, // For Description
    Trash2,
    UserCog, // For Assign Head
    UserIcon, // For Dept Head Name
    X,
} from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { AssignHeadDialog } from "./assignHeadDialog";
import { EditDepartmentFormDialog } from "./editDepartmentFormDialog";

type ProcessedDepartmentType = DepartmentType & { deptHeadName: string | null };

export function DepartmentDataTable() {
    const queryClient = useQueryClient();
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnFilters, setColumnFilters] =
        React.useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] =
        React.useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = React.useState({});

    const [editDialogOpen, setEditDialogOpen] = useAtom(
        editDepartmentDialogAtom,
    );
    const [deleteDialogOpen, setDeleteDialogOpen] = useAtom(
        deleteDepartmentDialogAtom,
    );
    const [assignHeadOpen, setAssignHeadOpen] = useAtom(assignHeadDialogAtom);
    const [selectedDepartment, setSelectedDepartment] = useAtom(
        selectedDepartmentAtom,
    );

    // Fetch departments and users
    const { data: departmentsData } = useSuspenseQuery(departmentsQueryOptions);
    const { data: usersData } = useSuspenseQuery(usersQueryOptions); // For assigning head

    const processedDepartments =
        React.useMemo((): ProcessedDepartmentType[] => {
            if (!departmentsData || !usersData) return [];

            const userMap = new Map(
                // Ensure user.id is treated consistently (e.g., as string if that's the type)
                usersData.map((user: UserType) => [user.id, user]),
            );

            return departmentsData.map((dept) => {
                // Ensure dept.deptHeadId is treated consistently (e.g., as string if user.id is string)
                const headUser = dept.deptHeadId
                    ? userMap.get(String(dept.deptHeadId)) // Use String() if user.id is string
                    : null;
                return {
                    ...dept,
                    deptHeadName: headUser
                        ? `${headUser.firstName} ${headUser.lastName}`
                        : null,
                };
            });
        }, [departmentsData, usersData]);

    // --- Mutations ---
    const updateDepartmentMutation = useMutation({
        mutationFn: ({
            departmentId,
            payload,
        }: {
            departmentId: number;
            payload: Partial<DepartmentInput>;
        }) => updateDepartment(departmentId, payload),
        onMutate: async ({ departmentId, payload }) => {
            await queryClient.cancelQueries({
                queryKey: departmentsQueryOptions.queryKey,
            });
            const previousDepartments = queryClient.getQueryData<
                DepartmentType[]
            >(departmentsQueryOptions.queryKey);

            // Find dept head name for optimistic update
            const deptHeadUser = payload.deptHeadId
                ? users?.find((u) => Number(u.id) === payload.deptHeadId)
                : null;
            const deptHeadName = deptHeadUser
                ? `${deptHeadUser.firstName} ${deptHeadUser.lastName}`
                : null;

            queryClient.setQueryData<DepartmentType[]>(
                departmentsQueryOptions.queryKey,
                (old = []) =>
                    old.map((dept) =>
                        dept.id === departmentId
                            ? {
                                  ...dept,
                                  ...payload,
                                  deptHeadName:
                                      deptHeadName !== undefined
                                          ? deptHeadName
                                          : dept.deptHeadName, // Update name if ID changed
                                  deptHeadId:
                                      payload.deptHeadId !== undefined
                                          ? payload.deptHeadId
                                          : dept.deptHeadId,
                                  updatedAt: new Date().toISOString(),
                              }
                            : dept,
                    ),
            );
            return { previousDepartments };
        },
        onError: (err, variables, context) => {
            if (context?.previousDepartments) {
                queryClient.setQueryData(
                    departmentsQueryOptions.queryKey,
                    context.previousDepartments,
                );
            }
            toast.error(
                err instanceof Error
                    ? err.message
                    : "Failed to update department",
            );
        },
        onSuccess: (data) => {
            toast.success(data || "Department updated successfully");
            setEditDialogOpen(false);
            setSelectedDepartment(null);
        },
        onSettled: () => {
            queryClient.invalidateQueries({
                queryKey: departmentsQueryOptions.queryKey,
            });
            // Invalidate users query if head assignment might change user roles/data shown elsewhere
            // queryClient.invalidateQueries({ queryKey: usersQueryOptions.queryKey });
        },
    });

    const deleteDepartmentMutation = useMutation({
        mutationFn: deleteDepartment, // Expects departmentId (number)
        onMutate: async (departmentId: number) => {
            await queryClient.cancelQueries({
                queryKey: departmentsQueryOptions.queryKey,
            });
            const previousDepartments = queryClient.getQueryData<
                DepartmentType[]
            >(departmentsQueryOptions.queryKey);
            queryClient.setQueryData<DepartmentType[]>(
                departmentsQueryOptions.queryKey,
                (old = []) => old.filter((dept) => dept.id !== departmentId),
            );
            return { previousDepartments };
        },
        onError: (err, departmentId, context) => {
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

    const assignHeadMutation = useMutation({
        mutationFn: ({
            departmentId,
            userId,
        }: {
            departmentId: number;
            userId: number;
        }) => assignDepartmentHead(departmentId, userId),
        // Optimistic update for assign head
        onMutate: async ({ departmentId, userId }) => {
            await queryClient.cancelQueries({
                queryKey: departmentsQueryOptions.queryKey,
            });
            const previousDepartments = queryClient.getQueryData<
                DepartmentType[]
            >(departmentsQueryOptions.queryKey);

            const deptHeadUser = users?.find((u) => Number(u.id) === userId);
            const deptHeadName = deptHeadUser
                ? `${deptHeadUser.firstName} ${deptHeadUser.lastName}`
                : null;

            queryClient.setQueryData<DepartmentType[]>(
                departmentsQueryOptions.queryKey,
                (old = []) =>
                    old.map((dept) =>
                        dept.id === departmentId
                            ? {
                                  ...dept,
                                  deptHeadId: userId,
                                  deptHeadName: deptHeadName,
                                  updatedAt: new Date().toISOString(),
                              }
                            : dept,
                    ),
            );
            return { previousDepartments };
        },
        onError: (err, variables, context) => {
            if (context?.previousDepartments) {
                queryClient.setQueryData(
                    departmentsQueryOptions.queryKey,
                    context.previousDepartments,
                );
            }
            toast.error(
                err instanceof Error
                    ? err.message
                    : "Failed to assign department head",
            );
        },
        onSuccess: (data) => {
            toast.success(data || "Department head assigned successfully");
            setAssignHeadOpen(false);
            setSelectedDepartment(null);
        },
        onSettled: () => {
            queryClient.invalidateQueries({
                queryKey: departmentsQueryOptions.queryKey,
            });
            // Invalidate users query if head assignment might change user roles/data shown elsewhere
            queryClient.invalidateQueries({
                queryKey: usersQueryOptions.queryKey,
            });
        },
    });

    // --- Event Handlers ---
    const handleDeleteDepartment = () => {
        if (selectedDepartment) {
            deleteDepartmentMutation.mutate(selectedDepartment.id);
        }
    };

    // Handler for Assign Head Dialog submission
    const handleAssignHead = (userId: number) => {
        if (selectedDepartment) {
            assignHeadMutation.mutate({
                departmentId: selectedDepartment.id,
                userId,
            });
        }
    };

    // --- Filter Options ---
    const USER_OPTIONS = React.useMemo(() => {
        return (
            usersData?.map((user: UserType) => ({
                value: user.id, // Value for filtering (ID)
                label: `${user.firstName} ${user.lastName}`, // Label for display in filter dropdown
                icon: UserIcon,
            })) ?? []
        );
    }, [usersData]); //

    // --- Columns ---
    const columns = React.useMemo<ColumnDef<DepartmentType>[]>(
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
                accessorKey: "id",
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
                // meta: defineMeta(...) // Add filter meta if needed (number type)
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
                meta: defineMeta((row: DepartmentType) => row.name, {
                    displayName: "Name",
                    type: "text",
                    icon: Building,
                }) as ColumnMeta<DepartmentType, unknown>,
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
                meta: defineMeta((row: DepartmentType) => row.description, {
                    displayName: "Description",
                    type: "text",
                    icon: TextIcon,
                }) as ColumnMeta<DepartmentType, unknown>,
            },
            {
                accessorKey: "deptHeadName", // Accessor for the processed name
                id: "deptHead", // Unique ID for the column
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
                // Correctly display the name using the accessorKey
                cell: ({ row }) => (
                    <div>
                        {row.getValue("deptHeadName") || ( // Use deptHeadName here
                            <span className="text-muted-foreground">
                                Unassigned
                            </span>
                        )}
                    </div>
                ),
                filterFn: filterFn("option"), // Use option filter
                meta: defineMeta(
                    // Filter based on the original deptHeadId
                    (row: DepartmentType) =>
                        row.deptHeadId ? String(row.deptHeadId) : null, // Return string ID or null
                    {
                        displayName: "Department Head",
                        type: "option",
                        icon: UserIcon,
                        options: USER_OPTIONS, // Use the options with ID as value, Name as label
                    },
                ) as ColumnMeta<DepartmentType, unknown>,
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
                    (row: DepartmentType) => new Date(row.createdAt),
                    {
                        displayName: "Created At",
                        type: "date",
                        icon: CalendarIcon,
                    },
                ) as ColumnMeta<DepartmentType, unknown>,
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
                    (row: DepartmentType) => new Date(row.updatedAt),
                    {
                        displayName: "Updated At",
                        type: "date",
                        icon: CalendarIcon,
                    },
                ) as ColumnMeta<DepartmentType, unknown>,
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
                                <DropdownMenuItem
                                    onClick={() => {
                                        setSelectedDepartment(department);
                                        setAssignHeadOpen(true);
                                    }}
                                >
                                    <UserCog className="mr-2 h-4 w-4" /> Assign
                                    Head
                                </DropdownMenuItem>
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
        [USER_OPTIONS], // Add USER_OPTIONS dependency
    );

    // --- Table Instance ---
    const table = useReactTable({
        data: processedDepartments ?? [],
        columns,
        state: {
            sorting,
            columnVisibility,
            rowSelection,
            columnFilters,
        },
        enableRowSelection: true, // Enable if using select column
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
    });

    // --- Render ---
    return (
        <div className="w-full space-y-4">
            {/* Filters */}
            <div className="flex items-center justify-between">
                <DataTableFilter table={table} />
                {/* Add View Options Dropdown if needed */}
            </div>

            {/* Table */}
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id}>
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
            <div className="flex items-center justify-between space-x-2 py-4">
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

            {/* Dialogs */}
            {selectedDepartment && (
                <EditDepartmentFormDialog
                    isOpen={editDialogOpen}
                    onClose={() => {
                        setEditDialogOpen(false);
                        setSelectedDepartment(null);
                    }}
                    department={selectedDepartment}
                    users={usersData ?? []} // Pass users for select dropdown
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
            {selectedDepartment && (
                <AssignHeadDialog
                    isOpen={assignHeadOpen}
                    onClose={() => {
                        setAssignHeadOpen(false);
                        setSelectedDepartment(null);
                    }}
                    departmentName={selectedDepartment.name}
                    currentHeadId={selectedDepartment.deptHeadId}
                    users={usersData ?? []} // Pass users for select dropdown
                    onAssign={handleAssignHead}
                    isLoading={assignHeadMutation.isPending}
                />
            )}
        </div>
    );
}
