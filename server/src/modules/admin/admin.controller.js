import * as adminService from './admin.service.js';

export async function getAnalytics(req, res, next) {
  try {
    const refresh = req.query.refresh === 'true';
    const data = await adminService.getPlatformAnalytics({ refresh });
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function listUsers(req, res, next) {
  try {
    const { page, limit, search, plan } = req.parsed?.query ?? req.query;
    const data = await adminService.listUsers({ page, limit, search, plan });
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function getUserDetail(req, res, next) {
  try {
    const data = await adminService.getUserDetail(req.params.id);
    res.json(data);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
}

export async function banUser(req, res, next) {
  try {
    const data = await adminService.banUser(req.params.id);
    res.json(data);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
}

export async function changeUserPlan(req, res, next) {
  try {
    const { plan } = req.body;
    const data = await adminService.changeUserPlan(req.params.id, plan);
    res.json(data);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
}

export async function deleteUser(req, res, next) {
  try {
    await adminService.deleteUser(req.params.id);
    res.sendStatus(204);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
}

export async function getAiUsage(req, res, next) {
  try {
    const { page, limit } = req.parsed?.query ?? req.query;
    const data = await adminService.getAiUsage({ page, limit });
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function broadcast(req, res, next) {
  try {
    const { title, message, segment } = req.body;
    if (!title || !message) {
      return res.status(400).json({ error: 'title and message are required' });
    }
    const sentBy = req.user?.userId ?? req.user?.id ?? null;
    const data = await adminService.broadcastNotification({ title, message, segment, sentBy });
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function getBroadcastHistory(req, res, next) {
  try {
    const data = await adminService.getBroadcastHistory();
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function getFlags(req, res, next) {
  try {
    const data = await adminService.getFlags();
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function setFlag(req, res, next) {
  try {
    const { value } = req.body;
    if (value === undefined) {
      return res.status(400).json({ error: 'value is required' });
    }
    const data = await adminService.setFlag(req.params.key, value);
    res.json(data);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
}
