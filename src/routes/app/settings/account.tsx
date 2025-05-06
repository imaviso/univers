import ErrorPage from "@/components/ErrorPage";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // Added
import { Badge } from "@/components/ui/badge"; // Added
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
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { updateProfile } from "@/lib/api";
import {
    userForgotPassword,
    userResetPassword,
    userResetVerificationCode,
} from "@/lib/auth";
import { useCurrentUser, userQueryOptions } from "@/lib/query"; // Corrected import name
import {
    ImageSchema,
    OtpSchema,
    type SetNewPasswordInput,
    setNewPasswordSchema,
} from "@/lib/schema";
import { type EmailInput, emailSchema } from "@/lib/schema";
import type { UserType } from "@/lib/types";
import { useMutation } from "@tanstack/react-query"; // Corrected import
import { createFileRoute, useRouteContext } from "@tanstack/react-router";
import {
    Camera, // Added
    CheckCircle2,
    Eye,
    EyeOff,
    KeyRound,
    Loader2,
    Mail,
    Moon,
    Sun,
    X,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import * as v from "valibot";

export const Route = createFileRoute("/app/settings/account")({
    component: AccountSettings,
});

// --- Types and Initial States ---
const initialNewPasswordState: SetNewPasswordInput = {
    newPassword: "",
    confirmPassword: "",
};

type PasswordDialogStep = "request" | "verify" | "reset" | "success";

const initialChangeEmailState: EmailInput = { email: "" };
type EmailDialogStep = "input" | "verify" | "success"; // Steps for email change

// Define a type for the editable profile fields
type EditableProfile = {
    firstName: string;
    lastName: string;
    avatarFile?: File | null;
    avatarUrl?: string;
};

const getInitialProfileState = (
    user: UserType | undefined,
): EditableProfile => ({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    avatarUrl: user?.profileImagePath || undefined,
    avatarFile: null,
});
// --- End Types and Initial States ---

export function AccountSettings() {
    const { theme, setTheme } = useTheme();
    const { data: user } = useCurrentUser();
    const { queryClient } = useRouteContext({ from: "/app/settings" });
    if (!user) {
        return <ErrorPage />;
    }

    const [profileForm, setProfileForm] = useState<EditableProfile>(() =>
        getInitialProfileState(user),
    );

    const [isChangePasswordDialogOpen, setIsChangePasswordDialogOpen] =
        useState(false);
    const [passwordDialogStep, setPasswordDialogStep] =
        useState<PasswordDialogStep>("request");
    const [otpCode, setOtpCode] = useState("");
    const [otpError, setOtpError] = useState<string | null>(null);
    const [newPasswordForm, setNewPasswordForm] = useState<SetNewPasswordInput>(
        initialNewPasswordState,
    );
    const [newPasswordErrors, setNewPasswordErrors] = useState<v.FlatErrors<
        typeof setNewPasswordSchema
    > | null>(null);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
    const [isRequestingCode, setIsRequestingCode] = useState(false);
    const [isVerifyingCode, setIsVerifyingCode] = useState(false);
    const [isSettingPassword, setIsSettingPassword] = useState(false);
    const [isRequestingEmailCode, setIsRequestingEmailCode] = useState(false);
    const [isVerifyingEmailCode, setIsVerifyingEmailCode] = useState(false);
    const [emailDialogStep, setEmailDialogStep] = useState<EmailDialogStep>();
    const [emailForm, setEmailForm] = useState<EmailInput>(
        initialChangeEmailState,
    );
    const [emailFormError, setEmailFormError] = useState<string | null>(null);
    const [emailOtpCode, setEmailOtpCode] = useState<string>("");
    const [emailOtpError, setEmailOtpError] = useState<string | null>(null);
    const [isChangeEmailDialogOpen, setIsChangeEmailDialogOpen] =
        useState(false);
    // Other State
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

    useEffect(() => {
        setProfileForm((prev) => ({
            ...prev,
            firstName: user?.firstName ?? "",
            lastName: user?.lastName ?? "",
        }));
    }, [user?.firstName, user?.lastName]);

    // update avatarUrl when profileImagePath changes and no local file is staged
    useEffect(() => {
        if (!profileForm.avatarFile) {
            setProfileForm((prev) => ({
                ...prev,
                avatarUrl: user?.profileImagePath || undefined,
            }));
        }
    }, [user?.profileImagePath, profileForm.avatarFile]);

    const updateProfileMutation = useMutation({
        // Pass the correct input type to mutationFn
        mutationFn: (
            payload: Parameters<typeof updateProfile>[0], // Use parameters type
        ) => updateProfile(payload),
        onMutate: async (payload: Parameters<typeof updateProfile>[0]) => {
            await queryClient.cancelQueries({
                queryKey: userQueryOptions.queryKey,
            });
            const previousUserData = queryClient.getQueryData<UserType>(
                userQueryOptions.queryKey,
            );
            // Optimistically update only the data part, not the file
            queryClient.setQueryData<UserType | undefined>(
                userQueryOptions.queryKey,
                (old) => (old ? { ...old, ...payload.data } : undefined),
            );
            return { previousUserData };
        },
        onError: (err, payload, context) => {
            if (context?.previousUserData) {
                queryClient.setQueryData(
                    userQueryOptions.queryKey,
                    context.previousUserData,
                );
                // Reset profile form on error, including avatar state
                setProfileForm(
                    getInitialProfileState(context.previousUserData),
                );
            }
            toast.error(
                `Failed to update profile: ${err instanceof Error ? err.message : "Unknown error"}`,
            );
        },
        onSuccess: (message) => {
            // Backend returns a success message string
            toast.success(message || "Profile updated successfully");
            // Reset avatar file state after successful upload
            setProfileForm((prev) => ({
                ...prev,
                avatarFile: null,
                avatarUrl: undefined, // let react-query refetch decide the new src
            }));
        },
        onSettled: () => {
            // Invalidate to refetch the latest user data (including potentially new avatar URL)
            queryClient.invalidateQueries({
                queryKey: userQueryOptions.queryKey,
            });
        },
    });

    const handleDeleteAccount = () => {
        toast.error("Delete account feature is not implemented yet.");
    };

    const handleProfileChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
        const { name, value } = e.target;
        setProfileForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate the file using the schema
            const result = v.safeParse(ImageSchema, file);
            if (!result.success) {
                const errorMessage =
                    v.flatten(result.issues).root?.[0] || "Invalid image file.";
                toast.error(`Avatar Error: ${errorMessage}`);
                // Clear the input field if validation fails
                e.target.value = "";
                return;
            }

            // Validation passed, update state
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfileForm((prev) => ({
                    ...prev,
                    avatarFile: file,
                    avatarUrl: reader.result as string, // Show preview
                }));
            };
            reader.readAsDataURL(file);
        } else {
            // Handle case where user cancels file selection (optional)
            // Maybe revert to original avatar if needed, or do nothing
        }
    };

    const handleRemoveAvatar = () => {
        setProfileForm((prev) => ({
            ...prev,
            avatarFile: null,
            // Revert to original user avatar URL or placeholder
            avatarUrl: getInitialProfileState(user).avatarUrl,
        }));
        // Reset the file input visually
        const input = document.getElementById(
            "avatar-upload",
        ) as HTMLInputElement;
        if (input) {
            input.value = "";
        }
    };

    const handleSaveChanges = () => {
        if (!user) {
            toast.error("User data not available.");
            return;
        }

        // Check if there are any changes
        const hasNameChange =
            profileForm.firstName !== user.firstName ||
            profileForm.lastName !== user.lastName;
        const hasAvatarChange = !!profileForm.avatarFile;

        if (!hasNameChange && !hasAvatarChange) {
            toast.info("No changes detected.");
            return;
        }

        // Prepare the data payload for the API
        const dataPayload: Partial<Pick<UserType, "firstName" | "lastName">> =
            {};
        if (hasNameChange) {
            dataPayload.firstName = profileForm.firstName;
            dataPayload.lastName = profileForm.lastName;
        }
        // Add other editable fields here if needed (e.g., phoneNumber, idNumber)
        // dataPayload.phoneNumber = profileForm.phoneNumber;
        // dataPayload.idNumber = profileForm.idNumber;

        // Call the mutation with userId, data, and the image file
        updateProfileMutation.mutate({
            userId: user.id,
            data: dataPayload,
            imageFile: profileForm.avatarFile, // Pass the file state
        });
    };

    const handleCancelProfileChanges = () => {
        setProfileForm(getInitialProfileState(user)); // Reset form to initial state
        // Reset the file input visually
        const input = document.getElementById(
            "avatar-upload",
        ) as HTMLInputElement;
        if (input) {
            input.value = "";
        }
        toast.info("Profile changes discarded.");
    };

    // Password Dialog Handlers
    const handleOpenChangePasswordDialog = async () => {
        if (!user?.email) {
            toast.error("User email not found.");
            return;
        }
        setPasswordDialogStep("request");
        setOtpCode("");
        setOtpError(null);
        setNewPasswordForm(initialNewPasswordState);
        setNewPasswordErrors(null);
        setIsChangePasswordDialogOpen(true);
        setIsRequestingCode(true);

        try {
            await userForgotPassword(user.email); // Request code
            toast.success(`Verification code sent to ${user.email}`);
            setPasswordDialogStep("verify");
        } catch (err) {
            toast.error(
                `Failed to send code: ${err instanceof Error ? err.message : "Unknown error"}`,
            );
        } finally {
            setIsRequestingCode(false);
        }
    };

    const handleOtpSubmit = async () => {
        if (!user?.email) {
            toast.error("User email not found.");
            return;
        }
        const result = v.safeParse(OtpSchema, { code: otpCode });
        if (!result.success) {
            setOtpError(
                v.flatten(result.issues).nested?.code?.[0] ||
                    "Invalid code format.",
            );
            return;
        }
        setOtpError(null);
        setIsVerifyingCode(true);

        try {
            await userResetVerificationCode(user.email, result.output.code); // Verify code
            toast.success("Code verified successfully");
            setPasswordDialogStep("reset");
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : "Verification failed";
            setOtpError(errorMessage);
            toast.error(`Code verification failed: ${errorMessage}`);
        } finally {
            setIsVerifyingCode(false);
        }
    };

    const handleNewPasswordInputChange = (
        e: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const { name, value } = e.target;
        setNewPasswordForm((prev) => ({ ...prev, [name]: value }));
        // Clear errors on change
        if (newPasswordErrors?.nested?.[name as keyof SetNewPasswordInput]) {
            setNewPasswordErrors((prev) => {
                if (!prev?.nested) return prev;
                const newNested = { ...prev.nested };
                delete newNested[name as keyof SetNewPasswordInput];
                return { ...prev, nested: newNested };
            });
        }
        if (name === "confirmPassword" && newPasswordErrors?.root) {
            setNewPasswordErrors((prev) => ({ ...prev, root: undefined }));
        }
    };

    const handleSetNewPasswordSubmit = async () => {
        if (!user?.email) {
            toast.error("User email not found.");
            return;
        }
        const result = v.safeParse(setNewPasswordSchema, newPasswordForm);
        if (!result.success) {
            setNewPasswordErrors(v.flatten(result.issues));
            toast.error("Please fix the errors in the new password form.");
            return;
        }
        setNewPasswordErrors(null);
        setIsSettingPassword(true);

        try {
            await userResetPassword(
                user.email,
                otpCode,
                result.output.newPassword,
            ); // Set new password
            setPasswordDialogStep("success");
        } catch (err) {
            toast.error(
                `Failed to set new password: ${err instanceof Error ? err.message : "Unknown error"}`,
            );
        } finally {
            setIsSettingPassword(false);
        }
    };

    const handleDialogClose = (open: boolean) => {
        if (!open) {
            setIsChangePasswordDialogOpen(false);
            setTimeout(() => {
                setPasswordDialogStep("request");
                setOtpCode("");
                setOtpError(null);
                setNewPasswordForm(initialNewPasswordState);
                setNewPasswordErrors(null);
                setIsRequestingCode(false);
                setIsVerifyingCode(false);
                setIsSettingPassword(false);
            }, 300);
        }
    };

    // Email Dialog Handlers
    const handleOpenChangeEmailDialog = () => {
        toast.error("Change email feature is not implemented yet.");
        // Reset state when opening
        setEmailDialogStep("input");
        setEmailForm(initialChangeEmailState);
        setEmailFormError(null);
        setEmailOtpCode("");
        setEmailOtpError(null);
        setIsChangeEmailDialogOpen(true);
    };

    const handleEmailInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEmailForm({ email: e.target.value });
        if (emailFormError) setEmailFormError(null); // Clear error on change
    };

    const handleRequestEmailCode = async () => {
        const result = v.safeParse(emailSchema, emailForm);
        if (!result.success) {
            setEmailFormError(
                v.flatten(result.issues).nested?.newEmail?.[0] ||
                    "Invalid email format.",
            );
            return;
        }
        if (result.output.email === user?.email) {
            setEmailFormError("This is already your current email address.");
            return;
        }
        setEmailFormError(null);
        setIsRequestingEmailCode(true);
        try {
            // await requestEmailChangeCode(result.output.email);
            toast.success(`Verification code sent to ${result.output.email}`);
            setEmailDialogStep("verify"); // Move to OTP step
        } catch (err) {
            toast.error(
                `Failed to send code: ${err instanceof Error ? err.message : "Unknown error"}`,
            );
        } finally {
            setIsRequestingEmailCode(false);
        }
    };

    const handleVerifyEmailCode = async () => {
        const otpResult = v.safeParse(OtpSchema, { code: emailOtpCode });
        if (!otpResult.success) {
            setEmailOtpError(
                v.flatten(otpResult.issues).nested?.code?.[0] ||
                    "Invalid code format.",
            );
            return;
        }
        // We also need the email that the code was sent to
        const emailResult = v.safeParse(emailSchema, emailForm);
        if (!emailResult.success) {
            // Should not happen if we are at this step, but good practice
            toast.error("An error occurred. Please try again.");
            setEmailDialogStep("input"); // Go back
            return;
        }
        setEmailOtpError(null);
        setIsVerifyingEmailCode(true);
        try {
            // Call API to verify code and update email
            // const updatedUser = await verifyEmailChangeCode(
            //     emailResult.output.newEmail,
            //     otpResult.output.code,
            // );
            // // Manually update the user data in the cache
            // queryClient.setQueryData(
            //     currentUserQueryOptions.queryKey,
            //     updatedUser,
            // );
            setEmailDialogStep("success"); // Move to success step
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : "Verification failed";
            setEmailOtpError(errorMessage);
            toast.error(`Email change failed: ${errorMessage}`);
        } finally {
            setIsVerifyingEmailCode(false);
        }
    };

    const handleEmailDialogClose = (open: boolean) => {
        if (!open) {
            setIsChangeEmailDialogOpen(false);
            // Reset state after closing
            setTimeout(() => {
                setEmailDialogStep("input");
                setEmailForm(initialChangeEmailState);
                setEmailFormError(null);
                setEmailOtpCode("");
                setEmailOtpError(null);
                setIsRequestingEmailCode(false);
                setIsVerifyingEmailCode(false);
            }, 300);
        }
    };
    // --- End Handlers ---

    // --- Derived State ---
    const initials = user
        ? `${user.firstName?.charAt(0)}${user.lastName?.charAt(0)}`
        : "UV";

    const profileHasChanges = user
        ? profileForm.firstName !== user.firstName ||
          profileForm.lastName !== user.lastName ||
          !!profileForm.avatarFile // Check if a new avatar file is staged
        : false;
    // --- End Derived State ---

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-semibold tracking-tight">
                    Account Settings
                </h2>
                <p className="text-sm text-muted-foreground">
                    Manage your profile, security, and application preferences.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Your Profile</CardTitle>
                    <CardDescription>
                        This information may be displayed publicly.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6">
                        {/* Avatar Section */}
                        <div className="relative group">
                            <Avatar className="h-24 w-24">
                                <AvatarImage
                                    src={profileForm.avatarUrl}
                                    alt={profileForm.firstName}
                                />
                                <AvatarFallback>{initials}</AvatarFallback>
                            </Avatar>
                            <Label
                                htmlFor="avatar-upload"
                                className="absolute bottom-0 right-0 cursor-pointer bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-full p-1.5 border group-hover:opacity-100 opacity-60 transition-opacity"
                                title="Change avatar"
                            >
                                <Camera className="h-4 w-4" />
                                <span className="sr-only">Change avatar</span>
                            </Label>
                            {profileForm.avatarFile && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute top-0 right-0 h-6 w-6 rounded-full bg-background/50 hover:bg-destructive/80 hover:text-destructive-foreground text-muted-foreground"
                                    onClick={handleRemoveAvatar}
                                    title="Remove selected avatar"
                                >
                                    <X className="h-4 w-4" />
                                    <span className="sr-only">
                                        Remove selected avatar
                                    </span>
                                </Button>
                            )}
                            <Input
                                id="avatar-upload"
                                type="file"
                                accept="image/jpeg, image/png, image/webp" // Specify accepted types
                                className="hidden"
                                onChange={handleAvatarChange}
                                disabled={updateProfileMutation.isPending}
                            />
                        </div>
                        {/* Details Section */}
                        <div className="space-y-4 flex-1">
                            {/* Name Inputs */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="firstName">
                                        First Name
                                    </Label>
                                    <Input
                                        className="mt-1"
                                        id="firstName"
                                        name="firstName"
                                        value={profileForm.firstName}
                                        onChange={handleProfileChange}
                                        disabled={
                                            updateProfileMutation.isPending
                                        }
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="lastName">Last Name</Label>
                                    <Input
                                        className="mt-1"
                                        id="lastName"
                                        name="lastName"
                                        value={profileForm.lastName}
                                        onChange={handleProfileChange}
                                        disabled={
                                            updateProfileMutation.isPending
                                        }
                                    />
                                </div>
                            </div>
                            {/* Role Display */}
                            <div className="grid gap-1">
                                <Label htmlFor="profileRole">Role</Label>
                                <Badge
                                    variant="destructive"
                                    className="mt-2"
                                    id="profileRole"
                                >
                                    {user.role || "N/A"}
                                </Badge>
                            </div>
                            {/* Email Display & Change Button */}
                            <div className="grid gap-1">
                                <Label htmlFor="profileEmail">
                                    Email Address
                                </Label>
                                <div className="flex items-center justify-between">
                                    <p
                                        id="profileEmail"
                                        className="text-sm text-primary"
                                    >
                                        {user.email}
                                    </p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleOpenChangeEmailDialog}
                                    >
                                        Change Email
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
                {/* Profile Save/Cancel Footer */}
                <CardFooter className="flex justify-end gap-2 border-t pt-4">
                    <Button
                        variant="outline"
                        onClick={handleCancelProfileChanges}
                        disabled={
                            !profileHasChanges ||
                            updateProfileMutation.isPending
                        }
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSaveChanges}
                        disabled={
                            !profileHasChanges ||
                            updateProfileMutation.isPending
                        }
                    >
                        {updateProfileMutation.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}{" "}
                        Save Profile Changes
                    </Button>
                </CardFooter>
            </Card>

            {/* Appearance Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Appearance</CardTitle>
                    <CardDescription>
                        Customize the appearance of the application.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {" "}
                    {/* Removed space-y-4 if only one item */}
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Theme</Label>
                            <p className="text-sm text-muted-foreground">
                                Select your preferred theme.
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant={
                                    theme === "light" ? "default" : "outline"
                                }
                                size="sm"
                                onClick={() => setTheme("light")}
                                className="gap-1.5"
                            >
                                <Sun className="h-4 w-4" /> Light
                            </Button>
                            <Button
                                variant={
                                    theme === "dark" ? "default" : "outline"
                                }
                                size="sm"
                                onClick={() => setTheme("dark")}
                                className="gap-1.5"
                            >
                                <Moon className="h-4 w-4" /> Dark
                            </Button>
                            <Button
                                variant={
                                    theme === "system" ? "default" : "outline"
                                }
                                size="sm"
                                onClick={() => setTheme("system")}
                            >
                                System
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Change Password Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Password</CardTitle>
                    <CardDescription>
                        Change your account password using email verification.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        A verification code will be sent to your email address.
                    </p>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                    <Button
                        onClick={handleOpenChangePasswordDialog}
                        disabled={isRequestingCode}
                    >
                        {isRequestingCode ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        Change Password
                    </Button>
                </CardFooter>
            </Card>

            {/* Two-Factor Authentication Card (Optional) */}
            {/* <Card>
                <CardHeader>
                    <CardTitle>Two-Factor Authentication</CardTitle>
                    <CardDescription>
                        Add an extra layer of security to your account.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <Label htmlFor="two-factor">Enable Two-Factor Authentication</Label>
                        <Switch
                            id="two-factor"
                            checked={twoFactorEnabled}
                            onCheckedChange={setTwoFactorEnabled}
                        />
                    </div>
                </CardContent>
            </Card> */}

            {/* Delete Account Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Delete Account</CardTitle>
                    <CardDescription>
                        Permanently delete your account and all associated data.
                        This action cannot be undone.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        If you are sure, click the button below. You will be
                        asked to confirm.
                    </p>
                </CardContent>
                <CardFooter>
                    <Button variant="destructive" onClick={handleDeleteAccount}>
                        Delete Account
                    </Button>
                </CardFooter>
            </Card>

            {/* Change Password Dialog */}
            <Dialog
                open={isChangePasswordDialogOpen}
                onOpenChange={handleDialogClose}
            >
                <DialogContent className="sm:max-w-md">
                    {/* Step 1: Requesting Code */}
                    {passwordDialogStep === "request" && (
                        <>
                            <DialogHeader>
                                <DialogTitle>
                                    Requesting Verification Code
                                </DialogTitle>
                                <DialogDescription>
                                    Please wait...
                                </DialogDescription>
                            </DialogHeader>
                            <div className="flex justify-center items-center py-10">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        </>
                    )}
                    {/* Step 2: Verify Code */}
                    {passwordDialogStep === "verify" && (
                        <>
                            <DialogHeader>
                                <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit mb-2">
                                    <Mail className="h-6 w-6 text-primary" />
                                </div>
                                <DialogTitle className="text-center">
                                    Enter Verification Code
                                </DialogTitle>
                                <DialogDescription className="text-center">
                                    Sent to {user?.email}.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="flex justify-center">
                                    <InputOTP
                                        maxLength={6}
                                        value={otpCode}
                                        onChange={(value) => {
                                            setOtpCode(value);
                                            if (otpError) setOtpError(null);
                                        }}
                                    >
                                        <InputOTPGroup>
                                            <InputOTPSlot index={0} />
                                            <InputOTPSlot index={1} />
                                            <InputOTPSlot index={2} />
                                            <InputOTPSlot index={3} />
                                            <InputOTPSlot index={4} />
                                            <InputOTPSlot index={5} />
                                        </InputOTPGroup>
                                    </InputOTP>
                                </div>
                                {otpError && (
                                    <p className="text-sm text-destructive text-center">
                                        {otpError}
                                    </p>
                                )}
                            </div>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button type="button" variant="outline">
                                        Cancel
                                    </Button>
                                </DialogClose>
                                <Button
                                    type="button"
                                    onClick={handleOtpSubmit}
                                    disabled={
                                        isVerifyingCode || otpCode.length !== 6
                                    }
                                >
                                    {isVerifyingCode && (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    )}{" "}
                                    Verify Code
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                    {/* Step 3: Reset Password */}
                    {passwordDialogStep === "reset" && (
                        <>
                            <DialogHeader>
                                <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit mb-2">
                                    <KeyRound className="h-6 w-6 text-primary" />
                                </div>
                                <DialogTitle className="text-center">
                                    Set New Password
                                </DialogTitle>
                                <DialogDescription className="text-center">
                                    Enter and confirm below.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="newPasswordDialog">
                                        New Password
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="newPasswordDialog"
                                            name="newPassword"
                                            type={
                                                showNewPassword
                                                    ? "text"
                                                    : "password"
                                            }
                                            value={newPasswordForm.newPassword}
                                            onChange={
                                                handleNewPasswordInputChange
                                            }
                                            disabled={isSettingPassword}
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground"
                                            onClick={() =>
                                                setShowNewPassword(
                                                    !showNewPassword,
                                                )
                                            }
                                        >
                                            {showNewPassword ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </div>
                                    {newPasswordErrors?.nested?.newPassword && (
                                        <p className="text-sm text-destructive">
                                            {newPasswordErrors.nested.newPassword.join(
                                                ", ",
                                            )}
                                        </p>
                                    )}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="confirmPasswordDialog">
                                        Confirm New Password
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="confirmPasswordDialog"
                                            name="confirmPassword"
                                            type={
                                                showConfirmNewPassword
                                                    ? "text"
                                                    : "password"
                                            }
                                            value={
                                                newPasswordForm.confirmPassword
                                            }
                                            onChange={
                                                handleNewPasswordInputChange
                                            }
                                            disabled={isSettingPassword}
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground"
                                            onClick={() =>
                                                setShowConfirmNewPassword(
                                                    !showConfirmNewPassword,
                                                )
                                            }
                                        >
                                            {showConfirmNewPassword ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </div>
                                    {newPasswordErrors?.nested
                                        ?.confirmPassword && (
                                        <p className="text-sm text-destructive">
                                            {
                                                newPasswordErrors.nested
                                                    .confirmPassword[0]
                                            }
                                        </p>
                                    )}
                                    {newPasswordErrors?.root && (
                                        <p className="text-sm text-destructive">
                                            {newPasswordErrors.root[0]}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button type="button" variant="outline">
                                        Cancel
                                    </Button>
                                </DialogClose>
                                <Button
                                    type="button"
                                    onClick={handleSetNewPasswordSubmit}
                                    disabled={isSettingPassword}
                                >
                                    {isSettingPassword && (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    )}{" "}
                                    Set New Password
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                    {/* Step 4: Success */}
                    {passwordDialogStep === "success" && (
                        <>
                            <DialogHeader>
                                <div className="mx-auto bg-green-100 p-3 rounded-full w-fit mb-2">
                                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                                </div>
                                <DialogTitle className="text-center">
                                    Password Changed Successfully
                                </DialogTitle>
                                <DialogDescription className="text-center">
                                    Your account password has been updated.
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter className="pt-4">
                                <DialogClose asChild>
                                    <Button type="button" className="w-full">
                                        Close
                                    </Button>
                                </DialogClose>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
