import { Button } from "@/components/ui/button";
import { UserFormDialog } from "@/components/user-management/userFormDialog";
import { UserDataTable } from "@/components/user-management/userManagementTable";
import { createUser } from "@/lib/api";
import { usersQueryOptions } from "@/lib/query";
import { DEPARTMENTS, ROLES } from "@/lib/types";
import type { UserType } from "@/lib/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { UserPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/user-management/users")({
    component: UsersComponent,
});

// Define the input type for the mutation, matching the API function
type CreateUserInput = Omit<
    UserType,
    "id" | "emailVerified" | "createdAt" | "updatedAt"
>;

function UsersComponent() {
    const queryClient = useQueryClient();
    const [isAddUserOpen, setIsAddUserOpen] = useState(false);

    const createUserMutation = useMutation({
        mutationFn: createUser,
        // When mutate is called:
        onMutate: async (newUserData: CreateUserInput) => {
            // Cancel any outgoing refetches for the users list
            await queryClient.cancelQueries({
                queryKey: usersQueryOptions.queryKey,
            });

            // Snapshot the previous value
            const previousUsers = queryClient.getQueryData<UserType[]>(
                usersQueryOptions.queryKey,
            );

            // Optimistically update to the new value (add the user to the list)
            // Note: This is a basic optimistic update. The new user won't have the final ID, createdAt, etc.
            // A placeholder or temporary ID could be used if needed.
            queryClient.setQueryData<UserType[]>(
                usersQueryOptions.queryKey,
                (old = []) => [
                    ...old,
                    {
                        ...newUserData,
                        id: Math.random().toString(), // Temporary ID for optimistic update
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        emailVerified: false, // Assuming default
                    } as UserType, // Cast needed due to temporary ID/dates
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
        onSuccess: () => {
            toast.success("User created successfully");
            setIsAddUserOpen(false); // Close dialog on success
        },
        // Always refetch after error or success:
        onSettled: () => {
            queryClient.invalidateQueries({
                queryKey: usersQueryOptions.queryKey,
            });
        },
    });

    const handleAddUser = (userData: CreateUserInput) => {
        createUserMutation.mutate(userData);
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
                            disabled={createUserMutation.isPending} // Disable button while mutation is pending
                        >
                            <UserPlus className="h-4 w-4" />
                            Add User
                        </Button>
                    </div>
                </header>

                <UserFormDialog
                    isOpen={isAddUserOpen}
                    isLoading={createUserMutation.isPending} // Pass mutation pending state
                    onClose={() => {
                        if (!createUserMutation.isPending) {
                            setIsAddUserOpen(false);
                        }
                    }}
                    onSubmit={handleAddUser}
                    roles={ROLES}
                    departments={DEPARTMENTS}
                />
                <div className="flex-1 overflow-auto p-6">
                    <UserDataTable />
                </div>
            </div>
        </div>
    );
}
