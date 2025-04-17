import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
    ArrowLeft,
    Calendar,
    CheckCircle2,
    Circle,
    Clock,
    Download,
    Edit,
    FileText,
    MapPin,
    MoreHorizontal,
    Plus,
    Share2,
    Trash2,
    Users,
} from "lucide-react";
import { useState } from "react";

import {
    Link,
    createFileRoute,
    useRouteContext,
    useRouter,
} from "@tanstack/react-router";

export const Route = createFileRoute("/app/events/$eventId")({
    component: EventDetailsPage,
    // loader: async ({ params: { eventId } }) => {
    //     const reservation = eventData.find(
    //         (r) => r.id.toString() === eventId,
    //     );

    //     if (!reservation) {
    //         throw new Error("Reservation not found");
    //     }

    //     return {
    //         reservation,
    //     };
    // },
});

// Sample event data
const eventData = {
    id: "1",
    idNumber: "EVT-2024-001",
    title: "Annual Tech Conference",
    date: "May 15-17, 2024",
    startTime: "09:00 AM",
    endTime: "06:00 PM",
    location: "San Francisco Convention Center",
    address: "747 Howard St, San Francisco, CA 94103",
    status: "planning",
    progress: 25,
    attendees: 1200,
    description:
        "Our annual technology conference bringing together industry leaders, innovators, and tech enthusiasts for three days of learning, networking, and inspiration. This year's theme focuses on AI and sustainable technology.",
    organizer: {
        name: "Alex Johnson",
        role: "Event Lead",
        idNumber: "ORG-2024-001",
        email: "alex.johnson@example.com",
        phone: "+1 (555) 123-4567",
        avatar: "/placeholder.svg?height=40&width=40",
    },
    team: [
        {
            id: 1,
            name: "Alex Johnson",
            role: "Event Lead",
            idNumber: "EMP-001",
            avatar: "/placeholder.svg?height=40&width=40",
        },
        {
            id: 2,
            name: "Maria Garcia",
            role: "Marketing",
            idNumber: "EMP-002",
            avatar: "/placeholder.svg?height=40&width=40",
        },
        {
            id: 3,
            name: "Sam Lee",
            role: "Logistics",
            idNumber: "EMP-003",
            avatar: "/placeholder.svg?height=40&width=40",
        },
        {
            id: 4,
            name: "Taylor Swift",
            role: "Speaker Coordinator",
            idNumber: "EMP-004",
            avatar: "/placeholder.svg?height=40&width=40",
        },
    ],
    tasks: [
        {
            id: 1,
            title: "Book venue",
            status: "completed",
            assignee: "Alex Johnson",
            dueDate: "Feb 15, 2024",
        },
        {
            id: 2,
            title: "Confirm speakers",
            status: "in-progress",
            assignee: "Taylor Swift",
            dueDate: "Apr 1, 2024",
        },
        {
            id: 3,
            title: "Finalize agenda",
            status: "in-progress",
            assignee: "Alex Johnson",
            dueDate: "Apr 15, 2024",
        },
        {
            id: 4,
            title: "Send invitations",
            status: "todo",
            assignee: "Maria Garcia",
            dueDate: "Apr 20, 2024",
        },
        {
            id: 5,
            title: "Arrange catering",
            status: "todo",
            assignee: "Sam Lee",
            dueDate: "May 1, 2024",
        },
        {
            id: 6,
            title: "Set up registration page",
            status: "completed",
            assignee: "Maria Garcia",
            dueDate: "Mar 10, 2024",
        },
    ],
    agenda: [
        {
            day: "Day 1 - May 15",
            sessions: [
                {
                    time: "08:00 - 09:00",
                    title: "Registration & Breakfast",
                    type: "break",
                },
                {
                    time: "09:00 - 10:00",
                    title: "Opening Keynote: The Future of AI",
                    type: "keynote",
                },
                {
                    time: "10:15 - 11:15",
                    title: "Panel: Sustainable Technology",
                    type: "panel",
                },
                {
                    time: "11:30 - 12:30",
                    title: "Workshop: Cloud Computing",
                    type: "workshop",
                },
                { time: "12:30 - 13:30", title: "Lunch Break", type: "break" },
                {
                    time: "13:30 - 14:30",
                    title: "Technical Session: Blockchain",
                    type: "technical",
                },
                {
                    time: "14:45 - 15:45",
                    title: "Technical Session: Machine Learning",
                    type: "technical",
                },
                {
                    time: "16:00 - 17:00",
                    title: "Networking Event",
                    type: "networking",
                },
            ],
        },
        {
            day: "Day 2 - May 16",
            sessions: [
                { time: "08:30 - 09:00", title: "Breakfast", type: "break" },
                {
                    time: "09:00 - 10:00",
                    title: "Keynote: Industry Trends",
                    type: "keynote",
                },
                {
                    time: "10:15 - 11:15",
                    title: "Technical Session: DevOps",
                    type: "technical",
                },
                {
                    time: "11:30 - 12:30",
                    title: "Workshop: UX Design",
                    type: "workshop",
                },
                { time: "12:30 - 13:30", title: "Lunch Break", type: "break" },
                {
                    time: "13:30 - 14:30",
                    title: "Panel: Diversity in Tech",
                    type: "panel",
                },
                {
                    time: "14:45 - 15:45",
                    title: "Technical Session: Mobile Development",
                    type: "technical",
                },
                {
                    time: "16:00 - 17:00",
                    title: "Startup Showcase",
                    type: "special",
                },
                {
                    time: "19:00 - 21:00",
                    title: "Conference Dinner",
                    type: "special",
                },
            ],
        },
        {
            day: "Day 3 - May 17",
            sessions: [
                { time: "08:30 - 09:00", title: "Breakfast", type: "break" },
                {
                    time: "09:00 - 10:00",
                    title: "Technical Session: Security",
                    type: "technical",
                },
                {
                    time: "10:15 - 11:15",
                    title: "Workshop: Data Science",
                    type: "workshop",
                },
                {
                    time: "11:30 - 12:30",
                    title: "Panel: Future of Work",
                    type: "panel",
                },
                { time: "12:30 - 13:30", title: "Lunch Break", type: "break" },
                {
                    time: "13:30 - 14:30",
                    title: "Technical Session: AR/VR",
                    type: "technical",
                },
                {
                    time: "14:45 - 15:45",
                    title: "Closing Keynote",
                    type: "keynote",
                },
                {
                    time: "16:00 - 17:00",
                    title: "Closing Remarks & Networking",
                    type: "networking",
                },
            ],
        },
    ],
    equipment: [
        {
            id: 1,
            name: "Projector",
            idNumber: "EQ-001",
            quantity: 5,
            status: "confirmed",
        },
        {
            id: 2,
            name: "Microphone",
            idNumber: "EQ-002",
            quantity: 10,
            status: "confirmed",
        },
        {
            id: 3,
            name: "Laptop",
            idNumber: "EQ-003",
            quantity: 3,
            status: "pending",
        },
        {
            id: 4,
            name: "Speaker System",
            idNumber: "EQ-004",
            quantity: 2,
            status: "confirmed",
        },
        {
            id: 5,
            name: "Whiteboard",
            idNumber: "EQ-005",
            quantity: 4,
            status: "confirmed",
        },
    ],
    documents: [
        {
            id: 1,
            name: "Event Proposal.pdf",
            size: "2.4 MB",
            lastUpdated: "Jan 15, 2024",
        },
        {
            id: 2,
            name: "Speaker Guidelines.docx",
            size: "1.2 MB",
            lastUpdated: "Feb 10, 2024",
        },
        {
            id: 3,
            name: "Venue Contract.pdf",
            size: "3.5 MB",
            lastUpdated: "Feb 20, 2024",
        },
        {
            id: 4,
            name: "Marketing Plan.pptx",
            size: "5.1 MB",
            lastUpdated: "Mar 5, 2024",
        },
    ],
    relatedEvents: [
        {
            id: 1,
            title: "Pre-conference Workshop",
            idNumber: "EVT-2024-002",
            date: "May 14, 2024",
            status: "confirmed",
        },
        {
            id: 2,
            title: "Speaker Dinner",
            idNumber: "EVT-2024-003",
            date: "May 15, 2024",
            status: "confirmed",
        },
        {
            id: 3,
            title: "After-party",
            idNumber: "EVT-2024-004",
            date: "May 17, 2024",
            status: "planning",
        },
    ],
    comments: [
        {
            id: 1,
            author: "Alex Johnson",
            avatar: "/placeholder.svg?height=32&width=32",
            content:
                "I've confirmed the venue booking. We're all set for the dates.",
            timestamp: "2 days ago",
        },
        {
            id: 2,
            author: "Maria Garcia",
            avatar: "/placeholder.svg?height=32&width=32",
            content:
                "Registration page is live now. I'll start the email campaign next week.",
            timestamp: "1 day ago",
        },
        {
            id: 3,
            author: "Taylor Swift",
            avatar: "/placeholder.svg?height=32&width=32",
            content:
                "We have 8 speakers confirmed so far. Still waiting to hear back from 3 more.",
            timestamp: "5 hours ago",
        },
    ],
};

