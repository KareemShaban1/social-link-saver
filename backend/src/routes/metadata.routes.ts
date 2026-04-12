import express, { type Request, type Response } from "express";
import { body, validationResult } from "express-validator";
import { extractMetadataWithAI } from "../lib/aiMetadata.js";
import {
	isAllowedFacebookHost,
	facebookSharePathNeedsResolve,
	resolveFacebookShareToCanonical,
} from "../lib/resolveFacebookUrl.js";

const router = express.Router();

/**
 * GET /api/metadata/resolve-facebook-url?url=...
 * Resolves Facebook app share links (/share/r/...) to canonical reel URLs.
 * Lives under /metadata (not /public) because many reverse proxies map `/api/public/*` to static files → 404 on Node.
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

/**
 * POST /api/metadata/extract
 * Extracts metadata from a URL (title, description, platform). No API key required.
 * Body: { url: string, content?: string }
 */
router.post(
	'/extract',
	[
		body('url').isURL().withMessage('Valid URL is required'),
		body('content').optional().isString(),
	],
	async (req: express.Request, res: Response) => {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				return res.status(400).json({ errors: errors.array() });
			}

			const { url, content } = req.body;

			const metadata = await extractMetadataWithAI(url, content);

			res.json({
				title: metadata.title,
				description: metadata.description,
				platform: metadata.platform,
			});
		} catch (error: any) {
			console.error('Metadata extraction error:', error);

			// Return error but don't fail completely
			res.status(500).json({
				error: error.message || 'Failed to extract metadata',
				fallback: true,
			});
		}
	}
);

export default router;
