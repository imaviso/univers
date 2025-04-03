import { Button } from "@/components/ui/button";
import { UserDataTable } from "@/components/user-management/userManagementTable";
import { createFileRoute } from "@tanstack/react-router";
import { UserPlus } from "lucide-react";

export const Route = createFileRoute("/app/user-management/users")({
    component: UsersComponent,
});

function UsersComponent() {
    return (
        <div className="bg-background">
            <div className="flex flex-col flex-1 overflow-hidden">
                <header className="flex items-center justify-between border-b px-6 h-16 py-3.5">
                    <h1 className="text-xl font-semibold">User Management</h1>
                    <div className="flex items-center gap-2">
                        <Button size="sm" className="gap-1">
                            <UserPlus className="h-4 w-4" />
                            Add User
                        </Button>
                    </div>
                </header>

                {/* <div className="flex items-center justify-between border-b px-6 py-2"> */}
                {/*     what */}
                {/* </div> */}

                <div className="flex-1 overflow-auto p-6">
                    <UserDataTable />
                </div>
            </div>
        </div>
    );
}
