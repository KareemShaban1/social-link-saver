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
 * Extracts a simple title from content
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
 * Extracts metadata from a URL (title, description, platform) using page fetch and simple parsing.
 * No paid APIs required.
 */
export async function extractMetadataWithAI(
	url: string,
	providedContent?: string
): Promise<MetadataResult> {
	const platform = detectPlatformFromUrl(url);

	let content = providedContent || '';

	if (!content) {
		try {
			const html = await fetchPageContent(url);
			content = extractTextFromHTML(html);
		} catch (error) {
			console.error('Failed to fetch page content:', error);
		}
	}

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
