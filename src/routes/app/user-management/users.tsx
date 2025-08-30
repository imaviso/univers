import { Button } from "@/components/ui/button";
import { UserFormDialog } from "@/components/user-management/userFormDialog";
import { UserDataTable } from "@/components/user-management/userManagementTable";
import { createUser } from "@/lib/api";
import { departmentsQueryOptions, usersQueryOptions } from "@/lib/query";
import type { UserFormInput } from "@/lib/schema";
import type { UserDTO } from "@/lib/types";
import { ROLES } from "@/lib/types";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useRouteContext } from "@tanstack/react-router";
import { UserPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/user-management/users")({
	component: UsersComponent,
});

type CreateUserInputFE = Omit<
	UserDTO,
	"id" | "publicId" | "emailVerified" | "createdAt" | "updatedAt" | "department"
>;

type CreateUserInputFEWithDepartment = CreateUserInputFE & {
	departmentPublicId: string;
};

function UsersComponent() {
	const context = useRouteContext({ from: "/app/user-management" });
	const queryClient = context.queryClient;
	const [isAddUserOpen, setIsAddUserOpen] = useState(false);

	const { data: departments } = useSuspenseQuery(departmentsQueryOptions);

	const createUserMutation = useMutation({
		mutationFn: createUser,
		// When mutate is called:
		onMutate: async (newUserData: CreateUserInputFEWithDepartment) => {
			// Cancel any outgoing refetches for the users list
			await queryClient.cancelQueries({
				queryKey: usersQueryOptions.queryKey,
			});

			const previousUsers = queryClient.getQueryData<UserDTO[]>(
				usersQueryOptions.queryKey,
			);

			queryClient.setQueryData<CreateUserInputFEWithDepartment[]>(
				usersQueryOptions.queryKey,
				(old = []) => [
					...old,
					{
						...newUserData,
						id: Math.random().toString(36).substring(2), // Temporary ID
						publicId: `${Math.random().toString(36).substring(2)}_user_pub`,
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
						emailVerified: false,
						active: newUserData.active ?? true,
						departmentPublicId: newUserData.departmentPublicId,
						password: "****",
						// If UserType needs department name, add it here based on deptLabel
						// departmentName: deptLabel,
					} as CreateUserInputFEWithDepartment,
				],
			);

			return { previousUsers };
		},
		onError: (err, _newUser, context) => {
			if (context?.previousUsers) {
				queryClient.setQueryData(
					usersQueryOptions.queryKey,
					context.previousUsers,
				);
			}
			const errorMessage =
				err instanceof Error ? err.message : "Failed to create user";
			toast.error(errorMessage);
		},
		onSuccess: () => {
			toast.success("User created successfully");
			setIsAddUserOpen(false);
		},
		onSettled: () => {
			queryClient.invalidateQueries({
				queryKey: usersQueryOptions.queryKey,
			});
		},
	});

	const handleAddUser = (userData: Omit<UserFormInput, "confirmPassword">) => {
		const apiPayload = {
			idNumber: userData.idNumber,
			firstName: userData.firstName,
			lastName: userData.lastName,
			email: userData.email,
			password: userData.password,
			roles: userData.roles,
			departmentPublicId: userData.departmentPublicId,
			telephoneNumber: userData.telephoneNumber,
			phoneNumber: userData.phoneNumber || "",
			active: userData.active,
		};
		//@ts-ignore
		createUserMutation.mutate(apiPayload);
	};

	return (
		<div className="bg-background">
			<div className="flex flex-col flex-1 overflow-hidden">
				<header className="flex items-center justify-between border-b px-6 h-[65px]">
					<h1 className="text-xl font-semibold">User Management</h1>
					<div className="flex items-center gap-2">
						<Button
							onClick={() => setIsAddUserOpen(true)}
							size="sm"
							className="gap-1"
							disabled={createUserMutation.isPending}
						>
							<UserPlus className="h-4 w-4" />
							Add User
						</Button>
					</div>
				</header>

				<UserFormDialog
					isOpen={isAddUserOpen}
					isLoading={createUserMutation.isPending}
					onClose={() => {
						if (!createUserMutation.isPending) {
							setIsAddUserOpen(false);
						}
					}}
					onSubmit={handleAddUser}
					roles={ROLES}
					departments={departments}
				/>
				<div className="flex-1 overflow-auto p-6">
					<UserDataTable />
				</div>
			</div>
		</div>
	);
}
