import { useAtom } from "jotai";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	addPersonnelDialogAtom,
	selectedEventForAssignmentAtom,
} from "@/lib/atoms";

export function AddPersonnelDialog() {
	const [isOpen, setIsOpen] = useAtom(addPersonnelDialogAtom);
	const [_selectedEventId] = useAtom(selectedEventForAssignmentAtom);

	const handleClose = () => {
		setIsOpen(false);
	};

	return (
		<Dialog open={isOpen} onOpenChange={handleClose}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Add Personnel</DialogTitle>
					<DialogDescription>
						Please use the Manage Staff dialog to add personnel to events.
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button onClick={handleClose}>Close</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
