import { valibotResolver } from "@hookform/resolvers/valibot";
import { useQuery } from "@tanstack/react-query";
import { useAtom } from "jotai";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormDescription,
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
import { registrationFormAtom } from "@/lib/atoms";
import { departmentsQueryOptions } from "@/lib/query";
import { type PersonalInfoInput, personalInfoSchema } from "@/lib/schema";

interface PersonalInfoStepProps {
	onNext: () => void;
}

export default function PersonalInfoStep({ onNext }: PersonalInfoStepProps) {
	const [formData, setFormData] = useAtom(registrationFormAtom);

	const { data: DEPARTMENTS = [] } = useQuery(departmentsQueryOptions);

	const form = useForm<PersonalInfoInput>({
		resolver: valibotResolver(personalInfoSchema),
		defaultValues: {
			idNumber: formData.idNumber,
			firstName: formData.firstName,
			lastName: formData.lastName,
			departmentPublicId: formData.departmentPublicId,
		},
	});

	const onSubmit = (values: PersonalInfoInput) => {
		setFormData({
			...formData,
			...values,
		});

		onNext();
	};

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
				<div className="space-y-4">
					<FormField
						control={form.control}
						name="idNumber"
						render={({ field }) => (
							<FormItem>
								<FormLabel>ID Number</FormLabel>
								<FormControl>
									<Input placeholder="Enter your ID number" {...field} />
								</FormControl>
								<FormDescription>
									Your employee or student ID number
								</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>

					<div className="grid grid-cols-2 gap-4">
						<FormField
							control={form.control}
							name="firstName"
							render={({ field }) => (
								<FormItem>
									<FormLabel>First Name</FormLabel>
									<FormControl>
										<Input placeholder="Enter your first name" {...field} />
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
										<Input placeholder="Enter your last name" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>

					<FormField
						control={form.control}
						name="departmentPublicId"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Department/Organization</FormLabel>
								<Select
									onValueChange={field.onChange}
									defaultValue={field.value}
								>
									<FormControl>
										<SelectTrigger className="w-full">
											<SelectValue placeholder="Select your department/organization" />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{DEPARTMENTS.map((dept) => (
											<SelectItem key={dept.publicId} value={dept.publicId}>
												{dept.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				<div className="flex justify-end">
					<Button type="submit">Continue</Button>
				</div>
			</form>
		</Form>
	);
}
