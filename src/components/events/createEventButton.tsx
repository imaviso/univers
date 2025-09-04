import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CreateEventButtonProps {
	onClick: () => void;
}

export function CreateEventButton({ onClick }: CreateEventButtonProps) {
	return (
		<Button onClick={onClick} size="sm" className="gap-1">
			<Plus className="h-4 w-4" />
			New Event
		</Button>
	);
}
