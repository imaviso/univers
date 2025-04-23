import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { Home } from "lucide-react";

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen px-4">
            <div className="w-full max-w-md text-center space-y-8">
                {/* 404 Illustration */}
                <div className="relative mx-auto w-64 h-64 md:w-80 md:h-80">
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-[180px] md:text-[220px] font-bold text-primary">
                            404
                        </div>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-5xl md:text-6xl font-bold text-accent">
                            404
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="space-y-4">
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                        Page not found
                    </h1>
                    <p className="text-primary max-w-sm mx-auto">
                        Sorry, we couldn't find the page you're looking for. It
                        might have been moved or deleted.
                    </p>
                </div>

                {/* Navigation Options */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                    <Button asChild variant="default">
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
