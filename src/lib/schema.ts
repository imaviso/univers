import { isBefore } from "date-fns"; // Import date-fns functions
import * as v from "valibot";
import { type EventInputType, type EventOutputType, ROLES } from "./types"; // Adjust the import path as needed

export const ImageSchema = v.pipe(
    v.instance(File, "Image file is required."), // Check if it's a File object
    v.mimeType(
        ["image/jpeg", "image/png", "image/webp"], // Adjust allowed image types
        "Invalid file type. Please select a JPG, PNG, or WEBP image.",
    ),
    v.maxSize(1024 * 1024 * 5, "Image file too large (max 5MB)."), // Adjust max size as needed
);

export type ImageInput = v.InferInput<typeof ImageSchema>;
export const personalInfoSchema = v.object({
    idNumber: v.pipe(v.string(), v.nonEmpty("ID Number is required")),
    firstName: v.pipe(v.string(), v.nonEmpty("First name is required")),
    lastName: v.pipe(v.string(), v.nonEmpty("Last name is required")),
    department: v.pipe(v.string(), v.nonEmpty("Department is required")),
});

export type PersonalInfoInput = v.InferInput<typeof personalInfoSchema>;

export const accountInfoSchema = v.pipe(
    v.object({
        email: v.pipe(
            v.string(),
            v.nonEmpty("Email is required"),
            v.email("The email is badly formatted"),
        ),
        telephoneNumber: v.pipe(
            v.string(),
            v.minLength(3, "Telephone Number is required"),
        ),
        phoneNumber: v.optional(
            v.union([
                v.literal(""),
                v.pipe(
                    v.string(),
                    v.length(11, "Phone Number must be 11 digits"),
                    v.regex(/^\d+$/, "Phone Number must be a number"),
                ),
            ]),
        ),
        password: v.pipe(
            v.string(),
            v.minLength(8, "Your password is too short."),
            v.regex(/[a-z]/, "Your password must contain a lowercase letter."),
            v.regex(/[A-Z]/, "Your password must contain a uppercase letter."),
            v.regex(/[0-9]/, "Your password must contain a number."),
        ),
        confirmPassword: v.string(),
    }),
    v.forward(
        v.partialCheck(
            [["password"], ["confirmPassword"]],
            (input) => input.password === input.confirmPassword,
            "Passwords do not match.",
        ),
        ["confirmPassword"],
    ),
);

export type AccountInfoInput = v.InferInput<typeof accountInfoSchema>;

export const loginSchema = v.object({
    email: v.pipe(
        v.string(),
        v.nonEmpty("Email is required"),
        v.email("Invalid email address"),
    ),
    password: v.pipe(
        v.string(),
        v.minLength(8, "Password must be at least 8 characters"),
        v.regex(/[A-Z]/, "Password must contain at least one uppercase letter"),
        v.regex(/[a-z]/, "Password must contain at least one lowercase letter"),
        v.regex(/[0-9]/, "Password must contain at least one number"),
    ),
});

export type LoginInput = v.InferInput<typeof loginSchema>;

export const OtpSchema = v.object({
    code: v.pipe(
        v.string(),
        v.length(6, "Your verification code must be 6 characters."),
    ),
});

export type OtpInput = v.InferInput<typeof OtpSchema>;

export const resetPasswordSchema = v.pipe(
    v.object({
        password: v.pipe(
            v.string(),
            v.minLength(8, "Your password is too short."),
            v.regex(/[a-z]/, "Your password must contain a lowercase letter."),
            v.regex(/[A-Z]/, "Your password must contain a uppercase letter."),
            v.regex(/[0-9]/, "Your password must contain a number."),
        ),
        confirmPassword: v.string(),
    }),
    v.forward(
        v.partialCheck(
            [["password"], ["confirmPassword"]],
            (input) => input.password === input.confirmPassword,
            "Passwords do not match.",
        ),
        ["confirmPassword"],
    ),
);

export type ResetPasswordInput = v.InferInput<typeof resetPasswordSchema>;

export const emailSchema = v.object({
    email: v.pipe(
        v.string(),
        v.nonEmpty("Email is required"),
        v.email("Invalid email address"),
    ),
});

export type EmailInput = v.InferInput<typeof emailSchema>;

