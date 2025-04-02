import type { UserType } from "@/lib/types";
import { atom } from "jotai";
// Registration form atoms
export const registrationStepAtom = atom(0);

export const registrationLoadingAtom = atom(false);

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

export const userDetailsAtom = atom<UserType>({
    idNumber: "",
    firstName: "",
    lastName: "",
    email: "",
    department: "",
    role: "",
    phoneNumber: "",
});
