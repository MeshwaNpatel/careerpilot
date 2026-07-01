import * as subscriptionsService from './subscriptions.service.js';

export async function getMy(req, res, next) {
  try {
    const sub = await subscriptionsService.getMySubscription(req.user.userId);
    res.json(sub);
  } catch (err) {
    next(err);
  }
}

export async function createCheckout(req, res, next) {
  try {
    const { plan } = req.body;
    if (!['pro', 'premium'].includes(plan)) {
      return res.status(400).json({ error: 'Invalid plan. Must be "pro" or "premium".' });
    }
    const result = await subscriptionsService.createCheckoutSession(req.user.userId, plan);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function createPortal(req, res, next) {
  try {
    const result = await subscriptionsService.createPortalSession(req.user.userId);
    res.json(result);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
}

export async function stripeWebhook(req, res, next) {
  try {
    const signature = req.headers['stripe-signature'];
    const result = await subscriptionsService.handleStripeWebhook(req.body, signature);
    res.json(result);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
}
