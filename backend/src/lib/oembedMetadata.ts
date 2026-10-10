/**
 * Fetch title/description via platform oEmbed / Open Graph APIs.
 * Social sites often block HTML scrapers; these endpoints are the reliable path.
 */

export interface OEmbedMeta {
	title: string;
	description: string;
}

function getMetaAccessToken(): string | null {
	const direct = process.env.FACEBOOK_APP_ACCESS_TOKEN?.trim();
	if (direct) return direct;
	const id = process.env.FACEBOOK_APP_ID?.trim();
	const secret = process.env.FACEBOOK_APP_SECRET?.trim();
	if (id && secret) return `${id}|${secret}`;
	return null;
}

function decodeBasicEntities(value: string): string {
	return value
		.replace(/&amp;/g, "&")
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&nbsp;/g, " ")
		.trim();
}

function stripHtml(value: string): string {
	return decodeBasicEntities(value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

/** Pull caption-like text from Meta oEmbed HTML when `title` is absent. */
function captionFromEmbedHtml(html: string): string {
	if (!html) return "";
	const paragraph = html.match(/<p[^>]*>([\s\S]*?)<\/p>/i)?.[1];
	if (paragraph) {
		const text = stripHtml(paragraph);
		if (text) return text;
	}
	const blockquote = html.match(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/i)?.[1];
	if (blockquote) {
		const text = stripHtml(blockquote);
		if (text) return text;
	}
	return "";
}

async function fetchJson(url: string, timeoutMs = 8000): Promise<Record<string, unknown> | null> {
	try {
		const response = await fetch(url, {
			headers: {
				Accept: "application/json",
				"User-Agent":
					"Mozilla/5.0 (compatible; SocialSaverBot/1.0; +https://link-nest.digitaura.net)",
			},
			signal: AbortSignal.timeout(timeoutMs),
		});
		if (!response.ok) return null;
		return (await response.json()) as Record<string, unknown>;
	} catch {
		return null;
	}
}

function asString(value: unknown): string {
	return typeof value === "string" ? value.trim() : "";
}

function fromOEmbedPayload(data: Record<string, unknown>): OEmbedMeta | null {
	const title = asString(data.title);
	const description =
		asString(data.description) ||
		captionFromEmbedHtml(asString(data.html)) ||
		asString(data.author_name);
	if (!title && !description) return null;

	// Prefer real caption as title when oEmbed title is missing.
	const resolvedTitle = title || (description ? description.slice(0, 120) : "");
	const resolvedDescription =
		description && description !== resolvedTitle
			? description.slice(0, 500)
			: description
				? description.slice(0, 500)
				: "";

	return {
		title: resolvedTitle,
		description: resolvedDescription,
	};
}

async function fetchTikTokOEmbed(url: string): Promise<OEmbedMeta | null> {
	const data = await fetchJson(
		`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`,
	);
	return data ? fromOEmbedPayload(data) : null;
}

async function fetchYouTubeOEmbed(url: string): Promise<OEmbedMeta | null> {
	const data = await fetchJson(
		`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url)}`,
	);
	if (!data) return null;
	const title = asString(data.title);
	const author = asString(data.author_name);
	if (!title) return null;
	return {
		title,
		description: author ? `By ${author}` : "",
	};
}

async function fetchMetaOEmbed(
	url: string,
	endpoint: "instagram_oembed" | "oembed_post" | "oembed_video",
): Promise<OEmbedMeta | null> {
	const token = getMetaAccessToken();
	const params = new URLSearchParams({
		url,
		omitscript: "true",
	});
	if (token) params.set("access_token", token);

	const data = await fetchJson(
		`https://graph.facebook.com/v22.0/${endpoint}?${params.toString()}`,
	);
	return data && !data.error ? fromOEmbedPayload(data) : null;
}

/** Facebook Graph can return og_object title/description when an app token is configured. */
async function fetchFacebookGraphOg(url: string): Promise<OEmbedMeta | null> {
	const token = getMetaAccessToken();
	if (!token) return null;

	const params = new URLSearchParams({
		id: url,
		fields: "og_object{title,description,url}",
		access_token: token,
	});
	const data = await fetchJson(`https://graph.facebook.com/v22.0/?${params.toString()}`);
	if (!data || data.error) return null;

	const og = data.og_object as { title?: string; description?: string } | undefined;
	if (!og) return null;
	const title = asString(og.title);
	const description = asString(og.description);
	if (!title && !description) return null;
	return {
		title: title || description.slice(0, 120),
		description: description.slice(0, 500),
	};
}

/**
 * Optional general unfurler. Works well for TikTok/LinkedIn/many sites.
 * Instagram often requires a paid proxy plan — failures are ignored.
 */
async function fetchMicrolink(url: string): Promise<OEmbedMeta | null> {
	if (process.env.MICROLINK_ENABLED === "false") return null;

	const data = await fetchJson(
		`https://api.microlink.io/?url=${encodeURIComponent(url)}`,
		10000,
	);
	if (!data || data.status !== "success") return null;
	const payload = data.data as { title?: string; description?: string } | undefined;
	if (!payload) return null;
	const title = asString(payload.title);
	const description = asString(payload.description);
	if (!title && !description) return null;
	return {
		title: title || description.slice(0, 120),
		description: description.slice(0, 500),
	};
}

function hostOf(url: string): string {
	try {
		return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
	} catch {
		return "";
	}
}

/**
 * Best-effort metadata from official/public APIs for the given URL.
 */
export async function fetchOEmbedMetadata(url: string): Promise<OEmbedMeta | null> {
	const host = hostOf(url);

	const attempts: Array<() => Promise<OEmbedMeta | null>> = [];

	if (host.includes("tiktok.com")) {
		attempts.push(() => fetchTikTokOEmbed(url));
		attempts.push(() => fetchMicrolink(url));
	} else if (host.includes("youtube.com") || host.includes("youtu.be")) {
		attempts.push(() => fetchYouTubeOEmbed(url));
	} else if (host.includes("instagram.com")) {
		attempts.push(() => fetchMetaOEmbed(url, "instagram_oembed"));
		attempts.push(() => fetchMicrolink(url));
	} else if (
		host.includes("facebook.com") ||
		host.includes("fb.com") ||
		host.includes("fb.watch")
	) {
		attempts.push(() => fetchFacebookGraphOg(url));
		const isVideo =
			/\/(reel|watch|videos?)\//i.test(url) || host.includes("fb.watch");
		attempts.push(() =>
			fetchMetaOEmbed(url, isVideo ? "oembed_video" : "oembed_post"),
		);
		attempts.push(() => fetchMicrolink(url));
	} else if (host.includes("linkedin.com") || host.includes("lnkd.in")) {
		attempts.push(() => fetchMicrolink(url));
	} else {
		attempts.push(() => fetchMicrolink(url));
	}

	for (const attempt of attempts) {
		const result = await attempt();
		if (result?.title || result?.description) return result;
	}

	return null;
}
