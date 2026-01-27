import express, { type Response } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../lib/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get user profile
router.get('/profile', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        avatarUrl: true,
        createdAt: true,
        profile: true,
        subscription: {
          include: {
            plan: true,
          },
        },
        _count: {
          select: {
            links: true,
            categories: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update user profile
router.put(
  '/profile',
  [
    body('fullName').optional().trim(),
    body('avatarUrl').optional().isURL(),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userId = req.userId!;
      const { fullName, avatarUrl } = req.body;

      // Update user
      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          ...(fullName !== undefined && { fullName }),
          ...(avatarUrl !== undefined && { avatarUrl }),
        },
        select: {
          id: true,
          email: true,
          fullName: true,
          avatarUrl: true,
          createdAt: true,
        },
      });

      // Update or create profile
      await prisma.userProfile.upsert({
        where: { userId },
        update: {
          fullName: fullName || undefined,
          avatarUrl: avatarUrl || undefined,
        },
        create: {
          userId,
          fullName: fullName || undefined,
          avatarUrl: avatarUrl || undefined,
        },
      });

      res.json({ user });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  }
);

export default router;
