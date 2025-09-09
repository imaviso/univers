import { valibotResolver } from "@hookform/resolvers/valibot";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
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
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { updateDepartment } from "@/lib/api";
import { departmentsQueryOptions, usersQueryOptions } from "@/lib/query";
import { type EditDepartmentInput, editDepartmentSchema } from "@/lib/schema";
import type { DepartmentDTO, UserDTO } from "@/lib/types";

interface EditDepartmentFormDialogProps {
	isOpen: boolean;
	onClose: () => void;
	department: DepartmentDTO; // The department being edited
	users: UserDTO[]; // List of users for the dropdown
}

export function EditDepartmentFormDialog({
	isOpen,
	onClose,
	department,
	users,
}: EditDepartmentFormDialogProps) {
	const queryClient = useQueryClient();
	// We get isOpen and onClose from props, no need for atom here directly for control
	// const [isOpen, setIsOpen] = useAtom(editDepartmentDialogAtom);
	// const [, setSelectedDepartment] = useAtom(selectedDepartmentAtom); // Not needed if department is passed as prop

	const form = useForm<EditDepartmentInput>({
		resolver: valibotResolver(editDepartmentSchema),
		defaultValues: {
			// Default values will be overridden by useEffect
			name: "",
			description: "",
			deptHeadId: undefined,
		},
		mode: "onChange",
	});

	// Reset form when dialog opens or department changes
	useEffect(() => {
		if (isOpen && department) {
			form.reset({
				name: department.name,
				description: department.description ?? "",
				deptHeadId: department.deptHead?.publicId ?? undefined,
			});
		}
	}, [isOpen, department, form]);

	const updateMutation = useMutation({
		// Destructure args in mutationFn
		mutationFn: ({
			departmentId,
			payload,
		}: {
			departmentId: string;
			payload: Partial<EditDepartmentInput>;
		}) => updateDepartment(departmentId, payload),
		onMutate: async ({ departmentId, payload }) => {
			await queryClient.cancelQueries({
				queryKey: departmentsQueryOptions.queryKey,
			});
			const previousDepartments = queryClient.getQueryData<DepartmentDTO[]>(
				departmentsQueryOptions.queryKey,
			);

			// Find dept head name for optimistic update
			const deptHeadUser = payload.deptHeadId
				? users?.find((u) => u.publicId === payload.deptHeadId)
				: null;
			const deptHeadName = deptHeadUser
				? `${deptHeadUser.firstName} ${deptHeadUser.lastName}`
				: payload.deptHeadId === null
					? null
					: undefined; // Handle unassigning optimistically

			queryClient.setQueryData<DepartmentDTO[]>(
				departmentsQueryOptions.queryKey,
				(old = []) =>
					old.map((dept) =>
						dept.publicId === departmentId
							? {
									...dept,
									name: payload.name ?? dept.name,
									description:
										payload.description !== undefined
											? payload.description
											: dept.description,
									deptHeadId:
										payload.deptHeadId !== undefined
											? payload.deptHeadId
											: dept.deptHead?.publicId,
									deptHeadName:
										deptHeadName !== undefined
											? deptHeadName
											: dept.deptHead?.firstName,
									updatedAt: new Date().toISOString(),
								}
							: dept,
					),
			);
			return { previousDepartments };
		},
		onError: (err, _variables, context) => {
			if (context?.previousDepartments) {
				queryClient.setQueryData(
					departmentsQueryOptions.queryKey,
					context.previousDepartments,
				);
			}
			toast.error(
				err instanceof Error ? err.message : "Failed to update department",
			);
		},
		onSuccess: () => {
			toast.success("Department updated successfully");
			onClose(); // Call onClose prop
		},
		onSettled: () => {
			queryClient.invalidateQueries({
				queryKey: departmentsQueryOptions.queryKey,
			});
			queryClient.invalidateQueries({
				queryKey: usersQueryOptions.queryKey,
			}); // Invalidate users too
		},
	});

	const handleFormSubmit = (values: EditDepartmentInput) => {
		// Prepare payload - only send changed values if using PATCH effectively
		// Or send all values as per current API setup
		const payload: Partial<EditDepartmentInput> = {
			name: values.name,
			description: values.description || undefined,
			deptHeadId: values.deptHeadId ?? undefined,
		};

		updateMutation.mutate({
			departmentId: department.publicId,
			payload,
		});
	};

	// Use the onClose prop for closing
	const handleClose = () => {
		if (!updateMutation.isPending) {
			onClose();
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={handleClose}>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>Edit Department</DialogTitle>
					<DialogDescription>
						Update the details for the "{department.name}" department.
					</DialogDescription>
				</DialogHeader>

				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(handleFormSubmit)}
						className="space-y-4 py-4"
					>
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Department Name</FormLabel>
									<FormControl>
										<Input placeholder="e.g., Finance" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="description"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Description (Optional)</FormLabel>
									<FormControl>
										<Textarea
											placeholder="Brief description of the department"
											{...field}
											value={field.value ?? ""}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="deptHeadId"
							render={({ field }) => {
								return (
									<FormItem>
										<FormLabel>Department Head (Optional)</FormLabel>
										<Select
											onValueChange={(value) => field.onChange(value)}
											value={field.value?.toString()}
										>
											<FormControl>
												<SelectTrigger className="w-full">
													<SelectValue placeholder="Select a user" />
												</SelectTrigger>
											</FormControl>

											<SelectContent>
												{users?.map((user: UserDTO) => (
													<SelectItem key={user.publicId} value={user.publicId}>
														{user.firstName} {user.lastName} ({user.email})
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								);
							}}
						/>

						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={handleClose}
								disabled={updateMutation.isPending}
							>
								Cancel
							</Button>
							<Button
								type="submit"
								disabled={!form.formState.isValid || updateMutation.isPending} // Only enable if changed and valid
							>
								{updateMutation.isPending ? "Saving..." : "Save Changes"}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
