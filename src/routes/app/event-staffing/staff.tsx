import { createFileRoute } from "@tanstack/react-router";
import {
	CalendarDays,
	Clock,
	Mail,
	MapPin,
	Phone,
	Plus,
	Search,
	Users,
} from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Event, Personnel, UserRole } from "@/lib/types";
import { formatDateTime, getInitials, getStatusColor } from "@/lib/utils";

export const Route = createFileRoute("/app/event-staffing/staff")({
	component: EventStaff,
});

const getPersonnelStatusColor = (status: Personnel["status"]) => {
	switch (status) {
		case "Available":
			return "bg-maroon/10 text-maroon";
		case "Busy":
			return "bg-gold/10 text-gold";
		case "Unavailable":
			return "bg-destructive/10 text-destructive";
		default:
			return "bg-muted text-muted-foreground";
	}
};

const mockPersonnel: Personnel[] = [
	{
		publicId: "1",
		name: "Sarah Johnson",
		email: "sarah@example.com",
		phoneNumber: "+1 (555) 123-4567",
		status: "Available",
		avatar: undefined,
	},
	{
		publicId: "2",
		name: "Mike Chen",
		email: "mike@example.com",
		phoneNumber: "+1 (555) 234-5678",
		status: "Busy",
		avatar: undefined,
	},
	{
		publicId: "3",
		name: "Emily Davis",
		email: "emily@example.com",
		phoneNumber: "+1 (555) 345-6789",
		status: "Available",
		avatar: undefined,
	},
	{
		publicId: "4",
		name: "James Wilson",
		email: "james@example.com",
		phoneNumber: "+1 (555) 456-7890",
		status: "Unavailable",
		avatar: undefined,
	},
];

const sampleDepartment = {
	publicId: "dept-1",
	name: "College of Computer Studies (CCS)",
	description: null,
	deptHead: null,
	createdAt: "2024-01-01T00:00:00Z",
	updatedAt: "2024-01-01T00:00:00Z",
};

const sampleVenue = {
	publicId: "venue-1",
	name: "Convention Center",
	location: "Main City",
	venueOwner: null,
	imagePath: null,
	createdAt: "2024-01-01T00:00:00Z",
	updatedAt: "2024-01-01T00:00:00Z",
};

const sampleOrganizer = {
	publicId: "user-1",
	email: "organizer@example.com",
	firstName: "Olivia",
	lastName: "Brown",
	password: undefined,
	confirmPassword: undefined,
	idNumber: null,
	phoneNumber: null,
	telephoneNumber: null,
	roles: ["ORGANIZER"] as UserRole[],
	department: sampleDepartment,
	emailVerified: true,
	active: true,
	createdAt: "2024-01-01T00:00:00Z",
	updatedAt: "2024-01-01T00:00:00Z",
	profileImagePath: null,
};

const mockEvents: Event[] = [
	{
		publicId: "evt-1",
		eventName: "Annual Conference 2024",
		eventType: "Conference",
		organizer: sampleOrganizer,
		approvedLetterUrl: null,
		imageUrl: null,
		eventVenue: sampleVenue,
		department: sampleDepartment,
		startTime: "2024-03-15T09:00:00Z",
		endTime: "2024-03-15T17:00:00Z",
		status: "RESERVED",
		staffAssigned: mockPersonnel[0]!,
	},
	{
		publicId: "evt-2",
		eventName: "Product Launch Event",
		eventType: "Launch",
		organizer: sampleOrganizer,
		approvedLetterUrl: null,
		imageUrl: null,
		eventVenue: { ...sampleVenue, publicId: "venue-2", name: "Downtown Hotel" },
		department: sampleDepartment,
		startTime: "2024-03-22T10:00:00Z",
		endTime: "2024-03-22T13:00:00Z",
		status: "PENDING",
		staffAssigned: mockPersonnel[1]!,
	},
	{
		publicId: "evt-3",
		eventName: "Charity Gala",
		eventType: "Gala",
		organizer: sampleOrganizer,
		approvedLetterUrl: null,
		imageUrl: null,
		eventVenue: { ...sampleVenue, publicId: "venue-3", name: "Grand Ballroom" },
		department: sampleDepartment,
		startTime: "2024-04-05T18:00:00Z",
		endTime: "2024-04-05T22:00:00Z",
		status: "ONGOING",
		staffAssigned: mockPersonnel[2],
	},
];

