import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    type EquipmentReservationFormInput,
    equipmentReservationFormSchema,
} from "@/lib/schema";
import type { Equipment, EventDTO } from "@/lib/types";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { parseISO } from "date-fns";
import { useForm } from "react-hook-form";
import EquipmentList from "./equipmentList";

interface EquipmentReservationFormDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: {
        selectedEquipment: EquipmentReservationFormInput["selectedEquipment"];
    }) => void;
    event: EventDTO;
    equipment: Equipment[];
    isLoading?: boolean;
}

export function EquipmentReservationFormDialog({
    isOpen,
    onClose,
    onSubmit,
    event,
    equipment,
    isLoading = false,
}: EquipmentReservationFormDialogProps) {
    let initialStartTime: Date | undefined;
    let initialEndTime: Date | undefined;
    try {
        initialStartTime = parseISO(event.startTime);
        initialEndTime = parseISO(event.endTime);
        if (Number.isNaN(initialStartTime.getTime()))
            initialStartTime = undefined;
        if (Number.isNaN(initialEndTime.getTime())) initialEndTime = undefined;
    } catch (error) {
        console.error("Error parsing event dates:", error);
    }

    const form = useForm<
        Pick<EquipmentReservationFormInput, "selectedEquipment">
    >({
        resolver: valibotResolver(equipmentReservationFormSchema),
        defaultValues: {
            selectedEquipment: [],
        },
        mode: "onChange",
    });

    const handleSubmit = (
        values: Pick<EquipmentReservationFormInput, "selectedEquipment">,
    ) => {
        console.log("Submitting selected equipment:", values);
        // Only submit the selected equipment data
        onSubmit({ selectedEquipment: values.selectedEquipment });
    };

    const handleDialogClose = () => {
        form.reset({
            selectedEquipment: [],
        });
        onClose();
    };

    const isSubmitDisabled = () => {
        const errors = form.formState.errors;
        return (
            isLoading ||
            !!errors.selectedEquipment ||
            (form.watch("selectedEquipment")?.length ?? 0) === 0
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleDialogClose}>
            <DialogContent className="sm:max-w-[600px] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Select Equipment for Event</DialogTitle>
                    <p className="text-sm text-muted-foreground pt-1">
                        Event: {event.eventName}
                    </p>
                </DialogHeader>

                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(handleSubmit)}
                        className="space-y-6 pt-4"
                    >
                        <FormField
                            control={form.control}
                            name="selectedEquipment"
                            render={({ field }) => (
                                <FormItem>
                                    <div className="mb-4">
                                        <FormLabel className="text-base">
                                            Select Equipment *
                                        </FormLabel>
                                        <FormDescription>
                                            Select the equipment and specify the
                                            quantity needed for the event
                                            duration.
                                        </FormDescription>
                                    </div>
                                    <EquipmentList
                                        equipment={equipment}
                                        value={field.value ?? []}
                                        onChange={field.onChange}
                                    />
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <div className="flex w-full justify-between items-center">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleDialogClose}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSubmitDisabled()}
                                >
                                    {isLoading
                                        ? "Submitting..."
                                        : "Confirm Selection"}
                                </Button>
                            </div>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
