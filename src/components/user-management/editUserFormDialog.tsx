import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    // FormDescription, // Removed as password fields are gone
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
// Import the specific type needed for the onSubmit prop
import type { UpdateUserInputFE } from "@/lib/api";
import {
    type EditUserFormInput,
    type EditUserFormOutput,
    editUserFormSchema,
} from "@/lib/schema";
import type { DepartmentType, UserRole, UserType } from "@/lib/types";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

interface UserFormDialogProps {
    isOpen: boolean;
    onClose: () => void;
    isLoading?: boolean;
    // Update onSubmit prop to expect UpdateUserInputFE
    onSubmit: (userData: EditUserFormOutput) => void;
    user?: EditUserFormInput;
    roles: { value: string; label: string }[];
    departments: DepartmentType[];
}

export function EditUserFormDialog({
    isOpen,
    onClose,
    isLoading,
    onSubmit,
    user,
    roles,
    departments,
}: UserFormDialogProps) {
    const form = useForm<EditUserFormInput>({
        // Keep the original schema for potential create use case or full validation display
        resolver: valibotResolver(editUserFormSchema),
        defaultValues: {
            idNumber: "",
            firstName: "",
            lastName: "",
            email: "",
            role: "",
            departmentId: "",
            telephoneNumber: "",
            phoneNumber: "",
        },
        mode: "onChange",
    });

    const handleFormSubmit = (values: EditUserFormInput) => {
        // Destructure only the fields needed for UpdateUserInputFE
        const {
            idNumber,
            firstName,
            lastName,
            role,
            email,
            departmentId,
            telephoneNumber,
            phoneNumber,
            // Exclude password, confirmPassword, active, emailVerified
        } = values;

        // Construct the payload matching UpdateUserInputFE
        const payload = {
            idNumber,
            firstName,
            lastName,
            role: role as UserRole,
            email,
            departmentId,
            telephoneNumber,
            phoneNumber: phoneNumber ?? "",
        };

        onSubmit(payload);
    };

    useEffect(() => {
        if (isOpen) {
            if (user) {
                form.reset({
                    idNumber: user.idNumber || "",
                    firstName: user.firstName || "",
                    lastName: user.lastName || "",
                    email: user.email || "", // Keep for display
                    role: user.role || "",
                    departmentId: user.departmentId
                        ? String(user.departmentId)
                        : "",
                    telephoneNumber: user.telephoneNumber || "",
                    phoneNumber: user.phoneNumber || "",
                });
            } else {
                // Reset for potential "Add New User" case (if this dialog is reused)
                form.reset({
                    idNumber: "",
                    firstName: "",
                    lastName: "",
                    email: "",
                    role: "",
                    departmentId: "",
                    telephoneNumber: "",
                    phoneNumber: "",
                });
            }
        }
    }, [user, isOpen, form]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>
                        {user ? "Edit User" : "Add New User"}
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form
                        onSubmit={(e) => e.preventDefault()} // Prevent default form submission
                        className="space-y-4 py-4"
                    >
                        {/* ... ID Number and Role fields ... */}
                        <FormField
                            control={form.control}
                            name="idNumber"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>ID Number</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Enter ID number"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="role"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Role</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        // Use value prop for controlled component
                                        value={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select a role" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="w-[--radix-select-trigger-width]">
                                            {roles.map((role) => (
                                                <SelectItem
                                                    key={role.value}
                                                    value={role.value}
                                                    className="overflow-hidden text-ellipsis whitespace-nowrap"
                                                >
                                                    {role.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        {/* ... First Name and Last Name fields ... */}
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="firstName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>First Name</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Enter First Name"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="lastName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Last Name</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Enter Last Name"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="User email"
                                            type="email"
                                            {...field}
                                            className="bg-muted/50" // Optional: visual indication
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* ... Phone Number and Telephone Number fields ... */}
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="phoneNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Phone Number (Optional)
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Enter phone number"
                                                type="tel"
                                                // Ensure value is handled correctly (controlled component)
                                                {...field}
                                                value={field.value || undefined} // Handle null/undefined
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="telephoneNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Telephone Number</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Enter telephone number"
                                                type="tel"
                                                // Ensure value is handled correctly
                                                {...field}
                                                value={field.value || ""} // Handle null/undefined
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        {/* ... Department field ... */}
                        <FormField
                            control={form.control}
                            name="departmentId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Department</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        value={field.value || ""}
                                    >
                                        <FormControl>
                                            {/* The trigger sets the perceived width in the form */}
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select a department" />
                                            </SelectTrigger>
                                        </FormControl>
                                        {/* Constrain the dropdown panel's width */}
                                        <SelectContent
                                            // Use popper to avoid stretching the dialog, adjust width as needed
                                            // w-[--radix-select-trigger-width] ensures it matches the trigger width
                                            // max-h-[200px] adds vertical scroll if list is long
                                            className="w-[--radix-select-trigger-width] max-h-[200px]"
                                        >
                                            {departments.map((department) => (
                                                <SelectItem
                                                    key={department.id}
                                                    value={department.id.toString()}
                                                    title={department.name}
                                                    className="overflow-hidden text-ellipsis whitespace-nowrap"
                                                >
                                                    {department.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        {/* Active switch removed */}
                    </form>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            // Consider if isValid check needs adjustment if schema includes non-submitted fields
                            disabled={
                                !form.formState.isDirty ||
                                !form.formState.isValid ||
                                isLoading
                            }
                            onClick={form.handleSubmit(handleFormSubmit)}
                        >
                            {user ? "Save Changes" : "Create User"}
                        </Button>
                    </DialogFooter>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
