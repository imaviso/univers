import { atom } from "jotai";

// Define the expected structure of a notification payload from the backend
export interface BackendNotificationPayload {
    title: string;
    description: string;
    type?: "default" | "success" | "error" | "warning"; // Optional type
    // Add other fields if your backend sends more data
}

export interface NotificationDTO {
    id: number;
    eventId: string;
    message: {
        equipmentId?: string;
        equipmentName?: string;
        equipmentReservationId?: string;
        venueId?: string;
        venueName?: string;
        venueReservationId?: string;
        requesterName?: string;
        eventName?: string;
        approver?: string;
        type?: string;
        message?: string;
        eventId?: string;
    };
    createdAt: string;
    isRead: boolean;
    relatedEntityId: number | null;
    relatedEntityType: string | null;
}

export interface Notification {
    id: number;
    message: string;
    timestamp: Date;
    isRead: boolean;
    relatedEntityId: number | null;
    relatedEntityType: string | null;
    title?: string;
    type: "default" | "success" | "error" | "warning";
    originalMessageData?: NotificationDTO["message"];
}

export interface Page<T> {
    content: T[];
    totalPages: number;
    totalElements: number;
    number: number; // Current page number (0-indexed)
    size: number;
    // Add other pagination fields if needed (first, last, sort, etc.)
}

export type WebSocketStatus =
    | "connecting"
    | "connected"
    | "disconnected"
    | "error"
    | "closed";

// Atom to store the list of notifications
export const notificationsAtom = atom<Notification[]>([]);

// Atom to store the WebSocket connection status
export const webSocketStatusAtom = atom<WebSocketStatus>("disconnected");

// Derived atom for the count of unread notifications
export const unreadNotificationsCountAtom = atom(
    (get) => get(notificationsAtom).filter((n) => !n.read).length,
);

// Atom to add a new notification
export const addNotificationAtom = atom(
    null, // write-only atom
    (
        get,
        set,
        newNotificationData: Omit<Notification, "id" | "timestamp" | "read">,
    ) => {
        const newNotification: Notification = {
            ...newNotificationData,
            id: Date.now(), // Use timestamp as a simple unique ID
            timestamp: new Date(),
            read: false,
            type: newNotificationData.type ?? "default",
        };
        set(notificationsAtom, (prev) => [newNotification, ...prev]);
    },
);

// Atom to mark a notification as read
export const markNotificationAsReadAtom = atom(
    null, // write-only atom
    (get, set, id: number) => {
        set(notificationsAtom, (prev) =>
            prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
        );
    },
);

// Atom to clear all notifications
export const clearNotificationsAtom = atom(
    null, // write-only atom
    (get, set) => {
        set(notificationsAtom, []);
    },
);

export const generateNotificationTitle = (
    notification: NotificationDTO,
): string => {
    // Access nested fields
    if (notification.message?.eventName) {
        return `Event: ${notification.message.eventName}`;
    }
    // Use nested type first
    if (notification.message?.type) {
        return notification.message.type
            .replace(/_/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase());
    }
    // Fallback to top-level relatedEntityType
    if (notification.relatedEntityType) {
        return notification.relatedEntityType
            .replace(/_/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase());
    }
    return "Notification Update";
};
