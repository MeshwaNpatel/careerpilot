import * as applicationsService from './applications.service.js';
import prisma from '../../config/db.js';
import { logActivity } from '../../utils/activityLogger.js';

export async function list(req, res, next) {
  try {
    const result = await applicationsService.listApplications(req.user.userId, req.parsed.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function create(req, res, next) {
  try {
    const application = await applicationsService.createApplication(req.user.userId, req.user.plan, req.body);
    logActivity(application.id, req.user.userId, 'application_created', {
      company: application.company,
      roleTitle: application.roleTitle,
      status: application.status,
    });
    res.status(201).json({ application });
  } catch (err) {
    next(err);
  }
}

export async function getById(req, res, next) {
  try {
    const application = await applicationsService.getApplicationById(req.user.userId, req.params.id);
    res.json({ application });
  } catch (err) {
    next(err);
  }
}

export async function update(req, res, next) {
  try {
    const application = await applicationsService.updateApplication(req.user.userId, req.params.id, req.body);
    if (req.body.notes !== undefined) {
      logActivity(application.id, req.user.userId, 'notes_updated');
    }
    res.json({ application });
  } catch (err) {
    next(err);
  }
}

export async function updateStatus(req, res, next) {
  try {
    const application = await applicationsService.updateApplicationStatus(
      req.user.userId,
      req.params.id,
      req.body.status
    );
    logActivity(application.id, req.user.userId, 'status_changed', { status: req.body.status });
    res.json({ application });
  } catch (err) {
    next(err);
  }
}

export async function remove(req, res, next) {
  try {
    await applicationsService.deleteApplication(req.user.userId, req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

export async function getActivity(req, res, next) {
  try {
    const logs = await prisma.activityLog.findMany({
      where: { applicationId: req.params.id, userId: req.user.userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json(logs);
  } catch (err) {
    next(err);
  }
}

export async function exportCsv(req, res, next) {
  try {
    const apps = await prisma.application.findMany({
      where: { userId: req.user.userId, isArchived: false },
      orderBy: { appliedAt: 'desc' },
      include: { resume: { select: { label: true } } },
    });

    const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

    const header = ['Company', 'Role Title', 'Status', 'Applied Date', 'Source', 'Job URL', 'Salary Min', 'Salary Max', 'Resume', 'Notes', 'Cover Letter'];
    const rows = apps.map((a) => [
      a.company,
      a.roleTitle,
      a.status,
      new Date(a.appliedAt).toISOString().slice(0, 10),
      a.source ?? '',
      a.jobUrl ?? '',
      a.salaryMin ?? '',
      a.salaryMax ?? '',
      a.resume?.label ?? '',
      a.notes ?? '',
      a.coverLetterText ?? '',
    ].map(escape).join(','));

    const csv = [header.map(escape).join(','), ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="careerpilot-applications.csv"');
    res.send(csv);
  } catch (err) {
    next(err);
  }
}
