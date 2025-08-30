import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
	title: string;
	value: string | number;
	icon?: LucideIcon;
	description?: string;
	isLoading?: boolean;
}

export function StatCard({
	title,
	value,
	icon: Icon,
	description,
	isLoading = false,
}: StatCardProps) {
	if (isLoading) {
		return <StatCardSkeleton />;
	}

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle className="text-sm font-medium">{title}</CardTitle>
				{Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
			</CardHeader>
			<CardContent>
				<div className="text-2xl font-bold">{value}</div>
				{description && (
					<p className="text-xs text-muted-foreground">{description}</p>
				)}
			</CardContent>
		</Card>
	);
}

export function StatCardSkeleton() {
	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between pb-2">
				<Skeleton className="h-4 w-2/5" />
				<Skeleton className="h-4 w-4" />
			</CardHeader>
			<CardContent>
				<Skeleton className="h-7 w-1/2 mb-1" />
				<Skeleton className="h-3 w-3/5" />
			</CardContent>
		</Card>
	);
}
