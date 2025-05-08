import { atom } from "jotai";
import type { DepartmentDTO, UserDTO } from "./types"; // Add DepartmentType
// Registration form atoms
export const registrationStepAtom = atom(0);

export const registrationLoadingAtom = atom(false);

export const registrationFormAtom = atom({
    idNumber: "",
    firstName: "",
    lastName: "",
    departmentPublicId: "",
    email: "",
    telephoneNumber: "",
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
    telephoneNumber: string | null;
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
    telephoneNumber: null,
    phoneNumber: null,
    emailVerified: null,
    active: null,
};

export const userDetailsAtom = atom<UserDetails>(initialUserDetails);

export const editDialogAtom = atom(false);
export const selectedUserAtom = atom<UserDTO | null>(null);
export const deleteDialogAtom = atom(false);

export const addDepartmentDialogAtom = atom(false);
export const editDepartmentDialogAtom = atom(false);
export const deleteDepartmentDialogAtom = atom(false);
export const assignHeadDialogAtom = atom(false);
export const selectedDepartmentAtom = atom<DepartmentDTO | null>(null);
