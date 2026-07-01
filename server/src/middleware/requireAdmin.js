/**
 * Must run after verifyToken. Rejects non-admin users with 403.
 */
export default function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  return next();
}
