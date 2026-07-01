import redis from '../config/redis.js';

const PLAN_AI_LIMITS = {
  free: 3,
  pro: 20,
  premium: Infinity,
};

function redisKey(userId) {
  const now = new Date();
  const month = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
  return `ai_usage:${userId}:${month}`;
}

function secondsUntilEndOfMonth() {
  const now = new Date();
  const nextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return Math.ceil((nextMonth - now) / 1000);
}

export default async function checkPlanLimit(req, res, next) {
  try {
    const userId = req.user.userId ?? req.user.id;
    const plan = req.user.plan ?? 'free';
    const limit = PLAN_AI_LIMITS[plan] ?? PLAN_AI_LIMITS.free;

    if (limit === Infinity) {
      req.aiUsageKey = redisKey(userId);
      req.aiUsageTtl = secondsUntilEndOfMonth();
      return next();
    }

    const key = redisKey(userId);
    const current = await redis.get(key);
    const count = current ? parseInt(current, 10) : 0;

    if (count >= limit) {
      return res.status(429).json({
        error: `You have used all ${limit} AI credits for this month. Upgrade your plan for more.`,
        used: count,
        limit,
      });
    }

    req.aiUsageKey = key;
    req.aiUsageTtl = secondsUntilEndOfMonth();
    next();
  } catch (err) {
    next(err);
  }
}
