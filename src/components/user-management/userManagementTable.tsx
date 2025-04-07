import {
    type ColumnDef,
    type ColumnFiltersState,
    type SortingState,
    type VisibilityState,
    flexRender,
    getCoreRowModel,
    getFacetedRowModel, // Often needed for DataTableFilter
    getFacetedUniqueValues, // Often needed for DataTableFilter
    getFilteredRowModel, // Keep this
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
    // Import filter function type if provided by Tanstack Table or your filter component
    // FilterFnOption,
} from "@tanstack/react-table";
import {
    ArrowUpDown,
    BuildingIcon, // Icon for Department
    CalendarIcon, // Icon for Last Active (Date)
    CheckCircleIcon, // Icon for Active Status
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    FingerprintIcon, IdCardIcon, // Icon for ID Number
    ListFilterIcon, // Generic Filter Icon or for Status
    MoreHorizontal,
    UserIcon, // Icon for User Name
    UsersIcon,
    VerifiedIcon, // Icon for Role
    XCircleIcon, // Icon for Inactive Status
} from "lucide-react";
import * as React from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
// Remove the direct Input import if DataTableFilter handles all filtering
// import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

// --- Import your custom filter components ---
// Adjust the import path as necessary
import { DataTableFilter } from "@/components/data-table-filter";
import { editDialogAtom, selectedUserAtom } from "@/lib/atoms";
import { defineMeta } from "@/lib/filters";
import { filterFn } from "@/lib/filters";
import { usersQueryOptions } from "@/lib/query";
import { DEPARTMENTS, ROLES, type UserType } from "@/lib/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { set } from "date-fns";
import { atom, useAtom } from "jotai";
import { UserFormDialog } from "./userFormDialog";
import { updateUser } from "@/lib/api";
import { toast } from "sonner";
// --- End Import ---

