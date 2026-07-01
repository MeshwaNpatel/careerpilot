import { Router } from 'express';
import bcrypt from 'bcrypt';
import verifyToken from '../../middleware/verifyToken.js';
import validateRequest from '../../middleware/validateRequest.js';
import uploadAvatar from '../../middleware/uploadAvatar.js';
import { updateSettingsSchema } from './users.validation.js';
import prisma from '../../config/db.js';
import { uploadBufferToS3, getPresignedDownloadUrl } from '../../utils/uploadToS3.js';

const router = Router();

router.use(verifyToken);

router.get('/profile', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true, name: true, email: true, avatarUrl: true,
        role: true, createdAt: true,
        subscription: { select: { plan: true } },
        _count: { select: { applications: true, resumes: true } },
      },
    });

    let avatarUrl = user.avatarUrl;
    if (avatarUrl && avatarUrl.startsWith('avatars/')) {
      avatarUrl = await getPresignedDownloadUrl(avatarUrl);
    }

    res.json({
      profile: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl,
        role: user.role,
        plan: user.subscription?.plan ?? 'free',
        createdAt: user.createdAt,
        totalApplications: user._count.applications,
        totalResumes: user._count.resumes,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.patch('/profile', async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });
    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data: { name: name.trim() },
      select: { id: true, name: true, email: true, avatarUrl: true },
    });
    res.json({ profile: user });
  } catch (err) {
    next(err);
  }
});

router.patch('/profile/password', async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Both fields are required' });
    if (newPassword.length < 8) return res.status(400).json({ error: 'New password must be at least 8 characters' });

    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user.passwordHash) return res.status(400).json({ error: 'Password change is not available for accounts using Google sign-in' });

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) return res.status(400).json({ error: 'Current password is incorrect' });

    const hash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: req.user.userId }, data: { passwordHash: hash } });
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    next(err);
  }
});

router.post('/profile/avatar', uploadAvatar, async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image provided' });
    const ext = req.file.mimetype === 'image/png' ? 'png' : req.file.mimetype === 'image/webp' ? 'webp' : 'jpg';
    const key = `avatars/${req.user.userId}/${Date.now()}.${ext}`;
    await uploadBufferToS3({ key, buffer: req.file.buffer, contentType: req.file.mimetype });
    await prisma.user.update({ where: { id: req.user.userId }, data: { avatarUrl: key } });
    const avatarUrl = await getPresignedDownloadUrl(key);
    res.json({ avatarUrl });
  } catch (err) {
    next(err);
  }
});

router.get('/settings', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, name: true, email: true, emailNotifications: true, followUpReminders: true },
    });
    res.json({ settings: user });
  } catch (err) {
    next(err);
  }
});

router.patch('/settings', validateRequest(updateSettingsSchema), async (req, res, next) => {
  try {
    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data: req.body,
      select: { id: true, name: true, email: true, emailNotifications: true, followUpReminders: true },
    });
    res.json({ settings: user });
  } catch (err) {
    next(err);
  }
});

export default router;
