import express, { type Response } from "express";
import prisma from "../lib/prisma.js";

const router = express.Router();

router.get("/stats", async (_req, res: Response) => {
  try {
    const now = Date.now();
    const last24Hours = new Date(now - 24 * 60 * 60 * 1000);

    const [totalUsers, totalLinks, totalCategories, linksLast24Hours, platformGroups] =
      await Promise.all([
        prisma.user.count(),
        prisma.link.count(),
        prisma.category.count(),
        prisma.link.count({
          where: {
            createdAt: {
              gte: last24Hours,
            },
          },
        }),
        prisma.link.groupBy({
          by: ["platform"],
        }),
      ]);

    res.json({
      stats: {
        totalUsers,
        totalLinks,
        totalCategories,
        totalPlatforms: platformGroups.length,
        linksLast24Hours,
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Public stats error:", error);
    res.status(500).json({ error: "Failed to fetch public stats" });
  }
});

export default router;
