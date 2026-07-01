import { z } from 'zod';

export const createInterviewSchema = z.object({
  roundName: z.string().trim().max(100).optional(),
  format: z.enum(['video', 'phone', 'onsite', 'take_home']).optional(),
  scheduledAt: z.string().optional().or(z.literal('')),
  durationMinutes: z.number().int().positive().optional(),
  interviewerName: z.string().trim().max(255).optional(),
  outcome: z.enum(['passed', 'failed', 'pending', 'cancelled']).optional(),
  notes: z.string().optional(),
});

export const updateInterviewSchema = createInterviewSchema;
