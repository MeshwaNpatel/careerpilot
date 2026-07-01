import prisma from '../../config/db.js';
import stripe from '../../config/stripe.js';
import logger from '../../utils/logger.js';

const PLAN_BY_PRICE = () => ({
  [process.env.STRIPE_PRO_PRICE_ID]: 'pro',
  [process.env.STRIPE_PREMIUM_PRICE_ID]: 'premium',
});

export async function getMySubscription(userId) {
  const sub = await prisma.subscription.findUnique({
    where: { userId },
    select: { plan: true, status: true, currentPeriodEnd: true, stripeCustomerId: true, stripeSubId: true },
  });
  return sub ?? { plan: 'free', status: 'active', currentPeriodEnd: null };
}

export async function createCheckoutSession(userId, plan) {
  const priceId = plan === 'pro' ? process.env.STRIPE_PRO_PRICE_ID : process.env.STRIPE_PREMIUM_PRICE_ID;

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
  const sub = await prisma.subscription.findUnique({ where: { userId } });

  const sessionParams = {
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.CLIENT_URL}/billing?success=true`,
    cancel_url: `${process.env.CLIENT_URL}/billing?cancelled=true`,
    metadata: { userId },
  };

  if (sub?.stripeCustomerId) {
    sessionParams.customer = sub.stripeCustomerId;
  } else {
    sessionParams.customer_email = user.email;
  }

  const session = await stripe.checkout.sessions.create(sessionParams);
  return { checkoutUrl: session.url };
}

export async function createPortalSession(userId) {
  const sub = await prisma.subscription.findUnique({ where: { userId } });
  if (!sub?.stripeCustomerId) {
    const err = new Error('No active Stripe subscription found');
    err.status = 400;
    throw err;
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: sub.stripeCustomerId,
    return_url: `${process.env.CLIENT_URL}/billing`,
  });
  return { portalUrl: session.url };
}

export async function handleStripeWebhook(rawBody, signature) {
  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    const verifyErr = new Error(`Webhook signature verification failed: ${err.message}`);
    verifyErr.status = 400;
    throw verifyErr;
  }

  const planByPrice = PLAN_BY_PRICE();

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const userId = session.metadata?.userId;
      if (!userId) break;

      const stripeSubId = session.subscription;
      const stripeSub = await stripe.subscriptions.retrieve(stripeSubId);
      const priceId = stripeSub.items.data[0]?.price.id;
      const plan = planByPrice[priceId] ?? 'pro';
      const currentPeriodEnd = new Date(stripeSub.current_period_end * 1000);

      await prisma.subscription.upsert({
        where: { userId },
        update: { plan, status: 'active', stripeCustomerId: session.customer, stripeSubId, currentPeriodEnd },
        create: { userId, plan, status: 'active', stripeCustomerId: session.customer, stripeSubId, currentPeriodEnd },
      });
      logger.info(`Stripe checkout.session.completed: userId=${userId} plan=${plan}`);
      break;
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object;
      if (!invoice.subscription) break;

      const stripeSub = await stripe.subscriptions.retrieve(invoice.subscription);
      const currentPeriodEnd = new Date(stripeSub.current_period_end * 1000);

      await prisma.subscription.updateMany({
        where: { stripeSubId: invoice.subscription },
        data: { status: 'active', currentPeriodEnd },
      });
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      if (!invoice.subscription) break;

      await prisma.subscription.updateMany({
        where: { stripeSubId: invoice.subscription },
        data: { status: 'past_due' },
      });
      logger.warn(`Stripe payment failed for subscription ${invoice.subscription}`);
      break;
    }

    case 'customer.subscription.updated': {
      const stripeSub = event.data.object;
      const priceId = stripeSub.items.data[0]?.price.id;
      const plan = planByPrice[priceId] ?? 'pro';
      const status =
        stripeSub.status === 'active' ? 'active'
        : stripeSub.status === 'past_due' ? 'past_due'
        : 'cancelled';

      await prisma.subscription.updateMany({
        where: { stripeSubId: stripeSub.id },
        data: { plan, status, currentPeriodEnd: new Date(stripeSub.current_period_end * 1000) },
      });
      break;
    }

    case 'customer.subscription.deleted': {
      const stripeSub = event.data.object;
      await prisma.subscription.updateMany({
        where: { stripeSubId: stripeSub.id },
        data: { plan: 'free', status: 'cancelled', stripeSubId: null, currentPeriodEnd: null },
      });
      logger.info(`Subscription cancelled for stripeSubId=${stripeSub.id}`);
      break;
    }

    default:
      logger.info(`Unhandled Stripe event: ${event.type}`);
  }

  return { received: true };
}
