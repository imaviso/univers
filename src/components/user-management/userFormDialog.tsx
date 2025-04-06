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
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

const formSchema = z
    .object({
        firstName: z.string().min(2, {
            message: "First Name must be at least 2 characters.",
        }),
        lastName: z.string().min(2, {
            message: "Last Name must be at least 2 characters.",
        }),
        idNumber: z.string().min(5, {
            message: "ID Number must be at least 5 characters.",
        }),
        email: z.string().email({
            message: "Please enter a valid email address.",
        }),
        password: z
            .string()
            .min(8, { message: "Password must be at least 8 characters" })
            .regex(/[A-Z]/, {
                message: "Password must contain at least one uppercase letter",
            })
            .regex(/[a-z]/, {
                message: "Password must contain at least one lowercase letter",
            })
            .regex(/[0-9]/, {
                message: "Password must contain at least one number",
            })
            .optional(),
        confirmPassword: z.string().optional(),
        role: z.string({
            required_error: "Please select a role.",
        }),
        department: z.string({
            required_error: "Please select a department.",
        }),
        phoneNumber: z
            .string()
            .regex(/^\+?[0-9]\d{1,10}$/, {
                message: "Please enter a valid phone number",
            })
            .min(11, { message: "Phone number must be 11 digits" }),
        active: z.string({
            required_error: "Please select a status.",
        }),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });

interface UserFormDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (
        userData: Partial<{
            idNumber: string;
            firstName: string;
            lastName: string;
            email: string;
            password: string;
            confirmPassword: string;
            role: string;
            department: string;
            phoneNumber: string;
            active: string;
        }>,
    ) => void;
    user?: {
        idNumber: string;
        firstName: string;
        lastName: string;
        email: string;
        // password: string;
        // confirmPassword: string;
        role: string;
        department: string;
        phoneNumber: string;
        active: string;
    };
    roles: { value: string; label: string }[];
    departments: string[];
    active: { value: string; label: string }[];
}

export function UserFormDialog({
    isOpen,
    onClose,
    onSubmit,
    user,
    roles,
    departments,
    active,
}: UserFormDialogProps) {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            idNumber: user?.idNumber || "",
            firstName: user?.firstName || "",
            lastName: user?.lastName || "",
            email: user?.email || "",
            password: "",
            confirmPassword: "",
            role: user?.role || "",
            department: user?.department || "",
            phoneNumber: user?.phoneNumber || "",
            active: user?.active || "",
        },
        mode: "onChange",
    });

    useEffect(() => {
        if (user && isOpen) {
            form.reset(user);
        }
    }, [user, isOpen, form]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>
                        {user ? "Edit User" : "Add New User"}
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
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
                                name="phoneNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Phone Number</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Enter phone number"
                                                type="tel"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

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
                                            placeholder="Enter email"
                                            type="email"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Password</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Enter password"
                                            type="password"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="confirmPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Confirm Password</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Confirm password"
                                            type="password"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="role"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Role</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a role" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {roles.map((role) => (
                                                    <SelectItem
                                                        key={role.value}
                                                        value={role.value}
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

                            <FormField
                                control={form.control}
                                name="department"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Department</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a department" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {departments.map(
                                                    (department) => (
                                                        <SelectItem
                                                            key={department}
                                                            value={department}
                                                        >
                                                            {department}
                                                        </SelectItem>
                                                    ),
                                                )}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="active"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Status</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a status" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {active.map((status) => (
                                                <SelectItem
                                                    key={status.value}
                                                    value={status.value}
                                                >
                                                    {status.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={!form.formState.isValid}
                            onClick={form.handleSubmit(onSubmit)}
                        >
                            {user ? "Save changes" : "Create"}
                        </Button>
                    </DialogFooter>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