function EventStaff() {
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedStatus, setSelectedStatus] = useState<
		"all" | Personnel["status"]
	>("all");

	const filteredPersonnel = mockPersonnel.filter((person) => {
		const needle = searchTerm.toLowerCase();
		const matchesSearch =
			person.name.toLowerCase().includes(needle) ||
			person.email.toLowerCase().includes(needle) ||
			person.phoneNumber.toLowerCase().includes(needle);
		const matchesStatus =
			selectedStatus === "all" || person.status === selectedStatus;
		return matchesSearch && matchesStatus;
	});

	return (
		<div className="bg-background">
			<div className="flex flex-col flex-1 overflow-hidden">
				<header className="flex items-center justify-between border-b px-6 h-[65px]">
					<h1 className="text-xl font-semibold">Event Staffing</h1>
					<div className="flex items-center gap-2">
						<div className="relative" />
						<Button onClick={() => {}} size="sm" className="gap-1">
							<Plus className="h-4 w-4" />
							Add Staff
						</Button>
					</div>
				</header>

				<div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 pb-0">
					<Card>
						<CardContent className="p-6">
							<div className="flex items-center space-x-2">
								<Users className="w-5 h-5 text-primary" />
								<div>
									<p className="text-2xl font-bold">{mockPersonnel.length}</p>
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
									<p className="text-2xl font-bold">{mockEvents.length}</p>
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
								<Clock className="w-5 h-5 text-yellow-500" />
								<div>
									<p className="text-2xl font-bold">
										{
											mockPersonnel.filter((p) => p.status === "Available")
												.length
										}
									</p>
									<p className="text-sm text-muted-foreground">Available Now</p>
								</div>
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardContent className="p-6">
							<div className="flex items-center space-x-2">
								<MapPin className="w-5 h-5 text-destructive" />
								<div>
									<p className="text-2xl font-bold">{mockEvents.length}</p>
									<p className="text-sm text-muted-foreground">Assignments</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
				{/* Main Content */}
				<Tabs defaultValue="personnel" className="space-y-6 p-6">
					<TabsList className="grid w-full grid-cols-2">
						<TabsTrigger value="personnel">Personnel Directory</TabsTrigger>
						<TabsTrigger value="events">Event Scheduling</TabsTrigger>
					</TabsList>

					<TabsContent value="personnel" className="space-y-4">
						{/* Search and Filter */}
						<div className="flex flex-col sm:flex-row gap-4">
							<div className="relative flex-1">
								<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
								<Input
									placeholder="Search personnel..."
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									className="pl-10"
								/>
							</div>
							<div className="flex gap-2">
								<Button
									variant={selectedStatus === "all" ? "default" : "outline"}
									onClick={() => setSelectedStatus("all")}
									size="sm"
								>
									All
								</Button>
								<Button
									variant={
										selectedStatus === "Available" ? "default" : "outline"
									}
									onClick={() => setSelectedStatus("Available")}
									size="sm"
								>
									Available
								</Button>
								<Button
									variant={selectedStatus === "Busy" ? "default" : "outline"}
									onClick={() => setSelectedStatus("Busy")}
									size="sm"
								>
									Busy
								</Button>
								<Button
									variant={
										selectedStatus === "Unavailable" ? "default" : "outline"
									}
									onClick={() => setSelectedStatus("Unavailable")}
									size="sm"
								>
									Unavailable
								</Button>
							</div>
						</div>

						{/* Personnel Grid */}
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{filteredPersonnel.map((person) => (
								<Card
									key={person.publicId}
									className="hover:shadow-md transition-shadow"
								>
									<CardHeader className="pb-3">
										<div className="flex items-center space-x-3">
											<Avatar>
												<AvatarImage
													src={person.avatar || "/placeholder.svg"}
												/>
												<AvatarFallback>
													{getInitials(person.name)}
												</AvatarFallback>
											</Avatar>
											<div className="flex grow">
												<CardTitle className="text-lg">{person.name}</CardTitle>
												<CardDescription>&nbsp;</CardDescription>
											</div>
											<Badge className={getPersonnelStatusColor(person.status)}>
												{person.status}
											</Badge>
										</div>
									</CardHeader>
									<CardContent className="space-y-3">
										<div className="flex items-center space-x-2 text-sm text-muted-foreground">
											<Mail className="w-4 h-4" />
											<span>{person.email}</span>
										</div>
										<div className="flex items-center space-x-2 text-sm text-muted-foreground">
											<Phone className="w-4 h-4" />
											<span>{person.phoneNumber}</span>
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					</TabsContent>

					<TabsContent value="events" className="space-y-4">
						<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
							{mockEvents.map((event) => (
								<Card key={event.publicId}>
									<CardHeader>
										<div className="flex items-center justify-between">
											<div>
												<CardTitle className="text-xl">
													{event.eventName}
												</CardTitle>
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
									<CardContent className="space-y-4">
										<div className="flex items-center justify-between">
											<span className="text-sm font-medium">
												Assigned Staff
											</span>
											{event.staffAssigned && (
												<Badge
													className={getPersonnelStatusColor(
														event.staffAssigned.status,
													)}
												>
													{event.staffAssigned.status}
												</Badge>
											)}
										</div>
										{event.staffAssigned ? (
											<div className="flex items-center space-x-3">
												<Avatar>
													<AvatarImage
														src={
															event.staffAssigned.avatar || "/placeholder.svg"
														}
													/>
													<AvatarFallback>
														{getInitials(event.staffAssigned.name)}
													</AvatarFallback>
												</Avatar>
												<div className="space-y-1">
													<div className="font-medium">
														{event.staffAssigned.name}
													</div>
													<div className="text-sm text-muted-foreground flex items-center gap-3">
														<span className="inline-flex items-center gap-1">
															<Mail className="w-4 h-4" />
															<span>{event.staffAssigned.email}</span>
														</span>
														<span className="inline-flex items-center gap-1">
															<Phone className="w-4 h-4" />
															<span>{event.staffAssigned.phoneNumber}</span>
														</span>
													</div>
												</div>
											</div>
										) : (
											<div className="text-sm text-muted-foreground">
												No staff assigned.
											</div>
										)}
										<Button className="w-full bg-transparent" variant="outline">
											Manage Assignments
										</Button>
									</CardContent>
								</Card>
							))}
						</div>
					</TabsContent>
				</Tabs>
			</div>
		</div>
	);
}
