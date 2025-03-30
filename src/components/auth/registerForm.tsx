import AccountInfoStep from "@/components/auth/accountInfoStep";
import PersonalInfoStep from "@/components/auth/personalInfoStep";
import StepIndicator from "@/components/auth/stepIndicator";
import SummaryStep from "@/components/auth/summaryInfoStep";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { registrationFormAtom, registrationStepAtom } from "@/lib/atoms";
import { Link } from "@tanstack/react-router";
import { useAtom } from "jotai";

export default function RegistrationForm() {
    const [currentStep, setCurrentStep] = useAtom(registrationStepAtom);
    const [formData] = useAtom(registrationFormAtom);

    // Steps configuration
    const steps = [
        { title: "Personal Info", description: "Your personal information" },
        { title: "Account Info", description: "Your account details" },
        { title: "Summary", description: "Review your information" },
    ];

    // Render the current step
    const renderStep = () => {
        switch (currentStep) {
            case 0:
                return <PersonalInfoStep onNext={() => setCurrentStep(1)} />;
            case 1:
                return (
                    <AccountInfoStep
                        onNext={() => setCurrentStep(2)}
                        onBack={() => setCurrentStep(0)}
                    />
                );
            case 2:
                return (
                    <SummaryStep
                        onSubmit={handleSubmit}
                        onBack={() => setCurrentStep(1)}
                    />
                );
            default:
                return <PersonalInfoStep onNext={() => setCurrentStep(1)} />;
        }
    };

    const handleSubmit = async () => {
        // Here you would typically send the data to your backend
        console.log("Form submitted:", formData);

        // Show success message or redirect
        alert("Registration successful!");
    };

    return (
        <Card className="w-full max-w-xl mx-auto shadow-lg">
            <CardContent className="pt-6">
                <div className="space-y-8">
                    <StepIndicator
                        steps={steps}
                        currentStep={currentStep}
                        onStepClick={(step) => {
                            // Only allow going back to previous steps
                            if (step < currentStep) {
                                setCurrentStep(step);
                            }
                        }}
                    />

                    {renderStep()}
                </div>
            </CardContent>
            <CardFooter className="flex justify-center border-t px-6 py-4">
                <div className="text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <Link
                        to="/auth/login"
                        className="text-primary underline-offset-4 hover:underline"
                    >
                        Login
                    </Link>
                </div>
            </CardFooter>
        </Card>
    );
}