export const eventSchema = v.pipe(
    v.object({
        eventName: v.pipe(
            v.string("Event Name is required"),
            v.nonEmpty("Event Name is required"),
        ),
        eventType: v.pipe(
            v.string("Event Type is required"),
            v.nonEmpty("Event Type is required"),
        ),
        eventVenueId: v.pipe(
            v.number("Venue ID must be a number"),
            v.integer("Venue ID must be an integer"),
            v.minValue(1, "Please select a valid facility."), // Ensure a positive ID
        ),
        startTime: v.date("Start date is required"),
        endTime: v.date("End date is required"),
        approvedLetter: v.pipe(
            v.array(
                v.pipe(
                    v.instance(File, "Each item must be a file."),
                    v.mimeType(
                        [
                            "application/pdf",
                            "image/jpeg",
                            "image/png",
                            "image/webp",
                        ],
                        "Invalid file type. Please select a PDF or image.",
                    ),
                    v.maxSize(1024 * 1024 * 5, "File too large (max 5MB)."), // Validation 2 for the element
                ),
                "Approved letter must be a list of files.", // Message for the array schema itself
            ),
            // Validations/transformations on the array as a whole
            v.check((arr) => arr.length > 0, "Approved letter is required."),
            v.check((arr) => arr.length <= 1, "Only one file allowed."),
            v.transform((arr) => arr[0]), // Transform File[] to single File
        ),
    }),
    v.forward(
        v.check(
            (input) => isBefore(input.startTime, input.endTime),
            "End date/time cannot be before start date/time.",
        ),
        ["endTime"],
    ),
);

export type EventInput = v.InferInput<typeof eventSchema>;
export type EventOutput = v.InferOutput<typeof eventSchema>;

export const editEventSchema = v.pipe(
    v.object({
        eventName: v.optional(
            v.pipe(
                v.string(),
                v.nonEmpty("Event Name cannot be empty if provided"),
            ),
        ),
        eventType: v.optional(
            v.pipe(
                v.string(),
                v.nonEmpty("Event Type cannot be empty if provided"),
            ),
        ),
        eventVenueId: v.optional(
            v.pipe(
                v.number("Venue ID must be a number"),
                v.integer("Venue ID must be an integer"),
                v.minValue(1, "Please select a valid facility."),
            ),
        ),
        startTime: v.optional(v.date()),
        endTime: v.optional(v.date()),
        approvedLetter: v.optional(
            v.pipe(
                v.array(
                    v.pipe(
                        v.instance(File, "Each item must be a file."),
                        v.mimeType(
                            [
                                "application/pdf",
                                "image/jpeg",
                                "image/png",
                                "image/webp",
                            ],
                            "Invalid file type. Please select a PDF or image.",
                        ),
                        v.maxSize(1024 * 1024 * 5, "File too large (max 5MB)."),
                    ),
                    "Approved letter must be a list of files.",
                ),
                v.check((arr) => arr.length <= 1, "Only one file allowed."),
                v.transform((arr) => (arr.length > 0 ? arr[0] : undefined)),
            ),
        ),
    }),
    v.forward(
        v.check((input) => {
            if (input.startTime && input.endTime) {
                return isBefore(input.startTime, input.endTime);
            }
            return true;
        }, "End date/time cannot be before start date/time."),
        ["endTime"],
    ),
);

export type EditEventInput = v.InferInput<typeof editEventSchema>;
export type EditEventOutput = v.InferOutput<typeof editEventSchema>;

export const userFormSchema = v.pipe(
    v.object({
        idNumber: v.pipe(v.string(), v.nonEmpty("ID Number is required")),
        firstName: v.pipe(v.string(), v.nonEmpty("First name is required")),
        lastName: v.pipe(v.string(), v.nonEmpty("Last name is required")),
        department: v.string("Department selection is required."),
        email: v.pipe(
            v.string(),
            v.nonEmpty("Email is required"),
            v.email("Invalid email address"),
        ),
        password: v.optional(
            v.pipe(
                v.string(),
                // Only apply non-empty checks if the string is not empty
                v.check(
                    (s) => s.length === 0 || s.length >= 8,
                    "Password must be at least 8 characters",
                ),
                v.check(
                    (s) => s.length === 0 || /[A-Z]/.test(s),
                    "Password must contain at least one uppercase letter",
                ),
                v.check(
                    (s) => s.length === 0 || /[a-z]/.test(s),
                    "Password must contain at least one lowercase letter",
                ),
                v.check(
                    (s) => s.length === 0 || /[0-9]/.test(s),
                    "Password must contain at least one number",
                ),
            ),
            "",
        ),
        confirmPassword: v.optional(v.string(), ""),
        role: v.pipe(v.string(), v.nonEmpty("Role is required")),
        telephoneNumber: v.pipe(
            v.string(),
            v.minLength(3, "Telephone Number is required"),
        ),
        phoneNumber: v.optional(
            v.union([
                v.literal(""),
                v.pipe(
                    v.string(),
                    v.length(11, "Phone Number must be 11 digits"),
                    v.regex(/^\d+$/, "Phone Number must be a number"),
                ),
            ]),
        ),
        active: v.boolean(),
        emailVerified: v.optional(v.boolean()),
    }),
    v.forward(
        v.check((input) => {
            // If password is provided (not empty string), confirmPassword must match
            if (input.password && input.password.length > 0) {
                return input.password === input.confirmPassword;
            }
            // If password is empty or undefined, confirmPassword must also be empty or undefined
            // Note: We defaulted optional fields to "", so check against ""
            if (input.password === "" && input.confirmPassword !== "") {
                return false; // Password empty, but confirm not
            }
            return true; // Both empty or password provided and they match
        }, "Passwords do not match. Both fields must be filled or both must be empty."),
        ["confirmPassword"], // Apply error message to confirmPassword
    ),
);

