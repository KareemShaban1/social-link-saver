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
 * GET …?url=… — also mounted at `/api/fb-share-resolve` and `/metadata/...` in server.ts for proxy quirks.
 */
export async function handleFacebookResolveUrl(req: Request, res: Response): Promise<void> {
	const raw = req.query.url;
	if (typeof raw !== "string" || raw.length === 0 || raw.length > 4096) {
		res.status(400).json({ error: "Missing or invalid url query parameter" });
		return;
	}

	let parsed: URL;
	try {
		parsed = new URL(raw.trim());
	} catch {
		res.status(400).json({ error: "Invalid URL" });
		return;
	}

	if (!isAllowedFacebookHost(parsed.hostname)) {
		res.status(400).json({ error: "Only Facebook family URLs are allowed" });
		return;
	}

	if (!facebookSharePathNeedsResolve(parsed.pathname)) {
		res.json({ url: parsed.toString() });
		return;
	}

	try {
		const resolved = await resolveFacebookShareToCanonical(parsed.toString());
		res.json({ url: resolved });
	} catch (e) {
		console.error("resolve-facebook-url:", e);
		res.json({ url: parsed.toString() });
	}
}

router.get("/resolve-facebook-url", handleFacebookResolveUrl);

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
