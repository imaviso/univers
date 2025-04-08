import { Button } from "@/components/ui/button";
import { UserFormDialog } from "@/components/user-management/userFormDialog";
import { UserDataTable } from "@/components/user-management/userManagementTable";
import { createUser } from "@/lib/api";
import { usersQueryOptions } from "@/lib/query";
import { ACTIVE, DEPARTMENTS, ROLES } from "@/lib/types";
import type { UserType } from "@/lib/types";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { set } from "date-fns";
import { UserPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
export const Route = createFileRoute("/app/user-management/users")({
    component: UsersComponent,
    loader: async ({ context: { queryClient } }) => {
        queryClient.ensureQueryData(usersQueryOptions);
    },
});

function UsersComponent() {
    const queryClient = useQueryClient();
    const [isAddUserOpen, setIsAddUserOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleAddUser = (
        userData: Omit<
            UserType,
            "id" | "emailVerified" | "createdAt" | "updatedAt"
        >,
    ) => {
        setIsAddUserOpen(false);
        setIsLoading(true);
        createUser(userData)
            .then(() => {
                toast.success("User created successfully");
                queryClient.invalidateQueries(usersQueryOptions);
            })
            .catch((error) => {
                const errorMessage =
                    error instanceof Error
                        ? error.message
                        : "Failed to update user";
                toast.error(errorMessage);
            });
        setIsLoading(false);
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
                        >
                            <UserPlus className="h-4 w-4" />
                            Add User
                        </Button>
                    </div>
                </header>

                <UserFormDialog
                    isOpen={isAddUserOpen}
                    isLoading={isLoading}
                    onClose={() => {
                        setIsAddUserOpen(false);
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
