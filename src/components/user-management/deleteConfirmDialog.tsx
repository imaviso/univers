import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { LoaderCircleIcon } from "lucide-react";

interface DeleteConfirmDialogProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: () => void;
	title: string;
	description: string;
	isLoading?: boolean; // Add isLoading prop
	buttonText?: string; // Add buttonText prop
}

export function DeleteConfirmDialog({
	isOpen,
	isLoading,
	onClose,
	onConfirm,
	title,
	description,
	buttonText,
}: DeleteConfirmDialogProps) {
	return (
		<AlertDialog open={isOpen} onOpenChange={onClose}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{title}</AlertDialogTitle>
					<AlertDialogDescription>{description}</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction
						onClick={onConfirm}
						className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
					>
						{isLoading ? (
							<>
								<LoaderCircleIcon className="-ms-1 animate-spin" size={16} />
								{buttonText || "Delete"}
							</>
						) : (
							buttonText || "Delete"
						)}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
