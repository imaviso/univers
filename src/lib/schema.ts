import { isBefore, isSameDay, setHours, setMinutes } from "date-fns"; // Import date-fns functions
import * as v from "valibot";

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

const combineDateTime = (date: Date, time: string): Date => {
    const [hours = 0, minutes = 0] = time.split(":").map(Number);
    const newDate = new Date(date);
    newDate.setHours(hours, minutes, 0, 0);
    return newDate;
};

export const eventSchema = v.pipe(
    // Use v.pipe for object-level validation
    v.object({
        eventName: v.pipe(
            v.string("Event Name is required"),
            v.nonEmpty("Event Name is required"),
        ),
        status: v.pipe(
            v.string("Status is required"),
            v.nonEmpty("Status is required"),
        ),
        facility: v.pipe(
            v.string("Facility is required"),
            v.nonEmpty("Facility is required"),
        ),
        description: v.optional(v.string()),
        startDate: v.date("Start date is required"),
        endDate: v.date("End date is required"),
        // Add validation for time format if needed (e.g., using regex)
        startTime: v.pipe(
            v.string("Start time is required"),
            v.regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:MM)"),
        ),
        endTime: v.pipe(
            v.string("End time is required"),
            v.regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:MM)"),
        ),
        allDay: v.optional(v.boolean()),
    }),
    // Add refinement for cross-field validation
    v.forward(
        v.check((input) => {
            // Skip validation if allDay is true
            if (input.allDay) {
                return true;
            }
            // Combine date and time for comparison
            const combinedStart = combineDateTime(
                input.startDate,
                input.startTime,
            );
            const combinedEnd = combineDateTime(input.endDate, input.endTime);

            // Check if end date/time is before start date/time
            return !isBefore(combinedEnd, combinedStart);
        }, "End date/time cannot be before start date/time."),
        // Apply the error message to relevant fields
        ["endTime"],
    ),
);

export type EventInput = v.InferInput<typeof eventSchema>;

export const userFormSchema = v.pipe(
    v.object({
        idNumber: v.pipe(v.string(), v.nonEmpty("ID Number is required")),
        firstName: v.pipe(v.string(), v.nonEmpty("First name is required")),
        lastName: v.pipe(v.string(), v.nonEmpty("Last name is required")),
        department: v.pipe(v.string(), v.nonEmpty("Department is required")),
        email: v.pipe(
            v.string(),
            v.nonEmpty("Email is required"),
            v.email("Invalid email address"),
        ),
        password: v.pipe(
            v.string(),
            v.minLength(8, "Password must be at least 8 characters"),
            v.regex(
                /[A-Z]/,
                "Password must contain at least one uppercase letter",
            ),
            v.regex(
                /[a-z]/,
                "Password must contain at least one lowercase letter",
            ),
            v.regex(/[0-9]/, "Password must contain at least one number"),
        ),
        confirmPassword: v.string(),
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
        v.partialCheck(
            [["password"], ["confirmPassword"]],
            (input) => input.password === input.confirmPassword,
            "Passwords do not match.",
        ),
        ["confirmPassword"],
    ),
);

export type UserFormInput = v.InferInput<typeof userFormSchema>;

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
    startDate: v.date("Start date is required"),
    endDate: v.date("End date is required"),
    // Add validation for time format if needed (e.g., using regex)
    startTime: v.pipe(
        v.string("Start time is required"),
        v.regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:MM)"),
    ),
    endTime: v.pipe(
        v.string("End time is required"),
        v.regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:MM)"),
    ),
    allDay: v.optional(v.boolean()),
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
        eventType: v.string(),
        department: v.string(),
        contactPerson: v.pipe(
            v.string(),
            v.minLength(
                2,
                "Contact person name must be at least 2 characters.",
            ),
        ),
        contactEmail: v.pipe(
            v.string(),
            v.email("Please enter a valid email address."),
        ),
        contactPhone: v.pipe(
            v.string(),
            v.minLength(10, "Please enter a valid phone number."),
        ),
        attendees: v.pipe(
            v.string(),
            v.custom((value) => {
                const num = Number(value);
                return !Number.isNaN(num) && num > 0;
            }, "Attendees must be a number greater than 0"),
        ),
        description: v.optional(v.string()),
        venue: v.string(),
        startDate: v.date("Start date is required"),
        endDate: v.date("End date is required"),
        // Add validation for time format if needed (e.g., using regex)
        startTime: v.pipe(
            v.string("Start time is required"),
            v.regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:MM)"),
        ),
        endTime: v.pipe(
            v.string("End time is required"),
            v.regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:MM)"),
        ),
        allDay: v.optional(v.boolean()),
        equipment: v.pipe(
            v.array(v.string()),
            v.minLength(1, "Please select at least one equipment."),
        ),
    }),
    v.forward(
        v.check((input) => {
            // Skip validation if allDay is true
            if (input.allDay) {
                return true;
            }
            // Combine date and time for comparison
            const combinedStart = combineDateTime(
                input.startDate,
                input.startTime,
            );
            const combinedEnd = combineDateTime(input.endDate, input.endTime);

            // Check if end date/time is before start date/time
            return !isBefore(combinedEnd, combinedStart);
        }, "End date/time cannot be before start date/time."),
        // Apply the error message to relevant fields
        ["endTime"],
    ),
);
export type VenueReservationFormDialogInput = v.InferInput<
    typeof venueReservationFormDialogSchema
>;

export const equipmentReservationFormSchema = v.pipe(
    v.object({
        eventId: v.pipe(v.string(), v.nonEmpty("Please select an event.")),
        venueId: v.pipe(v.string(), v.nonEmpty("Please select a venue.")),
        startDate: v.date("Start date is required"),
        endDate: v.date("End date is required"),
        // Add validation for time format if needed (e.g., using regex)
        startTime: v.pipe(
            v.string("Start time is required"),
            v.regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:MM)"),
        ),
        endTime: v.pipe(
            v.string("End time is required"),
            v.regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:MM)"),
        ),
        allDay: v.optional(v.boolean()),
        purpose: v.optional(v.string()),
        selectedEquipment: v.pipe(
            v.array(v.string()),
            v.minLength(1, "Please select at least one equipment."),
        ),
    }),
    v.forward(
        v.check((input) => {
            // Skip validation if allDay is true
            if (input.allDay) {
                return true;
            }
            // Combine date and time for comparison
            const combinedStart = combineDateTime(
                input.startDate,
                input.startTime,
            );
            const combinedEnd = combineDateTime(input.endDate, input.endTime);

            // Check if end date/time is before start date/time
            return !isBefore(combinedEnd, combinedStart);
        }, "End date/time cannot be before start date/time."),
        // Apply the error message to relevant fields
        ["endTime"],
    ),
);

export type EquipmentReservationFormInput = v.InferInput<
    typeof equipmentReservationFormSchema
>;
