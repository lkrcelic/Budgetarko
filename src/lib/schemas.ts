import { z } from 'zod'

/**
 * The entry form stores amount as a string so the custom keypad
 * can build it digit-by-digit. It gets parsed to a number on submit.
 */
export const entryFormSchema = z.object({
  amount: z
    .string()
    .min(1, 'Enter an amount')
    .refine(v => {
      const n = parseFloat(v)
      return !isNaN(n) && n > 0
    }, 'Amount must be greater than 0'),
  category:    z.string().min(1, 'Select a category'),
  description: z.string().default(''),
  year:        z.number().int().positive(),
  month:       z.number().int().min(1).max(12),
  // Card installment fields
  installments: z.number().int().min(2).max(36),
  start_year:   z.number().int().positive(),
  start_month:  z.number().int().min(1).max(12).optional(),
  // Subscription fields
  frequency: z.enum(['monthly', 'yearly', 'once']),
})

export type EntryFormValues = z.infer<typeof entryFormSchema>
