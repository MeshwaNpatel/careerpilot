import * as interviewsService from './interviews.service.js';
import { logActivity } from '../../utils/activityLogger.js';

export async function list(req, res, next) {
  try {
    const interviews = await interviewsService.listInterviews(req.user.userId, req.params.applicationId);
    res.json(interviews);
  } catch (err) {
    next(err);
  }
}

export async function create(req, res, next) {
  try {
    const interview = await interviewsService.createInterview(
      req.user.userId,
      req.params.applicationId,
      req.body
    );
    logActivity(req.params.applicationId, req.user.userId, 'interview_added', {
      roundName: interview.roundName,
      format: interview.format,
      scheduledAt: interview.scheduledAt,
    });
    res.status(201).json(interview);
  } catch (err) {
    next(err);
  }
}

export async function update(req, res, next) {
  try {
    const interview = await interviewsService.updateInterview(
      req.user.userId,
      req.params.applicationId,
      req.params.id,
      req.body
    );
    const changes = Object.keys(req.body).join(', ');
    logActivity(req.params.applicationId, req.user.userId, 'interview_updated', {
      roundName: interview.roundName,
      changes,
      outcome: req.body.outcome,
    });
    res.json(interview);
  } catch (err) {
    next(err);
  }
}

export async function remove(req, res, next) {
  try {
    await interviewsService.deleteInterview(
      req.user.userId,
      req.params.applicationId,
      req.params.id
    );
    logActivity(req.params.applicationId, req.user.userId, 'interview_deleted');
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
