import prisma from '../../config/db.js';
import redis from '../../config/redis.js';
import logger from '../../utils/logger.js';

// ── Feature flags ─────────────────────────────────────────────────────────────

const FLAG_DEFAULTS = {
  ai_review_enabled: 'true',
  cover_letter_enabled: 'true',
  free_plan_ai_limit: '3',
  pro_plan_ai_limit: '20',
  max_resume_uploads_free: '2',
  max_resume_uploads_pro: '10',
};

export async function getFlags() {
  const entries = await Promise.all(
    Object.keys(FLAG_DEFAULTS).map(async (key) => {
      const stored = await redis.get(`flag:${key}`);
      return [key, stored ?? FLAG_DEFAULTS[key]];
    })
  );
  return Object.fromEntries(entries);
}

export async function setFlag(key, value) {
  if (!(key in FLAG_DEFAULTS)) {
    const err = new Error(`Unknown flag: ${key}`);
    err.status = 400;
    throw err;
  }
  await redis.set(`flag:${key}`, String(value));
  return { key, value: String(value) };
}

// ── Analytics ─────────────────────────────────────────────────────────────────

const ANALYTICS_CACHE_KEY = 'admin:analytics';
const ANALYTICS_CACHE_TTL = 60 * 60; // 1 hour

export async function getPlatformAnalytics({ refresh = false } = {}) {
  if (!refresh) {
    const cached = await redis.get(ANALYTICS_CACHE_KEY);
    if (cached) return JSON.parse(cached);
  }

  const result = await _computePlatformAnalytics();
  await redis.set(ANALYTICS_CACHE_KEY, JSON.stringify(result), 'EX', ANALYTICS_CACHE_TTL);
  return result;
}

async function _computePlatformAnalytics() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    newLast7,
    newLast30,
    mau,
    planDistribution,
    aiStats,
    aiFeatureBreakdown,
    recentSignups,
    totalApplications,
    totalResumes,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.user.count({ where: { lastActiveAt: { gte: thirtyDaysAgo } } }),
    prisma.subscription.groupBy({ by: ['plan'], _count: { plan: true } }),
    prisma.aiRequest.aggregate({
      where: { createdAt: { gte: startOfMonth } },
      _sum: { costUsd: true },
      _count: { id: true },
    }),
    prisma.aiRequest.groupBy({
      by: ['feature'],
      where: { createdAt: { gte: startOfMonth } },
      _count: { id: true },
    }),
    // Signups per day for last 30 days (raw SQL for date truncation)
    prisma.$queryRaw`
      SELECT DATE_TRUNC('day', created_at)::date AS date, COUNT(*)::int AS count
      FROM users
      WHERE created_at >= ${thirtyDaysAgo}
      GROUP BY DATE_TRUNC('day', created_at)
      ORDER BY date ASC
    `,
    prisma.application.count(),
    prisma.resume.count(),
  ]);

  const planCounts = { free: 0, pro: 0, premium: 0 };
  for (const row of planDistribution) {
    planCounts[row.plan] = row._count.plan;
  }

  // Estimated MRR: Pro $9/mo, Premium $19/mo
  const estimatedMrr = (planCounts.pro * 9) + (planCounts.premium * 19);

  const featureBreakdown = {};
  for (const row of aiFeatureBreakdown) {
    featureBreakdown[row.feature] = row._count.id;
  }

  return {
    totalUsers,
    newLast7Days: newLast7,
    newLast30Days: newLast30,
    monthlyActiveUsers: mau,
    planDistribution: planCounts,
    estimatedMrr,
    totalApplications,
    totalResumes,
    aiThisMonth: {
      calls: aiStats._count.id,
      costUsd: Number(aiStats._sum.costUsd ?? 0).toFixed(4),
      featureBreakdown,
    },
    signupTrend: recentSignups,
  };
}

// ── User management ───────────────────────────────────────────────────────────

