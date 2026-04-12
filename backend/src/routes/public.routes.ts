import express, { type Request, type Response } from "express";
import prisma from "../lib/prisma.js";
import {
	isAllowedFacebookHost,
	facebookSharePathNeedsResolve,
	resolveFacebookShareToCanonical,
} from "../lib/resolveFacebookUrl.js";

const router = express.Router();

/**
 * Resolve Facebook app share links (e.g. /share/r/...) to the canonical web reel/video URL.
 * Query: ?url=encoded  — host must be Facebook; only share short paths trigger upstream fetch.
 */
router.get("/resolve-facebook-url", async (req: Request, res: Response) => {
	const raw = req.query.url;
	if (typeof raw !== "string" || raw.length === 0 || raw.length > 4096) {
		return res.status(400).json({ error: "Missing or invalid url query parameter" });
	}

	let parsed: URL;
	try {
		parsed = new URL(raw.trim());
	} catch {
		return res.status(400).json({ error: "Invalid URL" });
	}

	if (!isAllowedFacebookHost(parsed.hostname)) {
		return res.status(400).json({ error: "Only Facebook family URLs are allowed" });
	}

	if (!facebookSharePathNeedsResolve(parsed.pathname)) {
		return res.json({ url: parsed.toString() });
	}

	try {
		const resolved = await resolveFacebookShareToCanonical(parsed.toString());
		return res.json({ url: resolved });
	} catch (e) {
		console.error("resolve-facebook-url:", e);
		return res.json({ url: parsed.toString() });
	}
});

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
