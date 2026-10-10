import { fetchOEmbedMetadata } from "./oembedMetadata.js";

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

const BARE_LINK_RE =
	/(?:^|[\s<(])((?:www\.)?(?:instagram\.com|facebook\.com|fb\.com|fb\.watch|tiktok\.com|vm\.tiktok\.com|linkedin\.com|lnkd\.in|twitter\.com|x\.com|youtube\.com|youtu\.be|pinterest\.com|pin\.it|reddit\.com|redd\.it)\/[^\s<>"'`]+)/gi;

function looksLikeLinkOnly(value: string): boolean {
	const trimmed = value.trim();
	if (!trimmed) return true;
	if (/^https?:\/\//i.test(trimmed)) return true;
	if (/^www\./i.test(trimmed) && trimmed.includes('.')) return true;
	if (/^[a-z0-9.-]+\.[a-z]{2,}\//i.test(trimmed)) return true;
	if (/^\/?(reel|p|posts?|video|share|v|t)\//i.test(trimmed)) return true;
	return false;
}

function stripUrls(value: string, knownUrl?: string): string {
	let next = value.replace(URL_IN_TEXT_RE, ' ');
	next = next.replace(BARE_LINK_RE, (match, link: string) => match.replace(link, ' '));

	if (knownUrl) {
		const variants = new Set<string>([knownUrl]);
		try {
			const parsed = new URL(knownUrl);
			variants.add(parsed.href);
			variants.add(`${parsed.host}${parsed.pathname}`);
			variants.add(`${parsed.hostname}${parsed.pathname}`);
			variants.add(parsed.pathname);
		} catch {
			/* ignore */
		}
		for (const variant of variants) {
			if (!variant || variant === '/') continue;
			next = next.split(variant).join(' ');
		}
	}

	next = next.replace(/\s+/g, ' ').trim();
	return looksLikeLinkOnly(next) ? '' : next;
}

function isUsefulText(value: string | undefined | null, knownUrl?: string): value is string {
	if (!value) return false;
	const cleaned = stripUrls(value, knownUrl);
	if (!cleaned) return false;
	if (USELESS_TITLES.has(cleaned.toLowerCase())) return false;
	if (looksLikeLinkOnly(cleaned)) return false;
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
 * Extracts metadata from a URL (title, description, platform).
 * Order: platform oEmbed APIs → Open Graph HTML → share-sheet caption.
 * oEmbed is the reliable path for TikTok/YouTube/Meta when scrapers are blocked.
 */
export async function extractMetadataWithAI(
	url: string,
	providedContent?: string
): Promise<MetadataResult> {
	const platform = detectPlatformFromUrl(url);
	const shareCaption = providedContent ? stripUrls(providedContent, url) : '';

	let oembedTitle = '';
	let oembedDescription = '';
	try {
		const oembed = await fetchOEmbedMetadata(url);
		if (oembed) {
			oembedTitle = stripUrls(oembed.title, url);
			oembedDescription = stripUrls(oembed.description, url);
		}
	} catch (error) {
		console.error('oEmbed metadata failed:', error);
	}

	let htmlMeta: HtmlMeta = { title: '', description: '' };
	let pageText = '';

	// Skip slow HTML fetch when oEmbed already gave useful fields.
	if (!isUsefulText(oembedTitle, url) || !isUsefulText(oembedDescription, url)) {
		try {
			const html = await fetchPageContent(url);
			htmlMeta = extractMetaFromHTML(html);
			pageText = extractTextFromHTML(html);
		} catch (error) {
			console.error('Failed to fetch page content:', error);
		}
	}

	const ogTitle = stripUrls(htmlMeta.title, url);
	const ogDescription = stripUrls(htmlMeta.description, url);
	const pageCaption = stripUrls(pageText, url);

	const title =
		(isUsefulText(oembedTitle, url) && oembedTitle) ||
		(isUsefulText(ogTitle, url) && ogTitle) ||
		(isUsefulText(shareCaption, url) && extractTitleFromContent(shareCaption)) ||
		(isUsefulText(pageCaption, url) && extractTitleFromContent(pageCaption)) ||
		'';

	const description =
		(isUsefulText(oembedDescription, url) && oembedDescription.slice(0, 500)) ||
		(isUsefulText(ogDescription, url) && ogDescription.slice(0, 500)) ||
		(isUsefulText(shareCaption, url) && shareCaption.slice(0, 500)) ||
		(isUsefulText(pageCaption, url) && pageCaption.slice(0, 500)) ||
		'';

	return {
		title,
		description,
		platform,
	};
}
