import { AddDepartmentFormDialog } from "@/components/department/addDepartmentFormDialog";
import { DepartmentDataTable } from "@/components/department/departmentManagementTable";
import { Button } from "@/components/ui/button";
import { addDepartmentDialogAtom } from "@/lib/atoms";
import { useSetAtom } from "jotai";
import { Building } from "lucide-react";

import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app/departments/dashboard")({
    component: DepartmentsComponent,
});

function DepartmentsComponent() {
    const setAddDepartmentOpen = useSetAtom(addDepartmentDialogAtom);

    return (
        <div className="bg-background">
            <div className="flex flex-col flex-1 overflow-hidden">
                <header className="flex items-center justify-between border-b px-6 h-[65px]">
                    <h1 className="text-xl font-semibold">
                        Department Management
                    </h1>
                    <div className="flex items-center gap-2">
                        <Button
                            onClick={() => setAddDepartmentOpen(true)}
                            size="sm"
                            className="gap-1"
                        >
                            <Building className="h-4 w-4" /> Add Department
                        </Button>
                    </div>
                </header>

                <AddDepartmentFormDialog />

                <div className="flex-1 overflow-auto p-6">
                    <DepartmentDataTable />
                </div>
            </div>
        </div>
    );
}
