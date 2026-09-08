import { z } from "zod";

/* ------------------------------------------------------------------ */
/* Budget bands (shared by the enquiry form and the API route)          */
/* ------------------------------------------------------------------ */

export const budgetOptions = [
  { value: "under-500", label: "Under ₹500" },
  { value: "500-1000", label: "₹500–₹1,000" },
  { value: "1000-2500", label: "₹1,000–₹2,500" },
  { value: "2500-plus", label: "₹2,500+" },
  { value: "not-sure", label: "Not sure yet" },
] as const;

export type BudgetValue = (typeof budgetOptions)[number]["value"];

const phonePattern = /^[+()\d][\d\s()+-]{6,17}$/;

/* ------------------------------------------------------------------ */
/* Enquiry schema                                                      */
/* ------------------------------------------------------------------ */

/**
 * Validated on the client (inline errors) and re-validated on the server
 * inside `POST /api/enquiry`. Only name and email are required; everything
 * else is optional but shape-checked when present.
 */
export const enquirySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Please share your name.")
    .max(120, "Name is too long."),
  company: z.string().trim().max(120, "Company name is too long.").default(""),
  email: z.string().trim().pipe(z.email("Please enter a valid email address.")),
  phone: z
    .string()
    .trim()
    .refine((value) => value === "" || phonePattern.test(value), {
      message: "Please enter a valid phone number.",
    })
    .default(""),
  occasion: z.string().trim().max(80).default(""),
  quantity: z
    .string()
    .trim()
    .refine(
      (value) =>
        value === "" || (/^\d+$/.test(value) && Number(value) >= 1 && Number(value) <= 100_000),
      { message: "Enter a quantity between 1 and 1,00,000." },
    )
    .default(""),
  budget: z.enum(["under-500", "500-1000", "1000-2500", "2500-plus", "not-sure"]).default("not-sure"),
  message: z
    .string()
    .trim()
    .max(2000, "Please keep your message under 2,000 characters.")
    .default(""),
});

export type EnquiryData = z.infer<typeof enquirySchema>;

/** Field names of the enquiry schema, for typed form handling. */
export type EnquiryField = keyof EnquiryData;

/** Map of field name → first error message. */
export function fieldErrorsFrom(error: z.ZodError): Partial<Record<EnquiryField, string>> {
  const errors: Partial<Record<EnquiryField, string>> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !(key in errors)) {
      errors[key as EnquiryField] = issue.message;
    }
  }
  return errors;
}
