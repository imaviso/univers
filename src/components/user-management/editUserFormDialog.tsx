import { valibotResolver } from "@hookform/resolvers/valibot";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
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
	FormControl,
	// FormDescription, // Removed as password fields are gone
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import MultipleSelector, { type Option } from "@/components/ui/multiselect";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	type EditUserFormInput,
	type EditUserFormOutput,
	editUserFormSchema,
} from "@/lib/schema";
import type { DepartmentDTO, UserDTO, UserRole } from "@/lib/types";
// Import the specific type needed for the onSubmit prop
import { getBadgeVariant } from "@/lib/utils";

interface UserFormDialogProps {
	isOpen: boolean;
	onClose: () => void;
	isLoading?: boolean;
	// Update onSubmit prop to expect UpdateUserInputFE
	onSubmit: (userData: EditUserFormOutput) => void;
	user?: UserDTO;
	roles: { value: string; label: string }[];
	departments: DepartmentDTO[];
}

export function EditUserFormDialog({
	isOpen,
	onClose,
	isLoading,
	onSubmit,
	user,
	roles,
	departments,
}: UserFormDialogProps) {
	const form = useForm<EditUserFormInput>({
		// Keep the original schema for potential create use case or full validation display
		resolver: valibotResolver(editUserFormSchema),
		defaultValues: {
			idNumber: "",
			firstName: "",
			lastName: "",
			password: "",
			confirmPassword: "",
			email: "",
			roles: [],
			departmentPublicId: "",
			telephoneNumber: "",
			phoneNumber: "",
			active: true,
			emailVerified: false,
		},
		mode: "onChange",
	});

	const { dirtyFields, isValid, isDirty } = form.formState;
	const numberOfChanges = Object.keys(dirtyFields).length;

	const handleFormSubmit = (values: EditUserFormInput) => {
		// Destructure only the fields needed for UpdateUserInputFE
		const {
			idNumber,
			firstName,
			lastName,
			roles,
			email,
			password,
			confirmPassword,
			departmentPublicId,
			telephoneNumber,
			phoneNumber,
			active,
			emailVerified,
		} = values;

		const payload = {
			idNumber,
			firstName,
			lastName,
			roles,
			email,
			password: password ?? "",
			confirmPassword: confirmPassword ?? "",
			departmentPublicId,
			telephoneNumber,
			phoneNumber: phoneNumber ?? "",
			active,
			emailVerified,
		};

		onSubmit(payload);
	};

	useEffect(() => {
		if (isOpen) {
			if (user) {
				form.reset({
					idNumber: user.idNumber || "",
					firstName: user.firstName || "",
					lastName: user.lastName || "",
					email: user.email || "",
					password: "",
					confirmPassword: "",
					roles: Array.from(user.roles),
					departmentPublicId: user.department?.publicId || "",
					telephoneNumber: user.telephoneNumber || "",
					phoneNumber: user.phoneNumber || "",
					active: user.active ?? true,
					emailVerified: user.emailVerified ?? false,
				});
			} else {
				// Reset for potential "Add New User" case (if this dialog is reused)
				form.reset({
					idNumber: "",
					firstName: "",
					lastName: "",
					email: "",
					password: "",
					confirmPassword: "",
					roles: [],
					departmentPublicId: "",
					telephoneNumber: "",
					phoneNumber: "",
					active: true,
					emailVerified: false,
				});
			}
		}
	}, [user, isOpen, form.reset]);

	const isSaveDisabled = user
		? numberOfChanges < 1 || !isValid || isLoading
		: !isDirty || !isValid || isLoading;

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-[600px]">
				<DialogHeader>
					<DialogTitle>{user ? "Edit User" : "Add New User"}</DialogTitle>
				</DialogHeader>

				<Form {...form}>
					<form
						onSubmit={(e) => e.preventDefault()} // Prevent default form submission
						className="space-y-4 py-4"
					>
						{/* ... ID Number and Role fields ... */}
						<FormField
							control={form.control}
							name="idNumber"
							render={({ field }) => (
								<FormItem>
									<FormLabel>ID Number</FormLabel>
									<FormControl>
										<Input placeholder="Enter ID number" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="roles"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Roles</FormLabel>
									<FormControl>
										<MultipleSelector
											value={
												Array.isArray(field.value)
													? field.value.map((role) => ({
															value: role,
															label:
																roles.find((r) => r.value === role)?.label ||
																role,
														}))
													: []
											}
											onChange={(options: Option[]) => {
												field.onChange(options.map((opt) => opt.value));
											}}
											options={roles}
											placeholder="Select roles"
											className="w-full file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input"
											badgeClassName={(option) =>
												getBadgeVariant(option.value as UserRole)
											}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						{/* ... First Name and Last Name fields ... */}
						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="firstName"
								render={({ field }) => (
									<FormItem>
										<FormLabel>First Name</FormLabel>
										<FormControl>
											<Input placeholder="Enter First Name" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="lastName"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Last Name</FormLabel>
										<FormControl>
											<Input placeholder="Enter Last Name" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
						<FormField
							control={form.control}
							name="email"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Email</FormLabel>
									<FormControl>
										<Input
											placeholder="User email"
											type="email"
											{...field}
											className="bg-muted/50" // Optional: visual indication
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="password"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Password</FormLabel>
										<FormControl>
											<Input
												placeholder="Enter password"
												type="password"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="confirmPassword"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Confirm Password</FormLabel>
										<FormControl>
											<Input
												placeholder="Confirm password"
												type="password"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						{/* ... Phone Number and Telephone Number fields ... */}
						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="phoneNumber"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Phone Number (Optional)</FormLabel>
										<FormControl>
											<Input
												placeholder="Enter phone number"
												type="tel"
												// Ensure value is handled correctly (controlled component)
												{...field}
												value={field.value || ""} // Handle null/undefined
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="telephoneNumber"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Telephone Number</FormLabel>
										<FormControl>
											<Input
												placeholder="Enter telephone number"
												type="tel"
												// Ensure value is handled correctly
												{...field}
												value={field.value || ""} // Handle null/undefined
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
						{/* ... Department field ... */}
						<FormField
							control={form.control}
							name="departmentPublicId"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Department</FormLabel>
									<Select
										onValueChange={field.onChange}
										value={field.value || ""}
									>
										<FormControl>
											{/* The trigger sets the perceived width in the form */}
											<SelectTrigger className="w-full">
												<SelectValue placeholder="Select a department" />
											</SelectTrigger>
										</FormControl>
										{/* Constrain the dropdown panel's width */}
										<SelectContent
											// Use popper to avoid stretching the dialog, adjust width as needed
											// w-[--radix-select-trigger-width] ensures it matches the trigger width
											// max-h-[200px] adds vertical scroll if list is long
											className="w-[--radix-select-trigger-width] max-h-[200px]"
										>
											{departments.map((department) => (
												<SelectItem
													key={department.publicId}
													value={department.publicId}
													title={department.name}
													className="overflow-hidden text-ellipsis whitespace-nowrap"
												>
													{department.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>
						{/* Active switch removed */}
					</form>
					<DialogFooter>
						<Button type="button" variant="outline" onClick={onClose}>
							Cancel
						</Button>
						<Button
							type="button"
							disabled={isSaveDisabled}
							onClick={form.handleSubmit(handleFormSubmit)}
						>
							{user ? "Save Changes" : "Create User"}
						</Button>
					</DialogFooter>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
