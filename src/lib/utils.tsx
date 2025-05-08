import { Badge } from "@/components/ui/badge";
import { type ClassValue, clsx } from "clsx";
import { format, setHours, setMinutes } from "date-fns";
import { twMerge } from "tailwind-merge";
import type { Equipment } from "./types";

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

export const getStatusColor = (status: string | undefined) => {
    switch (status?.toUpperCase()) {
        case "PENDING":
            return "bg-yellow-500/10 text-yellow-600";
        case "APPROVED":
            return "bg-green-500/10 text-green-600";
        case "REJECTED":
            return "bg-red-500/10 text-red-600";
        case "COMPLETED":
            return "bg-purple-500/10 text-purple-600";
        default:
            return "bg-gray-500/10 text-gray-500";
    }
};

export function getStatusBadgeClass(status: string | undefined): string {
    switch (status) {
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

export const getApproverStatusBadge = (status: string | undefined) => {
    switch (status?.toUpperCase()) {
        case "APPROVED":
            return (
                <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
                    Approved
                </Badge>
            );
        case "REJECTED":
            return (
                <Badge className="bg-red-500/10 text-red-500 hover:bg-red-500/20">
                    Rejected
                </Badge>
            );
        case "PENDING":
            return (
                <Badge className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20">
                    Pending
                </Badge>
            );
        case "NOT_REQUIRED": // Handle if applicable
            return (
                <Badge className="bg-gray-500/10 text-gray-500 hover:bg-gray-500/20">
                    Not Required
                </Badge>
            );
        default:
            return <Badge variant="outline">{status || "Unknown"}</Badge>;
    }
};

export function formatRole(role: string | null | undefined): string {
    if (!role) return "N/A";
    return role
        .split("_") // Split by underscore
        .map(
            (word) =>
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
        ) // Capitalize each word
        .join(" ") // Join with space
        .toUpperCase(); // Convert the whole string to uppercase
}
export const getBadgeVariant = (role: string): string => {
    switch (role) {
        case "SUPER_ADMIN":
            return "bg-red-100 text-red-800";
        case "VP_ADMIN":
            return "bg-purple-100 text-purple-800";
        case "ORGANIZER":
            return "bg-blue-100 text-blue-800";
        case "DEPT_HEAD":
            return "bg-yellow-100 text-yellow-800";
        case "VPAA":
            return "bg-fuchsia-100 text-fuchsia-800";
        case "VENUE_OWNER":
            return "bg-indigo-100 text-indigo-800";
        case "EQUIPMENT_OWNER":
            return "bg-teal-100 text-teal-800";
        case "MSDO":
            return "bg-pink-100 text-pink-800";
        case "OPC":
            return "bg-cyan-100 text-cyan-800";
        case "SSD":
            return "bg-orange-100 text-orange-800";
        case "FAO":
            return "bg-lime-100 text-lime-800";
        case "TSG":
            return "bg-green-100 text-green-800";
        case "CORE":
            return "bg-violet-100 text-violet-800";
        default:
            return "bg-gray-100 text-gray-800";
    }
};
