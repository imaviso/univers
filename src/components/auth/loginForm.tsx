import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { userSignIn } from "@/lib/auth";
import { userQueryOptions } from "@/lib/query";
import { type LoginInput, loginSchema } from "@/lib/schema";
import { valibotResolver } from "@hookform/resolvers/valibot";
import {
    Link,
    redirect,
    useNavigate,
    useRouteContext,
} from "@tanstack/react-router";
import { Eye, EyeOff, LoaderCircleIcon } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export default function LoginForm() {
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const context = useRouteContext({ from: "/(auth)/login" });
    const queryClient = context.queryClient;

    const navigate = useNavigate();
    const form = useForm<LoginInput>({
        resolver: valibotResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    const onSubmit = async (values: LoginInput) => {
        setIsLoading(true);
        try {
            await userSignIn(values.email, values.password);
            await queryClient.refetchQueries({
                queryKey: userQueryOptions.queryKey,
            });
            navigate({ to: "/app/calendar", replace: true });
        } catch (error) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "An unexpected error occurred";
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-md mx-auto shadow-lg">
            <CardContent>
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-6"
                    >
                        <div className="space-y-4">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Enter your Email"
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
                                                        setShowPassword(
                                                            !showPassword,
                                                        )
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
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <LoaderCircleIcon
                                        className="-ms-1 animate-spin"
                                        size={16}
                                        aria-hidden="true"
                                    />
                                    Logging in...
                                </>
                            ) : (
                                "Login"
                            )}
                        </Button>
                    </form>
                </Form>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4 border-t">
                <div className="text-sm text-muted-foreground text-center">
                    <Link
                        to="/forgot-password"
                        className="text-primary underline-offset-4 hover:underline"
                    >
                        Forgot your password?
                    </Link>
                </div>
                <div className="text-sm text-muted-foreground text-center">
                    Don't have an account?{" "}
                    <Link
                        to="/register"
                        className="text-primary underline-offset-4 hover:underline"
                    >
                        Register
                    </Link>
                </div>
            </CardFooter>
        </Card>
    );
}
