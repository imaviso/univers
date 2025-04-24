import { Button } from "@/components/ui/button";
import { UserFormDialog } from "@/components/user-management/userFormDialog";
import { UserDataTable } from "@/components/user-management/userManagementTable";
import { createUser } from "@/lib/api";
import { usersQueryOptions } from "@/lib/query";
import type { UserFormInput } from "@/lib/schema";
import { DEPARTMENTS, ROLES } from "@/lib/types";
import type { UserType } from "@/lib/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useRouteContext } from "@tanstack/react-router";
import { UserPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/user-management/users")({
    component: UsersComponent,
});

// Define the input type for the mutation, matching the API function
type CreateUserInputFE = Omit<
    UserType,
    "id" | "emailVerified" | "createdAt" | "updatedAt" | "department"
> & { departmentId: number | null };

function UsersComponent() {
    const context = useRouteContext({ from: "/app/user-management" });
    const queryClient = context.queryClient;
    const [isAddUserOpen, setIsAddUserOpen] = useState(false);

    const createUserMutation = useMutation({
        mutationFn: createUser, // Use the updated API function
        // When mutate is called:
        onMutate: async (newUserData: CreateUserInputFE) => {
            // Cancel any outgoing refetches for the users list
            await queryClient.cancelQueries({
                queryKey: usersQueryOptions.queryKey,
            });

            // Snapshot the previous value
            const previousUsers = queryClient.getQueryData<UserType[]>(
                usersQueryOptions.queryKey,
            );

            // Optimistically update to the new value
            // Find department label for optimistic update
            const deptLabel =
                DEPARTMENTS.find((d) => d.value === newUserData.departmentId)
                    ?.label || "Unknown Dept";
            queryClient.setQueryData<UserType[]>(
                usersQueryOptions.queryKey,
                (old = []) => [
                    ...old,
                    {
                        ...newUserData,
                        id: Math.random().toString(36).substring(2), // Temporary client-side ID
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        emailVerified: false, // Default assumption
                        active: newUserData.active ?? true, // Default assumption
                        department: deptLabel, // Add department string for display
                        password: "****", // Don't store actual password optimistically
                    } as UserType,
                ],
            );

            // Return a context object with the snapshotted value
            return { previousUsers };
        },
        // If the mutation fails, use the context returned from onMutate to roll back
        onError: (err, newUser, context) => {
            if (context?.previousUsers) {
                queryClient.setQueryData(
                    usersQueryOptions.queryKey,
                    context.previousUsers,
                );
            }
            const errorMessage =
                err instanceof Error ? err.message : "Failed to create user";
            toast.error(errorMessage);
        },
        onSuccess: (data) => {
            // Backend returns string message
            toast.success(data || "User created successfully"); // Display backend message
            setIsAddUserOpen(false); // Close dialog on success
        },
        // Always refetch after error or success:
        onSettled: () => {
            queryClient.invalidateQueries({
                queryKey: usersQueryOptions.queryKey,
            });
        },
    });

    // Adjust handleAddUser to match the expected input type CreateUserInputFE
    const handleAddUser = (
        userData: Omit<UserFormInput, "confirmPassword">, // Use UserFormInput from schema
    ) => {
        // Map UserFormInput to CreateUserInputFE
        const departmentId = userData.department
            ? Number.parseInt(userData.department, 10)
            : null;
        if (userData.department && Number.isNaN(departmentId!)) {
            toast.error("Invalid Department ID selected.");
            return;
        }

        const apiPayload: CreateUserInputFE = {
            idNumber: userData.idNumber,
            firstName: userData.firstName,
            lastName: userData.lastName,
            email: userData.email,
            password: userData.password, // Password is required for create
            role: userData.role,
            departmentId: departmentId,
            telephoneNumber: userData.telephoneNumber,
            phoneNumber: userData.phoneNumber || "", // Ensure empty string if optional
            active: userData.active,
        };
        createUserMutation.mutate(apiPayload);
    };

    return (
        <div className="bg-background">
            <div className="flex flex-col flex-1 overflow-hidden">
                <header className="flex items-center justify-between border-b px-6 h-16 py-3.5">
                    <h1 className="text-xl font-semibold">User Management</h1>
                    <div className="flex items-center gap-2">
                        <Button
                            onClick={() => setIsAddUserOpen(true)}
                            size="sm"
                            className="gap-1"
                            disabled={createUserMutation.isPending}
                        >
                            <UserPlus className="h-4 w-4" />
                            Add User
                        </Button>
                    </div>
                </header>

                <UserFormDialog
                    isOpen={isAddUserOpen}
                    isLoading={createUserMutation.isPending}
                    onClose={() => {
                        if (!createUserMutation.isPending) {
                            setIsAddUserOpen(false);
                        }
                    }}
                    onSubmit={handleAddUser}
                    roles={ROLES}
                    departments={DEPARTMENTS.map((d) => ({
                        value: String(d.value),
                        label: d.label,
                    }))}
                />
                <div className="flex-1 overflow-auto p-6">
                    <UserDataTable />
                </div>
            </div>
        </div>
    );
}
