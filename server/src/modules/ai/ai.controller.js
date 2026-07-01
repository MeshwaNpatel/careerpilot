import * as aiService from './ai.service.js';
import ApiError from '../../utils/ApiError.js';
import redis from '../../config/redis.js';

const PLAN_AI_LIMITS = { free: 3, pro: 20, premium: null };

function aiUsageKey(userId) {
  const now = new Date();
  const month = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
  return `ai_usage:${userId}:${month}`;
}

function handleAIError(err, next) {
  const msg = err?.message ?? '';
  if (msg.includes('quota') || msg.includes('429') || err?.status === 429) {
    return next(new ApiError('AI service is temporarily unavailable — rate limit reached. Please try again in a minute.', 503));
  }
  if (msg.includes('API_KEY') || err?.status === 401 || err?.status === 403) {
    return next(new ApiError('AI service configuration error. Please contact support.', 503));
  }
  next(err);
}

export async function getUsage(req, res, next) {
  try {
    const userId = req.user.userId ?? req.user.id;
    const [subRow, current] = await Promise.all([
      aiService.getSubscriptionPlan(userId),
      redis.get(aiUsageKey(userId)),
    ]);
    const plan = subRow ?? req.user.plan ?? 'free';
    const limit = PLAN_AI_LIMITS[plan] ?? PLAN_AI_LIMITS.free;
    const used = current ? parseInt(current, 10) : 0;
    res.json({
      plan,
      used,
      limit,
      remaining: limit === null ? null : Math.max(0, limit - used),
    });
  } catch (err) {
    next(err);
  }
}

export async function reviewResume(req, res, next) {
  try {
    const result = await aiService.reviewResume(
      req.user.userId,
      req.body,
      req.aiUsageKey,
      req.aiUsageTtl
    );
    res.json(result);
  } catch (err) {
    handleAIError(err, next);
  }
}

export async function generateCoverLetter(req, res, next) {
  try {
    const result = await aiService.generateCoverLetter(
      req.user.userId,
      req.body,
      req.aiUsageKey,
      req.aiUsageTtl
    );
    res.json(result);
  } catch (err) {
    handleAIError(err, next);
  }
}

export async function generateInterviewPrep(req, res, next) {
  try {
    const result = await aiService.generateInterviewPrep(
      req.user.userId,
      req.body,
      req.aiUsageKey,
      req.aiUsageTtl
    );
    res.json(result);
  } catch (err) {
    handleAIError(err, next);
  }
}
