import { createFileRoute } from "@tanstack/react-router";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
export const Route = createFileRoute("/app/settings/notifications")({
	component: NotificationSettings,
});
export function NotificationSettings() {
	const [notifications, setNotifications] = useState({
		eventReminders: true,
		eventUpdates: true,
		weeklyDigest: false,
		marketingEmails: false,
	});

	const handleToggle = (key: keyof typeof notifications) => {
		setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
	};

	const id = useId();
	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-2xl font-semibold tracking-tight">
					Notification Settings
				</h2>
				<p className="text-sm text-muted-foreground">
					Manage how and when you receive notifications.
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Event Notifications</CardTitle>
					<CardDescription>
						Control notifications related to events you're involved with.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex items-center justify-between">
						<div className="space-y-0.5">
							<Label htmlFor="event-reminders">Event reminders</Label>
							<p className="text-sm text-muted-foreground">
								Receive notifications before events start.
							</p>
						</div>
						<Switch
							id={`${id}event-reminders`}
							checked={notifications.eventReminders}
							onCheckedChange={() => handleToggle("eventReminders")}
						/>
					</div>
					<Separator />
					<div className="flex items-center justify-between">
						<div className="space-y-0.5">
							<Label htmlFor="event-updates">Event updates</Label>
							<p className="text-sm text-muted-foreground">
								Receive notifications when events are updated.
							</p>
						</div>
						<Switch
							id={`${id}event-updates`}
							checked={notifications.eventUpdates}
							onCheckedChange={() => handleToggle("eventUpdates")}
						/>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Email Preferences</CardTitle>
					<CardDescription>
						Control what types of emails you receive.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex items-center justify-between">
						<div className="space-y-0.5">
							<Label htmlFor="weekly-digest">Weekly digest</Label>
							<p className="text-sm text-muted-foreground">
								Receive a weekly summary of your events and tasks.
							</p>
						</div>
						<Switch
							id={`${id}weekly-digest`}
							checked={notifications.weeklyDigest}
							onCheckedChange={() => handleToggle("weeklyDigest")}
						/>
					</div>
					<Separator />
					<div className="flex items-center justify-between">
						<div className="space-y-0.5">
							<Label htmlFor="marketing-emails">Marketing emails</Label>
							<p className="text-sm text-muted-foreground">
								Receive emails about new features and promotions.
							</p>
						</div>
						<Switch
							id={`${id}marketing-emails`}
							checked={notifications.marketingEmails}
							onCheckedChange={() => handleToggle("marketingEmails")}
						/>
					</div>
				</CardContent>
			</Card>

			<div className="flex justify-end">
				<Button>Save Preferences</Button>
			</div>
		</div>
	);
}
