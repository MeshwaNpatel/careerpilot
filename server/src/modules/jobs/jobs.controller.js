import { searchJobs } from './jobs.service.js';
import prisma from '../../config/db.js';
import ApiError from '../../utils/ApiError.js';

export async function search(req, res, next) {
  try {
    const { keyword = '', country = 'us', page = 1, source } = req.query;
    const jobs = await searchJobs({
      keyword: String(keyword).trim(),
      country: String(country),
      page: Math.max(1, parseInt(page) || 1),
      source: source || null,
    });
    res.json({ jobs });
  } catch (err) {
    next(err);
  }
}

export async function saveJob(req, res, next) {
  try {
    const userId = req.user.userId;
    const { externalId, title, company, location, url, source, salaryMin, salaryMax, salary, description, jobType, isRemote, postedAt } = req.body;

    if (!externalId || !title || !company || !url) {
      throw new ApiError('Missing required fields', 400);
    }

    const saved = await prisma.savedJob.upsert({
      where: { userId_externalId: { userId, externalId } },
      create: { userId, externalId, title, company, location: location || '', url, source, salaryMin, salaryMax, salary, description, jobType, isRemote: isRemote ?? false, postedAt: postedAt ? new Date(postedAt) : null },
      update: {},
    });

    res.status(201).json(saved);
  } catch (err) {
    next(err);
  }
}

export async function listSaved(req, res, next) {
  try {
    const jobs = await prisma.savedJob.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ jobs });
  } catch (err) {
    next(err);
  }
}

export async function unsaveJob(req, res, next) {
  try {
    const job = await prisma.savedJob.findFirst({
      where: { id: req.params.id, userId: req.user.userId },
    });
    if (!job) throw new ApiError('Saved job not found', 404);
    await prisma.savedJob.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function moveToPipeline(req, res, next) {
  try {
    const userId = req.user.userId;
    const job = await prisma.savedJob.findFirst({
      where: { id: req.params.id, userId },
    });
    if (!job) throw new ApiError('Saved job not found', 404);

    const application = await prisma.application.create({
      data: {
        userId,
        company: job.company,
        roleTitle: job.title,
        appliedAt: new Date(),
        status: 'applied',
        jobUrl: job.url,
        source: 'Job Board',
        notes: `Saved from ${job.source}. Location: ${job.location}.`,
      },
    });

    res.status(201).json(application);
  } catch (err) {
    next(err);
  }
}