export async function listUsers({ page = 1, limit = 20, search = '', plan = '' }) {
  const pageNum = Math.max(1, parseInt(page, 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * pageSize;

  const where = {
    AND: [
      search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {},
      plan ? { subscription: { plan } } : {},
    ],
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastActiveAt: true,
        subscription: { select: { plan: true, status: true } },
        _count: { select: { applications: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    items: users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      isActive: u.isActive,
      plan: u.subscription?.plan ?? 'free',
      subscriptionStatus: u.subscription?.status ?? 'active',
      applicationCount: u._count.applications,
      createdAt: u.createdAt,
      lastActiveAt: u.lastActiveAt,
    })),
    pagination: { page: pageNum, limit: pageSize, total, totalPages: Math.ceil(total / pageSize) },
  };
}

export async function getUserDetail(id) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      lastActiveAt: true,
      subscription: true,
      _count: { select: { applications: true, resumes: true } },
    },
  });

  if (!user) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }

  const aiUsageThisMonth = await prisma.aiRequest.aggregate({
    where: { userId: id, createdAt: { gte: startOfMonth } },
    _sum: { costUsd: true },
    _count: { id: true },
  });

  return {
    ...user,
    applicationCount: user._count.applications,
    resumeCount: user._count.resumes,
    aiThisMonth: {
      calls: aiUsageThisMonth._count.id,
      costUsd: Number(aiUsageThisMonth._sum.costUsd ?? 0).toFixed(4),
    },
  };
}

export async function banUser(id) {
  const user = await prisma.user.findUnique({ where: { id }, select: { isActive: true } });
  if (!user) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }
  const updated = await prisma.user.update({
    where: { id },
    data: { isActive: !user.isActive },
    select: { id: true, isActive: true },
  });
  logger.info(`Admin ${updated.isActive ? 'unbanned' : 'banned'} user ${id}`);
  return updated;
}

export async function changeUserPlan(id, plan) {
  if (!['free', 'pro', 'premium'].includes(plan)) {
    const err = new Error('Invalid plan');
    err.status = 400;
    throw err;
  }
  await prisma.subscription.upsert({
    where: { userId: id },
    update: { plan },
    create: { userId: id, plan, status: 'active' },
  });
  logger.info(`Admin changed plan for user ${id} to ${plan}`);
  return { id, plan };
}

export async function deleteUser(id) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }
  await prisma.user.delete({ where: { id } });
  logger.info(`Admin deleted user ${id}`);
}

// ── AI usage ──────────────────────────────────────────────────────────────────

export async function getAiUsage({ page = 1, limit = 50 }) {
  const pageNum = Math.max(1, parseInt(page, 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * pageSize;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [requests, total, monthlyStats] = await Promise.all([
    prisma.aiRequest.findMany({
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        feature: true,
        tokensUsed: true,
        costUsd: true,
        createdAt: true,
        user: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.aiRequest.count(),
    prisma.aiRequest.aggregate({
      where: { createdAt: { gte: startOfMonth } },
      _sum: { costUsd: true, tokensUsed: true },
      _count: { id: true },
    }),
  ]);

  return {
    items: requests,
    pagination: { page: pageNum, limit: pageSize, total, totalPages: Math.ceil(total / pageSize) },
    thisMonth: {
      calls: monthlyStats._count.id,
      tokensUsed: monthlyStats._sum.tokensUsed ?? 0,
      costUsd: Number(monthlyStats._sum.costUsd ?? 0).toFixed(4),
    },
  };
}

// ── Broadcast notification ────────────────────────────────────────────────────

const BROADCAST_HISTORY_KEY = 'broadcast:history';
const BROADCAST_HISTORY_MAX = 100;

export async function broadcastNotification({ title, message, segment = 'all', sentBy = null }) {
  const where = {};
  if (segment !== 'all') {
    where.subscription = { plan: segment };
  }

  const users = await prisma.user.findMany({ where, select: { id: true } });

  if (users.length === 0) {
    // Still log the attempt even if 0 recipients
    const entry = JSON.stringify({ id: crypto.randomUUID(), title, message, segment, recipientCount: 0, sentBy, sentAt: new Date().toISOString() });
    await redis.multi().lpush(BROADCAST_HISTORY_KEY, entry).ltrim(BROADCAST_HISTORY_KEY, 0, BROADCAST_HISTORY_MAX - 1).exec();
    return { sent: 0 };
  }

  await prisma.notification.createMany({
    data: users.map((u) => ({
      userId: u.id,
      type: 'broadcast',
      title,
      message,
    })),
  });

  const entry = JSON.stringify({
    id: crypto.randomUUID(),
    title,
    message,
    segment,
    recipientCount: users.length,
    sentBy,
    sentAt: new Date().toISOString(),
  });
  await redis.multi().lpush(BROADCAST_HISTORY_KEY, entry).ltrim(BROADCAST_HISTORY_KEY, 0, BROADCAST_HISTORY_MAX - 1).exec();

  logger.info(`Admin broadcast to ${users.length} users (segment: ${segment}): "${title}"`);
  return { sent: users.length };
}

export async function getBroadcastHistory() {
  const raw = await redis.lrange(BROADCAST_HISTORY_KEY, 0, 49);
  return raw.map((item) => JSON.parse(item));
}
