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
      // Disallow ASCII control characters (0x00 - 0x1F, 0x7F)
      .refine(
        (val) => !/[\u0000-\u001F\u007F]/.test(val),
        'Name cannot contain control characters'
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
          // Digits, +, spaces and dashes only
          if (!/^[0-9+\s-]+$/.test(val)) return false;
          // Count only actual digits: 7 to 15 digits
          const digits = val.replace(/\D/g, '');
          return digits.length >= 7 && digits.length <= 15;
        },
        'Phone number must contain between 7 and 15 digits (plus, spaces, and dashes are allowed)'
      ),
  })
  .strict();

export type ClientInput = z.infer<typeof clientSchema>;
