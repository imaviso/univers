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
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSlot,
} from "@/components/ui/input-otp";
import { userResendVerificationCode, verifyOTP } from "@/lib/auth";
import { type OtpInput, OtpSchema } from "@/lib/schema";
import { cn } from "@/lib/utils";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { redirect, useNavigate, useRouter } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, Mail } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export function InputOTPForm() {
	const userEmail = localStorage.getItem("userEmail");
	if (userEmail === null) {
		throw redirect({ to: "/login", replace: true });
	}
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const navigate = useNavigate();
	const router = useRouter();
	const onBack = () => router.history.back();

	const form = useForm<OtpInput>({
		resolver: valibotResolver(OtpSchema),
		defaultValues: {
			code: "",
		},
	});

	async function onSubmit(data: OtpInput) {
		try {
			setIsLoading(true);
			await verifyOTP(userEmail!, data.code);
			navigate({ to: "/login" });
			toast.success("Verification successful! You can now log in.");
			localStorage.removeItem("userEmail");
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "An unexpected error occurred";
			toast.error(errorMessage);
		} finally {
			setIsLoading(false);
		}
	}

	const [isResending, setIsResending] = useState<boolean>(false);
	const [resendSuccess, setResendSuccess] = useState<boolean>(false);
	const [resendTimer, setResendTimer] = useState<number>(0);

	const handleResendCode = async () => {
		try {
			setIsResending(true);
			await userResendVerificationCode(userEmail!);
			console.log("Resending verification code to:", userEmail);
			setResendSuccess(true);

			// Start a 60-second timer
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
			const errorMessage =
				error instanceof Error ? error.message : "An unexpected error occurred";
			toast.error(errorMessage);
		} finally {
			setIsResending(false);
		}
	};

	return (
		<Card className="w-full max-w-md mx-auto shadow-lg">
			<CardHeader className="space-y-1">
				<Button className="w-fit" variant="link" onClick={() => onBack()}>
					<ArrowLeft className="h-5 w-5 text-primary" />
				</Button>
				<div className="mx-auto bg-primary/10 p-3 rounded-full w-fit">
					<Mail className="h-6 w-6 text-primary" />
				</div>
				<CardTitle className="text-2xl font-bold text-center">
					Email Verification
				</CardTitle>
				<CardDescription className="text-center">
					We've sent a verification code to your email
				</CardDescription>
			</CardHeader>
			<CardContent>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
						<FormField
							control={form.control}
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
										Please enter the 6-digit verification code sent to your
										email.
									</FormDescription>
									<FormMessage className="text-center" />
								</FormItem>
							)}
						/>

						<Button type="submit" className="w-full" disabled={isLoading}>
							{isLoading ? "Verifying..." : "Verify Email"}
						</Button>
					</form>
				</Form>
			</CardContent>
			<CardFooter className="flex flex-col space-y-4 pt-0">
				<div className="text-center text-sm">
					{resendSuccess && (
						<div className="flex items-center justify-center text-green-600 mb-2 gap-1">
							<CheckCircle2 className="h-4 w-4" />
							<span>Verification code resent successfully!</span>
						</div>
					)}

					<div className="text-muted-foreground">Didn't receive the code?</div>
				</div>

				<Button
					variant="outline"
					type="button"
					className={cn(
						"w-full",
						resendTimer > 0 && "cursor-not-allowed opacity-70",
					)}
					onClick={handleResendCode}
					disabled={isResending || resendTimer > 0}
				>
					{resendTimer > 0
						? `Resend code in ${resendTimer}s`
						: isResending
							? "Sending..."
							: "Resend verification code"}
				</Button>
			</CardFooter>
		</Card>
	);
}
