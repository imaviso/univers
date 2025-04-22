import { type ClassValue, clsx } from "clsx";
import { format, setHours, setMinutes } from "date-fns";
import { twMerge } from "tailwind-merge";

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
