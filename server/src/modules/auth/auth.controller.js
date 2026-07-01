import {
  registerUser,
  loginUser,
  refreshAccessToken,
  getCurrentUser,
  requestPasswordReset,
  resetPassword,
  issueTokens,
  toPublicUser,
} from './auth.service.js';

const REFRESH_COOKIE_NAME = 'refreshToken';

const refreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  // 'none' in production so cookie is sent cross-site (Vercel → Render).
  // 'lax' locally where the Vite proxy makes requests same-origin.
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/api/auth',
};

function setRefreshCookie(res, token) {
  res.cookie(REFRESH_COOKIE_NAME, token, refreshCookieOptions);
}

function clearRefreshCookie(res) {
  res.clearCookie(REFRESH_COOKIE_NAME, { ...refreshCookieOptions, maxAge: undefined });
}

export async function register(req, res, next) {
  try {
    const { user, accessToken, refreshToken } = await registerUser(req.body);
    setRefreshCookie(res, refreshToken);
    res.status(201).json({ user, accessToken });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { user, accessToken, refreshToken } = await loginUser(req.body);
    setRefreshCookie(res, refreshToken);
    res.json({ user, accessToken });
  } catch (err) {
    next(err);
  }
}

export async function logout(req, res, next) {
  try {
    clearRefreshCookie(res);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

export async function refresh(req, res, next) {
  try {
    const token = req.cookies?.[REFRESH_COOKIE_NAME];
    const { user, accessToken, refreshToken } = await refreshAccessToken(token);
    setRefreshCookie(res, refreshToken);
    res.json({ user, accessToken });
  } catch (err) {
    next(err);
  }
}

export async function me(req, res, next) {
  try {
    const user = await getCurrentUser(req.user.userId);
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

/**
 * Called after Passport's Google strategy attaches req.user (the Prisma user record).
 * Issues tokens and redirects to the frontend with the access token, mirroring
 * the email/password flow (refresh token goes in an httpOnly cookie).
 */
export async function googleCallback(req, res, next) {
  try {
    const user = req.user;
    const { accessToken, refreshToken } = issueTokens(user);
    setRefreshCookie(res, refreshToken);

    const redirectUrl = new URL('/oauth/callback', process.env.CLIENT_URL);
    redirectUrl.searchParams.set('accessToken', accessToken);
    res.redirect(redirectUrl.toString());
  } catch (err) {
    next(err);
  }
}

export async function forgotPassword(req, res, next) {
  try {
    await requestPasswordReset(req.body.email);
    // Always respond 200 — never reveal whether email exists
    res.json({ message: 'If that email is registered, a reset link has been sent.' });
  } catch (err) {
    next(err);
  }
}

export async function resetPasswordHandler(req, res, next) {
  try {
    await resetPassword(req.body.token, req.body.password);
    res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    next(err);
  }
}

export { toPublicUser };
