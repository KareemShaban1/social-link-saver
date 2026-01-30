import express, { type Response } from 'express';
import { body, validationResult } from 'express-validator';
import { extractMetadataWithAI } from '../lib/aiMetadata.js';

const router = express.Router();

/**
 * POST /api/metadata/extract
 * Extracts metadata from a URL using AI
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

			// Check if OpenAI is configured
			if (!process.env.OPENAI_API_KEY) {
				return res.status(503).json({
					error: 'AI metadata extraction is not configured. Please set OPENAI_API_KEY environment variable.',
					fallback: true,
				});
			}

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
