import { cn } from "@/lib/utils";
import { CheckIcon } from "lucide-react";

interface Step {
	title: string;
	description: string;
}

interface StepIndicatorProps {
	steps: Step[];
	currentStep: number;
	onStepClick?: (step: number) => void;
}

export default function StepIndicator({
	steps,
	currentStep,
	onStepClick,
}: StepIndicatorProps) {
	return (
		<div className="relative">
			<div className="absolute left-0 top-1/2 h-0.5 w-full -translate-y-1/2 bg-muted">
				<div
					className="h-full bg-primary transition-all duration-300 ease-in-out"
					style={{
						width: `${(currentStep / (steps.length - 1)) * 100}%`,
					}}
				/>
			</div>

			<ol className="relative z-10 flex w-full justify-between">
				{steps.map((step, index) => {
					const isCompleted = index < currentStep;
					const isCurrent = index === currentStep;

					const handleInteraction = () => {
						onStepClick?.(index);
					};

					const handleKeyDown = (event: React.KeyboardEvent<HTMLLIElement>) => {
						if (event.key === "Enter" || event.key === " ") {
							event.preventDefault();
							handleInteraction();
						}
					};

					return (
						<li
							key={step.title}
							className="flex flex-col items-center"
							onClick={onStepClick ? handleInteraction : undefined}
							onKeyDown={onStepClick ? handleKeyDown : undefined}
							role={onStepClick ? "button" : undefined}
							tabIndex={onStepClick ? 0 : undefined}
							aria-current={isCurrent ? "step" : undefined}
						>
							<div
								className={cn(
									"flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors",
									isCompleted
										? "border-primary bg-primary text-primary-foreground"
										: isCurrent
											? "border-primary bg-background text-primary"
											: "border-muted bg-muted text-muted-foreground",
									onStepClick && "cursor-pointer",
								)}
							>
								{isCompleted ? (
									<CheckIcon className="h-4 w-4" />
								) : (
									<span className="text-sm font-medium">{index + 1}</span>
								)}
							</div>
							<div className="mt-2 text-center">
								<div
									className={cn(
										"text-xs font-medium",
										isCurrent || isCompleted
											? "text-primary"
											: "text-muted-foreground",
									)}
								>
									{step.title}
								</div>
								<div className="text-xs text-muted-foreground hidden sm:block">
									{step.description}
								</div>
							</div>
						</li>
					);
				})}
			</ol>
		</div>
	);
}
