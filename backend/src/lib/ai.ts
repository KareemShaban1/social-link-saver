import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY;

// Lazily create client only if key is present
const client = apiKey ? new OpenAI({ apiKey }) : null;

export interface AiMetadataInput {
	url?: string;
	platform?: string;
	originalTitle?: string;
	originalDescription?: string;
}

export interface AiMetadataResult {
	title: string;
	description: string;
}

export async function generateLinkMetadataWithAi(
	input: AiMetadataInput
): Promise<AiMetadataResult | null> {
	if (!client) {
		console.warn('[AI] OPENAI_API_KEY not set – skipping AI metadata generation');
		return null;
	}

	const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

	const { url, platform, originalTitle, originalDescription } = input;

	const contentPieces: string[] = [];
	if (url) contentPieces.push(`URL: ${url}`);
	if (platform) contentPieces.push(`Platform: ${platform}`);
	if (originalTitle) contentPieces.push(`Original title: ${originalTitle}`);
	if (originalDescription) {
		contentPieces.push(`Post/page text:\n${originalDescription}`);
	}

	const joinedContent = contentPieces.join('\n');

	try {
		const response = await client.chat.completions.create({
			model,
			messages: [
				{
					role: 'system',
					content:
						'You are an assistant that creates concise, human-friendly titles and summaries for saved social links. Respond only in JSON.',
				},
				{
					role: 'user',
					content:
						`Based on the following link context and post/page text, generate:\n` +
						`1) A short, clear, engaging title (max 80 characters)\n` +
						`2) A concise description/summary (2–3 sentences, max ~260 characters)\n\n` +
						`${joinedContent}`,
				},
			],
			response_format: {
				type: 'json_schema',
				json_schema: {
					name: 'link_metadata',
					schema: {
						type: 'object',
						required: ['title', 'description'],
						properties: {
							title: {
								type: 'string',
								description: 'Short, human-readable title for the link (max 80 characters).',
								maxLength: 120,
							},
							description: {
								type: 'string',
								description:
									'Concise summary of the link/post (ideally 2–3 sentences, max ~260 characters).',
								maxLength: 400,
							},
						},
						additionalProperties: false,
					},
					strict: true,
				},
			},
			temperature: 0.4,
		});

		const raw = response.choices[0]?.message?.content;
		if (!raw) {
			console.warn('[AI] Empty response content from OpenAI');
			return null;
		}

		let parsed: any;
		try {
			parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
		} catch (err) {
			console.error('[AI] Failed to parse OpenAI JSON response', err);
			return null;
		}

		const title: string =
			typeof parsed.title === 'string' && parsed.title.trim()
				? parsed.title.trim()
				: originalTitle || 'Saved link';

		const description: string =
			typeof parsed.description === 'string' && parsed.description.trim()
				? parsed.description.trim()
				: originalDescription || '';

		return { title, description };
	} catch (error) {
		console.error('[AI] Error generating link metadata', error);
		return null;
	}
}