export type UserFormInput = v.InferInput<typeof userFormSchema>;

export const editUserFormSchema = v.object({
    idNumber: v.pipe(v.string(), v.nonEmpty("ID Number is required")),
    firstName: v.pipe(v.string(), v.nonEmpty("First name is required")),
    lastName: v.pipe(v.string(), v.nonEmpty("Last name is required")),
    email: v.pipe(
        v.string(),
        v.nonEmpty("Email is required"),
        v.email("Invalid email format"),
    ),
    role: v.pipe(v.string(), v.nonEmpty("Role is required")),
    departmentId: v.string("Department selection is required."),
    telephoneNumber: v.pipe(
        v.string(),
        v.nonEmpty("Telephone number is required"),
    ),
    phoneNumber: v.optional(v.string(), ""),
});

export type EditUserFormInput = v.InferInput<typeof editUserFormSchema>;
export type EditUserFormOutput = v.InferOutput<typeof editUserFormSchema>;

export const venueReservationFormSchema = v.object({
    email: v.pipe(v.string(), v.email("Please enter a valid email address")),
    phoneNumber: v.optional(
        v.union([
            v.literal(""),
            v.pipe(
                v.string(),
                v.length(11, "Phone Number must be 11 digits"),
                v.regex(/^\d+$/, "Phone Number must be a number"),
            ),
        ]),
    ),
    department: v.pipe(v.string(), v.nonEmpty("Department is required")),
    eventName: v.pipe(
        v.string(),
        v.minLength(3, "Event name must be at least 3 characters"),
    ),
    eventType: v.pipe(v.string(), v.nonEmpty("Event Type is required")),
    venue: v.pipe(v.string(), v.nonEmpty("Venue is required")),

    approvedLetter: v.pipe(
        v.file("Please select an image file."),
        v.mimeType(
            ["image/jpeg", "image/png"],
            "Please select a JPEG or PNG file.",
        ),
        v.maxSize(1024 * 1024 * 10, "Please select a file smaller than 10 MB."),
    ),
});

export type VenueReservationInput = v.InferInput<
    typeof venueReservationFormSchema
>;

export const venueReservationFormDialogSchema = v.pipe(
    v.object({
        eventName: v.pipe(
            v.string(),
            v.minLength(2, "Event name must be at least 2 characters."),
        ),
        department: v.string(),
        description: v.optional(v.string()),
        venue: v.string(),
        startDateTime: v.date("Start date is required"),
        endDateTime: v.date("End date is required"),
        equipment: v.pipe(
            v.array(v.string()),
            v.minLength(1, "Please select at least one equipment."),
        ),
        approvedLetter: v.pipe(
            v.array(
                v.pipe(
                    v.file("Please select an image file."),
                    v.mimeType(
                        ["image/jpeg", "image/png"],
                        "Please select a JPEG or PNG file.",
                    ),
                    v.maxSize(
                        1024 * 1024 * 10,
                        "Please select a file smaller than 10 MB.",
                    ),
                ),
            ),
            v.minLength(1, "Approved letter is required."),
        ),
    }),
    v.forward(
        v.check((input) => {
            // Check if end date/time is before start date/time
            // This check is valid whether it's allDay or not,
            // as the times will be adjusted accordingly elsewhere if allDay is true.
            return !isBefore(input.endDateTime, input.startDateTime);
        }, "End date/time cannot be before start date/time."),
        // Apply the error message to the endDateTime field
        ["endDateTime"],
    ),
);
export type VenueReservationFormDialogInput = v.InferInput<
    typeof venueReservationFormDialogSchema
>;

export const equipmentReservationFormSchema = v.pipe(
    v.object({
        eventId: v.pipe(v.string(), v.nonEmpty("Please select an event.")),
        venueId: v.pipe(v.string(), v.nonEmpty("Please select a venue.")),
        startDateTime: v.date("Start date/time is required"),
        endDateTime: v.date("End date/time is required"),
        purpose: v.optional(v.string()),
        selectedEquipment: v.pipe(
            v.array(v.string()),
            v.minLength(1, "Please select at least one equipment."),
        ),
        approvedLetter: v.pipe(
            v.array(
                v.pipe(
                    v.file("Please select an image file."),
                    v.mimeType(
                        ["image/jpeg", "image/png"],
                        "Please select a JPEG or PNG file.",
                    ),
                    v.maxSize(
                        1024 * 1024 * 10,
                        "Please select a file smaller than 10 MB.",
                    ),
                ),
            ),
            v.minLength(1, "Approved letter is required."),
        ),
    }),
    v.forward(
        v.check((input) => {
            // Check if end date/time is before start date/time
            // This check is valid whether it's allDay or not,
            // as the times will be adjusted accordingly elsewhere if allDay is true.
            return !isBefore(input.endDateTime, input.startDateTime);
        }, "End date/time cannot be before start date/time."),
        // Apply the error message to the endDateTime field
        ["endDateTime"],
    ),
);

