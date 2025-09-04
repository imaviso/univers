import { valibotResolver } from "@hookform/resolvers/valibot";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Switch } from "@/components/ui/switch";
import { allEquipmentCategoriesQueryOptions } from "@/lib/query";
import { type EquipmentDTOInput, equipmentDataSchema } from "@/lib/schema";
import type { Equipment, UserDTO } from "@/lib/types";
import { STATUS_EQUIPMENT } from "@/lib/types";

interface AddEquipmentFormDialogProps {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	onSubmit: (data: EquipmentDTOInput) => void;
	equipment?: Equipment | null;
	equipmentOwners?: UserDTO[];
	isMutating: boolean;
	currentUserRole?: string[];
}

export function AddEquipmentFormDialog({
	isOpen,
	onOpenChange,
	onSubmit,
	equipment,
	equipmentOwners = [],
	isMutating,
	currentUserRole = [],
}: AddEquipmentFormDialogProps) {
	const form = useForm<EquipmentDTOInput>({
		resolver: valibotResolver(equipmentDataSchema),
		defaultValues: {
			name: equipment?.name ?? "",
			brand: equipment?.brand ?? "",
			availability: equipment?.availability ?? true,
			quantity: equipment?.quantity ?? 1,
			status: equipment?.status ?? "NEW",
			serialNo: equipment?.serialNo ?? "",
			ownerId: equipment?.equipmentOwner?.publicId ?? undefined,
			image: undefined,
			categoryIds: equipment?.categories?.map((cat) => cat.publicId) ?? [],
		},
	});

	const { data: categories = [], isLoading: isLoadingCategories } = useQuery(
		allEquipmentCategoriesQueryOptions,
	);

	const isSuperAdmin = currentUserRole.includes("SUPER_ADMIN");

	const handleFormSubmit = (data: EquipmentDTOInput) => {
		onSubmit(data);
	};

	React.useEffect(() => {
		if (isOpen) {
			form.reset({
				name: equipment?.name ?? "",
				brand: equipment?.brand ?? "",
				availability: equipment?.availability ?? true,
				quantity: equipment?.quantity ?? 1,
				status: equipment?.status ?? "NEW",
				serialNo: equipment?.serialNo ?? "",
				ownerId: equipment?.equipmentOwner?.publicId ?? undefined,
				image: undefined,
				categoryIds: equipment?.categories?.map((cat) => cat.publicId) ?? [],
			});
		}
	}, [isOpen, equipment, form]);

	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[525px]">
				<DialogHeader>
					<DialogTitle>
						{equipment ? "Edit Equipment" : "Add New Equipment"}
					</DialogTitle>
					<DialogDescription>
						{equipment
							? "Edit the details of the equipment."
							: "Fill in the form to add a new equipment."}
					</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(handleFormSubmit)}
						className="space-y-4"
					>
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Equipment Name</FormLabel>
									<FormControl>
										<Input
											placeholder="e.g., Projector"
											{...field}
											value={String(field.value ?? "")}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="brand"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Brand</FormLabel>
									<FormControl>
										<Input
											placeholder="e.g., Epson"
											{...field}
											value={String(field.value ?? "")}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="categoryIds"
							render={({ field }) => {
								const fieldValue = (field.value as string[] | undefined) ?? [];
								return (
									<FormItem>
										<FormLabel>Categories</FormLabel>
										<FormControl>
											<div className="max-h-32 overflow-y-auto border p-2 rounded-md space-y-1">
												{isLoadingCategories && (
													<p className="text-sm text-muted-foreground">
														Loading categories...
													</p>
												)}
												{!isLoadingCategories && categories.length === 0 && (
													<p className="text-sm text-muted-foreground">
														No categories available.
													</p>
												)}
												{categories.map((category) => (
													<div
														key={category.publicId}
														className="flex items-center space-x-2"
													>
														<Checkbox
															id={`category-${category.publicId}`}
															checked={fieldValue.includes(category.publicId)}
															onCheckedChange={(checked) => {
																const currentCategoryIds = fieldValue;
																if (checked) {
																	field.onChange([
																		...currentCategoryIds,
																		category.publicId,
																	]);
																} else {
																	field.onChange(
																		currentCategoryIds.filter(
																			(id: string) => id !== category.publicId,
																		),
																	);
																}
															}}
														/>
														<label
															htmlFor={`category-${category.publicId}`}
															className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
														>
															{category.name}
														</label>
													</div>
												))}
											</div>
										</FormControl>
										<FormMessage />
									</FormItem>
								);
							}}
						/>
						<FormField
							control={form.control}
							name="quantity"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Quantity</FormLabel>
									<FormControl>
										<Input
											type="number"
											placeholder="e.g., 5"
											{...field}
											onChange={(e) =>
												field.onChange(Number.parseInt(e.target.value, 10) || 0)
											}
											value={Number(field.value ?? 0)}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="serialNo"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Serial Number</FormLabel>
									<FormControl>
										<Input
											placeholder="e.g., SN12345"
											{...field}
											value={String(field.value ?? "")}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="status"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Status</FormLabel>
									<Select
										onValueChange={field.onChange}
										value={String(field.value ?? "")}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Select status" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{STATUS_EQUIPMENT.map((status) => (
												<SelectItem key={status.value} value={status.value}>
													{status.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>
						{isSuperAdmin && (
							<FormField
								control={form.control}
								name="ownerId"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Equipment Owner</FormLabel>
										<Select
											onValueChange={field.onChange}
											value={String(field.value ?? "")}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Select owner" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{equipmentOwners.map((owner) => (
													<SelectItem
														key={owner.publicId}
														value={owner.publicId}
													>
														{owner.firstName} {owner.lastName}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
						)}
						<FormField
							control={form.control}
							name="availability"
							render={({ field }) => (
								<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
									<div className="space-y-0.5">
										<FormLabel>Availability</FormLabel>
										<DialogDescription>
											Is this equipment currently available?
										</DialogDescription>
									</div>
									<FormControl>
										<Switch
											checked={Boolean(field.value)}
											onCheckedChange={field.onChange}
										/>
									</FormControl>
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="image"
							render={({ field: { onChange, value, ...rest } }) => (
								<FormItem>
									<FormLabel>Equipment Image</FormLabel>
									<FormControl>
										<Input
											type="file"
											accept="image/*"
											onChange={(e) => onChange(e.target.files?.[0] ?? null)}
											{...rest}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => onOpenChange(false)}
								disabled={isMutating}
							>
								Cancel
							</Button>
							<Button
								type="submit"
								disabled={isMutating || isLoadingCategories}
							>
								{isMutating
									? "Submitting..."
									: equipment
										? "Save Changes"
										: "Add Equipment"}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
