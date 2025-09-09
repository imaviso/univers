export default function PendingPage() {
	return (
		<div className="flex flex-col items-center justify-center min-h-screen bg-background">
			<div className="relative w-20 h-20">
				<div className="absolute inset-0 rounded-full border-4 border-primary/30" />
				<div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin" />
			</div>
			<h2 className="text-xl font-medium mt-6">Processing your request</h2>
			<div className="flex gap-1 mt-2">
				<span className="animate-bounce delay-0">.</span>
				<span className="animate-bounce delay-150">.</span>
				<span className="animate-bounce delay-300">.</span>
			</div>
		</div>
	);
}