export type EquipmentReservationFormInput = v.InferInput<
    typeof equipmentReservationFormSchema
>;

export const venueSchema = v.object({
    name: v.pipe(
        v.string("Venue Name is required"),
        v.nonEmpty("Venue Name is required"),
    ),
    location: v.pipe(
        v.string("Location is required"),
        v.nonEmpty("Location is required"),
    ),
    venueOwnerId: v.optional(
        v.pipe(
            v.number("Venue Owner ID must be a number"),
            v.integer("Venue Owner ID must be an integer"),
            v.minValue(1, "Invalid Venue Owner ID"),
        ),
    ),
    // Update image schema for FileUpload (File[]) and make it optional
    image: v.optional(
        v.pipe(
            v.array(
                // Array of files
                v.pipe(
                    // Schema for each file in the array
                    v.instance(File, "Each item must be a file."),
                    v.mimeType(
                        ["image/jpeg", "image/png", "image/webp"],
                        "Invalid file type. Please select a JPG, PNG, or WEBP.",
                    ),
                    v.maxSize(1024 * 1024 * 10, "File too large (max 10MB)."),
                ),
                "Image must be a list of files.", // Message for array schema
            ),
            // Validations/transformations on the array as a whole
            v.check((arr) => arr.length <= 1, "Only one file allowed."),
            v.transform((arr) => (arr.length > 0 ? arr[0] : undefined)), // Transform File[] to single File or undefined
        ),
    ),
});

export type VenueInput = v.InferInput<typeof venueSchema>;

// ... existing schemas ...

// Schema for the final step of password reset/change via code
export const setNewPasswordSchema = v.pipe(
    v.object({
        newPassword: v.pipe(
            v.string(),
            v.minLength(8, "Your new password is too short."),
            v.regex(
                /[a-z]/,
                "Your new password must contain a lowercase letter.",
            ),
            v.regex(
                /[A-Z]/,
                "Your new password must contain an uppercase letter.",
            ),
            v.regex(/[0-9]/, "Your new password must contain a number."),
        ),
        confirmPassword: v.string(),
    }),
    v.forward(
        v.check(
            (input) => input.newPassword === input.confirmPassword,
            "New passwords do not match.",
        ),
        ["confirmPassword"], // Apply error to confirmPassword field
    ),
);
export type SetNewPasswordInput = v.InferInput<typeof setNewPasswordSchema>;

export const EquipmentStatusSchema = v.picklist([
    "APPROVED",
    "PENDING",
    "CANCELED",
    "DEFECT",
    "MAINTENANCE",
    "NEED_REPLACEMENT",
    "NEW",
]);

export type EquipmentStatus = v.InferInput<typeof EquipmentStatusSchema>;

export const equipmentDataSchema = v.object({
    name: v.pipe(v.string(), v.nonEmpty("Equipment name is required.")),
    brand: v.pipe(v.string(), v.nonEmpty("Brand is required.")),
    availability: v.boolean("Availability must be true or false."),
    quantity: v.pipe(
        v.number("Quantity must be a number."),
        v.integer("Quantity must be a whole number."),
        v.minValue(0, "Quantity cannot be negative."),
    ),
    status: v.pipe(EquipmentStatusSchema, v.nonEmpty("Status is required.")),
    ownerId: v.optional(
        v.pipe(
            v.number("Owner ID must be a number."),
            v.integer("Owner ID must be an integer."),
            v.minValue(1, "Invalid Owner ID."),
        ),
    ),
});

export type EquipmentDTOInput = v.InferInput<typeof equipmentDataSchema>;
export type EquipmentDTOOutput = v.InferOutput<typeof equipmentDataSchema>;

export const departmentSchema = v.object({
    name: v.pipe(
        v.string("Department Name is required"),
        v.nonEmpty("Department Name is required"),
    ),
    description: v.optional(v.string()),
    deptHeadId: v.optional(
        v.pipe(
            v.number("Dept Head ID must be a number"),
            v.integer("Dept Head ID must be an integer"),
            v.minValue(1, "Invalid Dept Head ID"),
        ),
    ),
});

export type DepartmentInput = v.InferInput<typeof departmentSchema>;
