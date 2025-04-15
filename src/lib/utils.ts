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
