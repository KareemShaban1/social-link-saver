import express, { type Response } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../lib/prisma.js';
import { parseOptionalBoolean, parseRequiredBoolean } from '../lib/linkUtils.js';
import { authenticate, AuthRequest } from '../middleware/auth.middleware.js';
import { extractMetadataWithAI } from '../lib/aiMetadata.js';
import {
  linkInclude,
  mapLinkTags,
  normalizeTagList,
  parseRemindAt,
  syncLinkTags,
} from '../lib/linkTags.js';

const router = express.Router();

router.use(authenticate);

function escapeCsv(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

// Export must be before /:id
router.get('/export', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const format = String(req.query.format || 'json').toLowerCase();

    const links = await prisma.link.findMany({
      where: { userId },
      include: linkInclude,
      orderBy: { createdAt: 'desc' },
    });

    const rows = links.map((link) => {
      const mapped = mapLinkTags(link);
      return {
        title: mapped.title,
        url: mapped.url,
        description: mapped.description ?? '',
        platform: mapped.platform,
        category: mapped.category?.name ?? '',
        tags: mapped.tags.map((t) => t.name),
        isFavorite: mapped.isFavorite,
        remindAt: mapped.remindAt?.toISOString() ?? null,
        createdAt: mapped.createdAt.toISOString(),
      };
    });

    if (format === 'csv') {
      const header = [
        'title',
        'url',
        'description',
        'platform',
        'category',
        'tags',
        'isFavorite',
        'remindAt',
        'createdAt',
      ];
      const lines = [
        header.join(','),
        ...rows.map((row) =>
          [
            escapeCsv(row.title),
            escapeCsv(row.url),
            escapeCsv(row.description),
            escapeCsv(row.platform),
            escapeCsv(row.category),
            escapeCsv(row.tags.join('|')),
            row.isFavorite ? 'true' : 'false',
            escapeCsv(row.remindAt ?? ''),
            escapeCsv(row.createdAt),
          ].join(',')
        ),
      ];
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="links-export.csv"');
      return res.send(lines.join('\n'));
    }

    res.setHeader('Content-Disposition', 'attachment; filename="links-export.json"');
    res.json({
      exportedAt: new Date().toISOString(),
      count: rows.length,
      links: rows,
    });
  } catch (error) {
    console.error('Export links error:', error);
    res.status(500).json({ error: 'Failed to export links' });
  }
});

// Import must be before /:id
router.post('/import', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const payload = req.body?.links ?? req.body;
    if (!Array.isArray(payload)) {
      return res.status(400).json({ error: 'Expected an array of links (or { links: [] })' });
    }

    const existing = await prisma.link.findMany({
      where: { userId },
      select: { url: true },
    });
    const existingUrls = new Set(existing.map((l) => l.url));

    const categories = await prisma.category.findMany({
      where: { userId },
      select: { id: true, name: true },
    });
    const categoryByName = new Map(
      categories.map((c) => [c.name.trim().toLowerCase(), c.id])
    );

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (let i = 0; i < payload.length; i++) {
      const item = payload[i];
      if (!item || typeof item !== 'object') {
        skipped += 1;
        continue;
      }

      const url = typeof item.url === 'string' ? item.url.trim() : '';
      const title = typeof item.title === 'string' ? item.title.trim() : '';
      const platform =
        typeof item.platform === 'string' && item.platform.trim()
          ? item.platform.trim()
          : 'Other';

      if (!url || !title) {
        skipped += 1;
        errors.push(`Row ${i + 1}: missing title or url`);
        continue;
      }

      if (existingUrls.has(url)) {
        skipped += 1;
        continue;
      }

      let categoryId: string | null = null;
      const categoryName =
        typeof item.category === 'string'
          ? item.category.trim()
          : typeof item.categoryName === 'string'
            ? item.categoryName.trim()
            : '';
      if (categoryName) {
        const key = categoryName.toLowerCase();
        const found = categoryByName.get(key);
        if (found) {
          categoryId = found;
        } else {
          const created = await prisma.category.create({
            data: { name: categoryName, userId, color: '#3b82f6' },
          });
          categoryByName.set(key, created.id);
          categoryId = created.id;
        }
      }

      const remindAt = parseRemindAt(item.remindAt);
      const tags = normalizeTagList(item.tags);
      const isFavorite = Boolean(item.isFavorite ?? item.is_favorite);

      try {
        const link = await prisma.link.create({
          data: {
            url,
            title,
            description:
              typeof item.description === 'string' ? item.description : null,
            platform,
            categoryId,
            userId,
            isFavorite,
            ...(remindAt !== undefined && { remindAt }),
          },
        });
        if (tags.length > 0) {
          await syncLinkTags(link.id, userId, tags);
        }
        existingUrls.add(url);
        imported += 1;
      } catch (err) {
        skipped += 1;
        errors.push(`Row ${i + 1}: failed to import`);
        console.error('Import row error:', err);
      }
    }

    res.json({ imported, skipped, errors: errors.slice(0, 20) });
  } catch (error) {
    console.error('Import links error:', error);
    res.status(500).json({ error: 'Failed to import links' });
  }
});

