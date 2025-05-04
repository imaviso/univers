// **NOTE: Renamed file and route parameter from $approvalId to $reservationId**

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
	reservationApprovalsQueryOptions, // Use new query options
	reservationByIdQueryOptions,
	useApproveReservationMutation, // Use new mutations
	useRejectReservationMutation,
} from "@/lib/query";
import type { VenueApprovalDTO, VenueReservationDTO } from "@/lib/types"; // Use new types
import {
	formatDateTime,
	formatRole,
	getApproverStatusBadge,
	getBadgeVariant,
	getStatusBadgeClass,
} from "@/lib/utils"; // Import utils
import { useSuspenseQueries } from "@tanstack/react-query"; // Use useSuspenseQueries
import {
	Link,
	createFileRoute,
	notFound,
	useNavigate,
	useRouter,
} from "@tanstack/react-router";
import { format, intervalToDuration } from "date-fns";
import { ArrowLeft, CheckCircle2, Download, FileText, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

// **NOTE: Updated route path**
export const Route = createFileRoute("/app/venue-approval/$reservationId")({
	component: ReservationDetails,
	loader: async ({ params: { reservationId }, context: { queryClient } }) => {
		// Ensure both reservation and its approvals are fetched
		try {
			await Promise.all([
				queryClient.ensureQueryData(reservationByIdQueryOptions(reservationId)),
				queryClient.ensureQueryData(
					reservationApprovalsQueryOptions(reservationId),
				),
			]);
		} catch (error) {
			// Handle not found or other errors during fetch
			console.error("Loader error:", error);
			// Check if it's a "not found" type error if possible, otherwise throw generic
			// This depends on how your API/handleApiResponse signals "not found"
			throw notFound(); // Throw TanStack Router's notFound
		}
		// No need to return data, component will use useSuspenseQueries
	},
	notFoundComponent: () => {
		// Add a specific component for not found state
		const router = useRouter();
		return (
			<div className="flex h-screen bg-background">
				<div className="flex flex-col flex-1 items-center justify-center">
					<h2 className="text-xl font-semibold mb-2">Reservation Not Found</h2>
					<p className="text-muted-foreground mb-4">
						The requested reservation could not be found.
					</p>
					<Button
						onClick={() =>
							router.navigate({
								to: "/app/venue-approval/approval",
							})
						}
					>
						Back to Approvals
					</Button>
				</div>
			</div>
		);
	},
});

function ReservationDetails() {
	const { reservationId } = Route.useParams();
	const router = useRouter();
	const navigate = useNavigate();
	const onBack = () => router.history.back();

	const [{ data: reservation }, { data: approvals }] = useSuspenseQueries({
		queries: [
			reservationByIdQueryOptions(reservationId),
			reservationApprovalsQueryOptions(reservationId),
		],
	});

	const [isApprovalLetterDialogOpen, setIsApprovalLetterDialogOpen] =
		useState(false);
	const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
	const [approvalRemarks, setApprovalRemarks] = useState("");
	const [isRejectionDialogOpen, setIsRejectionDialogOpen] = useState(false);
	const [rejectionRemarks, setRejectionRemarks] = useState("");

	// Mutations
	const approveMutation = useApproveReservationMutation();
	const rejectMutation = useRejectReservationMutation();

	// Handle reservation operations
	const handleApproveReservation = () => {
		approveMutation.mutate(
			{ reservationId: reservation.id, remarks: "" },
			{
				onSuccess: (message) => {
					toast.success(message || "Reservation approved successfully.");
				},
				onError: (error) => {
					toast.error(error.message || "Failed to approve reservation.");
				},
			},
		);
	};

	const confirmApproveReservation = () => {
		// Renamed and updated
		approveMutation.mutate(
			{ reservationId: reservation.id, remarks: approvalRemarks }, // Use approvalRemarks
			{
				onSuccess: (message) => {
					toast.success(message || "Reservation approved successfully.");
					setIsApprovalDialogOpen(false); // Close dialog on success
					setApprovalRemarks(""); // Reset remarks
				},
				onError: (error) => {
					toast.error(error.message || "Failed to approve reservation.");
					// Optionally keep dialog open on error
				},
			},
		);
	};

	const confirmRejectReservation = () => {
		// Renamed for consistency
		if (!rejectionRemarks.trim()) {
			toast.warning("Please provide a reason for rejection.");
			return;
		}

		rejectMutation.mutate(
			{ reservationId: reservation.id, remarks: rejectionRemarks },
			{
				onSuccess: (message) => {
					toast.success(message || "Reservation rejected successfully.");
					setIsRejectionDialogOpen(false);
					setRejectionRemarks("");
				},
				onError: (error) => {
					toast.error(error.message || "Failed to reject reservation.");
					// Optionally keep dialog open on error
				},
			},
		);
	};

	const handleNavigateToVenue = (venueId: number) => {
		// Navigate to venue details page
		navigate({ to: `/app/venues/${venueId}` });
	};

	// Format date and time from ISO strings
	const formatDate = (dateString: string | null | undefined) => {
		if (!dateString) return "N/A";
		try {
			return format(new Date(dateString), "MMM d, yyyy");
		} catch {
			return "Invalid Date";
		}
	};

	const formatTime = (dateString: string | null | undefined) => {
		if (!dateString) return "N/A";
		try {
			return format(new Date(dateString), "h:mm a");
		} catch {
			return "Invalid Time";
		}
	};

	// Calculate duration
	const calculateDuration = (startTimeStr: string, endTimeStr: string) => {
		try {
			const start = new Date(startTimeStr);
			const end = new Date(endTimeStr);
			const duration = intervalToDuration({ start, end });
			const parts: string[] = [];
			if (duration.days && duration.days > 0)
				parts.push(`${duration.days} day${duration.days !== 1 ? "s" : ""}`);
			if (duration.hours && duration.hours > 0)
				parts.push(`${duration.hours} hour${duration.hours !== 1 ? "s" : ""}`);
			if (duration.minutes && duration.minutes > 0)
				parts.push(
					`${duration.minutes} minute${duration.minutes !== 1 ? "s" : ""}`,
				);
			return parts.length > 0 ? parts.join(" ") : "0 minutes";
		} catch {
			return "N/A";
		}
	};

	return (
		<div className="bg-background">
			<div className="flex flex-col flex-1 overflow-hidden">
				<header className="flex items-center justify-between border-b px-6 py-4 sticky top-0 bg-background z-10">
					<div className="flex items-center gap-4">
						<Button variant="link" onClick={onBack}>
							<ArrowLeft className="h-4 w-4" />
						</Button>
						<h1 className="text-xl font-semibold h-8">Reservation Details</h1>
						<Badge className={getStatusBadgeClass(reservation.status)}>
							{reservation.status}
						</Badge>
					</div>

					{/* Show buttons only if status is PENDING */}
					{reservation.status === "PENDING" && (
						<div className="flex gap-2">
							<Button
								className="gap-1"
								size="sm"
								onClick={() => setIsApprovalDialogOpen(true)}
								disabled={approveMutation.isPending || rejectMutation.isPending}
							>
								<CheckCircle2 className="h-4 w-4" /> Approve
							</Button>
							<Button
								variant="destructive"
								size="sm"
								className="gap-1"
								onClick={() => setIsRejectionDialogOpen(true)}
								disabled={approveMutation.isPending || rejectMutation.isPending}
							>
								<X className="h-4 w-4" /> Reject
							</Button>
						</div>
					)}
				</header>

				<div className="p-6 space-y-6 overflow-auto">
					{/* Reservation and Requester Information */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<Card>
							<CardHeader>
								<CardTitle>Reservation Information</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								{/* Use VenueReservationDTO fields */}
								<div className="grid grid-cols-2 gap-4">
									<div>
										<h3 className="text-sm font-medium text-muted-foreground">
											Venue
										</h3>
										<Button
											variant="link"
											className="p-0 h-auto text-base"
											onClick={() => handleNavigateToVenue(reservation.venueId)}
										>
											{reservation.venueName}
										</Button>
									</div>
									<div>
										<h3 className="text-sm font-medium text-muted-foreground">
											Department
										</h3>
										<p className="text-base">
											{reservation.departmentName ?? "N/A"}
										</p>
									</div>
								</div>

								<Separator />

								<div className="grid grid-cols-2 gap-4">
									<div>
										<h3 className="text-sm font-medium text-muted-foreground">
											Date
										</h3>
										<p className="text-base">
											{formatDate(reservation.startTime)}
										</p>
									</div>
									<div>
										<h3 className="text-sm font-medium text-muted-foreground">
											Time
										</h3>
										<p className="text-base">
											{formatTime(reservation.startTime)} -{" "}
											{formatTime(reservation.endTime)}
										</p>
									</div>
								</div>

								<div className="grid grid-cols-1 gap-4">
									<div>
										<h3 className="text-sm font-medium text-muted-foreground">
											Duration
										</h3>
										<p className="text-base">
											{calculateDuration(
												reservation.startTime,
												reservation.endTime,
											)}
										</p>
									</div>
								</div>

								<Separator />

								<div>
									<h3 className="text-sm font-medium text-muted-foreground">
										Reservation Letter
									</h3>
									<div className="mt-2">
										{reservation.reservationLetterUrl ? (
											<Button
												variant="outline"
												className="gap-1"
												onClick={() => setIsApprovalLetterDialogOpen(true)}
											>
												<FileText className="h-4 w-4" />
												View Reservation Letter
											</Button>
										) : (
											<p className="text-sm text-muted-foreground italic">
												No letter uploaded.
											</p>
										)}
									</div>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Requester Information</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								{/* Use requestingUser fields */}
								<div className="grid grid-cols-2 gap-4">
									<div>
										<h3 className="text-sm font-medium text-muted-foreground">
											Name
										</h3>
										<p className="text-base">
											{reservation.requestingUser?.firstName}{" "}
											{reservation.requestingUser?.lastName}
										</p>
									</div>
									<div>
										<h3 className="text-sm font-medium text-muted-foreground">
											Department
										</h3>
										<p className="text-base">
											{reservation.departmentName ?? "N/A"}{" "}
											{/* Or fetch department name based on ID if needed */}
										</p>
									</div>
								</div>

								<div className="grid grid-cols-2 gap-4">
									<div>
										<h3 className="text-sm font-medium text-muted-foreground">
											Email
										</h3>
										<p className="text-base">
											{reservation.requestingUser?.email ?? "N/A"}
										</p>
									</div>
									<div>
										<h3 className="text-sm font-medium text-muted-foreground">
											Submitted On
										</h3>
										<p className="text-base">
											{formatDateTime(reservation.createdAt)}
										</p>
									</div>
								</div>

								<Separator />

								{/* Display rejection remarks if status is REJECTED */}
								{reservation.status === "REJECTED" && (
									<div>
										<h3 className="text-sm font-medium text-muted-foreground">
											Rejection Note
										</h3>
										<div className="mt-2 p-3 rounded-md border bg-destructive/2 border-destructive/20 text-destructive text-sm">
											{/* Find the rejection remark from approvals */}
											{approvals?.find((appr) => appr.status === "REJECTED")
												?.remarks || "No remarks provided."}
										</div>
									</div>
								)}
							</CardContent>
						</Card>
					</div>

					{/* Approval Status */}
					<Card>
						<CardHeader>
							<CardTitle>Approval Status</CardTitle>
						</CardHeader>
						<CardContent>
							{approvals && approvals.length > 0 ? (
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Approver</TableHead>
											<TableHead>Role</TableHead>
											{/* <TableHead>Department/Office</TableHead> */}
											<TableHead>Date Signed</TableHead>
											<TableHead>Status</TableHead>
											<TableHead>Remarks</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{approvals.map((approval: VenueApprovalDTO) => (
											<TableRow key={approval.id}>
												<TableCell>{approval.signedBy}</TableCell>
												<TableCell>
													<Badge className={getBadgeVariant(approval.userRole)}>
														{formatRole(approval.userRole)}
													</Badge>
												</TableCell>
												{/* <TableCell>{approval.department}</TableCell> */}
												<TableCell>
													{formatDateTime(approval.dateSigned)}
												</TableCell>
												<TableCell>
													<Badge
														className={getStatusBadgeClass(approval.status)}
													>
														{reservation.status}
													</Badge>
												</TableCell>
												<TableCell>{approval.remarks || "—"}</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							) : (
								<p className="text-sm text-muted-foreground italic">
									No approval records yet.
								</p>
							)}
						</CardContent>
					</Card>

					{/* Remarks Card (Optional - if you want a separate section) */}
					{/* ... */}
				</div>
			</div>

			{/* Reservation Letter Dialog */}
			<Dialog
				open={isApprovalLetterDialogOpen}
				onOpenChange={setIsApprovalLetterDialogOpen}
			>
				{/* ... dialog content ... */}
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle>Reservation Letter</DialogTitle>
						<DialogDescription>
							Venue: {reservation.venueName}
						</DialogDescription>
					</DialogHeader>
					<div className="flex justify-center">
						{reservation.reservationLetterUrl ? (
							<img
								src={reservation.reservationLetterUrl}
								className="w-full max-h-[70vh]"
								title="Reservation Letter"
								alt="Reservation Letter"
							/>
						) : (
							<p>No letter available.</p>
						)}
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setIsApprovalLetterDialogOpen(false)}
						>
							Close
						</Button>
						{reservation.reservationLetterUrl && (
							<a
								href={reservation.reservationLetterUrl}
								download
								target="_blank"
								rel="noopener noreferrer"
							>
								<Button>
									<Download className="mr-2 h-4 w-4" />
									Download
								</Button>
							</a>
						)}
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Approval Dialog */}
			<Dialog
				open={isApprovalDialogOpen}
				onOpenChange={setIsApprovalDialogOpen}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Approve Reservation</DialogTitle>
						<DialogDescription>
							You can optionally add remarks for this approval.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<h3 className="text-sm font-medium">
								Venue: {reservation.venueName}
							</h3>
							<p className="text-sm text-muted-foreground">
								Date: {formatDate(reservation.startTime)} | Time:{" "}
								{formatTime(reservation.startTime)} -{" "}
								{formatTime(reservation.endTime)}
							</p>
						</div>
						<Textarea
							placeholder="Optional remarks..."
							value={approvalRemarks}
							onChange={(e) => setApprovalRemarks(e.target.value)}
							rows={5}
						/>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => {
								setIsApprovalDialogOpen(false);
								setApprovalRemarks(""); // Reset on cancel
							}}
							disabled={approveMutation.isPending}
						>
							Cancel
						</Button>
						<Button
							onClick={confirmApproveReservation}
							disabled={approveMutation.isPending}
						>
							{approveMutation.isPending ? "Approving..." : "Confirm Approval"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Rejection Dialog */}
			<Dialog
				open={isRejectionDialogOpen}
				onOpenChange={setIsRejectionDialogOpen}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Reject Reservation</DialogTitle>
						<DialogDescription>
							Please provide a reason for rejection. This note will be recorded.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<h3 className="text-sm font-medium">
								Venue: {reservation.venueName}
							</h3>
							<p className="text-sm text-muted-foreground">
								Date: {formatDate(reservation.startTime)} | Time:{" "}
								{formatTime(reservation.startTime)} -{" "}
								{formatTime(reservation.endTime)}
							</p>
						</div>
						<Textarea
							placeholder="Enter reason for rejection..."
							value={rejectionRemarks}
							onChange={(e) => setRejectionRemarks(e.target.value)}
							rows={5}
						/>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => {
								setIsRejectionDialogOpen(false);
								setRejectionRemarks(""); // Reset on cancel
							}}
							disabled={rejectMutation.isPending}
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={confirmRejectReservation} // Use confirmation handler
							disabled={!rejectionRemarks.trim() || rejectMutation.isPending}
						>
							{rejectMutation.isPending ? "Rejecting..." : "Confirm Rejection"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
