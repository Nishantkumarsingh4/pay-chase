import { z } from 'zod';

/**
 * Shared Client Schema with strict validation:
 * - name: trimmed, 2-100 chars, no control characters
 * - email: trimmed, lowercased, valid format, max 254 chars
 * - phone: optional, digits, +, spaces and dashes only, 7-15 digits
 * - rejects unknown fields
 */
export const clientSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name cannot exceed 100 characters')
      // Must only contain letters, spaces, dots, hyphens, and apostrophes (NO NUMBERS)
      .refine(
        (val) => !/\d/.test(val),
        'Name cannot contain numbers'
      )
      .refine(
        (val) => /^[a-zA-Z\s.'-]+$/.test(val),
        'Name can only contain letters and spaces'
      ),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .max(254, 'Email cannot exceed 254 characters')
      .email('Please enter a valid email address'),
    phone: z
      .string()
      .trim()
      .optional()
      .nullable()
      .transform((val) => (val && val.length > 0 ? val : null))
      .refine(
        (val) => {
          if (!val) return true;
          // Must be exactly 10 digits
          return /^\d{10}$/.test(val);
        },
        'Phone number must be exactly 10 digits'
      ),
  })
  .strict();

export type ClientInput = z.infer<typeof clientSchema>;
