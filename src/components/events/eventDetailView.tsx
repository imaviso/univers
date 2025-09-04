import {
	CheckCircle2,
	Circle,
	Clock,
	Edit,
	MapPin,
	MoreHorizontal,
	Plus,
	Trash2,
	Users,
} from "lucide-react";
import { useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

// Sample event data
const eventData = {
	id: "1",
	title: "Annual Tech Conference",
	date: "May 15-17, 2024",
	location: "San Francisco, CA",
	status: "planning",
	progress: 25,
	attendees: 1200,
	description:
		"Our annual technology conference bringing together industry leaders, innovators, and tech enthusiasts for three days of learning, networking, and inspiration. This year's theme focuses on AI and sustainable technology.",
	team: [
		{
			name: "Alex Johnson",
			role: "Event Lead",
			avatar: "/placeholder.svg?height=40&width=40",
		},
		{
			name: "Maria Garcia",
			role: "Marketing",
			avatar: "/placeholder.svg?height=40&width=40",
		},
		{
			name: "Sam Lee",
			role: "Logistics",
			avatar: "/placeholder.svg?height=40&width=40",
		},
		{
			name: "Taylor Swift",
			role: "Speaker Coordinator",
			avatar: "/placeholder.svg?height=40&width=40",
		},
	],
	tasks: [
		{
			id: 1,
			title: "Book venue",
			status: "completed",
			assignee: "Alex Johnson",
		},
		{
			id: 2,
			title: "Confirm speakers",
			status: "in-progress",
			assignee: "Taylor Swift",
		},
		{
			id: 3,
			title: "Finalize agenda",
			status: "in-progress",
			assignee: "Alex Johnson",
		},
		{
			id: 4,
			title: "Send invitations",
			status: "todo",
			assignee: "Maria Garcia",
		},
		{
			id: 5,
			title: "Arrange catering",
			status: "todo",
			assignee: "Sam Lee",
		},
		{
			id: 6,
			title: "Set up registration page",
			status: "completed",
			assignee: "Maria Garcia",
		},
	],
	comments: [
		{
			id: 1,
			author: "Alex Johnson",
			avatar: "/placeholder.svg?height=32&width=32",
			content: "I've confirmed the venue booking. We're all set for the dates.",
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
		default:
			return "bg-gray-500/10 text-gray-500";
	}
};

const getTaskStatusIcon = (status: string) => {
	switch (status) {
		case "completed":
			return <CheckCircle2 className="h-4 w-4 text-green-500" />;
		case "in-progress":
			return <Circle className="h-4 w-4 text-blue-500 fill-blue-500/50" />;
		case "todo":
			return <Circle className="h-4 w-4 text-muted-foreground" />;
		default:
			return <Circle className="h-4 w-4 text-muted-foreground" />;
	}
};

export function EventDetailView() {
	const [commentText, setCommentText] = useState("");

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
		<div className="bg-background">
			<div className="flex flex-col flex-1 overflow-hidden">
				<header className="flex items-center justify-between border-b px-6 py-3">
					<div className="flex items-center gap-4">
						<h1 className="text-xl font-semibold">{event.title}</h1>
						<Badge className={`${getStatusColor(event.status)}`}>
							{event.status.charAt(0).toUpperCase() + event.status.slice(1)}
						</Badge>
					</div>
					<div className="flex items-center gap-2">
						<Button variant="outline" size="sm" className="gap-1">
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
								<DropdownMenuItem>Duplicate</DropdownMenuItem>
								<DropdownMenuItem>Archive</DropdownMenuItem>
								<DropdownMenuItem className="text-destructive">
									<Trash2 className="h-4 w-4 mr-2" />
									Delete
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</header>
				<main className="flex-1 overflow-auto">
					<div className="grid md:grid-cols-3 gap-6 p-6">
						<div className="md:col-span-2 space-y-6">
							<Card>
								<CardHeader className="pb-2">
									<h2 className="text-lg font-medium">Event Details</h2>
								</CardHeader>
								<CardContent>
									<div className="space-y-4">
										<div className="space-y-2">
											<div className="flex items-center gap-2 text-sm">
												<Clock className="h-4 w-4 text-muted-foreground" />
												<span>{event.date}</span>
											</div>
											<div className="flex items-center gap-2 text-sm">
												<MapPin className="h-4 w-4 text-muted-foreground" />
												<span>{event.location}</span>
											</div>
											<div className="flex items-center gap-2 text-sm">
												<Users className="h-4 w-4 text-muted-foreground" />
												<span>
													{event.attendees.toLocaleString()} attendees
												</span>
											</div>
										</div>
										<Separator />
										<div>
											<h3 className="font-medium mb-2">Description</h3>
											<p className="text-sm text-muted-foreground">
												{event.description}
											</p>
										</div>
										<Separator />
										<div className="space-y-2">
											<div className="flex items-center justify-between text-sm">
												<span>Progress</span>
												<span>{event.progress}%</span>
											</div>
											<Progress value={event.progress} className="h-2" />
										</div>
									</div>
								</CardContent>
							</Card>

							<Tabs defaultValue="tasks">
								<TabsList className="grid w-full grid-cols-2">
									<TabsTrigger value="tasks">Tasks</TabsTrigger>
									<TabsTrigger value="comments">Comments</TabsTrigger>
								</TabsList>
								<TabsContent value="tasks" className="mt-4">
									<Card>
										<CardHeader className="pb-2 flex flex-row items-center justify-between">
											<h3 className="text-lg font-medium">Tasks</h3>
											<Button variant="outline" size="sm" className="gap-1">
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
															{getTaskStatusIcon(task.status)}
															<span className="text-sm">{task.title}</span>
														</div>
														<div className="flex items-center gap-2">
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
								<TabsContent value="comments" className="mt-4">
									<Card>
										<CardHeader className="pb-2">
											<h3 className="text-lg font-medium">Comments</h3>
										</CardHeader>
										<CardContent>
											<div className="space-y-4">
												{event.comments.map((comment) => (
													<div key={comment.id} className="flex gap-3">
														<Avatar className="h-8 w-8">
															<AvatarImage src={comment.avatar} />
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
																	{comment.timestamp}
																</span>
															</div>
															<p className="text-sm">{comment.content}</p>
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
															onChange={(e) => setCommentText(e.target.value)}
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
										</CardContent>
									</Card>
								</TabsContent>
							</Tabs>
						</div>

						<div className="space-y-6">
							<Card>
								<CardHeader className="pb-2">
									<h3 className="text-lg font-medium">Team</h3>
								</CardHeader>
								<CardContent>
									<div className="space-y-3">
										{event.team.map((member) => (
											<div
												key={member.name}
												className="flex items-center gap-3"
											>
												<Avatar className="h-10 w-10">
													<AvatarImage src={member.avatar} />
													<AvatarFallback>{member.name[0]}</AvatarFallback>
												</Avatar>
												<div>
													<div className="text-sm font-medium">
														{member.name}
													</div>
													<div className="text-xs text-muted-foreground">
														{member.role}
													</div>
												</div>
											</div>
										))}
										<Button
											variant="outline"
											size="sm"
											className="w-full gap-1 mt-2"
										>
											<Plus className="h-4 w-4" />
											Add Team Member
										</Button>
									</div>
								</CardContent>
							</Card>

							<Card>
								<CardHeader className="pb-2">
									<h3 className="text-lg font-medium">Related Events</h3>
								</CardHeader>
								<CardContent>
									<div className="space-y-2">
										<div className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
											<div className="text-sm">Pre-conference Workshop</div>
											<Badge variant="outline" className="text-xs">
												May 14
											</Badge>
										</div>
										<div className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
											<div className="text-sm">Speaker Dinner</div>
											<Badge variant="outline" className="text-xs">
												May 15
											</Badge>
										</div>
										<div className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
											<div className="text-sm">After-party</div>
											<Badge variant="outline" className="text-xs">
												May 17
											</Badge>
										</div>
									</div>
								</CardContent>
							</Card>
						</div>
					</div>
				</main>
			</div>
		</div>
	);
}
