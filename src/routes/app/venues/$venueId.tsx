import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { format } from "date-fns";
import {
	ArrowLeft,
	Calendar,
	Clock,
	Eye,
	MapPin,
	UserCircle,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getOngoingAndApprovedEventsByVenue } from "@/lib/api";
import { DEFAULT_VENUE_IMAGE_URL } from "@/lib/constants";
import { eventsQueryKeys, venuesQueryOptions } from "@/lib/query";
import type { Event as AppEvent, VenueDTO } from "@/lib/types";
import { formatDateRange, getApproverStatusBadge } from "@/lib/utils";

export const Route = createFileRoute("/app/venues/$venueId")({
	component: VenueDetails,
	loader: async ({ params: { venueId }, context }) => {
		const { queryClient } = context;
		const venues = queryClient.ensureQueryData(venuesQueryOptions);
		const venue = (await venues).find(
			(v) => v.publicId.toString() === venueId,
		) as VenueDTO | undefined;

		if (!venue) {
			throw new Error(`Venue with ID ${venueId} not found`);
		}

		// Fetch ongoing and approved events for this venue
		const ongoingAndApprovedEvents = await queryClient.ensureQueryData({
			queryKey: eventsQueryKeys.ongoingAndApprovedByVenue(venue.publicId),
			queryFn: () => getOngoingAndApprovedEventsByVenue(venue.publicId),
			staleTime: 1000 * 60 * 5, // Optional: 5 minutes stale time
		});

		return { venue, ongoingAndApprovedEvents };
	},
});

export function VenueDetails() {
	const { venue, ongoingAndApprovedEvents } = Route.useLoaderData();
	const router = useRouter();
	const onBack = () => router.history.back();
	const [activeTab, setActiveTab] = useState("overview");

	if (!venue) {
		return (
			<div className="flex h-screen bg-background">
				<div className="flex flex-col flex-1 items-center justify-center">
					<p>Loading venue details or events...</p>
				</div>
			</div>
		);
	}

	const formatDateTime = (dateString: string | null) => {
		if (!dateString) return "—";
		return format(new Date(dateString), "MMM d, yyyy h:mm a");
	};

	return (
		<div className="bg-background">
			<div className="flex flex-col flex-1 overflow-hidden">
				<header className="flex items-center justify-between border-b px-6 py-3.5">
					<div className="flex items-center gap-4">
						<Button
							variant="ghost"
							size="icon"
							onClick={onBack}
							aria-label="Go back"
						>
							<ArrowLeft className="h-4 w-4" />
						</Button>
						<h1 className="text-xl font-semibold">{venue.name}</h1>
						{/* Removed type badge as it's not in the new entity */}
					</div>
					{/* Removed action buttons if not applicable */}
				</header>

				{/* Added Tabs */}
				<Tabs
					value={activeTab}
					onValueChange={setActiveTab}
					className="flex-1 overflow-hidden"
				>
					<TabsList className="w-full text-foreground mb-3 h-auto gap-2 rounded-none border-b bg-transparent px-6 py-1">
						<TabsTrigger
							className="hover:bg-accent hover:text-foreground data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
							value="overview"
						>
							Overview
						</TabsTrigger>
						<TabsTrigger
							className="hover:bg-accent hover:text-foreground data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
							value="events"
						>
							Events
						</TabsTrigger>
						<TabsTrigger
							className="hover:bg-accent hover:text-foreground data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
							value="calendar"
						>
							Calendar
						</TabsTrigger>
					</TabsList>

					<div className="flex-1 overflow-auto p-6">
						{/* Overview Tab */}
						<TabsContent value="overview" className="h-full">
							<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
								{/* Left Column: Image */}
								<div className="md:col-span-2 space-y-6">
									<div className="rounded-lg overflow-hidden border aspect-video">
										<img
											src={venue.imagePath || DEFAULT_VENUE_IMAGE_URL}
											alt={venue.name}
											className="w-full h-full object-cover"
											onError={(e) => {
												e.currentTarget.src = DEFAULT_VENUE_IMAGE_URL;
											}}
										/>
									</div>
									{/* Add Description/Amenities back here if those fields exist */}
								</div>

								{/* Right Column: Details */}
								<div className="space-y-6">
									<Card>
										<CardHeader>
											<CardTitle>Venue Information</CardTitle>
										</CardHeader>
										<CardContent className="space-y-4">
											<div className="flex items-center gap-2">
												<MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
												<span className="text-sm">
													Location: {venue.location}
												</span>
											</div>
											<div className="flex items-center gap-2">
												<UserCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
												<span className="text-sm">
													Owner: {venue.venueOwner?.firstName}{" "}
													{venue.venueOwner?.lastName}
												</span>
											</div>
											<div className="flex items-center gap-2">
												<Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
												<span className="text-sm">
													Created: {formatDateTime(venue.createdAt)}
												</span>
											</div>
											<div className="flex items-center gap-2">
												<Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
												<span className="text-sm">
													Last Updated: {formatDateTime(venue.updatedAt)}
												</span>
											</div>
											{/* Removed capacity, contact info etc. */}
										</CardContent>
									</Card>
									{/* Add other cards (e.g., Upcoming Events) if needed */}
								</div>
							</div>
						</TabsContent>

						{/* Events Tab */}
						<TabsContent value="events" className="h-full">
							<div className="space-y-6">
								{ongoingAndApprovedEvents &&
								ongoingAndApprovedEvents.length > 0 ? (
									<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
										{ongoingAndApprovedEvents.map((event: AppEvent) => {
											const eventDate = formatDateRange(
												new Date(event.startTime),
												new Date(event.endTime),
											);
											return (
												<Card key={event.publicId} className="flex flex-col">
													<CardHeader>
														<div className="flex justify-between items-start">
															<CardTitle className="text-base">
																{event.eventName}
															</CardTitle>
															{getApproverStatusBadge(event.status)}
														</div>
													</CardHeader>
													<CardContent className="flex-grow space-y-2 text-sm">
														<div className="flex items-center gap-1.5">
															<Clock className="h-4 w-4 text-muted-foreground" />
															<span>{eventDate}</span>
														</div>
														{event.organizer && (
															<div className="flex items-center gap-1.5">
																<UserCircle className="h-4 w-4 text-muted-foreground" />
																<span>
																	{event.organizer.firstName}{" "}
																	{event.organizer.lastName}
																</span>
															</div>
														)}
													</CardContent>
													<CardFooter className="border-t pt-4">
														<Button asChild className="w-full" size="sm">
															<Link
																to="/app/events/$eventId"
																params={{
																	eventId: event.publicId,
																}}
															>
																<Eye className="mr-2 h-4 w-4" /> View Details
															</Link>
														</Button>
													</CardFooter>
												</Card>
											);
										})}
									</div>
								) : (
									<div className="text-center text-muted-foreground py-8 border rounded-md">
										No ongoing or approved events found for this venue.
									</div>
								)}
							</div>
						</TabsContent>

						{/* Calendar Tab */}
						<TabsContent value="calendar" className="h-full">
							<div className="flex items-center justify-center h-full">
								<div className="text-center">
									<Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
									<h3 className="text-lg font-medium">Calendar View</h3>
									<p className="text-muted-foreground">
										Calendar integration will be available soon.
									</p>
								</div>
							</div>
						</TabsContent>
					</div>
				</Tabs>
			</div>
		</div>
	);
}
