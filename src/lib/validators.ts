import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const signupSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type SignupInput = z.infer<typeof signupSchema>;

export const studentSchema = z.object({
  full_name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Enter a valid email address").optional().or(z.literal("")),
  date_of_birth: z.string().min(1, "Date of birth is required"),
  gender: z.enum(["male", "female"], {
    required_error: "Gender is required",
  }),
  contact_number: z
    .string()
    .min(10, "Phone number must be 10 digits")
    .max(15),
  parent_name: z.string().min(1, "Parent name is required").max(100),
  parent_contact: z
    .string()
    .min(10, "Phone number must be 10 digits")
    .max(15),
  address: z.string().optional(),
  board: z.enum(["cbse", "icse", "state"], {
    required_error: "Board is required",
  }),
  class_number: z.coerce
    .number()
    .min(1)
    .max(10, "Class must be between 1 and 10"),
  school_name: z.string().optional(),
  previous_academic_performance: z.string().optional(),
  subjects: z.array(z.string()).min(1, "Select at least one subject"),
  enrollment_date: z.string().min(1, "Enrollment date is required"),
  status: z.enum(["active", "inactive", "dropped"]),
  monthly_fee: z.coerce.number().min(0),
});

export type StudentInput = z.infer<typeof studentSchema>;

export const paymentSchema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  payment_date: z.string().min(1, "Payment date is required"),
  mode: z.enum(["cash", "upi", "bank_transfer", "cheque"], {
    required_error: "Payment mode is required",
  }),
  receipt_number: z.string().optional(),
  notes: z.string().optional(),
});

export type PaymentInput = z.infer<typeof paymentSchema>;

export const userSchema = z.object({
  full_name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["admin", "teacher"]),
});

export type UserInput = z.infer<typeof userSchema>;

export const ALL_SUBJECTS = [
  "Mathematics",
  "Science",
  "English",
  "Hindi",
  "Social Studies",
  "Computer Science",
  "Sanskrit",
  "French",
  "Art",
  "Physical Education",
  "Telugu",
  "Physics",
  "Biology",
  "Chemistry"
] as const;

export const studentSignupSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  full_name: z.string().min(2, "Name must be at least 2 characters").max(100),
  date_of_birth: z.string().min(1, "Date of birth is required"),
  gender: z.enum(["male", "female"], {
    required_error: "Gender is required",
  }),
  contact_number: z.string().min(10, "Phone number must be 10 digits").max(15),
  parent_name: z.string().min(1, "Parent name is required").max(100),
  parent_contact: z.string().min(10, "Phone number must be 10 digits").max(15),
  address: z.string().optional(),
  board: z.enum(["cbse", "icse", "state"], {
    required_error: "Board is required",
  }),
  class_number: z.coerce.number().min(1).max(10, "Class must be between 1 and 10"),
  school_name: z.string().optional(),
  previous_academic_performance: z.string().optional(),
  subjects: z.array(z.string()).min(1, "Select at least one subject"),
});

export type StudentSignupInput = z.infer<typeof studentSignupSchema>;
