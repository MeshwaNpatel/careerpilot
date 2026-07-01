import prisma from '../../config/db.js';
import ApiError from '../../utils/ApiError.js';

async function assertApplicationOwnership(userId, applicationId) {
  const app = await prisma.application.findFirst({ where: { id: applicationId, userId } });
  if (!app) throw new ApiError('Application not found', 404);
}

async function assertInterviewOwnership(userId, applicationId, interviewId) {
  const interview = await prisma.interview.findFirst({
    where: { id: interviewId, applicationId },
    include: { application: { select: { userId: true } } },
  });
  if (!interview || interview.application.userId !== userId) {
    throw new ApiError('Interview not found', 404);
  }
  return interview;
}

export async function listInterviews(userId, applicationId) {
  await assertApplicationOwnership(userId, applicationId);
  return prisma.interview.findMany({
    where: { applicationId },
    orderBy: { scheduledAt: 'asc' },
  });
}

export async function createInterview(userId, applicationId, data) {
  await assertApplicationOwnership(userId, applicationId);
  return prisma.interview.create({
    data: {
      ...data,
      scheduledAt: data.scheduledAt || null,
      applicationId,
    },
  });
}

export async function updateInterview(userId, applicationId, interviewId, data) {
  await assertInterviewOwnership(userId, applicationId, interviewId);
  const updateData = { ...data };
  if ('scheduledAt' in data) {
    updateData.scheduledAt = data.scheduledAt || null;
  }
  return prisma.interview.update({
    where: { id: interviewId },
    data: updateData,
  });
}

export async function deleteInterview(userId, applicationId, interviewId) {
  await assertInterviewOwnership(userId, applicationId, interviewId);
  await prisma.interview.delete({ where: { id: interviewId } });
}
