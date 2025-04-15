import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
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
import { type ResetPasswordInput, resetPasswordSchema } from "@/lib/schema";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { CheckCircle2, Eye, EyeOff, KeyRound } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

export function ResetPasswordForm() {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isSuccess, setIsSuccess] = useState<boolean>(false);
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [showConfirmPassword, setShowConfirmPassword] =
        useState<boolean>(false);

    const form = useForm<ResetPasswordInput>({
        resolver: valibotResolver(resetPasswordSchema),
        defaultValues: {
            password: "",
            confirmPassword: "",
        },
    });

    async function onSubmit(data: ResetPasswordInput) {
        try {
            setIsLoading(true);

            // Simulate API call for password reset
            await new Promise((resolve) => setTimeout(resolve, 1500));

            console.log("Password reset successful:", data.password);
            setIsSuccess(true);

            // Reset form after successful submission
            form.reset();
        } catch (error) {
            console.error("Password reset failed:", error);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Card className="w-full max-w-md mx-auto shadow-lg">
            <CardHeader className="space-y-1">
                <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit">
                    <KeyRound className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-2xl font-bold text-center">
                    Reset Password
                </CardTitle>
                <CardDescription className="text-center">
                    Create a new password for your account
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isSuccess ? (
                    <div className="text-center space-y-4">
                        <div className="mx-auto bg-green-100 p-3 rounded-full w-fit">
                            <CheckCircle2 className="h-6 w-6 text-green-600" />
                        </div>
                        <p className="text-green-600 font-medium">
                            Your password has been reset successfully!
                        </p>
                        <p className="text-muted-foreground text-sm">
                            You can now log in with your new password.
                        </p>
                    </div>
                ) : (
                    <Form {...form}>
                        <form
                            onSubmit={form.handleSubmit(onSubmit)}
                            className="space-y-6"
                        >
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem className="space-y-3">
                                        <FormLabel>New Password</FormLabel>
                                        <div className="relative">
                                            <FormControl>
                                                <Input
                                                    type={
                                                        showPassword
                                                            ? "text"
                                                            : "password"
                                                    }
                                                    {...field}
                                                />
                                            </FormControl>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="absolute right-0 top-0 text-muted-foreground"
                                                onClick={() =>
                                                    setShowPassword(
                                                        !showPassword,
                                                    )
                                                }
                                            >
                                                {showPassword ? (
                                                    <EyeOff className="h-4 w-4" />
                                                ) : (
                                                    <Eye className="h-4 w-4" />
                                                )}
                                                <span className="sr-only">
                                                    {showPassword
                                                        ? "Hide password"
                                                        : "Show password"}
                                                </span>
                                            </Button>
                                        </div>
                                        <FormDescription>
                                            Password must be at least 8
                                            characters and include uppercase,
                                            lowercase, and numbers.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="confirmPassword"
                                render={({ field }) => (
                                    <FormItem className="space-y-3">
                                        <FormLabel>Confirm Password</FormLabel>
                                        <div className="relative">
                                            <FormControl>
                                                <Input
                                                    type={
                                                        showConfirmPassword
                                                            ? "text"
                                                            : "password"
                                                    }
                                                    {...field}
                                                />
                                            </FormControl>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="absolute right-0 top-0 text-muted-foreground"
                                                onClick={() =>
                                                    setShowConfirmPassword(
                                                        !showConfirmPassword,
                                                    )
                                                }
                                            >
                                                {showConfirmPassword ? (
                                                    <EyeOff className="h-4 w-4" />
                                                ) : (
                                                    <Eye className="h-4 w-4" />
                                                )}
                                                <span className="sr-only">
                                                    {showConfirmPassword
                                                        ? "Hide password"
                                                        : "Show password"}
                                                </span>
                                            </Button>
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <Button
                                type="submit"
                                className="w-full font-medium"
                                disabled={isLoading}
                                size="lg"
                            >
                                {isLoading ? "Resetting..." : "Reset Password"}
                            </Button>
                        </form>
                    </Form>
                )}
            </CardContent>
            {isSuccess && (
                <CardFooter className="flex justify-center">
                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => setIsSuccess(false)}
                    >
                        Reset Another Password
                    </Button>
                </CardFooter>
            )}
        </Card>
    );
}
