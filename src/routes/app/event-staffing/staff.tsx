import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useAtom } from "jotai";
import { CalendarDays, MapPin, Phone, Users } from "lucide-react";
import { AddPersonnelDialog } from "@/components/event-staffing/addPersonnelDialog";
import { ManageAssignmentsDialog } from "@/components/event-staffing/manageAssignmentsDialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
	manageAssignmentsDialogAtom,
	selectedEventForAssignmentAtom,
} from "@/lib/atoms";
import { searchEventsQueryOptions } from "@/lib/query";
import type { EventPersonnelDTO } from "@/lib/types";
import { formatDateTime, getInitials, getStatusColor } from "@/lib/utils";

export const Route = createFileRoute("/app/event-staffing/staff")({
	component: EventStaff,
});

function EventStaff() {
	const [, setManageAssignmentsDialogOpen] = useAtom(
		manageAssignmentsDialogAtom,
	);
	const [, setSelectedEventId] = useAtom(selectedEventForAssignmentAtom);

	const { data: eventsData = [], isLoading: eventsLoading } = useQuery(
		searchEventsQueryOptions("ALL", "ALL", "startTime", undefined, undefined),
	);

	const allPersonnel: EventPersonnelDTO[] = eventsData.flatMap(
		(event) => event.assignedPersonnel || [],
	);

	const uniquePersonnel = allPersonnel.reduce(
		(acc: EventPersonnelDTO[], person) => {
			if (!acc.some((p) => p.publicId === person.publicId)) {
				acc.push(person);
			}
			return acc;
		},
		[],
	);

	const upcomingEvents = eventsData.filter((event) =>
		["APPROVED", "ONGOING"].includes(event.status),
	);

	if (eventsLoading) {
		return (
			<div className="bg-background">
				<div className="flex flex-col flex-1 overflow-hidden">
					<header className="flex items-center justify-between border-b px-6 h-[65px]">
						<h1 className="text-xl font-semibold">Event Staffing</h1>
					</header>
					<div className="p-6">
						<div className="text-center">Loading...</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="bg-background">
			<div className="flex flex-col flex-1 overflow-hidden">
				<header className="sticky top-0 z-10 flex items-center justify-between border-b px-6 h-[65px] bg-background">
					<h1 className="text-xl font-semibold">Event Staffing</h1>
				</header>

				<div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6">
					<Card>
						<CardContent className="p-6">
							<div className="flex items-center space-x-2">
								<Users className="w-5 h-5 text-primary" />
								<div>
									<p className="text-2xl font-bold">{uniquePersonnel.length}</p>
									<p className="text-sm text-muted-foreground">
										Total Personnel
									</p>
								</div>
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardContent className="p-6">
							<div className="flex items-center space-x-2">
								<CalendarDays className="w-5 h-5 text-accent" />
								<div>
									<p className="text-2xl font-bold">{upcomingEvents.length}</p>
									<p className="text-sm text-muted-foreground">
										Upcoming Events
									</p>
								</div>
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardContent className="p-6">
							<div className="flex items-center space-x-2">
								<MapPin className="w-5 h-5 text-yellow-500" />
								<div>
									<p className="text-2xl font-bold">{eventsData.length}</p>
									<p className="text-sm text-muted-foreground">Total Events</p>
								</div>
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardContent className="p-6">
							<div className="flex items-center space-x-2">
								<MapPin className="w-5 h-5 text-destructive" />
								<div>
									<p className="text-2xl font-bold">{allPersonnel.length}</p>
									<p className="text-sm text-muted-foreground">Assignments</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>

				<Separator className="my-4" />

				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
					{eventsData.map((event) => (
						<Card key={event.publicId}>
							<CardHeader>
								<div className="flex items-center justify-between">
									<div>
										<CardTitle className="text-xl">{event.eventName}</CardTitle>
										<CardDescription className="flex items-center space-x-4 mt-2">
											<span className="flex items-center space-x-1">
												<CalendarDays className="w-4 h-4" />
												<span>
													{formatDateTime(event.startTime)} -{" "}
													{formatDateTime(event.endTime)}
												</span>
											</span>
											<span className="flex items-center space-x-1">
												<MapPin className="w-4 h-4" />
												<span>
													{event.eventVenue.name}
													{event.eventVenue.location
														? ` • ${event.eventVenue.location}`
														: ""}
												</span>
											</span>
										</CardDescription>
									</div>
									<Badge className={getStatusColor(event.status)}>
										{event.status}
									</Badge>
								</div>
							</CardHeader>
							<CardContent className="flex flex-col h-full">
								<div className="flex-1 space-y-4">
									<div className="flex items-center justify-between">
										<span className="text-sm font-medium">
											Assigned Staff ({event.assignedPersonnel?.length || 0})
										</span>
									</div>
									{event.assignedPersonnel?.length ? (
										<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
											{event.assignedPersonnel.map((staff) => (
												<div
													key={staff.publicId}
													className="flex items-center space-x-2 p-2 rounded-lg bg-muted/30"
												>
													<Avatar className="h-8 w-8">
														<AvatarFallback className="text-xs">
															{getInitials(staff.name)}
														</AvatarFallback>
													</Avatar>
													<div className="flex-1 min-w-0">
														<div className="font-medium text-sm truncate">
															{staff.name}
														</div>
														<div className="text-xs text-muted-foreground flex items-center gap-1">
															<Phone className="w-3 h-3" />
															<span className="truncate">
																{staff.phoneNumber}
															</span>
														</div>
													</div>
												</div>
											))}
										</div>
									) : (
										<div className="text-sm text-muted-foreground">
											No staff assigned.
										</div>
									)}
								</div>
								<Button
									className="w-full bg-transparent mt-4"
									variant="outline"
									onClick={() => {
										setSelectedEventId(event.publicId);
										setManageAssignmentsDialogOpen(true);
									}}
								>
									Manage Assignments
								</Button>
							</CardContent>
						</Card>
					))}
				</div>

				{eventsData.length === 0 && (
					<div className="text-center text-muted-foreground py-8">
						No events found.
					</div>
				)}
			</div>

			{/* Dialogs */}
			<AddPersonnelDialog />
			<ManageAssignmentsDialog />
		</div>
	);
}
