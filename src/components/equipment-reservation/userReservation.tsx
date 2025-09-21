import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router"; // Added Link and useNavigate import
import {
	AlertCircle,
	Calendar,
	CalendarDays,
	Clock,
	Package,
	Package2,
} from "lucide-react"; // Added Package icon and CalendarDays for event
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription, // Import DialogDescription
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DEFAULT_EQUIPMENT_IMAGE_URL } from "@/lib/constants";
import {
	ownEquipmentReservationsQueryOptions,
	useCancelEquipmentReservationMutation,
} from "@/lib/query";
import type { EquipmentReservationDTO } from "@/lib/types";
import { formatDateTime, getStatusBadgeClass } from "@/lib/utils";

export default function UserReservations() {
	const [activeTab, setActiveTab] = useState("all"); // Can be 'all', 'pending', 'approved', 'rejected', 'canceled'
	const [selectedReservation, setSelectedReservation] =
		useState<EquipmentReservationDTO | null>(null);
	const [showCancelDialog, setShowCancelDialog] = useState(false);
	const [showDetailsDialog, setShowDetailsDialog] = useState(false);

	// Fetch user's own reservations
	const {
		data: reservations = [],
		isLoading,
		error,
	} = useQuery(ownEquipmentReservationsQueryOptions);

	// Cancel mutation
	const cancelMutation = useCancelEquipmentReservationMutation();
	const navigate = useNavigate(); // Added useNavigate hook

	// Filter reservations based on the active tab
	const filteredReservations = useMemo(() => {
		if (activeTab === "all") {
			return reservations;
		}
		return reservations.filter((res) => res.status.toLowerCase() === activeTab);
	}, [reservations, activeTab]);

	const handleCancel = () => {
		if (!selectedReservation) return;
		// @ts-expect-error
		cancelMutation.mutate(selectedReservation, {
			onSuccess: () => {
				toast.success("Reservation cancelled successfully.");
				setShowCancelDialog(false);
				setSelectedReservation(null);
				// Query invalidation happens automatically via the mutation hook
			},
			onError: () => {
				toast.error("Failed to cancel reservation.");
				setShowCancelDialog(false);
			},
		});
	};

	if (isLoading) {
		return (
			<p className="text-center text-muted-foreground">
				Loading your reservations...
			</p>
		);
	}

	if (error) {
		return (
			<Alert variant="destructive">
				<AlertCircle className="h-4 w-4" />
				<AlertTitle>Error</AlertTitle>
				<AlertDescription>
					Failed to load reservations: {error.message}
				</AlertDescription>
			</Alert>
		);
	}

	// Define available tabs based on potential statuses
	const availableTabs = ["all", "pending", "approved", "rejected", "canceled"];

	return (
		<div className="space-y-6">
			<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
				<div className="flex items-center justify-between">
					<TabsList className="text-foreground h-auto gap-2 rounded-none border-b bg-transparent px-0 py-1">
						{availableTabs.map((tab) => (
							<TabsTrigger
								key={tab}
								value={tab}
								className="capitalize hover:bg-accent hover:text-foreground data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
							>
								{tab}
							</TabsTrigger>
						))}
					</TabsList>
				</div>
				<TabsContent value={activeTab} className="pt-4">
					{filteredReservations.length > 0 ? (
						<div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
							{filteredReservations.map((reservation) => (
								<Card
									key={reservation.publicId}
									className="overflow-hidden flex flex-col"
								>
									{/* Equipment Image */}
									<div className="aspect-video w-full overflow-hidden bg-muted">
										<img
											src={
												reservation.equipment?.imagePath ||
												DEFAULT_EQUIPMENT_IMAGE_URL
											}
											alt={reservation.equipment?.name ?? "Equipment image"}
											className="h-full w-full object-cover"
											onError={(e) => {
												e.currentTarget.src = DEFAULT_EQUIPMENT_IMAGE_URL;
											}}
											loading="lazy"
										/>
									</div>
									<CardHeader>
										<div className="flex justify-between items-start">
											<CardTitle className="text-lg">
												{reservation.equipment?.name ?? "Equipment N/A"}
											</CardTitle>
											<Badge
												className={getStatusBadgeClass(reservation.status)}
											>
												{reservation.status}
											</Badge>
										</div>
									</CardHeader>
									<CardContent className="flex-grow space-y-2 text-sm">
										{/* Event Name as Link */}
										{reservation.event?.publicId &&
											reservation.event?.eventName && (
												<div className="flex items-center gap-1">
													<CalendarDays className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
													<Link
														to="/app/events/$eventId"
														params={{
															eventId: reservation.event.publicId,
														}}
														className="hover:underline text-primary font-medium"
													>
														{reservation.event.eventName}
													</Link>
												</div>
											)}
										{reservation.equipment?.categories &&
											reservation.equipment.categories.length > 0 && (
												<div className="flex items-center gap-1 truncate">
													<Package2 className="h-3.5 w-3.5 flex-shrink-0" />
													<span className="truncate">
														Categories:{" "}
														{reservation.equipment.categories
															.map((category) => category.name)
															.join(", ")}
													</span>
												</div>
											)}
										<div className="flex items-center gap-1">
											<Package className="h-3.5 w-3.5 flex-shrink-0" />
											<span>Quantity: {reservation.quantity}</span>
										</div>
										<div className="flex items-center gap-1">
											<Calendar className="h-3.5 w-3.5 flex-shrink-0" />
											<span>{formatDateTime(reservation.startTime)}</span>
										</div>
										<div className="flex items-center gap-1">
											<Clock className="h-3.5 w-3.5 flex-shrink-0" />
											<span>{formatDateTime(reservation.endTime)}</span>
										</div>
									</CardContent>
									<CardContent className="pt-4">
										{" "}
										{/* Separate content for buttons */}
										<div className="grid grid-cols-2 gap-2">
											<Button
												variant="outline"
												size="sm"
												className="w-full"
												onClick={() => {
													if (reservation.event?.publicId) {
														navigate({
															to: "/app/events/$eventId",
															params: {
																eventId: reservation.event.publicId,
															},
														});
													} else {
														toast.error(
															"Event details are not available for this reservation.",
														);
													}
													// setSelectedReservation(
													//     reservation,
													// );
													// setShowDetailsDialog(true);
												}}
												disabled={!reservation.event?.publicId} // Disable if no eventId
											>
												View Details
											</Button>
											{/* Allow cancellation if PENDING or RESERVED */}
											{(reservation.status === "PENDING" ||
												reservation.status === "RESERVED") && (
												<Button
													variant="destructive"
													size="sm"
													className="w-full"
													onClick={() => {
														setSelectedReservation(reservation);
														setShowCancelDialog(true);
													}}
													disabled={cancelMutation.isPending}
												>
													Cancel
												</Button>
											)}
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					) : (
						<Alert>
							<AlertCircle className="h-4 w-4" />
							<AlertTitle>No reservations found</AlertTitle>
							<AlertDescription>
								You don't have any {activeTab !== "all" ? activeTab : ""}{" "}
								equipment reservations.
							</AlertDescription>
						</Alert>
					)}
				</TabsContent>
			</Tabs>

			{/* Reservation Details Dialog */}
			<Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
				<DialogContent className="sm:max-w-[500px]">
					<DialogHeader>
						<DialogTitle>Reservation Details</DialogTitle>
					</DialogHeader>
					{selectedReservation && (
						<ScrollArea className="max-h-[70vh]">
							<div className="space-y-4 p-1 pr-4">
								{" "}
								{/* Add padding for scrollbar */}
								<div>
									<h4 className="font-medium text-muted-foreground">Event</h4>
									<p>{selectedReservation.event?.eventName}</p>
								</div>
								<div>
									<h4 className="font-medium text-muted-foreground">
										Equipment
									</h4>
									<p>
										{selectedReservation.equipment?.name}
										(Qty: {selectedReservation.quantity})
									</p>
								</div>
								{selectedReservation.equipment?.categories &&
									selectedReservation.equipment.categories.length > 0 && (
										<div>
											<h4 className="font-medium text-muted-foreground">
												Equipment Categories
											</h4>
											<p>
												{selectedReservation.equipment.categories
													.map((category) => category.name)
													.join(", ")}
											</p>
										</div>
									)}
								<div>
									<h4 className="font-medium text-muted-foreground">
										Department
									</h4>
									<p>{selectedReservation.event?.department?.name}</p>
								</div>
								<div>
									<h4 className="font-medium text-muted-foreground">
										Start Time
									</h4>
									<p>{formatDateTime(selectedReservation.startTime)}</p>
								</div>
								<div>
									<h4 className="font-medium text-muted-foreground">
										End Time
									</h4>
									<p>{formatDateTime(selectedReservation.endTime)}</p>
								</div>
								<div>
									<h4 className="font-medium text-muted-foreground">Status</h4>
									<div className="flex items-center gap-2 mt-1">
										<Badge
											className={getStatusBadgeClass(
												selectedReservation.status,
											)}
										>
											{selectedReservation.status}
										</Badge>
										{/* Display rejection remarks if available */}
										{selectedReservation.status === "REJECTED" &&
											selectedReservation.approvals?.find(
												(a) => a.status === "REJECTED",
											)?.remarks && (
												<span className="text-sm text-red-500">
													Reason:{" "}
													{
														selectedReservation.approvals.find(
															(a) => a.status === "REJECTED",
														)?.remarks
													}
												</span>
											)}
									</div>
								</div>
								<div>
									<h4 className="font-medium text-muted-foreground">
										Submitted On
									</h4>
									<p>{formatDateTime(selectedReservation.createdAt)}</p>
								</div>
								{selectedReservation.updatedAt && (
									<div>
										<h4 className="font-medium text-muted-foreground">
											Last Updated
										</h4>
										<p>{formatDateTime(selectedReservation.updatedAt)}</p>
									</div>
								)}
							</div>
						</ScrollArea>
					)}
					<DialogFooter>
						<Button onClick={() => setShowDetailsDialog(false)}>Close</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Cancel Reservation Dialog */}
			<Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
				<DialogContent className="sm:max-w-[425px]">
					<DialogHeader>
						<DialogTitle>Cancel Reservation</DialogTitle>
						<DialogDescription>
							{" "}
							{/* Use DialogDescription */}
							Are you sure you want to cancel the reservation for "
							{selectedReservation?.equipment?.name}" for the event "
							{selectedReservation?.event?.eventName}"?
						</DialogDescription>
					</DialogHeader>
					<div className="py-4">
						<p className="text-sm text-muted-foreground">
							This action cannot be undone. The equipment owner may be notified.
						</p>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setShowCancelDialog(false)}
							disabled={cancelMutation.isPending}
						>
							No, Keep Reservation
						</Button>
						<Button
							variant="destructive"
							onClick={handleCancel}
							disabled={cancelMutation.isPending}
						>
							{cancelMutation.isPending
								? "Cancelling..."
								: "Yes, Cancel Reservation"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
