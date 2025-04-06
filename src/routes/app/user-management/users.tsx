import { Button } from "@/components/ui/button";
import { UserFormDialog } from "@/components/user-management/userFormDialog";
import { UserDataTable } from "@/components/user-management/userManagementTable";
import { usersQueryOptions } from "@/lib/query";
import { DEPARTMENTS, ROLES } from "@/lib/types";
import { createFileRoute } from "@tanstack/react-router";
import { UserPlus } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/user-management/users")({
    component: UsersComponent,
    loader: async ({ context: { queryClient } }) => {
        queryClient.ensureQueryData(usersQueryOptions);
    },
});

function UsersComponent() {
    const [isAddUserOpen, setIsAddUserOpen] = useState(false);
    const [, setUsers] = useState<any[]>([]);

    const handleAddUser = (userData: any) => {
        const newUser = {
            ...userData,
        };
        setUsers([newUser]);
        // Here you can also send the new user data to your backend or perform any other action
        console.log("New User Data:", newUser);
        setIsAddUserOpen(false);
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
                    onClose={() => {
                        setIsAddUserOpen(false);
                    }}
                    onSubmit={handleAddUser}
                    roles={ROLES}
                    departments={DEPARTMENTS}
                    active={[
                        { value: "1", label: "Active" },
                        { value: "0", label: "Inactive" },
                    ]}
                />
                <div className="flex-1 overflow-auto p-6">
                    <UserDataTable />
                </div>
            </div>
        </div>
    );
}
