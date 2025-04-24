import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { updateDepartment } from "@/lib/api";
import { editDepartmentDialogAtom, selectedDepartmentAtom } from "@/lib/atoms"; // Use correct atoms
import { departmentsQueryOptions, usersQueryOptions } from "@/lib/query";
import { type DepartmentInput, departmentSchema } from "@/lib/schema";
import type { DepartmentType, UserType } from "@/lib/types";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAtom } from "jotai";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface EditDepartmentFormDialogProps {
    isOpen: boolean;
    onClose: () => void;
    department: DepartmentType; // The department being edited
    users: UserType[]; // List of users for the dropdown
}

export function EditDepartmentFormDialog({
    isOpen,
    onClose,
    department,
    users,
}: EditDepartmentFormDialogProps) {
    const queryClient = useQueryClient();
    // We get isOpen and onClose from props, no need for atom here directly for control
    // const [isOpen, setIsOpen] = useAtom(editDepartmentDialogAtom);
    // const [, setSelectedDepartment] = useAtom(selectedDepartmentAtom); // Not needed if department is passed as prop

    const form = useForm<DepartmentInput>({
        resolver: valibotResolver(departmentSchema),
        defaultValues: {
            // Default values will be overridden by useEffect
            name: "",
            description: "",
            deptHeadId: undefined,
        },
        mode: "onChange",
    });

    // Reset form when dialog opens or department changes
    useEffect(() => {
        if (isOpen && department) {
            form.reset({
                name: department.name,
                description: department.description ?? "", // Handle null description
                deptHeadId: department.deptHeadId ?? undefined, // Handle null deptHeadId
            });
        }
    }, [isOpen, department, form]);

    const updateMutation = useMutation({
        // Destructure args in mutationFn
        mutationFn: ({
            departmentId,
            payload,
        }: { departmentId: number; payload: Partial<DepartmentInput> }) =>
            updateDepartment(departmentId, payload),
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
                : payload.deptHeadId === null
                  ? null
                  : undefined; // Handle unassigning optimistically

            queryClient.setQueryData<DepartmentType[]>(
                departmentsQueryOptions.queryKey,
                (old = []) =>
                    old.map((dept) =>
                        dept.id === departmentId
                            ? {
                                  ...dept,
                                  name: payload.name ?? dept.name,
                                  description:
                                      payload.description !== undefined
                                          ? payload.description
                                          : dept.description,
                                  deptHeadId:
                                      payload.deptHeadId !== undefined
                                          ? payload.deptHeadId
                                          : dept.deptHeadId,
                                  // Update name only if ID changed
                                  deptHeadName:
                                      deptHeadName !== undefined
                                          ? deptHeadName
                                          : dept.deptHeadName,
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
            onClose(); // Call onClose prop
        },
        onSettled: () => {
            queryClient.invalidateQueries({
                queryKey: departmentsQueryOptions.queryKey,
            });
            queryClient.invalidateQueries({
                queryKey: usersQueryOptions.queryKey,
            }); // Invalidate users too
        },
    });

    const handleFormSubmit = (values: DepartmentInput) => {
        // Prepare payload - only send changed values if using PATCH effectively
        // Or send all values as per current API setup
        const payload: Partial<DepartmentInput> = {
            name: values.name,
            description: values.description || undefined, // Send null if empty
            // Map form's deptHeadId to backend's expected 'deptHead' (number | null)
            deptHead: values.deptHeadId ? Number(values.deptHeadId) : null,
        };

        updateMutation.mutate({ departmentId: department.id, payload });
    };

    // Use the onClose prop for closing
    const handleClose = () => {
        if (!updateMutation.isPending) {
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Edit Department</DialogTitle>
                    <DialogDescription>
                        Update the details for the "{department.name}"
                        department.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(handleFormSubmit)}
                        className="space-y-4 py-4"
                    >
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Department Name</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="e.g., Finance"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        Description (Optional)
                                    </FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Brief description of the department"
                                            {...field}
                                            value={field.value ?? ""}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="deptHeadId"
                            render={({ field }) => {
                                return (
                                    <FormItem>
                                        <FormLabel>
                                            Department Head (Optional)
                                        </FormLabel>
                                        <Select
                                            onValueChange={(value) =>
                                                field.onChange(Number(value))
                                            }
                                            value={field.value?.toString()}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Select a user" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {users?.map(
                                                    (user: UserType) => (
                                                        <SelectItem
                                                            key={user.id}
                                                            value={user.id.toString()} // Use user ID string (which is fine here)
                                                        >
                                                            {user.firstName}{" "}
                                                            {user.lastName} (
                                                            {user.email})
                                                        </SelectItem>
                                                    ),
                                                )}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                );
                            }}
                        />

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleClose}
                                disabled={updateMutation.isPending}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={
                                    !form.formState.isDirty ||
                                    !form.formState.isValid ||
                                    updateMutation.isPending
                                } // Only enable if changed and valid
                            >
                                {updateMutation.isPending
                                    ? "Saving..."
                                    : "Save Changes"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
