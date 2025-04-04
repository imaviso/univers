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

interface UserDetails {
    idNumber: string | null;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    role: string | null;
    department: string | null;
    phoneNumber: string | null;
}

const initialUserDetails: UserDetails = {
    idNumber: null,
    firstName: null,
    lastName: null,
    email: null,
    role: null,
    department: null,
    phoneNumber: null,
};

export const userDetailsAtom = atom<UserDetails>(initialUserDetails);
