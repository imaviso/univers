import {
    type ColumnDef,
    type ColumnFiltersState,
    type ColumnMeta,
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
    FingerprintIcon,
    IdCardIcon, // Icon for ID Number
    ListFilterIcon, // Generic Filter Icon or for Status
    MoreHorizontal,
    PhoneIcon,
    UserCheck,
    UserIcon, // Icon for User Name
    UserX,
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
import { activateUser, deactivateUser, updateUser } from "@/lib/api";
import {
    deleteDialogAtom,
    editDialogAtom,
    selectedUserAtom,
} from "@/lib/atoms";
import { defineMeta } from "@/lib/filters";
import { filterFn } from "@/lib/filters";
import { usersQueryOptions } from "@/lib/query";
import type { UserFormInput } from "@/lib/schema";
import { DEPARTMENTS, ROLES, type UserType } from "@/lib/types";
import {
    useMutation,
    useQueryClient,
    useSuspenseQuery,
} from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";
import { useAtom } from "jotai";
import { toast } from "sonner";
import { ActivateConfirmDialog } from "./activateConfirmDialog";
import { DeleteConfirmDialog } from "./deleteConfirmDialog";
import { EditUserFormDialog } from "./editUserFormDialog";
// --- End Import ---

// The main DataTable component
export function UserDataTable() {
    const context = useRouteContext({ from: "/app/user-management" });
    const queryClient = context.queryClient;
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnFilters, setColumnFilters] =
        React.useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] =
        React.useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = React.useState({});
    const [editDialogOpen, setEditDialogOpen] = useAtom(editDialogAtom);
    const [deleteDialogOpen, setDeleteDialogOpen] = useAtom(deleteDialogAtom);
    const [selectedUser, setSelectedUser] = useAtom(selectedUserAtom);
    const [activateDialogOpen, setActivateDialogOpen] = React.useState(false);

    const { data: initialUsers } = useSuspenseQuery(usersQueryOptions);

    // --- Mutations ---
    const updateUserMutation = useMutation({
        // Pass userId and payload to mutationFn
        mutationFn: ({
            userId,
            payload,
        }: {
            userId: string;
            payload: Partial<Omit<UserFormInput, "confirmPassword">>;
        }) => updateUser(userId, payload),
        onMutate: async ({ userId, payload }) => {
            // Destructure args
            await queryClient.cancelQueries({
                queryKey: usersQueryOptions.queryKey,
            });
            const previousUsers = queryClient.getQueryData<UserType[]>(
                usersQueryOptions.queryKey,
            );

            // Find department label for optimistic update
            const deptLabel = payload.department
                ? DEPARTMENTS.find(
                      (d) => String(d.value) === payload.department,
                  )?.label || "Unknown Dept"
                : undefined;

            queryClient.setQueryData<UserType[]>(
                usersQueryOptions.queryKey,
                (old = []) =>
                    old.map((user) =>
                        user.id === userId // Use userId from args
                            ? {
                                  ...user,
                                  ...payload, // Apply payload changes
                                  departmentId: payload.department
                                      ? Number.parseInt(payload.department, 10)
                                      : user.departmentId, // Update ID
                                  department: deptLabel ?? user.department, // Update label
                                  password: user.password, // Keep existing password hash/undefined in optimistic update
                                  updatedAt: new Date().toISOString(),
                              }
                            : user,
                    ),
            );
            return { previousUsers };
        },
        onError: (err, variables, context) => {
            // variables includes userId and payload
            if (context?.previousUsers) {
                queryClient.setQueryData(
                    usersQueryOptions.queryKey,
                    context.previousUsers,
                );
            }
            const errorMessage =
                err instanceof Error ? err.message : "Failed to update user";
            toast.error(errorMessage);
        },
        onSuccess: (data) => {
            // Backend returns string message
            toast.success(data || "User updated successfully");
            setEditDialogOpen(false);
            setSelectedUser(null);
        },
        onSettled: () => {
            queryClient.invalidateQueries({
                queryKey: usersQueryOptions.queryKey,
            });
        },
    });

    const deactivateUserMutation = useMutation({
        mutationFn: deactivateUser, // API function expects userId string
        onMutate: async (userId: string) => {
            // Expect userId string
            await queryClient.cancelQueries({
                queryKey: usersQueryOptions.queryKey,
            });
            const previousUsers = queryClient.getQueryData<UserType[]>(
                usersQueryOptions.queryKey,
            );
            queryClient.setQueryData<UserType[]>(
                usersQueryOptions.queryKey,
                (old = []) =>
                    old.map((user) =>
                        user.id === userId // Match by ID
                            ? { ...user, active: false } // Optimistically set active to false
                            : user,
                    ),
            );
            return { previousUsers };
        },
        onError: (err, userId, context) => {
            if (context?.previousUsers) {
                queryClient.setQueryData(
                    usersQueryOptions.queryKey,
                    context.previousUsers,
                );
            }
            const errorMessage =
                err instanceof Error
                    ? err.message
                    : "Failed to deactivate user";
            toast.error(errorMessage);
        },
        onSuccess: (data) => {
            // Backend returns string message
            toast.success(data || "User deactivated successfully");
            setDeleteDialogOpen(false); // Close the correct dialog
            setSelectedUser(null);
        },
        onSettled: () => {
            queryClient.invalidateQueries({
                queryKey: usersQueryOptions.queryKey,
            });
        },
    });

    // Add activateUserMutation
    const activateUserMutation = useMutation({
        mutationFn: activateUser, // API function expects userId string
        onMutate: async (userId: string) => {
            // Expect userId string
            await queryClient.cancelQueries({
                queryKey: usersQueryOptions.queryKey,
            });
            const previousUsers = queryClient.getQueryData<UserType[]>(
                usersQueryOptions.queryKey,
            );
            queryClient.setQueryData<UserType[]>(
                usersQueryOptions.queryKey,
                (old = []) =>
                    old.map((user) =>
                        user.id === userId // Match by ID
                            ? { ...user, active: true } // Optimistically set active to true
                            : user,
                    ),
            );
            return { previousUsers };
        },
        onError: (err, userId, context) => {
            if (context?.previousUsers) {
                queryClient.setQueryData(
                    usersQueryOptions.queryKey,
                    context.previousUsers,
                );
            }
            const errorMessage =
                err instanceof Error ? err.message : "Failed to activate user";
            toast.error(errorMessage);
        },
        onSuccess: (data) => {
            // Backend returns string message
            toast.success(data || "User activated successfully");
            setActivateDialogOpen(false); // Close the activate dialog if used
            setSelectedUser(null);
        },
        onSettled: () => {
            queryClient.invalidateQueries({
                queryKey: usersQueryOptions.queryKey,
            });
        },
    });

    // --- End Mutations ---

    // --- Event Handlers ---
    const handleEditUser = (
        userData: Partial<Omit<UserFormInput, "confirmPassword">>,
    ) => {
        if (!selectedUser) return;

        // Map department string ID back to number if present
        const departmentId = userData.department
            ? Number.parseInt(userData.department, 10)
            : undefined;
        if (userData.department && Number.isNaN(departmentId!)) {
            toast.error("Invalid Department ID selected for update.");
            return;
        }

        // Prepare payload for the API (UpdateUserInputFE)
        const apiPayload: Partial<
            Omit<
                UserType,
                | "id"
                | "createdAt"
                | "updatedAt"
                | "emailVerified"
                | "department"
            >
        > & { departmentId?: number | null } = {};

        if (userData.firstName !== undefined)
            apiPayload.firstName = userData.firstName;
        if (userData.lastName !== undefined)
            apiPayload.lastName = userData.lastName;
        if (userData.idNumber !== undefined)
            apiPayload.idNumber = userData.idNumber;
        if (userData.role !== undefined) apiPayload.role = userData.role;
        if (departmentId !== undefined) apiPayload.departmentId = departmentId; // Use numeric ID
        if (userData.telephoneNumber !== undefined)
            apiPayload.telephoneNumber = userData.telephoneNumber;
        if (userData.phoneNumber !== undefined)
            apiPayload.phoneNumber = userData.phoneNumber || "";
        if (userData.active !== undefined) apiPayload.active = userData.active;
        if (userData.password) apiPayload.password = userData.password; // Include password only if provided

        updateUserMutation.mutate({
            userId: selectedUser.id,
            payload: apiPayload,
        });
    };

    const handleDeactivateUser = () => {
        if (selectedUser) {
            deactivateUserMutation.mutate(selectedUser.id); // Pass only the ID
        }
    };

    // Add handler for activation
    const handleActivateUser = () => {
        if (selectedUser) {
            activateUserMutation.mutate(selectedUser.id); // Pass only the ID
        }
    };
    const ACTIVE_OPTIONS = React.useMemo(() => {
        const users = initialUsers || [];
        const uniqueActiveStates = Array.from(
            new Set(users.map((u: UserType) => u.active)),
        ) as boolean[];
        return uniqueActiveStates.map((isActive) => ({
            value: String(isActive),
            label: isActive ? "Active" : "Inactive", // Use more descriptive labels
            icon: isActive ? CheckCircleIcon : XCircleIcon,
        }));
    }, [initialUsers]);

    const VERIFIED_OPTIONS = React.useMemo(() => {
        const users = initialUsers || [];
        const uniqueVerifiedStates = Array.from(
            new Set(users.map((u: UserType) => u.emailVerified)),
        ) as boolean[];
        return uniqueVerifiedStates.map((isVerified) => ({
            value: String(isVerified),
            label: isVerified ? "Verified" : "Not Verified", // Descriptive labels
            icon: isVerified ? VerifiedIcon : XCircleIcon, // Use VerifiedIcon
        }));
    }, [initialUsers]);

    const ROLE_OPTIONS = React.useMemo(
        () =>
            ROLES.map((role) => ({
                // Use predefined ROLES for consistency
                value: role.value,
                label: role.label,
                // Add icon if desired
            })),
        [], // ROLES is constant
    );

    const DEPARTMENT_OPTIONS = React.useMemo(
        () =>
            DEPARTMENTS.map((dept) => ({
                // Use predefined DEPARTMENTS
                value: String(dept.value), // Use string ID for filter value
                label: dept.label,
                icon: BuildingIcon,
            })),
        [], // DEPARTMENTS is constant
    );

    // --- Define the columns with filter metadata ---
    const columns = React.useMemo<ColumnDef<UserType>[]>(
        () => [
            // ... Select column ...
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
            // ... User column (Name, Email, Avatar) ...
            {
                accessorFn: (row) => `${row.firstName} ${row.lastName}`,
                id: "name",
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
                meta: defineMeta(
                    (row: UserType) => `${row.firstName} ${row.lastName}`,
                    {
                        displayName: "User Name",
                        type: "text",
                        icon: UserIcon,
                    },
                ) as ColumnMeta<UserType, unknown>,
            },
            // ... ID Number column ...
            {
                accessorKey: "idNumber",
                header: "ID Number",
                cell: ({ row }) => <div>{row.getValue("idNumber")}</div>,
                filterFn: filterFn("text"),
                meta: defineMeta((row: UserType) => row.idNumber, {
                    displayName: "ID Number",
                    type: "text",
                    icon: FingerprintIcon,
                }) as ColumnMeta<UserType, unknown>,
            },
            // ... Role column ...
            {
                accessorKey: "role",
                header: ({ column }) => (
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
                cell: ({ row }) => {
                    const roleValue = row.getValue("role") as string;
                    const roleInfo = ROLES.find(
                        (role) => role.value === roleValue,
                    );
                    const getBadgeVariant = (role: string) => {
                        /* ...badge logic... */ return "";
                    }; // Keep your badge logic

                    return (
                        <Badge
                            className={`font-medium capitalize px-2 py-0.5 ${getBadgeVariant(roleValue)}`}
                            variant="outline"
                        >
                            {roleInfo ? roleInfo.label : roleValue}
                        </Badge>
                    );
                },
                filterFn: filterFn("option"),
                meta: defineMeta((row: UserType) => row.role, {
                    displayName: "Role",
                    type: "option",
                    icon: UsersIcon,
                    options: ROLE_OPTIONS, // Use updated ROLE_OPTIONS
                }) as ColumnMeta<UserType, unknown>,
            },
            // ... Phone Number column ...
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
                filterFn: filterFn("text"),
                meta: defineMeta((row: UserType) => row.phoneNumber, {
                    displayName: "Phone Number",
                    type: "text",
                    icon: PhoneIcon,
                }) as ColumnMeta<UserType, unknown>,
            },
            // ... Department column ...
            {
                accessorKey: "department", // Display the department string name
                header: ({ column }) => (
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
                // Filter using departmentId (represented as string in options)
                filterFn: filterFn("option"),
                meta: defineMeta((row: UserType) => String(row.departmentId), {
                    // Filter by string ID
                    displayName: "Department",
                    type: "option",
                    icon: BuildingIcon,
                    options: DEPARTMENT_OPTIONS, // Use updated DEPARTMENT_OPTIONS
                }) as ColumnMeta<UserType, unknown>,
            },
            // ... Verified column ...
            {
                accessorKey: "emailVerified",
                header: "Verified",
                cell: ({ row }) => {
                    const emailVerified = row.original.emailVerified;
                    return (
                        <Badge
                            variant={emailVerified ? "default" : "outline"}
                            className={`capitalize ${emailVerified ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`} // Example styling
                        >
                            {emailVerified ? "Verified" : "Not Verified"}
                        </Badge>
                    );
                },
                filterFn: filterFn("option"),
                meta: defineMeta((row: UserType) => String(row.emailVerified), {
                    displayName: "Verified",
                    type: "option",
                    icon: VerifiedIcon,
                    options: VERIFIED_OPTIONS, // Use updated options
                }) as ColumnMeta<UserType, unknown>,
            },
            // ... Active column ...
            {
                accessorKey: "active",
                header: "Status", // Rename header for clarity
                cell: ({ row }) => {
                    const isActive = row.original.active;
                    return (
                        <Badge
                            variant={isActive ? "default" : "destructive"} // Use destructive for inactive
                            className={`capitalize ${isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`} // Example styling
                        >
                            {isActive ? "Active" : "Inactive"}
                        </Badge>
                    );
                },
                filterFn: filterFn("option"),
                meta: defineMeta((row: UserType) => String(row.active), {
                    displayName: "Status", // Match header
                    type: "option",
                    icon: ListFilterIcon,
                    options: ACTIVE_OPTIONS, // Use updated options
                }) as ColumnMeta<UserType, unknown>,
            },
            // ... Created At column ...
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
                            Created At <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                ),
                cell: ({ row }) => {
                    const dateValue = row.getValue("createdAt");
                    try {
                        const date = new Date(dateValue as string);
                        if (Number.isNaN(date.getTime())) {
                            throw new Error("Invalid Date");
                        }
                        const formatted = new Intl.DateTimeFormat("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true, // Use AM/PM
                        }).format(date);
                        return (
                            <div className="text-right font-medium">
                                {formatted}
                            </div>
                        );
                    } catch (error) {
                        return (
                            <div className="text-right text-muted-foreground">
                                Invalid Date
                            </div>
                        );
                    }
                },
                filterFn: filterFn("date"),
                meta: defineMeta(
                    (row: UserType) => {
                        try {
                            const date = new Date(row.createdAt);
                            return Number.isNaN(date.getTime())
                                ? undefined
                                : date;
                        } catch (e) {
                            return undefined;
                        }
                    },
                    {
                        displayName: "Created At",
                        type: "date",
                        icon: CalendarIcon,
                    },
                ) as ColumnMeta<UserType, unknown>,
            },
            // --- Actions column ---
            {
                id: "actions",
                cell: ({ row }) => {
                    const user = row.original;
                    // Get setters from useAtom
                    const [, setEditDialogOpen] = useAtom(editDialogAtom);
                    const [, setSelectedUser] = useAtom(selectedUserAtom);
                    const [, setDeleteDialogOpen] = useAtom(deleteDialogAtom);
                    // Add setter for activate dialog if using separate one
                    // const [, setActivateDialogOpen] = useAtom(activateDialogAtom);

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
                                        setSelectedUser(user); // Set user first
                                        setEditDialogOpen(true); // Then open dialog
                                    }}
                                >
                                    <UserIcon className="mr-2 h-4 w-4" /> Edit
                                    User
                                </DropdownMenuItem>
                                {/* Add View Details if needed */}
                                {/* <DropdownMenuItem onClick={() => console.log(`Viewing details for: ${user.id}`)}>
                                    View Details
                                </DropdownMenuItem> */}
                                <DropdownMenuSeparator />
                                {user.active ? (
                                    <DropdownMenuItem
                                        className="text-destructive"
                                        onClick={() => {
                                            setSelectedUser(user);
                                            setDeleteDialogOpen(true);
                                        }}
                                        disabled={
                                            deactivateUserMutation.isPending
                                        } // Disable while mutation runs
                                    >
                                        <UserX className="mr-2 h-4 w-4" />{" "}
                                        Deactivate User
                                    </DropdownMenuItem>
                                ) : (
                                    <DropdownMenuItem
                                        className="text-green-600" // Style for activate
                                        onClick={() => {
                                            setSelectedUser(user);
                                            setActivateDialogOpen(true);
                                        }}
                                        disabled={
                                            activateUserMutation.isPending
                                        } // Disable while mutation runs
                                    >
                                        <UserCheck className="mr-2 h-4 w-4" />{" "}
                                        Activate User
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    );
                },
                enableHiding: false,
            },
        ],
        [
            ROLE_OPTIONS,
            DEPARTMENT_OPTIONS,
            ACTIVE_OPTIONS,
            VERIFIED_OPTIONS,
            deactivateUserMutation.isPending,
            activateUserMutation.isPending,
        ], // Add mutation pending states to dependencies
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
            <div className="flex items-center justify-end">
                <DataTableFilter table={table} />
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
            {selectedUser && (
                <EditUserFormDialog
                    isOpen={editDialogOpen}
                    onClose={() => {
                        setEditDialogOpen(false);
                        setSelectedUser(null);
                    }}
                    isLoading={updateUserMutation.isPending}
                    onSubmit={handleEditUser}
                    user={selectedUser} // Pass selectedUser which matches EditUser type
                    roles={ROLES}
                    // Map department IDs back to strings for the dialog's Select
                    departments={DEPARTMENTS.map((d) => ({
                        value: String(d.value),
                        label: d.label,
                    }))}
                />
            )}

            {/* Deactivate Dialog */}
            {selectedUser && (
                <DeleteConfirmDialog
                    isOpen={deleteDialogOpen}
                    onClose={() => {
                        setDeleteDialogOpen(false);
                        setSelectedUser(null);
                    }}
                    title="Deactivate User"
                    description={`Are you sure you want to deactivate user ${selectedUser.firstName} ${selectedUser.lastName}? This action will mark the user as inactive.`}
                    onConfirm={handleDeactivateUser}
                    isLoading={deactivateUserMutation.isPending}
                />
            )}

            {selectedUser && (
                <ActivateConfirmDialog
                    isOpen={activateDialogOpen}
                    onClose={() => {
                        setActivateDialogOpen(false);
                        setSelectedUser(null);
                    }}
                    title="Activate User"
                    description={`Are you sure you want to activate user ${selectedUser.firstName} ${selectedUser.lastName}?`}
                    onConfirm={handleActivateUser}
                    isLoading={activateUserMutation.isPending}
                />
            )}
        </div>
    );
}
