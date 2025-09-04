import { valibotResolver } from "@hookform/resolvers/valibot";
import { useNavigate } from "@tanstack/react-router";
import { CheckCircle2, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Drawer,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
} from "@/components/ui/drawer";
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
import { cn } from "@/lib/utils"; // Added

interface OtpVerificationDrawerProps {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
}

export function OtpVerificationDrawer({
	isOpen,
	onOpenChange,
}: OtpVerificationDrawerProps) {
	const [userEmail, setUserEmail] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const navigate = useNavigate();

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		if (isOpen) {
			const email = localStorage.getItem("userEmail");
			if (!email) {
				toast.error("User email not found. Please try logging in again.");
				onOpenChange(false);
				// Or redirect: navigate({ to: "/login", replace: true });
			} else {
				setUserEmail(email);
			}
		}
	}, [isOpen, onOpenChange, navigate]); // Added dependencies

	const form = useForm<OtpInput>({
		resolver: valibotResolver(OtpSchema),
		defaultValues: {
			code: "",
		},
	});

	async function onSubmit(data: OtpInput) {
		if (!userEmail) {
			toast.error("User email not found. Cannot verify OTP.");
			return;
		}
		try {
			setIsLoading(true);
			await verifyOTP(userEmail, data.code);
			onOpenChange(false);
			toast.success("Verification successful! You can now log in.");
			localStorage.removeItem("userEmail");
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "An unexpected error occurred";
			toast.error(errorMessage);
			form.reset();
		} finally {
			setIsLoading(false);
		}
	}

	const [isResending, setIsResending] = useState<boolean>(false);
	const [resendSuccess, setResendSuccess] = useState<boolean>(false);
	const [resendTimer, setResendTimer] = useState<number>(0);

	// Timer effect
	useEffect(() => {
		let interval: NodeJS.Timeout | undefined;
		if (resendTimer > 0) {
			interval = setInterval(() => {
				setResendTimer((prev) => prev - 1);
			}, 1000);
		} else if (interval) {
			clearInterval(interval);
		}
		return () => clearInterval(interval);
	}, [resendTimer]);

	const handleResendCode = async () => {
		if (!userEmail) {
			toast.error("User email not found. Cannot resend code.");
			return;
		}
		try {
			setIsResending(true);
			setResendSuccess(false); // Reset success state
			await userResendVerificationCode(userEmail);
			setResendSuccess(true);
			setResendTimer(60); // Start 60-second timer
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "An unexpected error occurred";
			toast.error(errorMessage);
		} finally {
			setIsResending(false);
		}
	};

	const handleOpenChange = (open: boolean) => {
		if (!open) {
			// Optional: Clear email or reset state if drawer is closed without verification
			// localStorage.removeItem("userEmail");
			// form.reset();
			// setResendTimer(0);
			// setResendSuccess(false);
		}
		onOpenChange(open);
	};

	return (
		<Drawer
			open={isOpen}
			onOpenChange={handleOpenChange}
			direction="left"
			showOverlay={false}
		>
			<DrawerContent className="p-4 flex flex-col justify-center shadow-2xl">
				<div className="w-full max-w-md mx-auto">
					{" "}
					<DrawerHeader className="text-left p-0 mb-4">
						{" "}
						<div className="mx-auto bg-primary/10 p-3 rounded-full w-fit mb-2">
							<Mail className="h-6 w-6 text-primary" />
						</div>
						<DrawerTitle className="text-2xl font-bold text-center">
							Email Verification
						</DrawerTitle>
						<DrawerDescription className="text-center">
							Please verify your email address to continue.
						</DrawerDescription>
					</DrawerHeader>
					<div className="px-4 pb-0">
						{" "}
						<Form {...form}>
							<form
								onSubmit={form.handleSubmit(onSubmit)}
								className="space-y-6"
							>
								<FormField
									control={form.control}
									name="code"
									render={({ field }) => (
										<FormItem className="space-y-3">
											<FormLabel className="text-center block sr-only">
												Verification Code
											</FormLabel>
											<FormControl>
												<InputOTP
													maxLength={6}
													{...field}
													className="flex justify-center"
													autoFocus
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
												Enter the 6-digit code.
											</FormDescription>
											<FormMessage className="text-center" />
										</FormItem>
									)}
								/>
								{/* Removed mt-auto */}
								<Button type="submit" className="w-full" disabled={isLoading}>
									{isLoading ? "Verifying..." : "Verify Email"}
								</Button>
							</form>
						</Form>
					</div>
					<DrawerFooter className="pt-4 px-4 pb-0">
						<div className="text-center text-sm">
							{resendSuccess && (
								<div className="flex items-center justify-center text-green-600 mb-2 gap-1">
									<CheckCircle2 className="h-4 w-4" />
									<span>Verification code resent successfully!</span>
								</div>
							)}
							<div className="text-muted-foreground">
								Didn't receive the code?
							</div>
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
					</DrawerFooter>
				</div>
			</DrawerContent>
		</Drawer>
	);
}
