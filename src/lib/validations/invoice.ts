import { z } from 'zod';

export const invoiceItemSchema = z.object({
  description: z
    .string()
    .trim()
    .min(1, 'Description is required')
    .max(200, 'Description cannot exceed 200 characters'),
  qty: z.coerce
    .number()
    .positive('Quantity must be greater than 0')
    .max(100000, 'Quantity cannot exceed 100,000')
    .refine(
      (val) => Number(val.toFixed(2)) === val,
      'Quantity can have at most 2 decimal places'
    ),
  price: z.coerce
    .number()
    .min(0, 'Price cannot be negative')
    .max(100000000, 'Price cannot exceed 100,000,000')
    .refine(
      (val) => Number(val.toFixed(2)) === val,
      'Price can have at most 2 decimal places'
    ),
});

export const invoiceFormSchema = z
  .object({
    clientId: z.string().min(1, 'Please select a client'),
    currency: z.enum(['INR', 'USD', 'EUR', 'GBP']),
    issueDate: z.string().min(1, 'Issue date is required'),
    dueDate: z.string().min(1, 'Due date is required'),
    notes: z.string().max(1000, 'Notes cannot exceed 1000 characters').optional().nullable(),
    items: z
      .array(invoiceItemSchema)
      .min(1, 'At least 1 item is required')
      .max(50, 'Cannot exceed 50 items'),
  })
  .strict()
  .refine(
    (data) => {
      const issue = new Date(data.issueDate);
      const due = new Date(data.dueDate);
      return !isNaN(issue.getTime()) && !isNaN(due.getTime()) && due >= issue;
    },
    {
      message: 'Due date cannot be before issue date',
      path: ['dueDate'],
    }
  )
  .refine(
    (data) => {
      const due = new Date(data.dueDate);
      const maxFuture = new Date();
      maxFuture.setFullYear(maxFuture.getFullYear() + 5);
      return due <= maxFuture;
    },
    {
      message: 'Due date cannot be more than 5 years in the future',
      path: ['dueDate'],
    }
  );

export type InvoiceItemInput = z.infer<typeof invoiceItemSchema>;
export type InvoiceFormInput = z.infer<typeof invoiceFormSchema>;
