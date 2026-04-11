import { z } from "zod";

// ──────────────────── USER / AUTH SCHEMAS ────────────────────

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z
    .string()
    .email("Invalid email address")
    .refine((email) => email.endsWith("@amu.ac.in"), {
      message: "Only AMU email addresses (@amu.ac.in) are allowed",
    }),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
  departmentId: z.string().min(1, "Department is required"),
  designation: z.string().min(1, "Designation is required"),
  phone: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// ──────────────────── ITEM SCHEMAS ────────────────────

export const itemVariantSchema = z.object({
  label: z.string().min(1, "Variant label is required"),
  image: z.string().optional(),
  acType: z.string().optional(),
  tonCapacity: z.string().optional(),
  starRating: z.string().optional(),
});

export const itemSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  description: z.string().optional(),
  specifications: z.string().optional(),
  itemCode: z.string().optional(),
  categoryId: z.string().min(1, "Category is required"),
  mainImage: z.string().optional(),
  variants: z.array(itemVariantSchema).optional(),
});

// ──────────────────── INDENT SCHEMAS ────────────────────

export const indentItemSchema = z.object({
  itemId: z.string().min(1),
  variantId: z.string().optional(),
  variantLabel: z.string().optional(),
  quantity: z.number().int().positive("Quantity must be positive"),
  year1Label: z.string().optional(),
  year1Qty: z.number().int().min(0).optional(),
  year1Remarks: z.string().optional(),
  year2Label: z.string().optional(),
  year2Qty: z.number().int().min(0).optional(),
  year2Remarks: z.string().optional(),
  year3Label: z.string().optional(),
  year3Qty: z.number().int().min(0).optional(),
  year3Remarks: z.string().optional(),
  remarks: z.string().optional(),
  usedByName: z.string().optional(),
});

export const createIndentSchema = z.object({
  purpose: z.string().min(10, "Purpose must be at least 10 characters"),
  urgency: z.enum(["NORMAL", "URGENT"]),
  items: z.array(indentItemSchema).min(1, "At least one item is required"),
});

export const receiveIndentSchema = z.object({
  receiptNo: z.string().min(1, "Receipt number is required"),
  receiptDate: z.string().min(1, "Receipt date is required"),
});

// ──────────────────── DEPARTMENT SCHEMA ────────────────────

export const departmentSchema = z.object({
  name: z.string().min(2, "Department name is required"),
  code: z.string().min(1, "Department code is required").max(10),
});

// ──────────────────── TYPE EXPORTS ────────────────────

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ItemInput = z.infer<typeof itemSchema>;
export type IndentItemInput = z.infer<typeof indentItemSchema>;
export type CreateIndentInput = z.infer<typeof createIndentSchema>;
export type ReceiveIndentInput = z.infer<typeof receiveIndentSchema>;
export type DepartmentInput = z.infer<typeof departmentSchema>;