// The main DataTable component
export function UserDataTable() {
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnFilters, setColumnFilters] =
        React.useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] =
        React.useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = React.useState({});
    const [editDialogOpen, setEditDialogOpen] = useAtom(editDialogAtom);
    const [selectedUser, setSelectedUser] = useAtom(selectedUserAtom);

    const queryClient = useQueryClient();
    const {
        isLoading,
        isError,
        data: initialUsers,
    } = useQuery(usersQueryOptions);

    if (isLoading) {
        return <div>Loading users...</div>;
    }

    if (isError) {
        return <div>Error loading users</div>;
    }

    const handleDeactivateUser = (userId: string) => {
        // Logic to deactivate user
        console.log(`Deactivating user with ID: ${userId}`);
    };

    const handleEditUser = (userId: string) => {
        try {
            updateUser(userId, selectedUser);
        } catch (error) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "An unexpected error occurred";
            toast.error(errorMessage);
        }
    };

    // --- Define Options for Filters ---
    const ACTIVE_OPTIONS = React.useMemo(() => {
        // Handle potential null/undefined initialUsers
        const users = initialUsers || [];

        // 1. Get unique boolean active states present in the users array
        //    Map directly to the boolean `active` property.
        const uniqueActiveStates = Array.from(
            new Set(users.map((u: UserType) => u.active)), // Result: e.g., [true], [false], [true, false]
        );

        // 2. Map these unique boolean states to the desired option objects
        const options = uniqueActiveStates.map((isActive: boolean) => ({
            value: isActive, // Convert boolean to string ("true" or "false") for the value
            label: isActive ? "True" : "False",
            icon: isActive ? CheckCircleIcon : XCircleIcon,
        }));

        // 4. Return the array of option objects directly
        return options;
    }, [initialUsers]);

    const VERIFIED_OPTIONS = React.useMemo(() => {
        // Handle potential null/undefined initialUsers
        const users = initialUsers || [];

        // 1. Get unique boolean active states present in the users array
        //    Map directly to the boolean `active` property.
        const uniqueVerifiedStates = Array.from(
            new Set(users.map((u: UserType) => u.emailVerified)), // Result: e.g., [true], [false], [true, false]
        );

        // 2. Map these unique boolean states to the desired option objects
        const options = uniqueVerifiedStates.map((isVerified: boolean) => ({
            value: isVerified, // Convert boolean to string ("true" or "false") for the value
            label: isVerified ? "True" : "False",
            icon: isVerified ? CheckCircleIcon : XCircleIcon,
        })); 

        // 4. Return the array of option objects directly
        return options;
    }, [initialUsers]);

    // Dynamically generate options or define manually if fixed
    const ROLE_OPTIONS = React.useMemo(
        () =>
            Array.from(
                new Set(initialUsers?.map((u: UserType) => u.role) || []),
            ).map((role) => ({
                value: role,
                label: role,
            })),
        [initialUsers],
    );

    const DEPARTMENT_OPTIONS = React.useMemo(
        () =>
            Array.from(
                new Set(initialUsers?.map((u) => u.department) || []),
            ).map((dep) => ({
                value: dep,
                label: dep,
                icon: BuildingIcon,
            })),
        [initialUsers],
    );
    // --- End Options ---

    // --- Define the columns with filter metadata ---
    const columns = React.useMemo<ColumnDef<UserType>[]>(
        () => [
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
            {
                accessorKey: "name",
                header: ({ column }) => (
                    <Button
                        variant="ghost"
                        onClick={() =>
                            column.toggleSorting(column.getIsSorted() === "asc")
                        }
                    >
                        User
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                ),
                cell: ({ row }) => {
                    const user = row.original;
                    const fullName = `${user.firstName} ${user.lastName}`;
                    const getInitials = () => {
                        return `${user.firstName?.charAt(0) || ""}${user.lastName?.charAt(0) || ""}`.toUpperCase();
                    };
                    return (
                        <div className="flex items-center space-x-3">
                            <Avatar>
                                <AvatarImage
                                    src={user?.avatar}
                                    alt={fullName}
                                />
                                <AvatarFallback>{getInitials()}</AvatarFallback>
                            </Avatar>
                            <div>
                                <div className="font-medium">{fullName}</div>
                                <div className="text-sm text-muted-foreground">
                                    {user.email}
                                </div>
                            </div>
                        </div>
                    );
                },
                filterFn: filterFn("text"),
                meta: defineMeta((row) => `${row.firstName} ${row.lastName}`, {
                    // Combined name for filtering
                    displayName: "User Name",
                    type: "text",
                    icon: UserIcon,
                }),
            },
         {
                accessorKey: "id",
                header: "User ID",
                cell: ({ row }) => <div>{row.getValue("id")}</div>,
                // --- Filter Config ---
                filterFn: filterFn("text"),
                meta: defineMeta((row) => row.id, {
                    displayName: "User ID",
                    type: "text",
                    icon: IdCardIcon,
                }),
                // --- End Filter Config ---
            },
            {
                accessorKey: "idNumber",
                header: "ID Number",
                cell: ({ row }) => <div>{row.getValue("idNumber")}</div>,
                // --- Filter Config ---
                filterFn: filterFn("text"),
                meta: defineMeta((row) => row.idNumber, {
                    displayName: "ID Number",
                    type: "text",
                    icon: FingerprintIcon,
                }),
                // --- End Filter Config ---
            },
            {
                accessorKey: "role",
                header: ({ column } /* Sort button... */) => (
                    <Button
                        variant="ghost"
                        onClick={() =>
                            column.toggleSorting(column.getIsSorted() === "asc")
                        }
                    >
                        Role
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                ),
                cell: ({ row }) => (
                    <div className="capitalize">{row.getValue("role")}</div>
                ),
                // --- Filter Config ---
                filterFn: filterFn("option"),
                meta: defineMeta((row) => row.role, {
                    displayName: "Role",
                    type: "option",
                    icon: UsersIcon,
                    options: ROLE_OPTIONS, 
                }),
                // --- End Filter Config ---
            },
            {
                accessorKey: "phoneNumber",
                header: ({ column }) => (
                    <Button
                        variant="ghost"
                        onClick={() =>
                            column.toggleSorting(column.getIsSorted() === "asc")
                        }
                    >
                        Phone
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                ),
                cell: ({ row }) => {
                    const phoneNumber = row.original.phoneNumber;
                    return <div>{phoneNumber || "-"}</div>;
                },
                // --- Filter Config ---
                filterFn: filterFn("text"),
                meta: defineMeta((row) => row.phoneNumber, {
                    displayName: "Phone Number",
                    type: "text",
                    icon: FingerprintIcon,
                }),
                // --- End Filter Config ---
            },
            {
                accessorKey: "department",
                header: ({ column } /* Sort button... */) => (
                    <Button
                        variant="ghost"
                        onClick={() =>
                            column.toggleSorting(column.getIsSorted() === "asc")
                        }
                    >
                        Department
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                ),
                cell: ({ row }) => <div>{row.getValue("department")}</div>,
                // --- Filter Config ---
                filterFn: filterFn("option"),
                meta: defineMeta((row) => row.department, {
                    displayName: "Department",
                    type: "option",
                    icon: BuildingIcon,
                    options: DEPARTMENT_OPTIONS,
                }),
                // --- End Filter Config ---
            },
            {
                accessorKey: "verified", // Virtual column
                header: "Verified",
                cell: ({ row }) => {
                    const emailVerified = row.original.emailVerified;
                    const status = emailVerified ? "true" : "false";
                    return (
                        <Badge
                            variant={emailVerified ? "default" : "outline"}
                            className="capitalize"
                        >
                            {status}
                        </Badge>
                    );
                },
                filterFn: filterFn("option"),
                meta: defineMeta(
                    (row) => (row.emailVerified ? "true" : "false"),
                    {
                        displayName: "Verified",
                        type: "option",
                        icon: VerifiedIcon,
                        options: VERIFIED_OPTIONS,
                    },
                ),
            },
            {
                accessorKey: "active", // Virtual column
                header: "Active",
                cell: ({ row }) => {
                    const statusActive = row.original.active;
                    const status = statusActive ? "true" : "false";
                    return (
                        <Badge
                            variant={status ? "default" : "outline"}
                            className="capitalize"
                        >
                            {status}
                        </Badge>
                    );
                },
                filterFn: filterFn("option"),
                meta: defineMeta((row) => (row.active ? "true" : "false"), {
                    displayName: "Active",
                    type: "option",
                    icon: ListFilterIcon,
                    options: ACTIVE_OPTIONS,
                }),
            },

            {
                accessorKey: "createdAt", 
                header: ({ column }) => (
                    <div className="text-right">
                        <Button
                            variant="ghost"
                            onClick={() =>
                                column.toggleSorting(
                                    column.getIsSorted() === "asc",
                                )
                            }
                        >
                            Created At{" "}
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                ),
                cell: ({ row }) => {
                    /* Add proper date validation */
                    const dateValue = row.getValue("createdAt");

                    // Check if date exists and is valid
                    if (!dateValue) {
                        return (
                            <div className="text-right text-muted-foreground">
                                Never
                            </div>
                        );
                    }

                    // Try to create a valid date object
                    try {
                        const date = new Date(dateValue);

                        // Check if the date is valid
                        if (isNaN(date.getTime())) {
                            return (
                                <div className="text-right text-muted-foreground">
                                    Invalid date
                                </div>
                            );
                        }

                        const formatted = new Intl.DateTimeFormat("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                        }).format(date);

                        return (
                            <div className="text-right font-medium">
                                {formatted}
                            </div>
                        );
                    } catch (error) {
                        return (
                            <div className="text-right text-muted-foreground">
                                Error
                            </div>
                        );
                    }
                },
                filterFn: filterFn("date"),
                meta: defineMeta(
                    (row) => {
                        try {
                            const date = new Date(row.createdAt);
                            return isNaN(date.getTime()) ? undefined : date;
                        } catch (e) {
                            return undefined;
                        }
                    },
                    {
                        displayName: "Created At", 
                        type: "date",
                        icon: CalendarIcon,
                    },
                ),
            },
            {
                id: "actions",
                cell: ({ row }) => {
                    /* Actions DropdownMenu... */
                    const user = row.original;
                    const [, setEditDialogOpen] = useAtom(editDialogAtom);
                    const [, setSelectedUser] = useAtom(selectedUserAtom);
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
                                        setEditDialogOpen(true);
                                        setSelectedUser(user);
                                    }}
                                >
                                    Edit User
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() =>
                                        console.log(
                                            `Viewing details for: ${user.id}`,
                                        )
                                    }
                                >
                                    View Details
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() =>
                                        console.log(
                                            `Deactivating user: ${user.id}`,
                                        )
                                    }
                                >
                                    Deactivate User
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    );
                },
                enableHiding: false, // Keep actions always visible
            },
        ],
        [ROLE_OPTIONS, DEPARTMENT_OPTIONS, ACTIVE_OPTIONS, VERIFIED_OPTIONS],
    );

    const table = useReactTable({
        data: initialUsers || [],
        columns,
        state: {
            // Order matters for state dependencies
            sorting,
            columnVisibility,
            rowSelection,
            columnFilters,
        },
        // --- Enable features needed by DataTableFilter ---
        onColumnFiltersChange: setColumnFilters, // Connect filter state
        getFilteredRowModel: getFilteredRowModel(), // Basic filtering
        getFacetedRowModel: getFacetedRowModel(), // Needed for list-based filters
        getFacetedUniqueValues: getFacetedUniqueValues(), // Needed for list-based filters
        // --- End Enable features ---
        onSortingChange: setSorting,
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        // Optional: Define column meta globally if needed, though per-column is shown above
        // meta: {},
        // debugTable: true, // Uncomment for debugging
        // debugHeaders: true,
        // debugColumns: true,
    });

    return (
        <div className="w-full space-y-4">
            {/* Column Visibility Dropdown (Keep if DataTableFilter doesn't handle it) */}
            <div className="flex items-center justify-end">
                {" "}
                {/* Add spacing */}
                {/* --- Add the custom filter component --- */}
                <DataTableFilter table={table} />
                {/* --- Remove the old simple filter input --- */}
                {/*
      <div className="flex items-center py-4">
        <Input placeholder="Filter names..." ... />
        <DropdownMenu>...</DropdownMenu> // Column visibility can stay if DataTableFilter doesn't handle it
      </div>
      */}
                {Object.keys(table.getState().rowSelection).length > 0 && (
                    <Button
                        variant="destructive"
                        className="ml-2 h-7 !px-2"
                        onClick={() => {
                            const selectedRowIds = Object.keys(
                                table.getState().rowSelection,
                            );
                            console.log(
                                "Deleting rows with ids:",
                                selectedRowIds,
                            );
                            // TODO: Add deletion logic here
                        }}
                    >
                        Delete
                    </Button>
                )}
                {/* Position it */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="ml-2">
                            Columns <ChevronDown className="ml-2 h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {table
                            .getAllColumns()
                            .filter((column) => column.getCanHide()) // Filter out non-hidable columns (select, actions)
                            .map((column) => {
                                // Use displayName from meta if available, otherwise format ID
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
            {/* --- Table Rendering (remains mostly the same) --- */}
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead
                                            key={header.id}
                                            colSpan={header.colSpan}
                                        >
                                            {" "}
                                            {/* Add colSpan */}
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                      header.column.columnDef
                                                          .header,
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
                                    colSpan={table.getAllColumns().length} // Use dynamic colspan
                                    className="h-24 text-center"
                                >
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            {/* --- Pagination and Selection Count (remains the same) --- */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
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
                        of{" "}
                        <strong>
                            {table.getFilteredRowModel().rows.length}
                        </strong>{" "}
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
                                placeholder={
                                    table.getState().pagination.pageSize
                                }
                            />
                        </SelectTrigger>
                        <SelectContent side="top">
                            {[5, 10, 20, 30, 40, 50].map((pageSize) => (
                                <SelectItem
                                    key={pageSize}
                                    value={pageSize.toString()}
                                >
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
            <UserFormDialog
                isOpen={editDialogOpen}
                onClose={() => {
                    setEditDialogOpen(false);
                    setSelectedUser(null); // Clear selected user on close
                }}
                onSubmit={(userData) => {
                    // Handle the form submission (e.g., update the user data)
                    console.log("Updated user data:", userData);
                    updateUser(userData) 
                    setEditDialogOpen(false);
                    setSelectedUser(null);
                    // TODO: Implement the actual update logic here
                }}
                user={selectedUser!} // Pass the selected user
                roles={ROLES}
                departments={DEPARTMENTS}
                active={ACTIVE_OPTIONS}
            />
        </div>
    );
}
