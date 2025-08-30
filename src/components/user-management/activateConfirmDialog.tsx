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

interface ActivateConfirmDialogProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: () => void;
	title: string;
	description: string;
	isLoading?: boolean;
}

export function ActivateConfirmDialog({
	isOpen,
	isLoading,
	onClose,
	onConfirm,
	title,
	description,
}: ActivateConfirmDialogProps) {
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
								<LoaderCircleIcon
									className="-ms-1 animate-spin"
									size={16}
									aria-hidden="true"
								/>
								Activate
							</>
						) : (
							"Activate"
						)}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
