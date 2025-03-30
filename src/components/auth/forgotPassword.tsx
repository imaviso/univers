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
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from "@/components/ui/input-otp";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "@tanstack/react-router";
import {
    ArrowLeft,
    CheckCircle2,
    KeyRound,
    LockKeyhole,
    Mail,
} from "lucide-react";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

// Form schemas with validation
const idNumberSchema = z.object({
    idNumber: z
        .string()
        .min(5, { message: "ID number must be at least 5 characters" }),
});

const emailSchema = z.object({
    email: z.string().email({ message: "Invalid email address" }),
});

const verificationCodeSchema = z.object({
    code: z
        .string()
        .min(6, { message: "Verification code must be 6 characters" }),
});

const passwordResetSchema = z
    .object({
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
        message: "Passwords don't match",
        path: ["confirmPassword"],
    });

type IdNumberValues = z.infer<typeof idNumberSchema>;
type EmailValues = z.infer<typeof emailSchema>;
type VerificationCodeValues = z.infer<typeof verificationCodeSchema>;
type PasswordResetValues = z.infer<typeof passwordResetSchema>;

export default function ForgotPasswordForm() {
    const [step, setStep] = useState<number>(1);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [idNumber, setIdNumber] = useState("");
    const [email, setEmail] = useState("");
    const [resendTimer, setResendTimer] = useState<number>(0);
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [showConfirmPassword, setShowConfirmPassword] =
        useState<boolean>(false);

    // Form for step 1: ID number
    const idForm = useForm<IdNumberValues>({
        resolver: zodResolver(idNumberSchema),
        defaultValues: {
            idNumber: "",
        },
    });

    const emailForm = useForm<EmailValues>({
        resolver: zodResolver(emailSchema),
        defaultValues: {
            email: "",
        },
    });

    // Form for step 2: Verification code
    const codeForm = useForm<VerificationCodeValues>({
        resolver: zodResolver(verificationCodeSchema),
        defaultValues: {
            code: "",
        },
    });

    // Form for step 3: New password
    const passwordForm = useForm<PasswordResetValues>({
        resolver: zodResolver(passwordResetSchema),
        defaultValues: {
            password: "",
            confirmPassword: "",
        },
    });

    const onSubmitIdNumber = async (values: IdNumberValues) => {
        setIsLoading(true);

        try {
            // Simulate API call to send verification code
            await new Promise((resolve) => setTimeout(resolve, 1000));

            console.log("Verification code sent for ID:", values.idNumber);
            setIdNumber(values.idNumber);

            // Start resend timer
            setResendTimer(60);
            const interval = setInterval(() => {
                setResendTimer((prev) => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            // Move to next step
            setStep(2);
        } catch (error) {
            console.error("Failed to send verification code:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const onSubmitEmail = async (values: EmailValues) => {
        setIsLoading(true);

        try {
            // Simulate API call to send verification code
            await new Promise((resolve) => setTimeout(resolve, 1000));

            console.log("Verification code sent for Email:", values.email);
            setEmail(values.email);

            // Start resend timer
            setResendTimer(60);
            const interval = setInterval(() => {
                setResendTimer((prev) => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            // Move to next step
            setStep(2);
        } catch (error) {
            console.error("Failed to send verification code:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const onSubmitVerificationCode = async (values: VerificationCodeValues) => {
        setIsLoading(true);

        try {
            // Simulate API call to verify code
            await new Promise((resolve) => setTimeout(resolve, 1000));

            console.log("Verification code validated:", values.code);

            // Move to next step
            setStep(3);
        } catch (error) {
            console.error("Code verification failed:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const onSubmitNewPassword = async (values: PasswordResetValues) => {
        setIsLoading(true);

        try {
            // Simulate API call to reset password
            await new Promise((resolve) => setTimeout(resolve, 1000));

            console.log("Password reset completed for ID:", idNumber);

            // Show success message
            setIsSubmitted(true);
        } catch (error) {
            console.error("Password reset failed:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendCode = async () => {
        setIsLoading(true);

        try {
            // Simulate API call to resend code
            await new Promise((resolve) => setTimeout(resolve, 1000));

            console.log("Resending verification code for ID:", idNumber);

            // Reset timer
            setResendTimer(60);
            const interval = setInterval(() => {
                setResendTimer((prev) => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } catch (error) {
            console.error("Failed to resend code:", error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isSubmitted) {
        return (
            <Card className="w-full max-w-md mx-auto shadow-lg">
                <CardHeader className="space-y-1">
                    <div className="mx-auto bg-green-100 p-3 rounded-full w-fit">
                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-center">
                        Password Reset Complete
                    </CardTitle>
                    <CardDescription className="text-center">
                        Your password has been successfully reset
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-4 text-center">
                    <p className="text-muted-foreground mb-6">
                        You can now log in to your account using your new
                        password.
                    </p>
                    <Button asChild className="w-full">
                        <Link to="/auth/login">Go to Login</Link>
                    </Button>
                </CardContent>
                <CardFooter className="flex justify-center border-t px-6 py-4">
                    <Link
                        to="/auth/login"
                        className="text-sm text-primary flex items-center hover:underline"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to login
                    </Link>
                </CardFooter>
            </Card>
        );
    }

    return (
        <Card className="w-full max-w-md mx-auto shadow-lg">
            <CardHeader className="space-y-1">
                <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit">
                    {step === 1 && (
                        <KeyRound className="h-6 w-6 text-primary" />
                    )}
                    {step === 2 && <Mail className="h-6 w-6 text-primary" />}
                    {step === 3 && (
                        <LockKeyhole className="h-6 w-6 text-primary" />
                    )}
                </div>
                <CardTitle className="text-2xl font-bold text-center">
                    Reset Password
                </CardTitle>
                <CardDescription className="text-center">
                    {step === 1 &&
                        "Enter your Email to receive a verification code"}
                    {step === 2 &&
                        "Enter the verification code sent to your email"}
                    {step === 3 && "Create a new password for your account"}
                </CardDescription>
            </CardHeader>

            <CardContent>
                {/* Step indicators */}
                <div className="flex items-center justify-center mb-6">
                    <div className="flex items-center">
                        <div
                            className={cn(
                                "rounded-full w-8 h-8 flex items-center justify-center text-sm font-medium",
                                step >= 1
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted text-muted-foreground",
                            )}
                        >
                            1
                        </div>
                        <div
                            className={cn(
                                "w-12 h-1 mx-1",
                                step >= 2 ? "bg-primary" : "bg-muted",
                            )}
                        />
                        <div
                            className={cn(
                                "rounded-full w-8 h-8 flex items-center justify-center text-sm font-medium",
                                step >= 2
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted text-muted-foreground",
                            )}
                        >
                            2
                        </div>
                        <div
                            className={cn(
                                "w-12 h-1 mx-1",
                                step >= 3 ? "bg-primary" : "bg-muted",
                            )}
                        />
                        <div
                            className={cn(
                                "rounded-full w-8 h-8 flex items-center justify-center text-sm font-medium",
                                step >= 3
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted text-muted-foreground",
                            )}
                        >
                            3
                        </div>
                    </div>
                </div>

                {/* Step 1: Email */}
                {step === 1 && (
                    <Form {...idForm}>
                        <form
                            onSubmit={emailForm.handleSubmit(onSubmitEmail)}
                            className="space-y-6"
                        >
                            <FormField
                                control={emailForm.control}
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
                                        <FormDescription>
                                            Enter the Email associated with your
                                            account
                                        </FormDescription>
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
                                {isLoading ? "Sending..." : "Send Reset Code"}
                            </Button>
                        </form>
                    </Form>
                )}

                {/* Step 2: Verification Code */}
                {step === 2 && (
                    <Form {...codeForm}>
                        <form
                            onSubmit={codeForm.handleSubmit(
                                onSubmitVerificationCode,
                            )}
                            className="space-y-6"
                        >
                            <FormField
                                control={codeForm.control}
                                name="code"
                                render={({ field }) => (
                                    <FormItem className="space-y-3">
                                        <FormLabel className="text-center block">
                                            Verification Code
                                        </FormLabel>
                                        <FormControl>
                                            <InputOTP
                                                maxLength={6}
                                                {...field}
                                                className="flex justify-center"
                                            >
                                                <InputOTPGroup className="flex items-center justify-center w-full">
                                                    <InputOTPSlot index={0} />
                                                    <InputOTPSlot index={1} />
                                                    <InputOTPSlot index={2} />
                                                    <InputOTPSlot index={3} />
                                                    <InputOTPSlot index={4} />
                                                    <InputOTPSlot index={5} />
                                                </InputOTPGroup>
                                            </InputOTP>
                                        </FormControl>
                                        <FormDescription className="text-center">
                                            Enter the 6-digit code sent to your
                                            email
                                        </FormDescription>
                                        <FormMessage className="text-center" />
                                    </FormItem>
                                )}
                            />

                            <div className="flex flex-col space-y-4">
                                <Button
                                    type="submit"
                                    className="w-full font-medium"
                                    disabled={isLoading}
                                    size="lg"
                                >
                                    {isLoading ? "Verifying..." : "Verify Code"}
                                </Button>

                                <Button
                                    type="button"
                                    variant="outline"
                                    className={cn(
                                        "w-full",
                                        resendTimer > 0 &&
                                            "cursor-not-allowed opacity-70",
                                    )}
                                    onClick={handleResendCode}
                                    disabled={isLoading || resendTimer > 0}
                                >
                                    {resendTimer > 0
                                        ? `Resend code in ${resendTimer}s`
                                        : isLoading
                                          ? "Sending..."
                                          : "Resend code"}
                                </Button>

                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => setStep(1)}
                                    disabled={isLoading}
                                >
                                    Back to Email
                                </Button>
                            </div>
                        </form>
                    </Form>
                )}

                {/* Step 3: New Password */}
                {step === 3 && (
                    <Form {...passwordForm}>
                        <form
                            onSubmit={passwordForm.handleSubmit(
                                onSubmitNewPassword,
                            )}
                            className="space-y-6"
                        >
                            <FormField
                                control={passwordForm.control}
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
                                control={passwordForm.control}
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

                            <div className="flex flex-col space-y-4">
                                <Button
                                    type="submit"
                                    className="w-full font-medium"
                                    disabled={isLoading}
                                    size="lg"
                                >
                                    {isLoading
                                        ? "Resetting..."
                                        : "Reset Password"}
                                </Button>

                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => setStep(2)}
                                    disabled={isLoading}
                                >
                                    Back to Verification
                                </Button>
                            </div>
                        </form>
                    </Form>
                )}
            </CardContent>

            <CardFooter className="flex justify-center border-t px-6 py-4">
                <Link
                    to="/auth/login"
                    className="text-sm text-primary flex items-center hover:underline"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to login
                </Link>
            </CardFooter>
        </Card>
    );
}
