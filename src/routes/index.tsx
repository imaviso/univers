import { userQueryOptions } from "@/lib/query";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
	beforeLoad: async ({ context }) => {
		const queryClient = context.queryClient;
		let isAuthenticated = false;
		try {
			// Attempt to fetch user data. If successful, user is authenticated.
			// Using fetchQuery ensures we get the data or an error.
			const user = await queryClient.fetchQuery(userQueryOptions);
			isAuthenticated = !!user; // Check if user data exists
		} catch (error) {
			// If fetchQuery throws (e.g., 401 error, network error), treat as unauthenticated.
			console.log("User not authenticated on index route:", error);
			isAuthenticated = false;
		}

		if (isAuthenticated) {
			// If authenticated, redirect from "/" to "/app/calendar"
			throw redirect({
				to: "/app/calendar",
				replace: true, // Replace "/" in history
			});
		}

		// If not authenticated (the code reaches here only if isAuthenticated is false), redirect from "/" to "/login"
		throw redirect({
			to: "/login",
			replace: true, // Replace "/" in history
		});

		// This part of the function is now unreachable because one of the redirects will always be thrown.
	},
	component: Index,
});

function Index() {
	throw null;
}
