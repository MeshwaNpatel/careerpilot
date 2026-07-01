import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
import prisma from '../../config/db.js';
import redis from '../../config/redis.js';
import groq from '../../config/groq.js';
import ApiError from '../../utils/ApiError.js';
import { getS3ObjectBuffer } from '../../utils/uploadToS3.js';
import {
  RESUME_REVIEW_SYSTEM,
  buildResumeReviewUser,
} from './prompts/resumeReview.prompt.js';
import {
  COVER_LETTER_SYSTEM,
  buildCoverLetterUser,
} from './prompts/coverLetter.prompt.js';
import {
  INTERVIEW_PREP_SYSTEM,
  buildInterviewPrepUser,
} from './prompts/interviewPrep.prompt.js';

const MODEL = 'llama-3.3-70b-versatile';

export async function getSubscriptionPlan(userId) {
  const sub = await prisma.subscription.findUnique({ where: { userId } });
  return sub?.plan ?? null;
}

async function getResumeText(userId, resumeId) {
  const resume = await prisma.resume.findFirst({ where: { id: resumeId, userId } });
  if (!resume) throw new ApiError('Resume not found', 404);

  const buffer = await getS3ObjectBuffer(resume.fileKey);
  const parsed = await pdfParse(buffer);
  const text = parsed.text.trim();
  if (!text) throw new ApiError('Could not extract text from the resume PDF', 422);
  return text;
}

async function logUsage(userId, feature, usage, responseData) {
  const tokensUsed = usage?.total_tokens ?? 0;
  await prisma.aiRequest.create({
    data: { userId, feature, tokensUsed, costUsd: 0, responseData },
  });
}

async function incrementUsageCounter(key, ttlSeconds) {
  await redis.multi().incr(key).expire(key, ttlSeconds).exec();
}

export async function reviewResume(userId, { resumeId, jobDescription }, usageKey, usageTtl) {
  const resumeText = await getResumeText(userId, resumeId);

  const completion = await groq.chat.completions.create({
    model: MODEL,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: RESUME_REVIEW_SYSTEM },
      { role: 'user', content: buildResumeReviewUser(resumeText, jobDescription) },
    ],
    temperature: 0.3,
  });

  const raw = completion.choices[0].message.content;
  let result;
  try {
    result = JSON.parse(raw);
  } catch {
    throw new ApiError('AI returned an unexpected response format', 502);
  }

  await Promise.all([
    logUsage(userId, 'resume_review', completion.usage, result),
    incrementUsageCounter(usageKey, usageTtl),
  ]);

  return result;
}

export async function generateCoverLetter(
  userId,
  { companyName, roleTitle, whyInterested, resumeId },
  usageKey,
  usageTtl
) {
  let resumeText = null;
  if (resumeId) {
    const resume = await prisma.resume.findFirst({ where: { id: resumeId, userId } });
    if (resume) {
      try {
        const buffer = await getS3ObjectBuffer(resume.fileKey);
        const parsed = await pdfParse(buffer);
        resumeText = parsed.text.trim() || null;
      } catch {
        // resume text is optional for cover letter — proceed without it
      }
    }
  }

  const completion = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: COVER_LETTER_SYSTEM },
      { role: 'user', content: buildCoverLetterUser({ companyName, roleTitle, whyInterested, resumeText }) },
    ],
    temperature: 0.7,
  });

  const letter = completion.choices[0].message.content.trim();

  await Promise.all([
    logUsage(userId, 'cover_letter', completion.usage, { letter }),
    incrementUsageCounter(usageKey, usageTtl),
  ]);

  return { letter };
}

export async function generateInterviewPrep(
  userId,
  { roleTitle, companyName, jobDescription, resumeId },
  usageKey,
  usageTtl
) {
  let resumeText = null;
  if (resumeId) {
    const resume = await prisma.resume.findFirst({ where: { id: resumeId, userId } });
    if (resume) {
      try {
        const buffer = await getS3ObjectBuffer(resume.fileKey);
        const parsed = await pdfParse(buffer);
        resumeText = parsed.text.trim() || null;
      } catch {
        // optional — proceed without resume text
      }
    }
  }

  const completion = await groq.chat.completions.create({
    model: MODEL,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: INTERVIEW_PREP_SYSTEM },
      { role: 'user', content: buildInterviewPrepUser({ roleTitle, companyName, jobDescription, resumeText }) },
    ],
    temperature: 0.5,
  });

  const raw = completion.choices[0].message.content;
  let result;
  try {
    result = JSON.parse(raw);
  } catch {
    throw new ApiError('AI returned an unexpected response format', 502);
  }

  if (!Array.isArray(result.questions)) {
    throw new ApiError('AI returned an unexpected response format', 502);
  }

  await Promise.all([
    logUsage(userId, 'interview_questions', completion.usage, result),
    incrementUsageCounter(usageKey, usageTtl),
  ]);

  return result;
}
