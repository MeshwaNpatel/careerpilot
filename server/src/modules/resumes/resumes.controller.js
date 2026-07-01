import * as resumesService from './resumes.service.js';

export async function list(req, res, next) {
  try {
    const resumes = await resumesService.listResumes(req.user.userId);
    res.json({ resumes });
  } catch (err) {
    next(err);
  }
}

export async function upload(req, res, next) {
  try {
    const resume = await resumesService.uploadResume(req.user.userId, req.user.plan, req.file, req.body);
    res.status(201).json({ resume });
  } catch (err) {
    next(err);
  }
}

export async function update(req, res, next) {
  try {
    const resume = await resumesService.updateResume(req.user.userId, req.params.id, req.body);
    res.json({ resume });
  } catch (err) {
    next(err);
  }
}

export async function remove(req, res, next) {
  try {
    await resumesService.deleteResume(req.user.userId, req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
