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

				const userDestination = "/user/queue/notifications";
				client.subscribe(userDestination, (message: IMessage) => {
					const handleMessage = () => {
						const receivedPayload: NotificationDTO = JSON.parse(message.body);

						// --- Extract data using the new DTO structure ---
						const actualMessageText =
							receivedPayload.message?.message?.toLowerCase() || ""; // Get text from nested message
						const messageType =
							receivedPayload.message?.type?.toLowerCase() || ""; // Get type from nested message
						const entityType = receivedPayload.relatedEntityType?.toUpperCase(); // Top-level entity type
						const entityId = receivedPayload.relatedEntityPublicId; // Top-level entity ID (NOW ALWAYS EVENT ID)

						// --- Invalidate Notification Queries --- Always do this
						queryClient.invalidateQueries({
							queryKey: notificationsQueryKeys.lists(),
						});
						queryClient.invalidateQueries({
							queryKey: notificationsQueryKeys.count(),
						});

						// --- Conditional Invalidation based on Payload ---
						if (entityId) {
							// Invalidate all related event queries
							queryClient.invalidateQueries({
								queryKey: eventsQueryKeys.all,
							});
							// queryClient.invalidateQueries({
							//     queryKey: eventsQueryKeys.lists(),
							// });
							// Also invalidate the specific search query with all possible parameters
							queryClient.invalidateQueries({
								queryKey: [
									...eventsQueryKeys.listsRelated(),
									{ scope: "related" },
								],
							});
							// Invalidate specific lists based on the original trigger type
							if (entityType?.includes("EQUIPMENT")) {
								// Invalidate equipment reservation lists (cannot invalidate detail without reservation ID)
								queryClient.invalidateQueries({
									queryKey: equipmentReservationKeys.all,
								});
								// queryClient.invalidateQueries({
								//     queryKey: eventsQueryKeys.lists(),
								// });
							}
						}

						// --- End Conditional Invalidation ---

						// --- Update Toast Logic ---
						const toastTitle = generateNotificationTitle(receivedPayload); // Use helper for title
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
					};

					try {
						handleMessage();
					} catch (error) {
						console.error("!!! ERROR IN WS MESSAGE CALLBACK !!!", error);
						console.error("Failed WS message body was:", message.body);
						toast.error("Failed to process incoming notification.");
					}
				});
			},
			onStompError(frame) {
				console.error(`Broker error: ${frame.headers.message}`, frame.body);
				setStatus("error");
				toast.error("STOMP connection error", {
					description: frame.headers.message || "Check console.",
				});
			},
			onWebSocketError() {
				setStatus("error");
				toast.error("You are offline!", {
					description: "Attempting to reconnect...",
				});
			},
			onDisconnect() {
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
