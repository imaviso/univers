import {
    type NotificationDTO,
    generateNotificationTitle,
    webSocketStatusAtom,
} from "@/lib//notifications";
import {
    equipmentReservationKeys,
    eventsQueryKeys,
    notificationsQueryKeys,
    useCurrentUser,
    venueReservationKeys,
} from "@/lib/query";
import { Client, type IMessage } from "@stomp/stompjs";
import { useRouteContext } from "@tanstack/react-router";
import { useSetAtom } from "jotai";
import { useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";

// Use ws:// or wss:// directly for brokerURL
const SOCKET_URL = import.meta.env.VITE_API_BASE_URL
    ? `${import.meta.env.VITE_API_BASE_URL.replace(/^http/, "ws")}/ws` // Use ws:// or wss://
    : "ws://localhost:8080/ws"; // Fallback for local dev

const RECONNECT_DELAY = 5000;

export function useWebSocketNotifications() {
    const { data: currentUser } = useCurrentUser();
    const setStatus = useSetAtom(webSocketStatusAtom);
    const stompClientRef = useRef<Client | null>(null);
    const intentionalDisconnect = useRef(false);
    const context = useRouteContext({ from: "/app" });
    const queryClient = context.queryClient;

    const connect = useCallback(() => {
        if (!currentUser?.email || stompClientRef.current?.active) {
            return;
        }

        intentionalDisconnect.current = false;
        setStatus("connecting");

        const client = new Client({
            brokerURL: SOCKET_URL,
            debug: (_str) => {
                /* console.log("STOMP: ", str); */
            },
            reconnectDelay: RECONNECT_DELAY,
            onConnect: () => {
                setStatus("connected");
                toast.success("You are now back online!", {
                    description: "You will able to receive notifications.",
                });

                const userDestination = "/user/queue/notifications";
                client.subscribe(userDestination, (message: IMessage) => {
                    try {
                        const receivedPayload: NotificationDTO = JSON.parse(
                            message.body,
                        );

                        // --- Extract data using the new DTO structure ---
                        const actualMessageText =
                            receivedPayload.message?.message?.toLowerCase() ||
                            ""; // Get text from nested message
                        const messageType =
                            receivedPayload.message?.type?.toLowerCase() || ""; // Get type from nested message
                        const entityType =
                            receivedPayload.relatedEntityType?.toUpperCase(); // Top-level entity type
                        const entityId = receivedPayload.relatedEntityPublicId; // Top-level entity ID (NOW ALWAYS EVENT ID)
                        // const eventId = receivedPayload.message?.eventId; // REMOVED - entityId is now the eventId

                        // --- Invalidate Notification Queries --- Always do this
                        queryClient.invalidateQueries({
                            queryKey: notificationsQueryKeys.lists(),
                        });
                        queryClient.invalidateQueries({
                            queryKey: notificationsQueryKeys.count(),
                        });

                        // --- Conditional Invalidation based on Payload ---
                        if (entityId) {
                            // Only proceed if we have an event ID (which entityId now is)
                            // Always invalidate the related event's details and approvals
                            queryClient.invalidateQueries({
                                queryKey: eventsQueryKeys.detail(entityId),
                            });
                            queryClient.invalidateQueries({
                                queryKey: eventsQueryKeys.approvals(entityId),
                            });
                            // Also invalidate general event lists as status might change
                            queryClient.invalidateQueries({
                                queryKey: eventsQueryKeys.lists(),
                            }); // Covers all, approved, etc.
                            queryClient.invalidateQueries({
                                queryKey: eventsQueryKeys.own(),
                            });
                            queryClient.invalidateQueries({
                                queryKey: eventsQueryKeys.pending(),
                            });
                            queryClient.invalidateQueries({
                                queryKey: eventsQueryKeys.pendingVenueOwner(),
                            });
                            queryClient.invalidateQueries({
                                queryKey: eventsQueryKeys.pendingDeptHead(),
                            });

                            // Invalidate specific lists based on the original trigger type
                            if (
                                entityType === "VENUE_RESERVATION" ||
                                entityType === "VENUE_RESERVATION_REQUEST"
                            ) {
                                // Invalidate venue reservation lists (cannot invalidate detail without reservation ID)
                                queryClient.invalidateQueries({
                                    queryKey: venueReservationKeys.lists(),
                                });
                                queryClient.invalidateQueries({
                                    queryKey: venueReservationKeys.own(),
                                });
                                queryClient.invalidateQueries({
                                    queryKey: venueReservationKeys.pending(),
                                });
                                queryClient.invalidateQueries({
                                    queryKey:
                                        venueReservationKeys.pendingVenueOwner(),
                                });
                            } else if (
                                entityType === "EQUIPMENT_RESERVATION" ||
                                entityType === "EQUIPMENT_RESERVATION_REQUEST"
                            ) {
                                // Invalidate equipment reservation lists (cannot invalidate detail without reservation ID)
                                queryClient.invalidateQueries({
                                    queryKey: equipmentReservationKeys.lists(),
                                });
                                queryClient.invalidateQueries({
                                    queryKey: equipmentReservationKeys.own(),
                                });
                                queryClient.invalidateQueries({
                                    queryKey:
                                        equipmentReservationKeys.pending(),
                                });
                                queryClient.invalidateQueries({
                                    queryKey:
                                        equipmentReservationKeys.pendingEquipmentOwner(),
                                });
                            }
                            // No special list invalidation needed if entityType was just "EVENT"
                        }

                        // --- End Conditional Invalidation ---

                        // --- Update Toast Logic ---
                        const toastTitle =
                            generateNotificationTitle(receivedPayload); // Use helper for title
                        const toastDescription =
                            receivedPayload.message?.message || // Use nested message text
                            "Received an update."; // Fallback description

                        // Use messageType or actualMessageText for toast type determination
                        if (
                            actualMessageText.includes("error") ||
                            actualMessageText.includes("fail") ||
                            messageType.includes("error") ||
                            messageType.includes("reject")
                        ) {
                            toast.error(toastTitle, {
                                description: toastDescription,
                            });
                        } else if (
                            actualMessageText.includes("success") ||
                            actualMessageText.includes("approved") ||
                            actualMessageText.includes("completed") ||
                            messageType.includes("success") ||
                            messageType.includes("approved")
                        ) {
                            toast.success(toastTitle, {
                                description: toastDescription,
                            });
                        } else if (
                            actualMessageText.includes("warning") ||
                            actualMessageText.includes("pending") ||
                            messageType.includes("warning") ||
                            messageType.includes("request")
                        ) {
                            toast.warning(toastTitle, {
                                description: toastDescription,
                            });
                        } else {
                            toast.info(toastTitle, {
                                description: toastDescription,
                            });
                        }
                        // --- End Toast Logic ---
                    } catch (e) {
                        console.error(
                            "!!! ERROR IN WS MESSAGE CALLBACK !!!",
                            e,
                        );
                        console.error(
                            "Failed WS message body was:",
                            message.body,
                        );
                        toast.error("Failed to process incoming notification.");
                    }
                });
            },
            onStompError: (frame) => {
                console.error(
                    `Broker error: ${frame.headers.message}`,
                    frame.body,
                );
                setStatus("error");
                toast.error("STOMP connection error", {
                    description: frame.headers.message || "Check console.",
                });
            },
            onWebSocketError: () => {
                setStatus("error");
                toast.error("You are offline!", {
                    description: "Attempting to reconnect...",
                });
            },
            onDisconnect: () => {
                if (!intentionalDisconnect.current) {
                    setStatus("disconnected");
                    toast.error("You are offline.", {
                        description: "Attempting to reconnect...",
                    });
                } else {
                    setStatus("closed");
                }
            },
        });

        stompClientRef.current = client;
        client.activate();
    }, [currentUser, setStatus, queryClient]);

    const disconnect = useCallback(() => {
        if (stompClientRef.current?.active) {
            intentionalDisconnect.current = true;
            stompClientRef.current.deactivate();
            stompClientRef.current = null;
            setStatus("closed");
        } else {
            // Ensure status is consistent if already inactive/null
            const currentStatus = webSocketStatusAtom.init; // Read current status if needed
            if (currentStatus !== "closed") {
                setStatus("disconnected"); // Or 'closed' depending on desired state
            }
        }
    }, [setStatus]); // Removed status from dependency array as it caused potential loops

    useEffect(() => {
        if (currentUser?.email) {
            connect();
        } else {
            disconnect();
        }
        return () => {
            disconnect();
        };
    }, [currentUser, connect, disconnect]);
}
