import express, { type Response } from 'express';
import prisma from '../lib/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.middleware.js';
import { normalizeTagName } from '../lib/linkTags.js';

const router = express.Router();

router.use(authenticate);

// List tags for the current user (with usage counts)
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    const tags = await prisma.tag.findMany({
      where: { userId },
      include: {
        _count: { select: { links: true } },
      },
      orderBy: { name: 'asc' },
    });

    res.json({
      tags: tags.map((tag) => ({
        id: tag.id,
        name: tag.name,
        count: tag._count.links,
        createdAt: tag.createdAt,
      })),
    });
  } catch (error) {
    console.error('Get tags error:', error);
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

// Rename a tag
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const name = normalizeTagName(req.body?.name);

    if (!name) {
      return res.status(400).json({ error: 'Valid tag name is required' });
    }

    const existing = await prisma.tag.findFirst({ where: { id, userId } });
    if (!existing) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    const clash = await prisma.tag.findFirst({
      where: { userId, name, NOT: { id } },
    });
    if (clash) {
      return res.status(409).json({ error: 'A tag with that name already exists' });
    }

    const tag = await prisma.tag.update({
      where: { id },
      data: { name },
    });

    res.json({ tag });
  } catch (error) {
    console.error('Update tag error:', error);
    res.status(500).json({ error: 'Failed to update tag' });
  }
});

// Delete a tag (unlinks from all links)
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const existing = await prisma.tag.findFirst({ where: { id, userId } });
    if (!existing) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    await prisma.tag.delete({ where: { id } });
    res.json({ message: 'Tag deleted successfully' });
  } catch (error) {
    console.error('Delete tag error:', error);
    res.status(500).json({ error: 'Failed to delete tag' });
  }
});

export default router;
