import { valibotResolver } from "@hookform/resolvers/valibot";
import {
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { useAtom } from "jotai";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription, // Optional: Add description
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
import { Textarea } from "@/components/ui/textarea"; // For description
import { addDepartment } from "@/lib/api";
import { addDepartmentDialogAtom } from "@/lib/atoms";
import { departmentsQueryOptions, usersQueryOptions } from "@/lib/query";
import { type DepartmentInput, departmentSchema } from "@/lib/schema";
import type { UserDTO } from "@/lib/types";

export function AddDepartmentFormDialog() {
	const queryClient = useQueryClient();
	const [isOpen, setIsOpen] = useAtom(addDepartmentDialogAtom);
	const { data: users } = useSuspenseQuery(usersQueryOptions);

	const form = useForm<DepartmentInput>({
		resolver: valibotResolver(departmentSchema),
		defaultValues: {
			name: "",
			description: "",
			deptHeadId: undefined,
		},
		mode: "onChange",
	});

	const addMutation = useMutation({
		mutationFn: addDepartment,
		onMutate: async () => {
			// Optional: Optimistic update (more complex for add)
			await queryClient.cancelQueries({
				queryKey: departmentsQueryOptions.queryKey,
			});
			// Snapshot previous value
			const previousDepartments = queryClient.getQueryData(
				departmentsQueryOptions.queryKey,
			);
			// Return context
			return { previousDepartments };
		},
		onError: (err, _newDepartment, context) => {
			// Rollback on error
			if (context?.previousDepartments) {
				queryClient.setQueryData(
					departmentsQueryOptions.queryKey,
					context.previousDepartments,
				);
			}
			toast.error(
				err instanceof Error ? err.message : "Failed to add department",
			);
		},
		onSuccess: () => {
			toast.success("Department added successfully");
			setIsOpen(false); // Close dialog
			form.reset(); // Reset form
		},
		onSettled: () => {
			queryClient.invalidateQueries({
				queryKey: departmentsQueryOptions.queryKey,
			});
			// Optionally invalidate users if adding a dept head changes user data elsewhere
			// queryClient.invalidateQueries({ queryKey: usersQueryOptions.queryKey });
		},
	});

	const handleFormSubmit = (values: DepartmentInput) => {
		addMutation.mutate(values);
	};

	// Close dialog handler
	const handleClose = () => {
		if (!addMutation.isPending) {
			setIsOpen(false);
			form.reset(); // Reset form on close
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={handleClose}>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>Add New Department</DialogTitle>
					<DialogDescription>
						Enter the details for the new department.
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
											value={field.value ?? ""} // Handle null/undefined for textarea
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="deptHeadId"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Department Head (Optional)</FormLabel>
									<Select
										onValueChange={(value) =>
											field.onChange(value === "none" ? undefined : value)
										}
										value={field.value ?? "none"}
									>
										<FormControl>
											<SelectTrigger className="w-full">
												<SelectValue placeholder="Select a user" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectItem value="none">No department head</SelectItem>
											{users?.map((user: UserDTO) => (
												<SelectItem key={user.publicId} value={user.publicId}>
													{user.firstName} {user.lastName} ({user.email})
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>

						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={handleClose}
								disabled={addMutation.isPending}
							>
								Cancel
							</Button>
							<Button type="submit" disabled={addMutation.isPending}>
								{addMutation.isPending ? "Adding..." : "Add Department"}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