const getStatusColor = (status: string) => {
    switch (status) {
        case "planning":
            return "bg-blue-500/10 text-blue-500";
        case "confirmed":
            return "bg-green-500/10 text-green-500";
        case "completed":
            return "bg-purple-500/10 text-purple-500";
        case "pending":
            return "bg-yellow-500/10 text-yellow-500";
        default:
            return "bg-gray-500/10 text-gray-500";
    }
};

const getTaskStatusIcon = (status: string) => {
    switch (status) {
        case "completed":
            return <CheckCircle2 className="h-4 w-4 text-green-500" />;
        case "in-progress":
            return (
                <Circle className="h-4 w-4 text-blue-500 fill-blue-500/50" />
            );
        case "todo":
            return <Circle className="h-4 w-4 text-muted-foreground" />;
        default:
            return <Circle className="h-4 w-4 text-muted-foreground" />;
    }
};

const getSessionTypeColor = (type: string) => {
    switch (type) {
        case "keynote":
            return "bg-purple-500/10 text-purple-500";
        case "panel":
            return "bg-blue-500/10 text-blue-500";
        case "workshop":
            return "bg-green-500/10 text-green-500";
        case "technical":
            return "bg-orange-500/10 text-orange-500";
        case "networking":
            return "bg-pink-500/10 text-pink-500";
        case "special":
            return "bg-indigo-500/10 text-indigo-500";
        case "break":
            return "bg-gray-500/10 text-gray-500";
        default:
            return "bg-gray-500/10 text-gray-500";
    }
};

