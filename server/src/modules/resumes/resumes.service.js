import prisma from '../../config/db.js';
import ApiError from '../../utils/ApiError.js';
import {
  buildResumeKey,
  buildObjectUrl,
  uploadBufferToS3,
  deleteFromS3,
  getPresignedDownloadUrl,
} from '../../utils/uploadToS3.js';

const PLAN_LIMITS = {
  free: { maxUploads: 10, maxSizeBytes: 5 * 1024 * 1024 },
  pro: { maxUploads: 25, maxSizeBytes: 5 * 1024 * 1024 },
  premium: { maxUploads: Infinity, maxSizeBytes: 10 * 1024 * 1024 },
};

async function withDownloadUrl(resume) {
  return { ...resume, downloadUrl: await getPresignedDownloadUrl(resume.fileKey) };
}

export async function listResumes(userId) {
  const resumes = await prisma.resume.findMany({
    where: { userId },
    orderBy: { uploadedAt: 'desc' },
  });

  return Promise.all(resumes.map(withDownloadUrl));
}

export async function uploadResume(userId, plan, file, { label, version }) {
  if (!file) {
    throw new ApiError('A PDF file is required', 400);
  }

  const limits = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;

  if (file.size > limits.maxSizeBytes) {
    throw new ApiError(`File exceeds the ${limits.maxSizeBytes / (1024 * 1024)}MB limit for your plan`, 413);
  }

  const count = await prisma.resume.count({ where: { userId } });
  if (count >= limits.maxUploads) {
    throw new ApiError(`Your plan allows up to ${limits.maxUploads} resumes. Upgrade to add more.`, 402);
  }

  const key = buildResumeKey(userId, file.originalname);
  await uploadBufferToS3({ key, buffer: file.buffer, contentType: file.mimetype });

  const resume = await prisma.resume.create({
    data: {
      userId,
      label,
      version,
      fileKey: key,
      fileUrl: buildObjectUrl(key),
      fileSizeKb: Math.round(file.size / 1024),
    },
  });

  return withDownloadUrl(resume);
}

export async function updateResume(userId, id, data) {
  const resume = await prisma.resume.findFirst({ where: { id, userId } });
  if (!resume) {
    throw new ApiError('Resume not found', 404);
  }

  const updated = await prisma.resume.update({ where: { id }, data });
  return withDownloadUrl(updated);
}

export async function deleteResume(userId, id) {
  const resume = await prisma.resume.findFirst({ where: { id, userId } });
  if (!resume) {
    throw new ApiError('Resume not found', 404);
  }

  await deleteFromS3(resume.fileKey);
  await prisma.resume.delete({ where: { id } });
}
