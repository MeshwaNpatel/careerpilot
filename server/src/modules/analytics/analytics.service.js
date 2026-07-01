import prisma from '../../config/db.js';

export async function getUserAnalytics(userId) {
  const now = new Date();
  const twelveWeeksAgo = new Date(now - 12 * 7 * 24 * 60 * 60 * 1000);

  const [
    total,
    byStatus,
    byWeek,
    bySource,
    resumePerformance,
  ] = await Promise.all([
    prisma.application.count({ where: { userId } }),

    prisma.application.groupBy({
      by: ['status'],
      where: { userId },
      _count: { status: true },
    }),

    // Applications submitted per week for last 12 weeks
    prisma.$queryRaw`
      SELECT
        TO_CHAR(DATE_TRUNC('week', applied_at), 'YYYY-"W"IW') AS week,
        MIN(applied_at)::text AS week_start,
        COUNT(*)::int AS count
      FROM applications
      WHERE user_id::text = ${userId}
        AND applied_at >= ${twelveWeeksAgo}::date
      GROUP BY DATE_TRUNC('week', applied_at)
      ORDER BY DATE_TRUNC('week', applied_at) ASC
    `,

    // Top 5 sources
    prisma.application.groupBy({
      by: ['source'],
      where: { userId, source: { not: null } },
      _count: { source: true },
      orderBy: { _count: { source: 'desc' } },
      take: 5,
    }),

    // Resume performance: which resume got the most interviews
    prisma.$queryRaw`
      SELECT
        r.id AS "resumeId",
        r.label,
        COUNT(DISTINCT a.id)::int AS applications,
        COUNT(DISTINCT i.id)::int AS interviews
      FROM resumes r
      LEFT JOIN applications a ON a.resume_id = r.id AND a.user_id::text = ${userId}
      LEFT JOIN interviews i ON i.application_id = a.id
      WHERE r.user_id::text = ${userId}
      GROUP BY r.id, r.label
      ORDER BY interviews DESC, applications DESC
      LIMIT 5
    `,
  ]);

  const statusMap = { applied: 0, screening: 0, interview: 0, offer: 0, rejected: 0 };
  for (const row of byStatus) {
    statusMap[row.status] = row._count.status;
  }

  const responded = total - (statusMap.applied ?? 0);
  const responseRate = total > 0 ? Math.round((responded / total) * 100) : 0;

  return {
    totalApplications: total,
    byStatus: statusMap,
    responseRate,
    inProgress: (statusMap.screening ?? 0) + (statusMap.interview ?? 0),
    interviews: statusMap.interview ?? 0,
    offers: statusMap.offer ?? 0,
    applicationsByWeek: byWeek.map((r) => ({
      week: r.week,
      weekStart: r.week_start,
      count: r.count,
    })),
    topSources: bySource
      .filter((r) => r.source)
      .map((r) => ({ source: r.source, count: r._count.source })),
    resumePerformance: resumePerformance.map((r) => ({
      resumeId: r.resumeId,
      label: r.label,
      applications: r.applications,
      interviews: r.interviews,
    })),
  };
}
