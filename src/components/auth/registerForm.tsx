import AccountInfoStep from "@/components/auth/accountInfoStep";
import PersonalInfoStep from "@/components/auth/personalInfoStep";
import StepIndicator from "@/components/auth/stepIndicator";
import SummaryStep from "@/components/auth/summaryInfoStep";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
    registrationFormAtom,
    registrationLoadingAtom,
    registrationStepAtom,
} from "@/lib/atoms";
import { userSignUp } from "@/lib/auth";
import { Link, useNavigate } from "@tanstack/react-router";
import { useAtom } from "jotai";
import { toast } from "sonner";

const initialRegistrationFormState = {
    idNumber: "",
    firstName: "",
    lastName: "",
    department: "",
    email: "",
    telephoneNumber: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
};

export default function RegistrationForm() {
    const [currentStep, setCurrentStep] = useAtom(registrationStepAtom);
    const [formData, setFormData] = useAtom(registrationFormAtom);
    const [, setLoading] = useAtom(registrationLoadingAtom);

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

    const navigate = useNavigate();
    const handleSubmit = async () => {
        setLoading(true);

        try {
            await userSignUp(
                formData.idNumber,
                formData.firstName,
                formData.lastName,
                formData.department,
                formData.email,
                formData.telephoneNumber,
                formData.phoneNumber,
                formData.password,
            );
            console.log(formData);
            localStorage.setItem("userEmail", formData.email);
            navigate({ from: "/register", to: "/verify-email" });
            toast.success("Registration successful! Please check your email.");
            setFormData(initialRegistrationFormState);
            setCurrentStep(0);
        } catch (error) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "An unexpected error occurred";
            toast.error(errorMessage);
            console.error("Registration error:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-xl mx-auto shadow-lg">
            <CardContent>
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
            <CardFooter className="flex justify-center border-t">
                <div className="text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <Link
                        to="/login"
                        className="text-primary underline-offset-4 hover:underline"
                    >
                        Login
                    </Link>
                </div>
            </CardFooter>
        </Card>
    );
}
