import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "@tanstack/react-router";
import {
    CalendarClock,
    ChevronRight,
    Clock,
    MapPin,
    Users,
} from "lucide-react";
// Sample data
const events = [
    {
        id: 1,
        title: "Annual Tech Conference",
        date: "May 15-17, 2024",
        location: "San Francisco, CA",
        status: "planning",
        progress: 25,
        attendees: 1200,
        team: [
            {
                name: "Alex Johnson",
                avatar: "/placeholder.svg?height=32&width=32",
            },
            {
                name: "Maria Garcia",
                avatar: "/placeholder.svg?height=32&width=32",
            },
            { name: "Sam Lee", avatar: "/placeholder.svg?height=32&width=32" },
        ],
    },
    {
        id: 2,
        title: "Product Launch: Version 2.0",
        date: "June 5, 2024",
        location: "Virtual Event",
        status: "confirmed",
        progress: 60,
        attendees: 5000,
        team: [
            {
                name: "Taylor Swift",
                avatar: "/placeholder.svg?height=32&width=32",
            },
            {
                name: "John Smith",
                avatar: "/placeholder.svg?height=32&width=32",
            },
        ],
    },
    {
        id: 3,
        title: "Quarterly Team Building",
        date: "April 22, 2024",
        location: "Central Park, NY",
        status: "completed",
        progress: 100,
        attendees: 45,
        team: [
            {
                name: "Emma Wilson",
                avatar: "/placeholder.svg?height=32&width=32",
            },
            {
                name: "James Brown",
                avatar: "/placeholder.svg?height=32&width=32",
            },
            {
                name: "Olivia Martinez",
                avatar: "/placeholder.svg?height=32&width=32",
            },
        ],
    },
    {
        id: 4,
        title: "Marketing Strategy Workshop",
        date: "May 3, 2024",
        location: "Chicago, IL",
        status: "planning",
        progress: 15,
        attendees: 30,
        team: [
            {
                name: "David Kim",
                avatar: "/placeholder.svg?height=32&width=32",
            },
            {
                name: "Sarah Johnson",
                avatar: "/placeholder.svg?height=32&width=32",
            },
        ],
    },
];

const getStatusColor = (status: string) => {
    switch (status) {
        case "planning":
            return "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20";
        case "confirmed":
            return "bg-green-500/10 text-green-500 hover:bg-green-500/20";
        case "completed":
            return "bg-purple-500/10 text-purple-500 hover:bg-purple-500/20";
        default:
            return "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20";
    }
};

export function EventList() {
    const navigate = useNavigate();

    const handleNavigate = (eventId: number) => {
        navigate({ to: `/app/events/${eventId}` });
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Upcoming Events</h2>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="gap-1">
                        <CalendarClock className="h-3 w-3" />
                        All Events
                    </Badge>
                </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {events.map((event) => (
                    <Card
                        key={event.id}
                        className="overflow-hidden transition-all hover:shadow-md"
                    >
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <h3 className="font-medium">{event.title}</h3>
                                <Badge
                                    className={`${getStatusColor(event.status)}`}
                                >
                                    {event.status.charAt(0).toUpperCase() +
                                        event.status.slice(1)}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Clock className="h-4 w-4" />
                                    <span>{event.date}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <MapPin className="h-4 w-4" />
                                    <span>{event.location}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Users className="h-4 w-4" />
                                    <span>
                                        {event.attendees.toLocaleString()}{" "}
                                        attendees
                                    </span>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between text-sm">
                                        <span>Progress</span>
                                        <span>{event.progress}%</span>
                                    </div>
                                    <Progress
                                        value={event.progress}
                                        className="h-1"
                                    />
                                </div>
                            </div>
                        </CardContent>
                        <Separator />
                        <CardFooter>
                            <div className="flex items-center justify-between w-full">
                                <div className="flex -space-x-2">
                                    {event.team.map((member, i) => (
                                        <div
                                            key={i}
                                            className="h-6 w-6 rounded-full border-2 border-background bg-muted overflow-hidden"
                                            title={member.name}
                                        >
                                            <img
                                                src={
                                                    member.avatar ||
                                                    "/placeholder.svg"
                                                }
                                                alt={member.name}
                                                className="h-full w-full object-cover"
                                            />
                                        </div>
                                    ))}
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="flex items-center gap-2 text-sm font-normal"
                                    onClick={() => handleNavigate(event.id)}
                                >
                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                </Button>
                            </div>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
}
