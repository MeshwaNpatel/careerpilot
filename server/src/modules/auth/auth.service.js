import bcrypt from 'bcrypt';
import crypto from 'crypto';
import prisma from '../../config/db.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../utils/generateToken.js';
import { sendEmail } from '../../utils/sendEmail.js';

const BCRYPT_COST = 12;

export const AuthError = class AuthError extends Error {
  constructor(message, status = 401) {
    super(message);
    this.status = status;
  }
};

function toPublicUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    role: user.role,
    plan: user.subscription?.plan || 'free',
    createdAt: user.createdAt,
  };
}

/**
 * Issues an access + refresh token pair for a user, embedding the JWT
 * payload shape described in project_brief.md section 9.3.
 */
function issueTokens(user) {
  const tokenPayload = { id: user.id, role: user.role, email: user.email, plan: user.subscription?.plan || 'free' };
  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);
  return { accessToken, refreshToken };
}

export async function registerUser({ name, email, password }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AuthError('An account with this email already exists', 409);
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      subscription: { create: { plan: 'free', status: 'active' } },
    },
    include: { subscription: true },
  });

  const tokens = issueTokens(user);
  return { user: toPublicUser(user), ...tokens };
}

export async function loginUser({ email, password }) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { subscription: true },
  });

  if (!user || !user.passwordHash) {
    throw new AuthError('Invalid email or password');
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    throw new AuthError('Invalid email or password');
  }

  if (!user.isActive) {
    throw new AuthError('This account has been disabled', 403);
  }

  await prisma.user.update({ where: { id: user.id }, data: { lastActiveAt: new Date() } });

  const tokens = issueTokens(user);
  return { user: toPublicUser(user), ...tokens };
}

export async function refreshAccessToken(refreshToken) {
  if (!refreshToken) {
    throw new AuthError('Missing refresh token');
  }

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new AuthError('Invalid or expired refresh token');
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: { subscription: true },
  });

  if (!user || !user.isActive) {
    throw new AuthError('User not found or disabled');
  }

  const tokens = issueTokens(user);
  return { user: toPublicUser(user), ...tokens };
}

export async function getCurrentUser(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { subscription: true },
  });

  if (!user) {
    throw new AuthError('User not found', 404);
  }

  return toPublicUser(user);
}

/**
 * Find-or-create flow for Google OAuth users (Passport strategy verify callback).
 */
export async function findOrCreateGoogleUser({ googleId, email, name, avatarUrl }) {
  let user = await prisma.user.findFirst({
    where: { OR: [{ oauthProvider: 'google', oauthId: googleId }, { email }] },
    include: { subscription: true },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        name,
        email,
        avatarUrl,
        oauthProvider: 'google',
        oauthId: googleId,
        subscription: { create: { plan: 'free', status: 'active' } },
      },
      include: { subscription: true },
    });
  } else if (!user.oauthProvider) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { oauthProvider: 'google', oauthId: googleId, avatarUrl: user.avatarUrl || avatarUrl },
      include: { subscription: true },
    });
  }

  await prisma.user.update({ where: { id: user.id }, data: { lastActiveAt: new Date() } });

  return user;
}

export async function requestPasswordReset(email) {
  const user = await prisma.user.findUnique({ where: { email } });
  // Return silently for unknown emails or OAuth-only accounts — prevents enumeration
  if (!user || user.oauthProvider) return;

  const token = crypto.randomBytes(32).toString('hex');
  const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordResetToken: token, passwordResetExpiry: expiry },
  });

  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
  await sendEmail({
    to: user.email,
    subject: 'Reset your CareerPilot password',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2 style="color:#4f46e5">Reset your password</h2>
        <p>Hi ${user.name},</p>
        <p>We received a request to reset your CareerPilot password. Click the button below to choose a new one. This link expires in <strong>1 hour</strong>.</p>
        <a href="${resetUrl}" style="display:inline-block;margin:16px 0;background:#4f46e5;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
          Reset password
        </a>
        <p style="color:#64748b;font-size:13px">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });
}

export async function resetPassword(token, newPassword) {
  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: token,
      passwordResetExpiry: { gt: new Date() },
    },
  });

  if (!user) {
    const err = new Error('This reset link is invalid or has expired.');
    err.status = 400;
    throw err;
  }

  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_COST);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, passwordResetToken: null, passwordResetExpiry: null },
  });
}

export { issueTokens, toPublicUser };
