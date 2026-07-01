import { z } from 'zod';

export const updateSettingsSchema = z
  .object({
    name: z.string().trim().min(1).max(255).optional(),
    emailNotifications: z.boolean().optional(),
    followUpReminders: z.boolean().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'At least one field is required' });
