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
import {
    ArrowUpDown,
    BuildingIcon,
    CalendarIcon,
    CheckCircleIcon,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    FingerprintIcon,
    ListFilterIcon,
    MoreHorizontal,
    PhoneIcon,
    UserCheck,
    UserIcon,
    UserX,
    UsersIcon,
    VerifiedIcon,
    XCircleIcon,
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

import { DataTableFilter } from "@/components/data-table-filter";
import { activateUser, deactivateUser, updateUser } from "@/lib/api";
import {
    deleteDialogAtom,
    editDialogAtom,
    selectedUserAtom,
} from "@/lib/atoms";
import { defineMeta } from "@/lib/filters";
import { filterFn } from "@/lib/filters";
import { departmentsQueryOptions, usersQueryOptions } from "@/lib/query";
import type { EditUserFormInput } from "@/lib/schema";
import { ROLES, type UserDTO, type UserRole } from "@/lib/types";
import { getBadgeVariant } from "@/lib/utils";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";
import { useAtom } from "jotai";
import { toast } from "sonner";
import { ActivateConfirmDialog } from "./activateConfirmDialog";
import { DeleteConfirmDialog } from "./deleteConfirmDialog";
import { EditUserFormDialog } from "./editUserFormDialog";

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
    // Fetch actual departments data
    const { data: departmentsData } = useSuspenseQuery(departmentsQueryOptions);

    const departmentMap = React.useMemo(() => {
        const map = new Map<string, string>();
        for (const dept of departmentsData ?? []) {
            map.set(dept.publicId, dept.name);
        }
        return map;
    }, [departmentsData]);

    const usersWithDeptNames = React.useMemo(() => {
        return (initialUsers ?? []).map((user: UserDTO) => ({
            ...user,
            departmentName:
                departmentMap.get(user.department?.publicId ?? "") ??
                "Unknown Dept",
        }));
    }, [initialUsers, departmentMap]);

    // --- Mutations ---
    const updateUserMutation = useMutation({
        mutationFn: ({
            userId,
            payload,
            imageFile,
        }: {
            userId: string;
            payload: EditUserFormInput;
            imageFile?: File | null;
        }) => updateUser({ userId, userData: payload, imageFile }),
        onMutate: async ({ userId, payload }) => {
            await queryClient.cancelQueries({
                queryKey: usersQueryOptions.queryKey,
            });
            const previousUsers = queryClient.getQueryData<UserDTO[]>(
                usersQueryOptions.queryKey,
            );

            queryClient.setQueryData<UserDTO[]>(
                usersQueryOptions.queryKey,
                (old = []) =>
                    old.map((user) => {
                        if (user.publicId !== userId) return user;

                        const updatedUser: UserDTO = {
                            ...user,
                            // Apply basic payload fields directly
                            ...(payload.firstName && {
                                firstName: payload.firstName,
                            }),
                            ...(payload.lastName && {
                                lastName: payload.lastName,
                            }),
                            ...(payload.idNumber && {
                                idNumber: payload.idNumber,
                            }),
                            ...(payload.phoneNumber && {
                                phoneNumber: payload.phoneNumber,
                            }),
                            ...(payload.telephoneNumber && {
                                telephoneNumber: payload.telephoneNumber,
                            }),
                            role:
                                payload.role !== undefined
                                    ? (payload.role as UserRole)
                                    : user.role,
                            email: user.email,
                            password: user.password,
                            emailVerified: user.emailVerified,
                            active: user.active,
                            createdAt: user.createdAt,
                            profileImagePath: user.profileImagePath,
                            // Update updatedAt timestamp
                            updatedAt: new Date().toISOString(),
                        };
                        return updatedUser;
                    }),
            );
            return { previousUsers };
        },
        onError: (err, _variables, context) => {
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
        onSuccess: () => {
            toast.success("User updated successfully");
            setEditDialogOpen(false);
            setSelectedUser(null);
        },
        onSettled: () => {
            queryClient.invalidateQueries({
                queryKey: usersQueryOptions.queryKey,
            });
            // Also invalidate departments if the update could affect department heads shown elsewhere
            // queryClient.invalidateQueries({ queryKey: departmentsQueryOptions.queryKey });
        },
    });

    const deactivateUserMutation = useMutation({
        mutationFn: deactivateUser,
        onMutate: async (userId: string) => {
            await queryClient.cancelQueries({
                queryKey: usersQueryOptions.queryKey,
            });
            const previousUsers = queryClient.getQueryData<UserDTO[]>(
                usersQueryOptions.queryKey,
            );
            queryClient.setQueryData<UserDTO[]>(
                usersQueryOptions.queryKey,
                (old = []) =>
                    old.map((user) =>
                        user.publicId === userId
                            ? {
                                  ...user,
                                  active: false,
                                  updatedAt: new Date().toISOString(),
                              }
                            : user,
                    ),
            );
            return { previousUsers };
        },
        onError: (err, _userId, context) => {
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
        onSuccess: () => {
            toast.success("User deactivated successfully");
            setDeleteDialogOpen(false);
            setSelectedUser(null);
        },
        onSettled: () => {
            queryClient.invalidateQueries({
                queryKey: usersQueryOptions.queryKey,
            });
        },
    });

    const activateUserMutation = useMutation({
        mutationFn: activateUser,
        onMutate: async (userId: string) => {
            await queryClient.cancelQueries({
                queryKey: usersQueryOptions.queryKey,
            });
            const previousUsers = queryClient.getQueryData<UserDTO[]>(
                usersQueryOptions.queryKey,
            );
            queryClient.setQueryData<UserDTO[]>(
                usersQueryOptions.queryKey,
                (old = []) =>
                    old.map((user) =>
                        user.publicId === userId
                            ? {
                                  ...user,
                                  active: true,
                                  updatedAt: new Date().toISOString(),
                              }
                            : user,
                    ),
            );
            return { previousUsers };
        },
        onError: (err, _userId, context) => {
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
        onSuccess: () => {
            toast.success("User activated successfully");
            setActivateDialogOpen(false);
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
    // onSubmit for EditUserFormDialog
    const handleEditUserSubmit = (payload: EditUserFormInput) => {
        if (!selectedUser) return;
        // Note: The payload from EditUserFormDialog already contains departmentId (number | null)
        // and other fields matching UpdateUserInputFE.
        // If image upload is needed from the edit dialog, it needs to be handled here too.
        updateUserMutation.mutate({
            userId: selectedUser.publicId,
            payload: payload,
            // imageFile: /* pass image file if collected from dialog */,
        });
    };

    const handleDeactivateUser = () => {
        if (selectedUser) {
            deactivateUserMutation.mutate(selectedUser.publicId);
        }
    };

    const handleActivateUser = () => {
        if (selectedUser) {
            activateUserMutation.mutate(selectedUser.publicId);
        }
    };

    // --- Filter Options ---
    const ACTIVE_OPTIONS = React.useMemo(() => {
        const users = initialUsers || [];
        const uniqueActiveStates = Array.from(
            new Set(users.map((u: UserDTO) => u.active)),
        ) as boolean[];
        return uniqueActiveStates.map((isActive) => ({
            value: String(isActive),
            label: isActive ? "Active" : "Inactive",
            icon: isActive ? CheckCircleIcon : XCircleIcon,
        }));
    }, [initialUsers]);

    const VERIFIED_OPTIONS = React.useMemo(() => {
        const users = initialUsers || [];
        const uniqueVerifiedStates = Array.from(
            new Set(users.map((u: UserDTO) => u.emailVerified)),
        ) as boolean[];
        return uniqueVerifiedStates.map((isVerified) => ({
            value: String(isVerified),
            label: isVerified ? "Verified" : "Not Verified",
            icon: isVerified ? VerifiedIcon : XCircleIcon,
        }));
    }, [initialUsers]);

    const ROLE_OPTIONS = React.useMemo(
        () =>
            ROLES.map((role) => ({
                value: role.value,
                label: role.label,
            })),
        [],
    );

    // Derive DEPARTMENT_OPTIONS from fetched departmentsData
    const DEPARTMENT_OPTIONS = React.useMemo(
        () =>
            (departmentsData ?? []).map((dept) => ({
                value: dept.name,
                label: dept.name,
                icon: BuildingIcon,
            })),
        [departmentsData],
    );

    // --- Define the columns with filter metadata ---
    const columns = React.useMemo<ColumnDef<UserDTO>[]>(
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
            // ... User column ...
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
                                {user.profileImagePath && (
                                    <AvatarImage
                                        src={user.profileImagePath}
                                        alt={fullName}
                                    />
                                )}
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
                    (row: UserDTO) => `${row.firstName} ${row.lastName}`,
                    {
                        displayName: "User Name",
                        type: "text",
                        icon: UserIcon,
                    },
                ) as ColumnMeta<UserDTO, unknown>,
            },
            // ... ID Number column ...
            {
                accessorKey: "idNumber",
                header: "ID Number",
                cell: ({ row }) => <div>{row.getValue("idNumber")}</div>,
                filterFn: filterFn("text"),
                meta: defineMeta((row: UserDTO) => row.idNumber, {
                    displayName: "ID Number",
                    type: "text",
                    icon: FingerprintIcon, // Changed icon
                }) as ColumnMeta<UserDTO, unknown>,
            },
            {
                id: "publicId",
                header: "Public ID",
                cell: ({ row }) => <div>{row.original.publicId}</div>,
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

                    return (
                        <Badge
                            className={`font-medium capitalize px-2 py-0.5 ${getBadgeVariant(roleValue)}`}
                            variant="outline" // Base variant, colors applied via className
                        >
                            {roleInfo ? roleInfo.label : roleValue}
                        </Badge>
                    );
                },
                filterFn: filterFn("option"),
                meta: defineMeta((row: UserDTO) => row.role, {
                    displayName: "Role",
                    type: "option",
                    icon: UsersIcon,
                    options: ROLE_OPTIONS,
                }) as ColumnMeta<UserDTO, unknown>,
            },
            // ... Phone Number column ...
            {
                accessorKey: "telephoneNumber",
                header: ({ column }) => (
                    <Button
                        variant="ghost"
                        onClick={() =>
                            column.toggleSorting(column.getIsSorted() === "asc")
                        }
                    >
                        Telephone
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                ),
                cell: ({ row }) => {
                    const telephoneNumber = row.original.telephoneNumber;
                    return <div>{telephoneNumber || "-"}</div>;
                },
                filterFn: filterFn("text"),
                meta: defineMeta((row: UserDTO) => row.telephoneNumber, {
                    displayName: "Telephone Number",
                    type: "text",
                    icon: PhoneIcon,
                }) as ColumnMeta<UserDTO, unknown>,
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
                filterFn: filterFn("text"),
                meta: defineMeta((row: UserDTO) => row.phoneNumber, {
                    displayName: "Phone Number",
                    type: "text",
                    icon: PhoneIcon,
                }) as ColumnMeta<UserDTO, unknown>,
            },
            // --- Department column ---
            {
                accessorKey: "departmentName",
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
                cell: ({ row }) => (
                    <div>{row.getValue("departmentName") || "-"}</div>
                ),
                filterFn: filterFn("option"),
                meta: defineMeta(
                    (row: UserDTO) => String(row.department?.publicId ?? ""),
                    {
                        displayName: "Department",
                        type: "option",
                        icon: BuildingIcon,
                        options: DEPARTMENT_OPTIONS,
                    },
                ) as ColumnMeta<UserDTO, unknown>,
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
                            className={`capitalize ${emailVerified ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}
                        >
                            {emailVerified ? "Verified" : "Not Verified"}
                        </Badge>
                    );
                },
                filterFn: filterFn("option"),
                meta: defineMeta((row: UserDTO) => String(row.emailVerified), {
                    displayName: "Verified",
                    type: "option",
                    icon: VerifiedIcon,
                    options: VERIFIED_OPTIONS,
                }) as ColumnMeta<UserDTO, unknown>,
            },
            // ... Active column ...
            {
                accessorKey: "active",
                header: "Status",
                cell: ({ row }) => {
                    const isActive = row.original.active;
                    return (
                        <Badge
                            variant={isActive ? "default" : "destructive"}
                            className={`capitalize ${isActive ? "bg-green-100 text-green-800" : "bg-destructive text-destructive-foreground"}`}
                        >
                            {isActive ? "Active" : "Inactive"}
                        </Badge>
                    );
                },
                filterFn: filterFn("option"),
                meta: defineMeta((row: UserDTO) => String(row.active), {
                    displayName: "Status",
                    type: "option",
                    icon: ListFilterIcon,
                    options: ACTIVE_OPTIONS,
                }) as ColumnMeta<UserDTO, unknown>,
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
                            hour12: true,
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
                    (row: UserDTO) => {
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
                ) as ColumnMeta<UserDTO, unknown>,
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
                    // Use the state setter directly, not from atom
                    // const [, setActivateDialogOpen] = useAtom(activateDialogAtom); // Remove if using local state

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
                                        setSelectedUser(user);
                                        setEditDialogOpen(true);
                                    }}
                                >
                                    <UserIcon className="mr-2 h-4 w-4" /> Edit
                                    User
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {user.active ? (
                                    <DropdownMenuItem
                                        className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                        onClick={() => {
                                            setSelectedUser(user);
                                            setDeleteDialogOpen(true);
                                        }}
                                        disabled={
                                            deactivateUserMutation.isPending
                                        }
                                    >
                                        <UserX className="mr-2 h-4 w-4" />{" "}
                                        Deactivate User
                                    </DropdownMenuItem>
                                ) : (
                                    <DropdownMenuItem
                                        className="text-green-600 focus:text-green-700 focus:bg-green-100"
                                        onClick={() => {
                                            setSelectedUser(user);
                                            setActivateDialogOpen(true); // Use local state setter
                                        }}
                                        disabled={
                                            activateUserMutation.isPending
                                        }
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
            DEPARTMENT_OPTIONS, // Use derived options
            ACTIVE_OPTIONS,
            VERIFIED_OPTIONS,
            deactivateUserMutation.isPending,
            activateUserMutation.isPending,
        ],
    );

    const table = useReactTable({
        data: usersWithDeptNames || [],
        columns,
        state: {
            sorting,
            columnVisibility,
            rowSelection,
            columnFilters,
        },
        onColumnFiltersChange: setColumnFilters,
        getFilteredRowModel: getFilteredRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
        onSortingChange: setSorting,
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
    });

    return (
        <div className="w-full space-y-4">
            {/* ... Filter/Column Toggle UI ... */}
            <div className="flex items-center justify-between">
                {" "}
                {/* Changed justify-end to justify-between */}
                {/* Filter Component */}
                <DataTableFilter table={table} />
                {/* Right-aligned Buttons */}
                <div className="flex items-center space-x-2">
                    {Object.keys(table.getState().rowSelection).length > 0 && (
                        <Button
                            variant="destructive"
                            size="sm" // Use size prop
                            className="h-8" // Keep height consistent if needed
                            onClick={() => {
                                const selectedUsers = table
                                    .getSelectedRowModel()
                                    .rows.map((row) => row.original);
                                console.log("Deleting users:", selectedUsers);
                                // TODO: Implement bulk delete mutation
                                // bulkDeleteMutation.mutate(selectedUsers.map(u => u.id));
                                toast.warning(
                                    "Bulk delete not yet implemented.",
                                );
                            }}
                        >
                            Delete (
                            {Object.keys(table.getState().rowSelection).length})
                        </Button>
                    )}
                    {/* Column Visibility Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="h-8">
                                {" "}
                                {/* Consistent height */}
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
            </div>
            {/* --- Table Rendering --- */}
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
                                        }} // Apply width if not default
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
                                        row.getIsSelected()
                                            ? "selected"
                                            : undefined
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
                                    colSpan={columns.length} // Use columns length
                                    className="h-24 text-center"
                                >
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            {/* --- Pagination --- */}
            <div className="flex items-center justify-between">
                {/* Row Selection Count */}
                <div className="flex-1 text-sm text-muted-foreground">
                    {table.getFilteredSelectedRowModel().rows.length} of{" "}
                    {table.getFilteredRowModel().rows.length} row(s) selected.
                </div>

                {/* Pagination Controls */}
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
            {/* --- Dialogs --- */}
            {selectedUser && (
                <EditUserFormDialog
                    isOpen={editDialogOpen}
                    onClose={() => {
                        setEditDialogOpen(false);
                        setSelectedUser(null);
                    }}
                    isLoading={updateUserMutation.isPending}
                    onSubmit={handleEditUserSubmit}
                    user={selectedUser}
                    roles={ROLES}
                    departments={departmentsData}
                />
            )}

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