// Get all links for user
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { categoryId, platform, search, favorite, tag, due } = req.query;

    const where: Record<string, unknown> = {
      userId,
    };

    if (categoryId) {
      where.categoryId = categoryId as string;
    }

    if (platform) {
      where.platform = platform as string;
    }

    if (favorite === 'true') {
      where.isFavorite = true;
    }

    if (tag) {
      where.tags = {
        some: {
          tag: {
            name: String(tag).trim().toLowerCase(),
            userId,
          },
        },
      };
    }

    if (due === 'true') {
      where.remindAt = { lte: new Date(), not: null };
    } else if (due === 'upcoming') {
      where.remindAt = { gt: new Date() };
    } else if (due === 'any') {
      where.remindAt = { not: null };
    }

    if (search) {
      const q = search as string;
      where.OR = [
        { title: { contains: q } },
        { description: { contains: q } },
        { url: { contains: q } },
        {
          tags: {
            some: {
              tag: {
                name: { contains: q },
                userId,
              },
            },
          },
        },
      ];
    }

    const links = await prisma.link.findMany({
      where,
      include: linkInclude,
      orderBy: [{ isFavorite: 'desc' }, { createdAt: 'desc' }],
    });

    res.json({ links: links.map(mapLinkTags) });
  } catch (error) {
    console.error('Get links error:', error);
    res.status(500).json({ error: 'Failed to fetch links' });
  }
});

// Toggle favorite (must be before generic /:id routes)
router.patch('/:id/favorite', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const isFavorite = parseRequiredBoolean(req.body?.isFavorite);

    if (isFavorite === undefined) {
      return res.status(400).json({ error: 'isFavorite must be true or false' });
    }

    const existingLink = await prisma.link.findFirst({
      where: { id, userId },
    });

    if (!existingLink) {
      return res.status(404).json({ error: 'Link not found' });
    }

    const link = await prisma.link.update({
      where: { id },
      data: { isFavorite },
      include: linkInclude,
    });

    res.json({ link: mapLinkTags(link) });
  } catch (error) {
    console.error('Toggle favorite error:', error);
    res.status(500).json({ error: 'Failed to update favorite' });
  }
});

// Get single link
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const link = await prisma.link.findFirst({
      where: {
        id,
        userId,
      },
      include: linkInclude,
    });

    if (!link) {
      return res.status(404).json({ error: 'Link not found' });
    }

    res.json({ link: mapLinkTags(link) });
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
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userId = req.userId!;
      const { url, title, description, platform, categoryId } = req.body;
      const isFavorite = parseOptionalBoolean(req.body?.isFavorite);
      const tags = normalizeTagList(req.body?.tags);
      const remindAt = parseRemindAt(req.body?.remindAt);

      if (req.body?.remindAt !== undefined && remindAt === undefined) {
        return res.status(400).json({ error: 'remindAt must be a valid date or null' });
      }

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
          ...(isFavorite !== undefined && { isFavorite }),
          ...(remindAt !== undefined && { remindAt }),
        },
      });

      if (tags.length > 0) {
        await syncLinkTags(link.id, userId, tags);
      }

      const full = await prisma.link.findFirst({
        where: { id: link.id },
        include: linkInclude,
      });

      res.status(201).json({ link: mapLinkTags(full!) });
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
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userId = req.userId!;
      const { id } = req.params;
      const { url, title, description, platform, categoryId } = req.body;
      const isFavorite = parseOptionalBoolean(req.body?.isFavorite);
      const hasTags = Object.prototype.hasOwnProperty.call(req.body, 'tags');
      const tags = hasTags ? normalizeTagList(req.body.tags) : undefined;
      const remindAt = parseRemindAt(req.body?.remindAt);

      if (req.body?.remindAt !== undefined && remindAt === undefined) {
        return res.status(400).json({ error: 'remindAt must be a valid date or null' });
      }

      const existingLink = await prisma.link.findFirst({
        where: {
          id,
          userId,
        },
      });

      if (!existingLink) {
        return res.status(404).json({ error: 'Link not found' });
      }

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

      await prisma.link.update({
        where: { id },
        data: {
          ...(url && { url }),
          ...(title && { title }),
          ...(description !== undefined && { description }),
          ...(platform && { platform }),
          ...(categoryId !== undefined && { categoryId: categoryId || null }),
          ...(isFavorite !== undefined && { isFavorite }),
          ...(remindAt !== undefined && { remindAt }),
        },
      });

      if (tags !== undefined) {
        await syncLinkTags(id, userId, tags);
      }

      const link = await prisma.link.findFirst({
        where: { id },
        include: linkInclude,
      });

      res.json({ link: mapLinkTags(link!) });
    } catch (error) {
      console.error('Update link error:', error);
      res.status(500).json({ error: 'Failed to update link' });
    }
  }
);

// Delete link
router.delete('/:id', async (req: AuthRequest, res: Response) => {
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

// Metadata generation for a link (title, description, platform from URL/content)
router.post('/ai-metadata', async (req: AuthRequest, res: Response) => {
  try {
    const { url, originalDescription } = req.body || {};

    if (!url && !originalDescription) {
      return res.status(400).json({
        error: 'Either url or originalDescription is required for metadata generation',
      });
    }

    if (!url) {
      return res.status(400).json({
        error: 'URL is required for metadata extraction',
      });
    }

    const result = await extractMetadataWithAI(url, originalDescription);

    res.json({
      metadata: {
        title: result.title,
        description: result.description,
      },
      platform: result.platform,
    });
  } catch (error) {
    console.error('Metadata extraction error:', error);
    res.status(500).json({ error: 'Failed to extract metadata for link' });
  }
});

export default router;
