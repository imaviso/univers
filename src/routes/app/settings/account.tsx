import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useCurrentUser } from "@/lib/query";
import { createFileRoute } from "@tanstack/react-router";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useState } from "react";
export const Route = createFileRoute("/app/settings/account")({
    component: AccountSettings,
});

export function AccountSettings() {
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
    const { theme, setTheme } = useTheme();
    const { data: user } = useCurrentUser();

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-semibold tracking-tight">
                    Account Settings
                </h2>
                <p className="text-sm text-muted-foreground">
                    Manage your account settings and security preferences.
                </p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Appearance</CardTitle>
                    <CardDescription>
                        Customize the appearance of the application.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Theme</Label>
                            <p className="text-sm text-muted-foreground">
                                Select your preferred theme for the application.
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center space-x-2">
                                <Button
                                    variant={
                                        theme === "light"
                                            ? "default"
                                            : "outline"
                                    }
                                    size="sm"
                                    onClick={() => setTheme("light")}
                                    className="gap-2"
                                >
                                    <Sun className="h-4 w-4" />
                                    Light
                                </Button>
                                <Button
                                    variant={
                                        theme === "dark" ? "default" : "outline"
                                    }
                                    size="sm"
                                    onClick={() => setTheme("dark")}
                                    className="gap-2"
                                >
                                    <Moon className="h-4 w-4" />
                                    Dark
                                </Button>
                                <Button
                                    variant={
                                        theme === "system"
                                            ? "default"
                                            : "outline"
                                    }
                                    size="sm"
                                    onClick={() => setTheme("system")}
                                >
                                    System
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Email Address</CardTitle>
                    <CardDescription>
                        Update your email address associated with your account.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            defaultValue={user?.email}
                        />
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                    <Button variant="outline">Cancel</Button>
                    <Button>Update Email</Button>
                </CardFooter>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Change Password</CardTitle>
                    <CardDescription>
                        Update your password to maintain account security.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="current-password">
                            Current Password
                        </Label>
                        <Input id="current-password" type="password" />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="new-password">New Password</Label>
                        <Input id="new-password" type="password" />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="confirm-password">
                            Confirm New Password
                        </Label>
                        <Input id="confirm-password" type="password" />
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                    <Button variant="outline">Cancel</Button>
                    <Button>Update Password</Button>
                </CardFooter>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Two-Factor Authentication</CardTitle>
                    <CardDescription>
                        Add an extra layer of security to your account.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="font-medium">
                                Two-factor authentication
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Secure your account with two-factor
                                authentication.
                            </p>
                        </div>
                        <Switch
                            checked={twoFactorEnabled}
                            onCheckedChange={setTwoFactorEnabled}
                        />
                    </div>

                    {twoFactorEnabled && (
                        <div className="mt-4 rounded-md bg-muted p-4">
                            <p className="text-sm font-medium">
                                Two-factor authentication is enabled
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                You will be asked for an authentication code
                                when you sign in.
                            </p>
                            <Button
                                size="sm"
                                variant="outline"
                                className="mt-4"
                            >
                                Configure 2FA
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Delete Account</CardTitle>
                    <CardDescription>
                        Permanently delete your account and all of your data.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        Once you delete your account, there is no going back.
                        This action cannot be undone.
                    </p>
                </CardContent>
                <CardFooter>
                    <Button variant="destructive">Delete Account</Button>
                </CardFooter>
            </Card>
        </div>
    );
}
