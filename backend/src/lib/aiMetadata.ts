import OpenAI from 'openai';

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

interface MetadataResult {
	title: string;
	description: string;
	platform: string;
}

/**
 * Detects platform from URL domain
 */
export function detectPlatformFromUrl(url: string): string {
	try {
		const urlObj = new URL(url);
		const hostname = urlObj.hostname.toLowerCase();
		const domain = hostname.replace(/^www\./, '');

		if (domain.includes('facebook.com') || domain.includes('fb.com')) {
			return 'Facebook';
		}
		if (domain.includes('instagram.com')) {
			return 'Instagram';
		}
		if (domain.includes('twitter.com') || domain.includes('x.com')) {
			return 'Twitter';
		}
		if (domain.includes('linkedin.com')) {
			return 'LinkedIn';
		}
		if (domain.includes('youtube.com') || domain.includes('youtu.be')) {
			return 'YouTube';
		}
		if (domain.includes('tiktok.com')) {
			return 'TikTok';
		}
		if (domain.includes('pinterest.com')) {
			return 'Pinterest';
		}
		if (domain.includes('reddit.com')) {
			return 'Reddit';
		}

		return 'Other';
	} catch {
		return 'Other';
	}
}

/**
 * Fetches HTML content from a URL using server-side fetch
 */
async function fetchPageContent(url: string): Promise<string> {
	try {
		const response = await fetch(url, {
			headers: {
				'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
				'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
				'Accept-Language': 'en-US,en;q=0.9',
			},
			// Add timeout
			signal: AbortSignal.timeout(10000), // 10 seconds
		});

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}

		return await response.text();
	} catch (error) {
		console.error('Error fetching page content:', error);
		throw new Error(`Failed to fetch page: ${error instanceof Error ? error.message : 'Unknown error'}`);
	}
}

/**
 * Extracts text content from HTML
 */
function extractTextFromHTML(html: string): string {
	// Remove script and style tags
	html = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
	html = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

	// Try to find main content areas
	const mainContentSelectors = [
		'article',
		'main',
		'[role="main"]',
		'.content',
		'#content',
		'.post-content',
		'.entry-content',
	];

	let text = '';
	for (const selector of mainContentSelectors) {
		try {
			// Simple regex-based extraction (we can't use DOMParser in Node.js easily)
			const regex = new RegExp(`<${selector}[^>]*>([\\s\\S]*?)<\\/${selector}>`, 'i');
			const match = html.match(regex);
			if (match && match[1]) {
				text = match[1];
				break;
			}
		} catch (e) {
			// Continue to next selector
		}
	}

	// If no main content found, use entire body
	if (!text) {
		const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
		if (bodyMatch) {
			text = bodyMatch[1];
		} else {
			text = html;
		}
	}

	// Remove HTML tags and decode entities
	text = text
		.replace(/<[^>]+>/g, ' ') // Remove HTML tags
		.replace(/&nbsp;/g, ' ')
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/\s+/g, ' ') // Normalize whitespace
		.trim();

	return text;
}

/**
 * Uses OpenAI to generate intelligent title and description from content
 */
async function generateMetadataWithAI(
	content: string,
	platform: string,
	url: string
): Promise<{ title: string; description: string }> {
	if (!process.env.OPENAI_API_KEY) {
		throw new Error('OPENAI_API_KEY is not configured');
	}

	// Truncate content if too long (to save tokens)
	const maxContentLength = 3000;
	const truncatedContent = content.length > maxContentLength
		? content.substring(0, maxContentLength) + '...'
		: content;

	const prompt = `You are a content curator helping to save social media links. Analyze the following ${platform} post/page content and generate:

1. A concise, engaging title (max 100 characters) that captures the main point or topic
2. A clear, informative description (max 500 characters) that summarizes the key information

Content:
${truncatedContent}

URL: ${url}
Platform: ${platform}

Respond in JSON format:
{
  "title": "Your generated title here",
  "description": "Your generated description here"
}`;

	try {
		const completion = await openai.chat.completions.create({
			model: process.env.OPENAI_MODEL || 'gpt-4o-mini', // Use cheaper model by default
			messages: [
				{
					role: 'system',
					content: 'You are a helpful assistant that generates concise titles and descriptions for saved links. Always respond with valid JSON only.',
				},
				{
					role: 'user',
					content: prompt,
				},
			],
			temperature: 0.7,
			max_tokens: 300,
			response_format: { type: 'json_object' },
		});

		const responseText = completion.choices[0]?.message?.content;
		if (!responseText) {
			throw new Error('No response from OpenAI');
		}

		const parsed = JSON.parse(responseText);

		return {
			title: parsed.title || extractTitleFromContent(content),
			description: parsed.description || content.substring(0, 500),
		};
	} catch (error) {
		console.error('OpenAI API error:', error);
		// Fallback to simple extraction
		return {
			title: extractTitleFromContent(content),
			description: content.substring(0, 500),
		};
	}
}

/**
 * Extracts a simple title from content (fallback)
 */
function extractTitleFromContent(content: string): string {
	if (!content) return '';

	// Take first sentence or first 100 chars
	const firstSentence = content.split(/[.!?]\s/)[0];
	const title = firstSentence.length > 100
		? firstSentence.substring(0, 97) + '...'
		: firstSentence;

	return title.trim() || content.substring(0, 100).trim();
}

/**
 * Main function to extract metadata with AI enhancement
 */
export async function extractMetadataWithAI(
	url: string,
	providedContent?: string
): Promise<MetadataResult> {
	const platform = detectPlatformFromUrl(url);

	let content = providedContent || '';

	// If no content provided, fetch from URL
	if (!content) {
		try {
			const html = await fetchPageContent(url);
			content = extractTextFromHTML(html);
		} catch (error) {
			console.error('Failed to fetch page content:', error);
			// Continue with empty content, AI will use URL/domain info
		}
	}

	// If we have content, use AI to generate title and description
	if (content && content.length > 50) {
		try {
			const aiResult = await generateMetadataWithAI(content, platform, url);
			return {
				title: aiResult.title,
				description: aiResult.description,
				platform,
			};
		} catch (error) {
			console.error('AI generation failed, using fallback:', error);
			// Fallback to simple extraction
		}
	}

	// Fallback: simple extraction
	const title = content
		? extractTitleFromContent(content)
		: extractTitleFromUrl(url);

	return {
		title,
		description: content ? content.substring(0, 500) : '',
		platform,
	};
}

/**
 * Extracts a readable title from URL (fallback)
 */
function extractTitleFromUrl(url: string): string {
	try {
		const urlObj = new URL(url);
		const pathname = urlObj.pathname;
		const parts = pathname.replace(/^\/|\/$/g, '').split('/').filter(Boolean);

		if (parts.length > 0) {
			const lastPart = parts[parts.length - 1];
			return decodeURIComponent(lastPart)
				.replace(/[-_]/g, ' ')
				.replace(/\.[^.]+$/, '')
				.split('?')[0]
				.trim();
		}

		return urlObj.hostname.replace(/^www\./, '');
	} catch {
		return url;
	}
}
