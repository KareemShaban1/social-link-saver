import express from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../lib/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all links for user
router.get('/', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { categoryId, platform, search } = req.query;

    const where: any = {
      userId,
    };

    if (categoryId) {
      where.categoryId = categoryId as string;
    }

    if (platform) {
      where.platform = platform as string;
    }

    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
        { url: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const links = await prisma.link.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            color: true,
            parentId: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({ links });
  } catch (error) {
    console.error('Get links error:', error);
    res.status(500).json({ error: 'Failed to fetch links' });
  }
});

// Get single link
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const link = await prisma.link.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    });

    if (!link) {
      return res.status(404).json({ error: 'Link not found' });
    }

    res.json({ link });
  } catch (error) {
    console.error('Get link error:', error);
    res.status(500).json({ error: 'Failed to fetch link' });
  }
});

// Create link
router.post(
  '/',
  [
    body('url').isURL(),
    body('title').notEmpty().trim(),
    body('description').optional().trim(),
    body('platform').notEmpty().trim(),
    body('categoryId').optional().isUUID(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userId = req.userId!;
      const { url, title, description, platform, categoryId } = req.body;

      // Verify category belongs to user if provided
      if (categoryId) {
        const category = await prisma.category.findFirst({
          where: {
            id: categoryId,
            userId,
          },
        });

        if (!category) {
          return res.status(404).json({ error: 'Category not found' });
        }
      }

      const link = await prisma.link.create({
        data: {
          url,
          title,
          description,
          platform,
          categoryId: categoryId || null,
          userId,
        },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              color: true,
            },
          },
        },
      });

      res.status(201).json({ link });
    } catch (error) {
      console.error('Create link error:', error);
      res.status(500).json({ error: 'Failed to create link' });
    }
  }
);

// Update link
router.put(
  '/:id',
  [
    body('url').optional().isURL(),
    body('title').optional().notEmpty().trim(),
    body('description').optional().trim(),
    body('platform').optional().notEmpty().trim(),
    body('categoryId').optional().isUUID(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userId = req.userId!;
      const { id } = req.params;
      const { url, title, description, platform, categoryId } = req.body;

      // Check if link exists and belongs to user
      const existingLink = await prisma.link.findFirst({
        where: {
          id,
          userId,
        },
      });

      if (!existingLink) {
        return res.status(404).json({ error: 'Link not found' });
      }

      // Verify category belongs to user if provided
      if (categoryId) {
        const category = await prisma.category.findFirst({
          where: {
            id: categoryId,
            userId,
          },
        });

        if (!category) {
          return res.status(404).json({ error: 'Category not found' });
        }
      }

      const link = await prisma.link.update({
        where: { id },
        data: {
          ...(url && { url }),
          ...(title && { title }),
          ...(description !== undefined && { description }),
          ...(platform && { platform }),
          ...(categoryId !== undefined && { categoryId: categoryId || null }),
        },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              color: true,
            },
          },
        },
      });

      res.json({ link });
    } catch (error) {
      console.error('Update link error:', error);
      res.status(500).json({ error: 'Failed to update link' });
    }
  }
);

// Delete link
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const link = await prisma.link.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!link) {
      return res.status(404).json({ error: 'Link not found' });
    }

    await prisma.link.delete({
      where: { id },
    });

    res.json({ message: 'Link deleted successfully' });
  } catch (error) {
    console.error('Delete link error:', error);
    res.status(500).json({ error: 'Failed to delete link' });
  }
});

export default router;
