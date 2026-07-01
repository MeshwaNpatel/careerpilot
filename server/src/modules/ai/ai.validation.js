import { z } from 'zod';

export const reviewResumeSchema = z.object({
  resumeId: z.string().uuid(),
  jobDescription: z.string().trim().min(50, 'Job description must be at least 50 characters').max(10000),
});

export const coverLetterSchema = z.object({
  companyName: z.string().trim().min(1, 'Company name is required').max(255),
  roleTitle: z.string().trim().min(1, 'Role title is required').max(255),
  whyInterested: z.string().trim().min(10, 'Please explain why you are interested').max(2000),
  resumeId: z.string().uuid().optional(),
});

export const interviewPrepSchema = z.object({
  roleTitle: z.string().trim().min(1, 'Role title is required').max(255),
  companyName: z.string().trim().min(1, 'Company name is required').max(255),
  jobDescription: z.string().trim().min(50, 'Job description must be at least 50 characters').max(10000),
  resumeId: z.string().uuid().optional(),
});
