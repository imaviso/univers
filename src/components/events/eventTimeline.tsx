import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useNavigate } from "@tanstack/react-router";
import {
    CalendarDays,
    CheckCircle,
    ChevronRight,
    Circle,
    Clock,
} from "lucide-react";
// Sample timeline data
const timelineEvents = [
    {
        id: 1,
        month: "April",
        events: [
            {
                id: 101,
                title: "Quarterly Team Building",
                date: "April 22, 2024",
                status: "completed",
                description: "Team building activities at Central Park",
                owner: {
                    name: "Emma W.",
                    avatar: "/placeholder.svg?height=32&width=32",
                },
            },
        ],
    },
    {
        id: 2,
        month: "May",
        events: [
            {
                id: 201,
                title: "Marketing Strategy Workshop",
                date: "May 3, 2024",
                status: "planning",
                description: "Workshop to align on Q2 marketing strategy",
                owner: {
                    name: "David K.",
                    avatar: "/placeholder.svg?height=32&width=32",
                },
            },
            {
                id: 202,
                title: "Annual Tech Conference",
                date: "May 15-17, 2024",
                status: "planning",
                description: "Our biggest tech conference of the year",
                owner: {
                    name: "Alex J.",
                    avatar: "/placeholder.svg?height=32&width=32",
                },
            },
        ],
    },
    {
        id: 3,
        month: "June",
        events: [
            {
                id: 301,
                title: "Product Launch: Version 2.0",
                date: "June 5, 2024",
                status: "confirmed",
                description: "Virtual product launch event for our new version",
                owner: {
                    name: "Taylor S.",
                    avatar: "/placeholder.svg?height=32&width=32",
                },
            },
            {
                id: 302,
                title: "Customer Appreciation Day",
                date: "June 15, 2024",
                status: "planning",
                description: "Special event to thank our loyal customers",
                owner: {
                    name: "Sarah J.",
                    avatar: "/placeholder.svg?height=32&width=32",
                },
            },
        ],
    },
];

const getStatusIcon = (status: string) => {
    switch (status) {
        case "completed":
            return <CheckCircle className="h-4 w-4 text-green-500" />;
        case "confirmed":
            return <Circle className="h-4 w-4 text-blue-500 fill-blue-500" />;
        case "planning":
            return <Circle className="h-4 w-4 text-muted-foreground" />;
        default:
            return <Circle className="h-4 w-4 text-muted-foreground" />;
    }
};

const getStatusColor = (status: string) => {
    switch (status) {
        case "planning":
            return "bg-blue-500/10 text-blue-500";
        case "confirmed":
            return "bg-green-500/10 text-green-500";
        case "completed":
            return "bg-purple-500/10 text-purple-500";
        default:
            return "bg-gray-500/10 text-gray-500";
    }
};

export function EventTimeline() {
    const navigate = useNavigate();

    const handleNavigate = (eventId: number) => {
        navigate({ to: `/app/events/${eventId}` });
    };
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Event Timeline</h2>
                <Badge variant="outline" className="gap-1">
                    <CalendarDays className="h-3 w-3" />
                    Q2 2024
                </Badge>
            </div>

            <div className="space-y-8">
                {timelineEvents.map((monthGroup) => (
                    <div key={monthGroup.id} className="space-y-4">
                        <h3 className="text-lg font-medium">
                            {monthGroup.month}
                        </h3>
                        <div className="space-y-4">
                            {monthGroup.events.map((event) => (
                                <Card
                                    key={event.id}
                                    className="overflow-hidden border-l-4"
                                    style={{
                                        borderLeftColor:
                                            event.status === "completed"
                                                ? "#a855f7"
                                                : event.status === "confirmed"
                                                  ? "#22c55e"
                                                  : "#3b82f6",
                                    }}
                                >
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-2">
                                                {getStatusIcon(event.status)}
                                                <h4 className="font-medium">
                                                    {event.title}
                                                </h4>
                                            </div>
                                            <Badge
                                                className={`${getStatusColor(event.status)}`}
                                            >
                                                {event.status
                                                    .charAt(0)
                                                    .toUpperCase() +
                                                    event.status.slice(1)}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                            <Clock className="h-4 w-4" />
                                            <span>{event.date}</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground mb-3">
                                            {event.description}
                                        </p>
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-6 w-6">
                                                    <AvatarImage
                                                        src={event.owner.avatar}
                                                    />
                                                    <AvatarFallback>
                                                        {event.owner.name.charAt(
                                                            0,
                                                        )}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="text-xs">
                                                    {event.owner.name}
                                                </span>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="flex items-center gap-2 text-sm font-normal"
                                                onClick={() =>
                                                    handleNavigate(event.id)
                                                }
                                            >
                                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
