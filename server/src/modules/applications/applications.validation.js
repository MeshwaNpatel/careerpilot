import { z } from 'zod';

export const APPLICATION_STATUSES = ['applied', 'screening', 'interview', 'offer', 'rejected'];

const optionalString = (max) => z.string().trim().max(max).optional().or(z.literal('').transform(() => undefined));

export const createApplicationSchema = z.object({
  company: z.string().trim().min(1, 'Company is required').max(255),
  roleTitle: z.string().trim().min(1, 'Role title is required').max(255),
  status: z.enum(APPLICATION_STATUSES).optional().default('applied'),
  jobUrl: optionalString(500),
  source: optionalString(100),
  salaryMin: z.coerce.number().int().nonnegative().optional().nullable(),
  salaryMax: z.coerce.number().int().nonnegative().optional().nullable(),
  salaryCurrency: z.string().trim().length(3).optional().default('USD'),
  appliedAt: z.coerce.date(),
  followUpDate: z.coerce.date().optional().nullable(),
  notes: z.string().optional(),
  coverLetterText: z.string().optional().nullable(),
  resumeId: z.string().uuid().optional().nullable(),
});

export const updateApplicationSchema = createApplicationSchema.partial().extend({
  isArchived: z.boolean().optional(),
  coverLetterText: z.string().optional().nullable(),
});

export const updateStatusSchema = z.object({
  status: z.enum(APPLICATION_STATUSES),
});

export const listApplicationsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  status: z.enum(APPLICATION_STATUSES).optional(),
  source: z.string().trim().optional(),
  sortBy: z.enum(['appliedAt', 'createdAt', 'updatedAt', 'company']).optional().default('appliedAt'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
  search: z.string().trim().max(200).optional(),
});
