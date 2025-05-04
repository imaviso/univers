import {
    type BackendNotificationPayload,
    type NotificationDTO,
    addNotificationAtom,
    webSocketStatusAtom,
} from "@/lib//notifications"; // Adjust path if needed
import {
    equipmentReservationKeys,
    eventsQueryKeys,
    notificationsQueryKeys,
    useCurrentUser,
    venueReservationKeys,
} from "@/lib/query";
// Remove SockJS import
// import SockJS from "sockjs-client";
import { Client, type IMessage } from "@stomp/stompjs"; // Import STOMP Client
import { useQueryClient } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";
import { en } from "chrono-node";
import { useSetAtom } from "jotai";
// filepath: /home/yunyun/Dev/univers/src/hooks/use-websocket-notifications.ts
import { useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";

// Use ws:// or wss:// directly for brokerURL
const SOCKET_URL = import.meta.env.VITE_API_BASE_URL
    ? `${import.meta.env.VITE_API_BASE_URL.replace(/^http/, "ws")}/ws` // Use ws:// or wss://
    : "ws://localhost:8080/ws"; // Fallback for local dev

const RECONNECT_DELAY = 5000; // 5 seconds
export function useWebSocketNotifications() {
    const { data: currentUser } = useCurrentUser();
    const setStatus = useSetAtom(webSocketStatusAtom);
    // Remove addNotification atom usage
    // const addNotification = useSetAtom(addNotificationAtom);
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
                        const messageText =
                            receivedPayload.message?.toLowerCase() || "";
                        const entityType =
                            receivedPayload.relatedEntityType?.toUpperCase();
                        const entityId = receivedPayload.relatedEntityId;

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
                            // Invalidate general event lists, own events, approved events
                            queryClient.invalidateQueries({
                                queryKey: eventsQueryKeys.all, // Use the factory
                            });
                            queryClient.invalidateQueries({
                                queryKey: eventsQueryKeys.own(), // Use the factory
                            });
                            queryClient.invalidateQueries({
                                queryKey: eventsQueryKeys.approved(), // Use the factory
                            });

                            // More specific invalidation if needed (e.g., for pending lists)
                            if (messageText.includes("approval")) {
                                queryClient.invalidateQueries({
                                    queryKey:
                                        eventsQueryKeys.pendingVenueOwner(),
                                });
                                queryClient.invalidateQueries({
                                    queryKey: eventsQueryKeys.pendingDeptHead(),
                                });
                            }
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
                            // Invalidate general list and own list
                            queryClient.invalidateQueries({
                                queryKey: venueReservationKeys.lists(),
                            });
                            queryClient.invalidateQueries({
                                queryKey: venueReservationKeys.own(),
                            });

                            // Example: Invalidate pending venue reservations if message mentions approval
                            if (messageText.includes("approval")) {
                                queryClient.invalidateQueries({
                                    queryKey:
                                        venueReservationKeys.pendingVenueOwner(),
                                });
                                // Also invalidate the general pending key if it exists/is used
                                queryClient.invalidateQueries({
                                    queryKey: venueReservationKeys.pending(),
                                });
                            }
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
                        } else if (entityType === "EQUIPMENT_RESERVATION") {
                            console.log(
                                "Invalidating EQUIPMENT_RESERVATION related queries...",
                            );
                            // Invalidate general list and own list
                            queryClient.invalidateQueries({
                                queryKey: equipmentReservationKeys.lists(),
                            });
                            queryClient.invalidateQueries({
                                queryKey: equipmentReservationKeys.own(),
                            });

                            if (messageText.includes("approval")) {
                                queryClient.invalidateQueries({
                                    queryKey:
                                        equipmentReservationKeys.pendingEquipmentOwner(),
                                });
                                // Also invalidate the general pending key if it exists/is used
                                queryClient.invalidateQueries({
                                    queryKey:
                                        equipmentReservationKeys.pending(),
                                });
                            }
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
                        }
                        // Add more 'else if' blocks for other entity types (USER, etc.)

                        // --- End Conditional Invalidation ---

                        const toastTitle =
                            receivedPayload.relatedEntityType || "Notification";
                        const toastDescription = receivedPayload.message;

                        // Use specific toast functions based on message content
                        if (
                            messageText.includes("error") ||
                            messageText.includes("fail")
                        ) {
                            toast.error(toastTitle, {
                                description: toastDescription,
                            });
                        } else if (
                            messageText.includes("success") ||
                            messageText.includes("approved") ||
                            messageText.includes("completed")
                        ) {
                            toast.success(toastTitle, {
                                description: toastDescription,
                            });
                        } else if (
                            messageText.includes("warning") ||
                            messageText.includes("pending")
                        ) {
                            toast.warning(toastTitle, {
                                description: toastDescription,
                            }); // Or use toast.info or default
                        } else {
                            toast.info(toastTitle, {
                                description: toastDescription,
                            }); // Default to info or basic toast
                            // Or just: toast(toastTitle, { description: toastDescription });
                        }
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
                // Don't show toast here, might be noisy during reconnect attempts
            },
            onDisconnect: (frame) => {
                console.log("STOMP Disconnected:", frame);
                // Only set to disconnected if it wasn't intentional
                if (!intentionalDisconnect.current) {
                    setStatus("disconnected");
                    // Optionally show a toast that connection was lost
                    // toast.warning("Notification connection lost. Attempting to reconnect...");
                } else {
                    setStatus("closed"); // Or keep as 'disconnected'
                }
            },
        });

        stompClientRef.current = client;
        client.activate();
    }, [currentUser, setStatus, queryClient]); // Add queryClient to dependency array

    const disconnect = useCallback(() => {
        if (stompClientRef.current?.active) {
            console.log("Deactivating STOMP client intentionally...");
            intentionalDisconnect.current = true;
            stompClientRef.current.deactivate();
            stompClientRef.current = null; // Clear ref after deactivation
            setStatus("closed"); // Set a distinct status for intentional close
        } else {
            // If already inactive or null, ensure status reflects it
            if (status !== "closed") {
                // Avoid redundant updates if already closed
                setStatus("disconnected");
            }
        }
    }, [setStatus]); // status added to dependency array

    useEffect(() => {
        if (currentUser?.email) {
            connect();
        } else {
            disconnect();
        }
        // Cleanup function: disconnect when component unmounts or user logs out
        return () => {
            disconnect();
        };
    }, [currentUser, connect, disconnect]); // Dependencies are correct

    // No return value needed as state is managed elsewhere (Jotai/React Query)
}
