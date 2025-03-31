import { registrationFormAtom } from "@/lib/atoms";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAtom } from "jotai";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

// Form schema with validation
const accountInfoSchema = z
    .object({
        email: z
            .string()
            .email({ message: "Please enter a valid email address" }),
        phoneNumber: z
            .string()
            .regex(/^\+?[0-9]\d{1,10}$/, {
                message: "Please enter a valid phone number",
            })
            .min(11, { message: "Phone number must be 11 digits" }),
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
            }),
        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });

type AccountInfoValues = z.infer<typeof accountInfoSchema>;

interface AccountInfoStepProps {
    onNext: () => void;
    onBack: () => void;
}

export default function AccountInfoStep({
    onNext,
    onBack,
}: AccountInfoStepProps) {
    const [formData, setFormData] = useAtom(registrationFormAtom);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const form = useForm<AccountInfoValues>({
        resolver: zodResolver(accountInfoSchema),
        defaultValues: {
            email: formData.email,
            phoneNumber: formData.phoneNumber,
            password: formData.password,
            confirmPassword: formData.confirmPassword,
        },
    });

    const onSubmit = (values: AccountInfoValues) => {
        // Update the global form state
        setFormData({
            ...formData,
            ...values,
        });

        // Move to the next step
        onNext();
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-4">
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                    <Input
                                        type="email"
                                        placeholder="Enter your email address"
                                        {...field}
                                    />
                                </FormControl>
                                <FormDescription>
                                    We'll never share your email with anyone
                                    else
                                </FormDescription>
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
                                        type="number"
                                        placeholder="Enter your phone number"
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
                                    <div className="relative">
                                        <Input
                                            type={
                                                showPassword
                                                    ? "text"
                                                    : "password"
                                            }
                                            placeholder="Enter your password"
                                            {...field}
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                            onClick={() =>
                                                setShowPassword(!showPassword)
                                            }
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                                            ) : (
                                                <Eye className="h-4 w-4 text-muted-foreground" />
                                            )}
                                            <span className="sr-only">
                                                {showPassword
                                                    ? "Hide password"
                                                    : "Show password"}
                                            </span>
                                        </Button>
                                    </div>
                                </FormControl>
                                <FormDescription>
                                    Password must be at least 8 characters and
                                    include uppercase, lowercase, and numbers
                                </FormDescription>
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
                                    <div className="relative">
                                        <Input
                                            type={
                                                showConfirmPassword
                                                    ? "text"
                                                    : "password"
                                            }
                                            placeholder="Confirm your password"
                                            {...field}
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                            onClick={() =>
                                                setShowConfirmPassword(
                                                    !showConfirmPassword,
                                                )
                                            }
                                        >
                                            {showConfirmPassword ? (
                                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                                            ) : (
                                                <Eye className="h-4 w-4 text-muted-foreground" />
                                            )}
                                            <span className="sr-only">
                                                {showConfirmPassword
                                                    ? "Hide password"
                                                    : "Show password"}
                                            </span>
                                        </Button>
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="flex justify-between">
                    <Button type="button" variant="outline" onClick={onBack}>
                        Back
                    </Button>
                    <Button type="submit">Continue</Button>
                </div>
            </form>
        </Form>
    );
}
