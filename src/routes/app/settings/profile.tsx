import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useCurrentUser } from "@/lib/query";
import { createFileRoute } from "@tanstack/react-router";
import { Camera } from "lucide-react";
import type React from "react";
import { useState } from "react";
export const Route = createFileRoute("/app/settings/profile")({
    component: ProfileSettings,
});

function ProfileSettings() {
    const { data: user } = useCurrentUser();
    const [profile, setProfile] = useState({
        name: "Jane Doe",
        email: "jane@example.com",
        title: "Event Manager",
        bio: "Experienced event manager with a passion for creating memorable experiences.",
        avatar: "/placeholder.svg?height=100&width=100",
    });
    const name = user?.firstName.concat(" ", user?.lastName);
    const initials = user
        ? `${user.firstName?.charAt(0)}${user.lastName?.charAt(0)}`
        : "UV"; // Default initials

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
        const { name, value } = e.target;
        setProfile((prev) => ({ ...prev, [name]: value }));
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-semibold tracking-tight">
                    Profile Settings
                </h2>
                <p className="text-sm text-muted-foreground">
                    Manage your profile information and how it appears to
                    others.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Your Profile</CardTitle>
                    <CardDescription>
                        This information will be displayed publicly so be
                        careful what you share.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6">
                        <div className="relative">
                            <Avatar className="h-24 w-24">
                                <AvatarImage
                                    src={profile.avatar}
                                    alt={profile.name}
                                />
                                <AvatarFallback>{initials}</AvatarFallback>
                            </Avatar>
                            <Button
                                size="icon"
                                variant="secondary"
                                className="absolute bottom-0 right-0 h-8 w-8 rounded-full"
                            >
                                <Camera className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="space-y-4 flex-1">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    value={name}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="title">Job Title</Label>
                                <Input
                                    id="title"
                                    name="title"
                                    value={user?.role}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                    </div>

                    <Separator />

                    <div className="grid gap-2">
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea
                            id="bio"
                            name="bio"
                            value={profile.bio}
                            onChange={handleChange}
                            rows={4}
                            placeholder="Write a few sentences about yourself"
                        />
                        <p className="text-xs text-muted-foreground">
                            Brief description for your profile. URLs are
                            hyperlinked.
                        </p>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                    <Button variant="outline">Cancel</Button>
                    <Button>Save Changes</Button>
                </CardFooter>
            </Card>
        </div>
    );
}
