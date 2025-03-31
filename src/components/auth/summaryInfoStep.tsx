import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { registrationFormAtom } from "@/lib/atoms";
import { useAtom } from "jotai";
import { CheckCircle2 } from "lucide-react";

// Sample departments mapping
const departments = {
    "1": "Marketing",
    "2": "Human Resources",
    "3": "Finance",
    "4": "IT",
    "5": "Operations",
    "6": "Research & Development",
    "7": "Customer Service",
    "8": "Sales",
    "9": "Legal",
    "10": "Executive",
};

interface SummaryStepProps {
    onSubmit: () => void;
    onBack: () => void;
}

export default function SummaryStep({ onSubmit, onBack }: SummaryStepProps) {
    const [formData] = useAtom(registrationFormAtom);

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <h3 className="text-lg font-medium">Registration Summary</h3>
                <p className="text-sm text-muted-foreground">
                    Please review your information before submitting
                </p>

                <Card>
                    <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <h4 className="text-sm font-medium text-muted-foreground">
                                    Personal Information
                                </h4>
                                <div className="grid grid-cols-[120px_1fr] gap-y-3 text-sm">
                                    <div className="font-medium">
                                        ID Number:
                                    </div>
                                    <div className="break-all">
                                        {formData.idNumber}
                                    </div>

                                    <div className="font-medium">
                                        First Name:
                                    </div>
                                    <div className="break-all">
                                        {formData.firstName}
                                    </div>

                                    <div className="font-medium">
                                        Last Name:
                                    </div>
                                    <div className="break-all">
                                        {formData.lastName}
                                    </div>

                                    <div className="font-medium">
                                        Department:
                                    </div>
                                    <div className="break-all">
                                        {departments[
                                            formData.department as keyof typeof departments
                                        ] || formData.department}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-sm font-medium text-muted-foreground">
                                    Account Information
                                </h4>
                                <div className="grid grid-cols-[120px_1fr] gap-y-3 text-sm">
                                    <div className="font-medium">Email:</div>
                                    <div className="break-all">
                                        {formData.email}
                                    </div>

                                    <div className="font-medium">
                                        Phone Number:
                                    </div>
                                    <div className="break-all">
                                        {formData.phoneNumber}
                                    </div>
                                    <div className="font-medium">Password:</div>
                                    <div>••••••••</div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="rounded-md bg-green-50 p-4 dark:bg-green-950">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <CheckCircle2
                                className="h-5 w-5 text-green-400"
                                aria-hidden="true"
                            />
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-green-800 dark:text-green-300">
                                All information is complete
                            </h3>
                            <div className="mt-2 text-sm text-green-700 dark:text-green-400">
                                <p>
                                    You're ready to create your account. Click
                                    the button below to submit your
                                    registration.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-between">
                <Button type="button" variant="outline" onClick={onBack}>
                    Back
                </Button>
                <Button onClick={onSubmit}>Create Account</Button>
            </div>
        </div>
    );
}
