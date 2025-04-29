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

interface CancelConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    isLoading?: boolean; // Add isLoading prop
}

export function CancelConfirmDialog({
    isOpen,
    isLoading,
    onClose,
    onConfirm,
    title,
    description,
}: CancelConfirmDialogProps) {
    return (
        <AlertDialog open={isOpen} onOpenChange={onClose}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {description}
                    </AlertDialogDescription>
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
                                Cancel
                            </>
                        ) : (
                            "Cancel"
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
