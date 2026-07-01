import prisma from '../../config/db.js';
import ApiError from '../../utils/ApiError.js';

const FREE_PLAN_APPLICATION_LIMIT = 25;

const detailInclude = {
  resume: { select: { id: true, label: true, version: true } },
  interviews: { orderBy: { scheduledAt: 'asc' } },
  contacts: true,
};

export async function listApplications(userId, { page, limit, status, source, sortBy, order, search }) {
  const where = {
    userId,
    isArchived: false,
    ...(status && { status }),
    ...(source && { source }),
    ...(search && {
      OR: [
        { company: { contains: search, mode: 'insensitive' } },
        { roleTitle: { contains: search, mode: 'insensitive' } },
      ],
    }),
  };

  const [items, total] = await Promise.all([
    prisma.application.findMany({
      where,
      orderBy: { [sortBy]: order },
      skip: (page - 1) * limit,
      take: limit,
      include: { resume: { select: { id: true, label: true, version: true } } },
    }),
    prisma.application.count({ where }),
  ]);

  return {
    items,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  };
}

export async function createApplication(userId, plan, data) {
  if (plan === 'free') {
    const count = await prisma.application.count({ where: { userId } });
    if (count >= FREE_PLAN_APPLICATION_LIMIT) {
      throw new ApiError(
        `Free plan is limited to ${FREE_PLAN_APPLICATION_LIMIT} applications. Upgrade to Pro for unlimited tracking.`,
        402
      );
    }
  }

  if (data.resumeId) {
    await assertResumeOwnership(userId, data.resumeId);
  }

  return prisma.application.create({
    data: { ...data, userId },
    include: { resume: { select: { id: true, label: true, version: true } } },
  });
}

export async function getApplicationById(userId, id) {
  const application = await prisma.application.findFirst({
    where: { id, userId },
    include: detailInclude,
  });

  if (!application) {
    throw new ApiError('Application not found', 404);
  }

  return application;
}

export async function updateApplication(userId, id, data) {
  await getApplicationById(userId, id);

  if (data.resumeId) {
    await assertResumeOwnership(userId, data.resumeId);
  }

  return prisma.application.update({
    where: { id },
    data,
    include: { resume: { select: { id: true, label: true, version: true } } },
  });
}

export async function updateApplicationStatus(userId, id, status) {
  await getApplicationById(userId, id);

  return prisma.application.update({
    where: { id },
    data: { status },
    include: { resume: { select: { id: true, label: true, version: true } } },
  });
}

export async function deleteApplication(userId, id) {
  await getApplicationById(userId, id);
  await prisma.application.delete({ where: { id } });
}

async function assertResumeOwnership(userId, resumeId) {
  const resume = await prisma.resume.findFirst({ where: { id: resumeId, userId } });
  if (!resume) {
    throw new ApiError('Resume not found', 404);
  }
}
