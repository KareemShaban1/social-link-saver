import express from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../lib/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all categories for user
router.get('/', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;

    const categories = await prisma.category.findMany({
      where: { userId },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        children: {
          select: {
            id: true,
            name: true,
            color: true,
            parentId: true,
          },
        },
        _count: {
          select: {
            links: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({ categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Get single category
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const category = await prisma.category.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        parent: true,
        children: true,
        _count: {
          select: {
            links: true,
          },
        },
      },
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({ category });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ error: 'Failed to fetch category' });
  }
});

// Create category
router.post(
  '/',
  [
    body('name').notEmpty().trim(),
    body('color').optional().isHexColor(),
    body('parentId').optional().isUUID(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userId = req.userId!;
      const { name, color, parentId } = req.body;

      // Verify parent category belongs to user if provided
      if (parentId) {
        const parent = await prisma.category.findFirst({
          where: {
            id: parentId,
            userId,
          },
        });

        if (!parent) {
          return res.status(404).json({ error: 'Parent category not found' });
        }
      }

      const category = await prisma.category.create({
        data: {
          name,
          color: color || '#3b82f6',
          parentId: parentId || null,
          userId,
        },
        include: {
          parent: {
            select: {
              id: true,
              name: true,
              color: true,
            },
          },
        },
      });

      res.status(201).json({ category });
    } catch (error) {
      console.error('Create category error:', error);
      res.status(500).json({ error: 'Failed to create category' });
    }
  }
);

// Update category
router.put(
  '/:id',
  [
    body('name').optional().notEmpty().trim(),
    body('color').optional().isHexColor(),
    body('parentId').optional().isUUID(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userId = req.userId!;
      const { id } = req.params;
      const { name, color, parentId } = req.body;

      // Check if category exists and belongs to user
      const existingCategory = await prisma.category.findFirst({
        where: {
          id,
          userId,
        },
      });

      if (!existingCategory) {
        return res.status(404).json({ error: 'Category not found' });
      }

      // Prevent circular reference
      if (parentId === id) {
        return res.status(400).json({ error: 'Category cannot be its own parent' });
      }

      // Verify parent category belongs to user if provided
      if (parentId) {
        const parent = await prisma.category.findFirst({
          where: {
            id: parentId,
            userId,
          },
        });

        if (!parent) {
          return res.status(404).json({ error: 'Parent category not found' });
        }

        // Check for circular reference in hierarchy
        const checkCircular = async (categoryId: string, targetId: string): Promise<boolean> => {
          const category = await prisma.category.findUnique({
            where: { id: categoryId },
            select: { parentId: true },
          });

          if (!category || !category.parentId) {
            return false;
          }

          if (category.parentId === targetId) {
            return true;
          }

          return checkCircular(category.parentId, targetId);
        };

        const isCircular = await checkCircular(parentId, id);
        if (isCircular) {
          return res.status(400).json({ error: 'Circular reference detected' });
        }
      }

      const category = await prisma.category.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(color && { color }),
          ...(parentId !== undefined && { parentId: parentId || null }),
        },
        include: {
          parent: {
            select: {
              id: true,
              name: true,
              color: true,
            },
          },
          children: {
            select: {
              id: true,
              name: true,
              color: true,
            },
          },
        },
      });

      res.json({ category });
    } catch (error) {
      console.error('Update category error:', error);
      res.status(500).json({ error: 'Failed to update category' });
    }
  }
);

// Delete category
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const category = await prisma.category.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        _count: {
          select: {
            links: true,
            children: true,
          },
        },
      },
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Check if category has children
    if (category._count.children > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete category with subcategories. Please delete or move subcategories first.' 
      });
    }

    await prisma.category.delete({
      where: { id },
    });

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

export default router;
