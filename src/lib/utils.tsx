import { type ClassValue, clsx } from "clsx";
import { format, setHours, setMinutes } from "date-fns";
import { useEffect, useState } from "react";
import { twMerge } from "tailwind-merge";
import { Badge } from "@/components/ui/badge";
import type { Equipment, Status, UserRole } from "./types";

// Normalize unknown strings to a safe Status value
export function toStatus(s?: string | Status | null): Status | undefined {
	if (!s) return undefined;
	const upper = s.toString().trim().toUpperCase();
	// Map common variants to canonical values
	const normalized = upper === "CANCELLED" ? "CANCELED" : upper;
	const VALID_STATUSES: Status[] = [
		"APPROVED",
		"PENDING",
		"CANCELED",
		"REJECTED",
		"ONGOING",
		"COMPLETED",
		"ENDED",
		"DEFECT",
		"MAINTENANCE",
		"NEED_REPLACEMENT",
		"NEW",
		"AVAILABLE",
		"RESERVED",
		"DENIED_RESERVATION",
		"PAID",
		"UNPAID",
	];
	return VALID_STATUSES.includes(normalized as Status)
		? (normalized as Status)
		: undefined;
}

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

// Helper function to combine date and time string
export const combineDateTime = (date: Date, time: string): Date => {
	const [hours = 0, minutes = 0] = time.split(":").map(Number);
	const newDate = new Date(date);
	newDate.setHours(hours, minutes, 0, 0);
	return newDate;
};

export const timeOptions = (() => {
	const StartHour = 0;
	const EndHour = 23;
	const options = [];
	for (let hour = StartHour; hour <= EndHour; hour++) {
		for (let minute = 0; minute < 60; minute += 15) {
			const formattedHour = hour.toString().padStart(2, "0");
			const formattedMinute = minute.toString().padStart(2, "0");
			const value = `${formattedHour}:${formattedMinute}`;
			const date = setMinutes(setHours(new Date(), hour), minute);
			const label = format(date, "h:mm a");
			options.push({ value, label });
		}
	}
	return options;
})();

export const getInitials = (name: string): string => {
	if (!name) return "?";
	const names = name.split(" ");
	if (names.length === 1) return names[0].charAt(0).toUpperCase();
	return (
		names[0].charAt(0).toUpperCase() +
		names[names.length - 1].charAt(0).toUpperCase()
	);
};

export const formatDateRange = (start: Date, end: Date): string => {
	if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
		console.error("formatDateRange received invalid Date objects.");
		return "Invalid date range";
	}
	const startFormat = "MMM d, yyyy h:mm a";
	const endFormatTimeOnly = "h:mm a";
	const endFormatFull = "MMM d, yyyy h:mm a";
	if (
		start.getFullYear() === end.getFullYear() &&
		start.getMonth() === end.getMonth() &&
		start.getDate() === end.getDate()
	) {
		return `${format(start, startFormat)} - ${format(end, endFormatTimeOnly)}`;
	}
	return `${format(start, startFormat)} to ${format(end, endFormatFull)}`;
};

export const formatDateTime = (dateString: string | null): string => {
	if (!dateString) return "—";
	try {
		// Assuming dateString is ISO 8601 or compatible
		return format(new Date(dateString), "MMM d, yyyy h:mm a");
	} catch (error) {
		console.error("Error formatting date:", dateString, error);
		return "Invalid Date";
	}
};

export const getStatusColor = (status: Status | string | undefined | null) => {
	const st = toStatus(status as string | null);
	switch (st) {
		case "PENDING":
			return "bg-yellow-500/10 text-yellow-600";
		case "APPROVED":
			return "bg-maroon/10 text-maroon";
		case "REJECTED":
			return "bg-red-500/10 text-red-600";
		case "COMPLETED":
			return "bg-purple-500/10 text-purple-600";
		case "ONGOING":
			return "bg-blue-500/10 text-blue-600";
		default:
			return "bg-gray-500/10 text-gray-500";
	}
};

export function getStatusBadgeClass(
	status: Status | string | undefined | null,
): string {
	const st = toStatus(status as string | null);
	switch (st) {
		case "NEW":
			return "border-blue-500/50 bg-blue-500/10 text-blue-600 dark:text-blue-400";
		case "PENDING":
			return "border-yellow-500/50 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400";
		case "APPROVED":
			return "border-green-500/50 bg-green-500/10 text-green-600 dark:text-green-400";
		case "REJECTED":
			return "border-red-500/50 bg-red-500/10 text-red-600 dark:text-red-400";
		case "MAINTENANCE":
			return "border-orange-500/50 bg-orange-500/10 text-orange-600 dark:text-orange-400";
		default:
			return "border-gray-500/50 bg-gray-500/10 text-gray-600 dark:text-gray-400";
	}
}

export function getEquipmentNameById(
	equipmentList: Equipment[],
	id: string | number,
): string | null {
	const equipment = equipmentList.find((item) => {
		if (typeof id === "string" && item.publicId === id) {
			return true;
		}
		return false;
	});
	return equipment ? equipment.name : null;
}

