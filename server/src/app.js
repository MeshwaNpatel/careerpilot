import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import session from 'express-session';
import passport from './config/passport.js';
import errorHandler from './middleware/errorHandler.js';
import authRoutes from './modules/auth/auth.routes.js';
import applicationsRoutes from './modules/applications/applications.routes.js';
import resumesRoutes from './modules/resumes/resumes.routes.js';
import aiRoutes from './modules/ai/ai.routes.js';
import notificationsRoutes from './modules/notifications/notifications.routes.js';
import usersRoutes from './modules/users/users.routes.js';
import subscriptionsRoutes from './modules/subscriptions/subscriptions.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';
import analyticsRoutes from './modules/analytics/analytics.routes.js';
import interviewsRoutes from './modules/interviews/interviews.routes.js';
import contactsRoutes from './modules/contacts/contacts.routes.js';
import contactsTopRoutes from './modules/contacts/contacts.top.routes.js';
import jobsRoutes from './modules/jobs/jobs.routes.js';
import { stripeWebhook } from './modules/subscriptions/subscriptions.controller.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));

const isDev = process.env.NODE_ENV !== 'production';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDev,
  message: { error: 'Too many requests, please try again later.' },
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDev,
  message: { error: 'Too many requests, please try again later.' },
});

// Stripe webhook must receive the raw body — register BEFORE express.json()
app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), stripeWebhook);

app.use(express.json());
app.use(cookieParser());
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));

// Required by Passport's Google strategy to persist the OAuth `state`
// CSRF token between the /google and /google/callback requests.
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === 'production', maxAge: 5 * 60 * 1000 },
  })
);
app.use(passport.initialize());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api', apiLimiter);
app.use('/api/applications', applicationsRoutes);
app.use('/api/resumes', resumesRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/subscriptions', subscriptionsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/applications/:applicationId/interviews', interviewsRoutes);
app.use('/api/applications/:applicationId/contacts', contactsRoutes);
app.use('/api/contacts', contactsTopRoutes);
app.use('/api/jobs', jobsRoutes);

app.use(errorHandler);

export default app;
