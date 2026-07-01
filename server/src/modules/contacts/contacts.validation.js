import { z } from 'zod';

export const createContactSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(255),
  roleTitle: z.string().trim().max(255).optional().or(z.literal('')),
  email: z.string().trim().email().max(255).optional().or(z.literal('')),
  linkedinUrl: z.string().trim().max(500).optional().or(z.literal('')),
  phone: z.string().trim().max(50).optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
});

export const updateContactSchema = createContactSchema.partial().refine(
  (d) => Object.keys(d).length > 0,
  { message: 'At least one field is required' }
);