export const getApproverStatusBadge = (
	status: Status | string | undefined | null,
	userRole?: string | string[] | null,
) => {
	const raw = status?.toString().trim().toUpperCase();
	if (raw === "NOT_REQUIRED") {
		return (
			<Badge className="bg-gray-500/10 text-gray-500 hover:bg-gray-500/20">
				Not Required
			</Badge>
		);
	}

	const st = toStatus(raw ?? null);
	const isAccountingUser = Array.isArray(userRole)
		? userRole.includes("ACCOUNTING")
		: userRole === "ACCOUNTING";
	const isVpaaUser = Array.isArray(userRole)
		? userRole.includes("VPAA")
		: userRole === "VPAA";

	switch (st) {
		case "APPROVED":
			return (
				<Badge className="bg-maroon/10 text-maroon hover:bg-maroon/20">
					{isAccountingUser ? "Paid" : isVpaaUser ? "Recommended" : "Reserved"}
				</Badge>
			);
		case "ONGOING":
			return (
				<Badge className="bg-maroon/10 text-maroon hover:bg-maroon/20">
					Ongoing
				</Badge>
			);
		case "COMPLETED":
			return (
				<Badge className="bg-maroon/10 text-maroon hover:bg-maroon/20">
					Completed
				</Badge>
			);
		case "RESERVED":
			return (
				<Badge className="bg-maroon/10 text-maroon hover:bg-maroon/20">
					{isAccountingUser ? "Paid" : isVpaaUser ? "Recommended" : "Reserved"}
				</Badge>
			);
		case "REJECTED":
			return (
				<Badge className="bg-red-500/10 text-red-500 hover:bg-red-500/20">
					{isAccountingUser
						? "Unpaid"
						: isVpaaUser
							? "Not Recommended"
							: "Denied Reservation"}
				</Badge>
			);
		case "CANCELED":
			return (
				<Badge className="bg-red-500/10 text-red-500 hover:bg-red-500/20">
					Canceled
				</Badge>
			);
		case "DENIED_RESERVATION":
			return (
				<Badge className="bg-red-500/10 text-red-500 hover:bg-red-500/20">
					{isAccountingUser
						? "Unpaid"
						: isVpaaUser
							? "Not Recommended"
							: "Denied Reservation"}
				</Badge>
			);
		case "PENDING":
			return (
				<Badge className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20">
					{isAccountingUser ? "Unpaid" : "Pending"}
				</Badge>
			);
		case "UNPAID":
			return (
				<Badge className="bg-red-500/10 text-red-500 hover:bg-red-500/20">
					Unpaid
				</Badge>
			);
		case "PAID":
			return (
				<Badge className="bg-maroon/10 text-maroon hover:bg-maroon/20">
					Paid
				</Badge>
			);
		default:
			return <Badge variant="outline">{st || "Unknown"}</Badge>;
	}
};

export function formatRole(role: UserRole): string {
	if (!role) return "N/A";

	if (role === "VP_ADMIN") return "VP Admin";

	if (role === "SUPER_ADMIN") return "Super Admin";

	if (role === "ADMIN") return "Approver";

	if (role === "VPAA") return "VPAA";

	return role
		.split("_")
		.map((word) => {
			if (word === "DEPT") return "Dept";
			return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
		})
		.join(" ");
}

export function formatRoles(roles: UserRole[] | null | undefined): string[] {
	if (!roles || roles.length === 0) return ["N/A"];
	return roles.map((role) => formatRole(role));
}

export const getBadgeVariant = (role: UserRole): string => {
	switch (role) {
		case "SUPER_ADMIN":
			return "bg-red-100 text-red-800";
		case "VP_ADMIN":
			return "bg-purple-100 text-purple-800";
		case "ORGANIZER":
			return "bg-blue-100 text-blue-800";
		case "DEPT_HEAD":
			return "bg-yellow-100 text-yellow-800";
		case "ADMIN":
			return "bg-fuchsia-100 text-fuchsia-800";
		case "VENUE_OWNER":
			return "bg-indigo-100 text-indigo-800";
		case "EQUIPMENT_OWNER":
			return "bg-teal-100 text-teal-800";
		case "VPAA":
			return "bg-orange-100 text-orange-800";
		case "ACCOUNTING":
			return "bg-cyan-100 text-cyan-800";
		default:
			return "bg-gray-100 text-gray-800";
	}
};

export function usePersistentState<T>(
	key: string,
	initialValue: T,
): [T, React.Dispatch<React.SetStateAction<T>>] {
	const [state, setState] = useState<T>(() => {
		try {
			const storedValue = localStorage.getItem(key);
			if (!storedValue) return initialValue;

			try {
				const parsed = JSON.parse(storedValue);
				return parsed ?? initialValue;
			} catch (parseError) {
				console.warn(
					`Invalid JSON in localStorage for key "${key}":`,
					parseError,
				);
				return initialValue;
			}
		} catch (error) {
			console.error("Error reading from localStorage:", error);
			return initialValue;
		}
	});

	useEffect(() => {
		try {
			if (state === undefined) {
				localStorage.removeItem(key);
			} else {
				localStorage.setItem(key, JSON.stringify(state));
			}
		} catch (error) {
			console.error("Error writing to localStorage:", error);
		}
	}, [key, state]);

	return [state, setState];
}
