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
        console.log("Attempting STOMP connection over plain WebSocket...");

        const client = new Client({
            brokerURL: SOCKET_URL,
            debug: (str) => {
                /* console.log("STOMP: ", str); */
            },
            reconnectDelay: RECONNECT_DELAY,
            onConnect: (frame) => {
                setStatus("connected");

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
                        const entityId = receivedPayload.relatedEntityId; // Top-level entity ID
                        const eventId = receivedPayload.message?.eventId; // Event ID from nested message

                        // --- Invalidate Notification Queries ---
                        queryClient.invalidateQueries({
                            queryKey: notificationsQueryKeys.lists(),
                        });
                        queryClient.invalidateQueries({
                            queryKey: notificationsQueryKeys.count(),
                        });

                        // --- Conditional Invalidation based on Payload ---
                        if (entityType === "EVENT") {
                            console.log(
                                "Invalidating EVENT related queries...",
                            );
                            queryClient.invalidateQueries({
                                queryKey: eventsQueryKeys.all,
                            });
                            queryClient.invalidateQueries({
                                queryKey: eventsQueryKeys.own(),
                            });
                            queryClient.invalidateQueries({
                                queryKey: eventsQueryKeys.approved(),
                            });

                            // Use actualMessageText for content checks
                            if (actualMessageText.includes("approval")) {
                                queryClient.invalidateQueries({
                                    queryKey:
                                        eventsQueryKeys.pendingVenueOwner(),
                                });
                                queryClient.invalidateQueries({
                                    queryKey: eventsQueryKeys.pendingDeptHead(),
                                });
                            }
                            // Use primary entityId for detail/approval invalidation
                            if (entityId) {
                                queryClient.invalidateQueries({
                                    queryKey: eventsQueryKeys.detail(entityId),
                                });
                                queryClient.invalidateQueries({
                                    queryKey:
                                        eventsQueryKeys.approvals(entityId),
                                });
                            }
                        } else if (entityType === "VENUE_RESERVATION") {
                            console.log(
                                "Invalidating VENUE_RESERVATION related queries...",
                            );
                            queryClient.invalidateQueries({
                                queryKey: venueReservationKeys.lists(),
                            });
                            queryClient.invalidateQueries({
                                queryKey: venueReservationKeys.own(),
                            });

                            // Use actualMessageText for content checks
                            if (actualMessageText.includes("approval")) {
                                queryClient.invalidateQueries({
                                    queryKey:
                                        venueReservationKeys.pendingVenueOwner(),
                                });
                                queryClient.invalidateQueries({
                                    queryKey: venueReservationKeys.pending(),
                                });
                            }
                            // Use primary entityId for detail/approval invalidation
                            if (entityId) {
                                queryClient.invalidateQueries({
                                    queryKey:
                                        venueReservationKeys.detail(entityId),
                                });
                                queryClient.invalidateQueries({
                                    queryKey:
                                        venueReservationKeys.approvals(
                                            entityId,
                                        ),
                                });
                            }
                            // Invalidate related event if eventId is present
                            if (eventId) {
                                queryClient.invalidateQueries({
                                    queryKey: eventsQueryKeys.detail(eventId),
                                });
                            }
                        } else if (entityType === "EQUIPMENT_RESERVATION") {
                            console.log(
                                "Invalidating EQUIPMENT_RESERVATION related queries...",
                            );
                            queryClient.invalidateQueries({
                                queryKey: equipmentReservationKeys.lists(),
                            });
                            queryClient.invalidateQueries({
                                queryKey: equipmentReservationKeys.own(),
                            });

                            // Use actualMessageText for content checks
                            if (actualMessageText.includes("approval")) {
                                queryClient.invalidateQueries({
                                    queryKey:
                                        equipmentReservationKeys.pendingEquipmentOwner(),
                                });
                                queryClient.invalidateQueries({
                                    queryKey:
                                        equipmentReservationKeys.pending(),
                                });
                            }
                            // Use primary entityId for detail/approval invalidation
                            if (entityId) {
                                queryClient.invalidateQueries({
                                    queryKey:
                                        equipmentReservationKeys.detail(
                                            entityId,
                                        ),
                                });
                                queryClient.invalidateQueries({
                                    queryKey:
                                        equipmentReservationKeys.approvals(
                                            entityId,
                                        ),
                                });
                            }
                            // Invalidate related event if eventId is present
                            if (eventId) {
                                queryClient.invalidateQueries({
                                    queryKey: eventsQueryKeys.detail(eventId),
                                });
                            }
                        }
                        // Add more 'else if' blocks for other entity types (USER, etc.)

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
                console.log(`Subscribed to: ${userDestination}`);
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
            onWebSocketError: (event) => {
                console.error("WebSocket error:", event);
                setStatus("error");
            },
            onDisconnect: (frame) => {
                console.log("STOMP Disconnected:", frame);
                if (!intentionalDisconnect.current) {
                    setStatus("disconnected");
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
            console.log("Deactivating STOMP client intentionally...");
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
