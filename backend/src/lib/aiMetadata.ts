interface MetadataResult {
	title: string;
	description: string;
	platform: string;
}

interface HtmlMeta {
	title: string;
	description: string;
}

const URL_IN_TEXT_RE = /https?:\/\/[^\s<>"'`]+/gi;

const USELESS_TITLES = new Set([
	"instagram",
	"facebook",
	"tiktok",
	"twitter",
	"x",
	"linkedin",
	"youtube",
	"pinterest",
	"reddit",
	"log in",
	"login",
	"sign up",
	"facebook – log in or sign up",
	"instagram • login",
]);

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

function stripUrls(value: string): string {
	return value.replace(URL_IN_TEXT_RE, ' ').replace(/\s+/g, ' ').trim();
}

function isUsefulText(value: string | undefined | null): value is string {
	if (!value) return false;
	const trimmed = value.trim();
	if (!trimmed) return false;
	if (USELESS_TITLES.has(trimmed.toLowerCase())) return false;
	return true;
}

/**
 * Fetches HTML content from a URL using server-side fetch
 */
async function fetchPageContent(url: string): Promise<string> {
	try {
		const response = await fetch(url, {
			headers: {
				'User-Agent':
					'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
				Accept:
					'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
				'Accept-Language': 'en-US,en;q=0.9',
				'Cache-Control': 'no-cache',
				'Upgrade-Insecure-Requests': '1',
			},
			redirect: 'follow',
			signal: AbortSignal.timeout(10000),
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

function metaContent(html: string, ...patterns: RegExp[]): string {
	for (const pattern of patterns) {
		const match = html.match(pattern);
		const value = match?.[1]?.trim();
		if (value) {
			return decodeBasicEntities(value);
		}
	}
	return '';
}

function decodeBasicEntities(value: string): string {
	return value
		.replace(/&amp;/g, '&')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&nbsp;/g, ' ')
		.trim();
}

/**
 * Prefer Open Graph / Twitter card tags — critical for social platforms that hide body content.
 */
function extractMetaFromHTML(html: string): HtmlMeta {
	const ogTitle = metaContent(
		html,
		/property=["']og:title["'][^>]*content=["']([^"']+)["']/i,
		/content=["']([^"']+)["'][^>]*property=["']og:title["']/i,
	);
	const twitterTitle = metaContent(
		html,
		/name=["']twitter:title["'][^>]*content=["']([^"']+)["']/i,
		/content=["']([^"']+)["'][^>]*name=["']twitter:title["']/i,
	);
	const titleTag = metaContent(html, /<title[^>]*>([\s\S]*?)<\/title>/i);

	const ogDescription = metaContent(
		html,
		/property=["']og:description["'][^>]*content=["']([^"']+)["']/i,
		/content=["']([^"']+)["'][^>]*property=["']og:description["']/i,
	);
	const twitterDescription = metaContent(
		html,
		/name=["']twitter:description["'][^>]*content=["']([^"']+)["']/i,
		/content=["']([^"']+)["'][^>]*name=["']twitter:description["']/i,
	);
	const metaDescription = metaContent(
		html,
		/name=["']description["'][^>]*content=["']([^"']+)["']/i,
		/content=["']([^"']+)["'][^>]*name=["']description["']/i,
	);

	return {
		title: ogTitle || twitterTitle || titleTag,
		description: ogDescription || twitterDescription || metaDescription,
	};
}

/**
 * Extracts text content from HTML
 */
function extractTextFromHTML(html: string): string {
	html = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
	html = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

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
			const regex = new RegExp(`<${selector}[^>]*>([\\s\\S]*?)<\\/${selector}>`, 'i');
			const match = html.match(regex);
			if (match && match[1]) {
				text = match[1];
				break;
			}
		} catch {
			// Continue to next selector
		}
	}

	if (!text) {
		const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
		if (bodyMatch) {
			text = bodyMatch[1];
		} else {
			text = html;
		}
	}

	text = text
		.replace(/<[^>]+>/g, ' ')
		.replace(/&nbsp;/g, ' ')
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/\s+/g, ' ')
		.trim();

	return text;
}

/**
 * Extracts a simple title from content
 */
function extractTitleFromContent(content: string): string {
	if (!content) return '';

	const firstSentence = content.split(/[.!?]\s/)[0];
	const title = firstSentence.length > 100
		? firstSentence.substring(0, 97) + '...'
		: firstSentence;

	return title.trim() || content.substring(0, 100).trim();
}

/**
 * Extracts metadata from a URL (title, description, platform) using page fetch and simple parsing.
 * Uses share-sheet text when social platforms block scrapers (common for IG/FB/TikTok).
 */
export async function extractMetadataWithAI(
	url: string,
	providedContent?: string
): Promise<MetadataResult> {
	const platform = detectPlatformFromUrl(url);
	const shareCaption = providedContent ? stripUrls(providedContent) : '';

	let htmlMeta: HtmlMeta = { title: '', description: '' };
	let pageText = '';

	try {
		const html = await fetchPageContent(url);
		htmlMeta = extractMetaFromHTML(html);
		pageText = extractTextFromHTML(html);
	} catch (error) {
		console.error('Failed to fetch page content:', error);
	}

	const title =
		(isUsefulText(htmlMeta.title) && htmlMeta.title) ||
		(isUsefulText(shareCaption) && extractTitleFromContent(shareCaption)) ||
		(isUsefulText(pageText) && extractTitleFromContent(pageText)) ||
		extractTitleFromUrl(url);

	const description =
		(isUsefulText(htmlMeta.description) && htmlMeta.description.slice(0, 500)) ||
		(isUsefulText(shareCaption) && shareCaption.slice(0, 500)) ||
		(isUsefulText(pageText) && pageText.slice(0, 500)) ||
		'';

	return {
		title,
		description,
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
