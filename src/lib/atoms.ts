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
    id: string | null;
    idNumber: string | null;
    firstName: string | null;
    lastName: string | null;
    password: string | null;
    email: string | null;
    role: string | null;
    department: string | null;
    phoneNumber: string | null;
    emailVerified: boolean | null;
    active: boolean | null;
}

const initialUserDetails: UserDetails = {
    id: null,
    idNumber: null,
    firstName: null,
    lastName: null,
    email: null,
    password: null,
    role: null,
    department: null,
    phoneNumber: null,
    emailVerified: null,
    active: null,
};

export const userDetailsAtom = atom<UserDetails>(initialUserDetails);

export const editDialogAtom = atom(false);
export const selectedUserAtom = atom<UserType | null>(null);
export const deleteDialogAtom = atom(false);