export function EventDetailsPage() {
    const context = useRouteContext({ from: "/app/events" });
    const role = "role" in context ? context.role : "USER";
    const [commentText, setCommentText] = useState("");
    const router = useRouter();
    const onBack = () => router.history.back();
    // In a real app, you would fetch the event data based on the ID
    const event = eventData;

    const handleAddComment = () => {
        if (commentText.trim()) {
            // In a real app, you would add the comment to the database
            console.log("Adding comment:", commentText);
            setCommentText("");
        }
    };

    return (
        <div className="flex h-screen bg-background">
            <div className="flex flex-col flex-1 overflow-hidden">
                <header className="flex items-center justify-between border-b px-6 py-3.5">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onBack()}
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <h1 className="text-xl font-semibold">{event.title}</h1>
                        <Badge className={`${getStatusColor(event.status)}`}>
                            {event.status.charAt(0).toUpperCase() +
                                event.status.slice(1)}
                        </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                        {role === "SUPER_ADMIN" && (
                            <>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-1"
                                >
                                    <Edit className="h-4 w-4" />
                                    Edit
                                </Button>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem>
                                            Duplicate
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                            Archive
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="text-destructive">
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </>
                        )}
                    </div>
                </header>
                <main className="flex-1 overflow-auto">
                    <div className="p-6 space-y-6">
                        {/* Event Overview Card */}
                        <Card>
                            <CardHeader className="pb-2">
                                <h2 className="text-lg font-medium">
                                    Event Overview
                                </h2>
                            </CardHeader>
                            <CardContent>
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <h3 className="text-sm font-medium text-muted-foreground">
                                                    ID Number
                                                </h3>
                                                <p className="text-sm font-medium">
                                                    {event.idNumber}
                                                </p>
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-medium text-muted-foreground">
                                                    Status
                                                </h3>
                                                <Badge
                                                    className={`${getStatusColor(event.status)} mt-1`}
                                                >
                                                    {event.status
                                                        .charAt(0)
                                                        .toUpperCase() +
                                                        event.status.slice(1)}
                                                </Badge>
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="text-sm font-medium text-muted-foreground">
                                                Date & Time
                                            </h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-sm">
                                                    {event.date}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Clock className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-sm">
                                                    {event.startTime} -{" "}
                                                    {event.endTime}
                                                </span>
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="text-sm font-medium text-muted-foreground">
                                                Location
                                            </h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-sm">
                                                    {event.location}
                                                </span>
                                            </div>
                                            <p className="text-sm text-muted-foreground ml-6">
                                                {event.address}
                                            </p>
                                        </div>

                                        <div>
                                            <h3 className="text-sm font-medium text-muted-foreground">
                                                Attendees
                                            </h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Users className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-sm">
                                                    {event.attendees.toLocaleString()}{" "}
                                                    expected
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <h3 className="text-sm font-medium text-muted-foreground">
                                                Organizer
                                            </h3>
                                            <div className="flex items-center gap-3 mt-2">
                                                <Avatar className="h-10 w-10">
                                                    <AvatarImage
                                                        src={
                                                            event.organizer
                                                                .avatar
                                                        }
                                                    />
                                                    <AvatarFallback>
                                                        {
                                                            event.organizer
                                                                .name[0]
                                                        }
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <div className="text-sm font-medium">
                                                        {event.organizer.name}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {event.organizer.role}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="mt-2 ml-13 space-y-1">
                                                <div className="text-xs text-muted-foreground">
                                                    ID:{" "}
                                                    {event.organizer.idNumber}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {event.organizer.email}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {event.organizer.phone}
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="text-sm font-medium text-muted-foreground">
                                                Description
                                            </h3>
                                            <p className="text-sm mt-1">
                                                {event.description}
                                            </p>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between text-sm">
                                                <span>Progress</span>
                                                <span>{event.progress}%</span>
                                            </div>
                                            <Progress
                                                value={event.progress}
                                                className="h-2"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Tabbed Content */}
                        <Tabs defaultValue="agenda">
                            <TabsList className="grid w-full grid-cols-5">
                                <TabsTrigger value="agenda">Agenda</TabsTrigger>
                                <TabsTrigger value="team">Team</TabsTrigger>
                                <TabsTrigger value="tasks">Tasks</TabsTrigger>
                                <TabsTrigger value="resources">
                                    Resources
                                </TabsTrigger>
                                <TabsTrigger value="comments">
                                    Comments
                                </TabsTrigger>
                            </TabsList>

                            {/* Agenda Tab */}
                            <TabsContent
                                value="agenda"
                                className="mt-4 space-y-4"
                            >
                                {event.agenda.map((day, index) => (
                                    <Card key={index}>
                                        <CardHeader className="pb-2">
                                            <h3 className="text-lg font-medium">
                                                {day.day}
                                            </h3>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-2">
                                                {day.sessions.map(
                                                    (session, sessionIndex) => (
                                                        <div
                                                            key={sessionIndex}
                                                            className="flex items-center justify-between p-2 rounded-md hover:bg-muted"
                                                        >
                                                            <div className="flex items-center gap-4">
                                                                <div className="text-sm font-medium w-32">
                                                                    {
                                                                        session.time
                                                                    }
                                                                </div>
                                                                <div className="text-sm">
                                                                    {
                                                                        session.title
                                                                    }
                                                                </div>
                                                            </div>
                                                            <Badge
                                                                className={`${getSessionTypeColor(session.type)}`}
                                                            >
                                                                {session.type
                                                                    .charAt(0)
                                                                    .toUpperCase() +
                                                                    session.type.slice(
                                                                        1,
                                                                    )}
                                                            </Badge>
                                                        </div>
                                                    ),
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </TabsContent>

                            {/* Team Tab */}
                            <TabsContent value="team" className="mt-4">
                                <Card>
                                    <CardHeader className="pb-2 flex flex-row items-center justify-between">
                                        <h3 className="text-lg font-medium">
                                            Team Members
                                        </h3>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="gap-1"
                                        >
                                            <Plus className="h-4 w-4" />
                                            Add Team Member
                                        </Button>
                                    </CardHeader>
                                    <CardContent>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Name</TableHead>
                                                    <TableHead>
                                                        ID Number
                                                    </TableHead>
                                                    <TableHead>Role</TableHead>
                                                    <TableHead className="text-right">
                                                        Actions
                                                    </TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {event.team.map((member) => (
                                                    <TableRow key={member.id}>
                                                        <TableCell>
                                                            <div className="flex items-center gap-3">
                                                                <Avatar className="h-8 w-8">
                                                                    <AvatarImage
                                                                        src={
                                                                            member.avatar
                                                                        }
                                                                    />
                                                                    <AvatarFallback>
                                                                        {
                                                                            member
                                                                                .name[0]
                                                                        }
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <span>
                                                                    {
                                                                        member.name
                                                                    }
                                                                </span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            {member.idNumber}
                                                        </TableCell>
                                                        <TableCell>
                                                            {member.role}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8"
                                                            >
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Tasks Tab */}
                            <TabsContent value="tasks" className="mt-4">
                                <Card>
                                    <CardHeader className="pb-2 flex flex-row items-center justify-between">
                                        <h3 className="text-lg font-medium">
                                            Tasks
                                        </h3>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="gap-1"
                                        >
                                            <Plus className="h-4 w-4" />
                                            Add Task
                                        </Button>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            {event.tasks.map((task) => (
                                                <div
                                                    key={task.id}
                                                    className="flex items-center justify-between p-2 rounded-md hover:bg-muted"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        {getTaskStatusIcon(
                                                            task.status,
                                                        )}
                                                        <span className="text-sm">
                                                            {task.title}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-xs text-muted-foreground">
                                                            Due: {task.dueDate}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {task.assignee}
                                                        </span>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6"
                                                        >
                                                            <MoreHorizontal className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Resources Tab */}
                            <TabsContent
                                value="resources"
                                className="mt-4 space-y-4"
                            >
                                {/* Equipment */}
                                <Card>
                                    <CardHeader className="pb-2">
                                        <h3 className="text-lg font-medium">
                                            Equipment
                                        </h3>
                                    </CardHeader>
                                    <CardContent>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Name</TableHead>
                                                    <TableHead>
                                                        ID Number
                                                    </TableHead>
                                                    <TableHead>
                                                        Quantity
                                                    </TableHead>
                                                    <TableHead>
                                                        Status
                                                    </TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {event.equipment.map((item) => (
                                                    <TableRow key={item.id}>
                                                        <TableCell>
                                                            {item.name}
                                                        </TableCell>
                                                        <TableCell>
                                                            {item.idNumber}
                                                        </TableCell>
                                                        <TableCell>
                                                            {item.quantity}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge
                                                                className={`${getStatusColor(item.status)}`}
                                                            >
                                                                {item.status
                                                                    .charAt(0)
                                                                    .toUpperCase() +
                                                                    item.status.slice(
                                                                        1,
                                                                    )}
                                                            </Badge>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>

                                {/* Documents */}
                                <Card>
                                    <CardHeader className="pb-2">
                                        <h3 className="text-lg font-medium">
                                            Documents
                                        </h3>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            {event.documents.map((doc) => (
                                                <div
                                                    key={doc.id}
                                                    className="flex items-center justify-between p-2 rounded-md hover:bg-muted"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                                        <span className="text-sm">
                                                            {doc.name}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-xs text-muted-foreground">
                                                            {doc.size}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">
                                                            Updated:{" "}
                                                            {doc.lastUpdated}
                                                        </span>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6"
                                                        >
                                                            <Download className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Related Events */}
                                <Card>
                                    <CardHeader className="pb-2">
                                        <h3 className="text-lg font-medium">
                                            Related Events
                                        </h3>
                                    </CardHeader>
                                    <CardContent>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>
                                                        Event Name
                                                    </TableHead>
                                                    <TableHead>
                                                        ID Number
                                                    </TableHead>
                                                    <TableHead>Date</TableHead>
                                                    <TableHead>
                                                        Status
                                                    </TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {event.relatedEvents.map(
                                                    (relEvent) => (
                                                        <TableRow
                                                            key={relEvent.id}
                                                        >
                                                            <TableCell>
                                                                {relEvent.title}
                                                            </TableCell>
                                                            <TableCell>
                                                                {
                                                                    relEvent.idNumber
                                                                }
                                                            </TableCell>
                                                            <TableCell>
                                                                {relEvent.date}
                                                            </TableCell>
                                                            <TableCell>
                                                                <Badge
                                                                    className={`${getStatusColor(relEvent.status)}`}
                                                                >
                                                                    {relEvent.status
                                                                        .charAt(
                                                                            0,
                                                                        )
                                                                        .toUpperCase() +
                                                                        relEvent.status.slice(
                                                                            1,
                                                                        )}
                                                                </Badge>
                                                            </TableCell>
                                                        </TableRow>
                                                    ),
                                                )}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Comments Tab */}
                            <TabsContent value="comments" className="mt-4">
                                <Card>
                                    <CardHeader className="pb-2">
                                        <h3 className="text-lg font-medium">
                                            Comments
                                        </h3>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {event.comments.map((comment) => (
                                                <div
                                                    key={comment.id}
                                                    className="flex gap-3"
                                                >
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarImage
                                                            src={comment.avatar}
                                                        />
                                                        <AvatarFallback>
                                                            {comment.author[0]}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-sm font-medium">
                                                                {comment.author}
                                                            </span>
                                                            <span className="text-xs text-muted-foreground">
                                                                {
                                                                    comment.timestamp
                                                                }
                                                            </span>
                                                        </div>
                                                        <p className="text-sm">
                                                            {comment.content}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                            <Separator />
                                            <div className="flex gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src="/placeholder.svg?height=32&width=32" />
                                                    <AvatarFallback>
                                                        JD
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 space-y-2">
                                                    <Textarea
                                                        placeholder="Add a comment..."
                                                        className="min-h-[80px]"
                                                        value={commentText}
                                                        onChange={(e) =>
                                                            setCommentText(
                                                                e.target.value,
                                                            )
                                                        }
                                                    />
                                                    <Button
                                                        onClick={
                                                            handleAddComment
                                                        }
                                                        disabled={
                                                            !commentText.trim()
                                                        }
                                                    >
                                                        Comment
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>
                </main>
            </div>
        </div>
    );
}
