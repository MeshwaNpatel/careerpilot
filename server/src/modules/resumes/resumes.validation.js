import { z } from 'zod';

export const uploadResumeSchema = z.object({
  label: z.string().trim().min(1, 'Label is required').max(255),
  version: z.string().trim().max(50).optional(),
});

export const updateResumeSchema = z
  .object({
    label: z.string().trim().min(1, 'Label is required').max(255).optional(),
    version: z.string().trim().max(50).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'At least one field is required' });
