import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { Event } from "@/lib/types";
import { format, isSameDay } from "date-fns";
import { Clock, Edit, MapPin, Trash, Users, X } from "lucide-react";
import { useState } from "react";

interface EventDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    event: Event;
}

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

// Sample team members
const teamMembers = [
    {
        name: "Alex Johnson",
        role: "Event Lead",
        avatar: "/placeholder.svg?height=32&width=32",
    },
    {
        name: "Maria Garcia",
        role: "Marketing",
        avatar: "/placeholder.svg?height=32&width=32",
    },
    {
        name: "Sam Lee",
        role: "Logistics",
        avatar: "/placeholder.svg?height=32&width=32",
    },
];

// Sample comments
const sampleComments = [
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
];

export function EventDetailsModal({
    isOpen,
    onClose,
    event,
}: EventDetailsModalProps) {
    const [activeTab, setActiveTab] = useState("details");
    const [commentText, setCommentText] = useState("");
    const [comments, setComments] = useState(sampleComments);

    if (!event) return null;

    const handleAddComment = () => {
        if (commentText.trim()) {
            const newComment = {
                id: comments.length + 1,
                author: "Jane Doe",
                avatar: "/placeholder.svg?height=32&width=32",
                content: commentText,
                timestamp: "Just now",
            };
            setComments([...comments, newComment]);
            setCommentText("");
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[650px]">
                <DialogHeader>
                    <DialogTitle className="text-xl">
                        {event.eventName}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex justify-between items-center">
                    <Badge className={`${getStatusColor(event.status)}`}>
                        {event.status.charAt(0).toUpperCase() +
                            event.status.slice(1)}
                    </Badge>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="gap-1">
                            <Edit className="h-4 w-4" />
                            Edit
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-1 text-destructive hover:text-destructive"
                        >
                            <Trash className="h-4 w-4" />
                            Delete
                        </Button>
                    </div>
                </div>

                <Tabs
                    defaultValue="details"
                    value={activeTab}
                    onValueChange={setActiveTab}
                >
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="details">Details</TabsTrigger>
                        <TabsTrigger value="team">Team</TabsTrigger>
                        <TabsTrigger value="comments">Comments</TabsTrigger>
                    </TabsList>

                    <TabsContent value="details" className="space-y-4 pt-4">
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span>
                                    {format(new Date(event.startTime), "PPP")}
                                    {isSameDay(
                                        new Date(event.startTime),
                                        new Date(event.endTime),
                                    )
                                        ? ` ${format(new Date(event.startTime), "p")} - ${format(new Date(event.endTime), "p")}`
                                        : ` to ${format(new Date(event.endTime), "PPP")}`}
                                </span>
                            </div>
                            {/* TODO: Add location display - requires venue details */}
                            {/* <div className="flex items-center gap-2 text-sm">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <span>{event.location}</span>
                            </div> */}
                            <div className="flex items-center gap-2 text-sm">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <span>Expected attendees: 120</span>
                            </div>
                        </div>

                        <Separator />

                        {/* TODO: Add description display if available in Event type */}
                        {/* <div>
                            <h3 className="font-medium mb-2">Description</h3>
                            <p className="text-sm text-muted-foreground">
                                {event.description ||
                                    "Join us for this exciting event! More details will be provided closer to the date."}
                            </p>
                        </div> */}

                        <Separator />

                        {/* TODO: Add facility display - requires venue details */}
                        {/* <div>
                            <h3 className="font-medium mb-2">Facility</h3>
                            <p className="text-sm text-muted-foreground">
                                {event.facility || "Main Conference Hall"}
                            </p>
                        </div> */}
                    </TabsContent>

                    <TabsContent value="team" className="space-y-4 pt-4">
                        <div>
                            <h3 className="font-medium mb-3">Event Team</h3>
                            <div className="space-y-3">
                                {teamMembers.map((member, index) => (
                                    <div
                                        key={member.name}
                                        className="flex items-center gap-3"
                                    >
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={member.avatar} />
                                            <AvatarFallback>
                                                {member.name.charAt(0)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="text-sm font-medium">
                                                {member.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {member.role}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <Separator />

                        <div className="flex justify-center">
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-1"
                            >
                                <Users className="h-4 w-4" />
                                Manage Team
                            </Button>
                        </div>
                    </TabsContent>

                    <TabsContent value="comments" className="space-y-4 pt-4">
                        <div className="space-y-4">
                            {comments.map((comment) => (
                                <div key={comment.id} className="flex gap-3">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={comment.avatar} />
                                        <AvatarFallback>
                                            {comment.author.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-sm font-medium">
                                                {comment.author}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {comment.timestamp}
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
                                    <AvatarFallback>JD</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 space-y-2">
                                    <Textarea
                                        placeholder="Add a comment..."
                                        className="min-h-[80px]"
                                        value={commentText}
                                        onChange={(e) =>
                                            setCommentText(e.target.value)
                                        }
                                    />
                                    <Button
                                        onClick={handleAddComment}
                                        disabled={!commentText.trim()}
                                    >
                                        Comment
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
