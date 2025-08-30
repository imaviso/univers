"use client";

import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { AlertTriangle, Home } from "lucide-react";

export default function ErrorPage() {
	return (
		<div className="flex flex-col items-center justify-center min-h-screen bg-background px-4">
			<div className="w-full max-w-md text-center space-y-8">
				<div className="mx-auto w-24 h-24 rounded-full bg-red-100 flex items-center justify-center">
					<AlertTriangle className="h-12 w-12 text-destructive" />
				</div>

				{/* Content */}
				<div className="space-y-4">
					<h1 className="text-2xl md:text-3xl font-bold tracking-tight">
						This page is not available
					</h1>
					<p className="text-gray-500 max-w-sm mx-auto">
						Something went wrong. Please try again later.
					</p>
				</div>

				<div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
					<Button asChild variant="outline">
						<Link to="/login">
							<Home className="mr-2 h-4 w-4" />
							Back to Home
						</Link>
					</Button>
				</div>
			</div>
		</div>
	);
}
