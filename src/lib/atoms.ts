import { atom } from "jotai";

// Registration form atoms
export const registrationStepAtom = atom(0);

export const registrationFormAtom = atom({
    idNumber: "",
    firstName: "",
    lastName: "",
    department: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
});
