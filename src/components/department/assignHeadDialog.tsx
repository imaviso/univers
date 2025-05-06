import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import type { UserType } from "@/lib/types";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface AssignHeadDialogProps {
    isOpen: boolean;
    onClose: () => void;
    departmentName: string;
    currentHeadId: number | undefined;
    users: UserType[];
    onAssign: (userId: number) => void; // Callback with selected user ID
    isLoading?: boolean;
}

export function AssignHeadDialog({
    isOpen,
    onClose,
    departmentName,
    currentHeadId,
    users,
    onAssign,
    isLoading,
}: AssignHeadDialogProps) {
    // State to hold the selected user ID (as string from Select)
    const [selectedUserId, setSelectedUserId] = useState<string>("");

    // Reset selection when dialog opens or current head changes
    useEffect(() => {
        if (isOpen) {
            setSelectedUserId(currentHeadId ? String(currentHeadId) : "");
        }
    }, [isOpen, currentHeadId]);

    const handleConfirm = () => {
        if (!selectedUserId) {
            // This case might mean unassigning, which the current backend endpoint doesn't support.
            // If unassigning is desired, use the updateDepartment endpoint instead.
            // For now, we require a user to be selected for this specific dialog.
            toast.error("Please select a user to assign as department head.");
            return;
        }
        const userIdNumber = Number(selectedUserId);
        if (Number.isNaN(userIdNumber)) {
            toast.error("Invalid user selected.");
            return;
        }
        onAssign(userIdNumber); // Call the callback prop
    };

    const handleClose = () => {
        if (!isLoading) {
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle>Assign Department Head</DialogTitle>
                    <DialogDescription>
                        Select a user to be the head of the "{departmentName}"
                        department.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-2">
                    <Label htmlFor="user-select">Select User</Label>
                    <Select
                        value={selectedUserId}
                        onValueChange={setSelectedUserId}
                        disabled={isLoading}
                    >
                        <SelectTrigger id="user-select">
                            <SelectValue placeholder="Select a user..." />
                        </SelectTrigger>
                        <SelectContent>
                            {/* Option to unassign - Requires backend/different endpoint logic */}
                            {/* <SelectItem value="">-- None --</SelectItem> */}
                            {users.map((user) => (
                                <SelectItem key={user.id} value={user.id}>
                                    {user.firstName} {user.lastName} (
                                    {user.email})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {/* Optional: Display warning if selecting the same user */}
                    {currentHeadId &&
                        String(currentHeadId) === selectedUserId && (
                            <p className="text-xs text-muted-foreground">
                                This user is already the department head.
                            </p>
                        )}
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleClose}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleConfirm}
                        // Disable if no user is selected OR if the selected user is the current head
                        disabled={
                            !selectedUserId ||
                            String(currentHeadId) === selectedUserId ||
                            isLoading
                        }
                    >
                        {isLoading ? "Assigning..." : "Assign Head"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
