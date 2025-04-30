import {
    type BackendNotificationPayload,
    type NotificationDTO,
    addNotificationAtom,
    webSocketStatusAtom,
} from "@/lib//notifications"; // Adjust path if needed
import {
    getApprovedEventsQuery,
    getOwnEventsQueryOptions,
    notificationsQueryKeys,
    useCurrentUser,
} from "@/lib/query";
// Remove SockJS import
// import SockJS from "sockjs-client";
import { Client, type IMessage } from "@stomp/stompjs"; // Import STOMP Client
import { useQueryClient } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";
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
                console.log("STOMP Connected:", frame);
                setStatus("connected");

                const userDestination = "/user/queue/notifications";
                client.subscribe(userDestination, (message: IMessage) => {
                    console.log(
                        `Received message on ${userDestination}:`,
                        message.body,
                    );
                    try {
                        // Parse the DTO from backend
                        const receivedPayload: NotificationDTO = JSON.parse(
                            message.body,
                        );

                        // --- Invalidate React Query Data ---
                        console.log(
                            "Invalidating notification queries due to WS message...",
                        );
                        queryClient.invalidateQueries({
                            queryKey: notificationsQueryKeys.lists(),
                        });
                        queryClient.invalidateQueries({
                            queryKey: notificationsQueryKeys.count(),
                        });
                        queryClient.invalidateQueries({
                            queryKey: getOwnEventsQueryOptions.queryKey,
                        });
                        queryClient.invalidateQueries({
                            queryKey: getApprovedEventsQuery.queryKey,
                        });

                        // --- End Invalidation ---

                        // Show a toast notification (using data from DTO)
                        // Map backend type/message to title/description/type for toast
                        const toastTitle =
                            receivedPayload.relatedEntityType || "Notification"; // Example title
                        const toastDescription = receivedPayload.message;
                        // You might want more sophisticated type mapping based on relatedEntityType
                        const toastType = receivedPayload.message
                            .toLowerCase()
                            .includes("error")
                            ? "error"
                            : receivedPayload.message
                                    .toLowerCase()
                                    .includes("success") ||
                                receivedPayload.message
                                    .toLowerCase()
                                    .includes("approved")
                              ? "success"
                              : "default";

                        toast(toastTitle, {
                            description: toastDescription,
                            // You might need to adjust toast options based on its type
                            // e.g., using different icons or colors via `toast[toastType](...)` if sonner supports it easily
                        });
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
