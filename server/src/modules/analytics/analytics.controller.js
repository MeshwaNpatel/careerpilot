import * as analyticsService from './analytics.service.js';

export async function getUserAnalytics(req, res, next) {
  try {
    const data = await analyticsService.getUserAnalytics(req.user.userId);
    res.json(data);
  } catch (err) {
    next(err);
  }
}
