/** Hostnames we allow for outbound resolve (SSRF guard). */
export function isAllowedFacebookHost(hostname: string): boolean {
	const h = hostname.toLowerCase();
	return (
		h === "facebook.com" ||
		h.endsWith(".facebook.com") ||
		h === "fb.com" ||
		h.endsWith(".fb.com") ||
		h === "fb.watch" ||
		h.endsWith(".fb.watch")
	);
}

/** Mobile / app “short” share paths that usually redirect to a canonical reel/video URL. */
export function facebookSharePathNeedsResolve(pathname: string): boolean {
	return /\/share\/r\//i.test(pathname) || /\/share\/reel\//i.test(pathname) || /\/share\/v\//i.test(pathname);
}

/** Strip tracking query/hash from resolved reel URLs (stable for storage + embed href). */
export function canonicalizeFacebookMediaUrl(u: string): string {
	try {
		const x = new URL(u);
		if (!isAllowedFacebookHost(x.hostname)) return u;
		const rawPath = x.pathname.replace(/\/+$/, "") || "/";
		if (/\/reel\/\d+$/i.test(rawPath)) {
			return `${x.origin}${rawPath}`;
		}
		return u;
	} catch {
		return u;
	}
}

function stripCompare(u: string): string {
	try {
		const x = new URL(u);
		x.hash = "";
		let p = x.pathname.replace(/\/+$/, "") || "/";
		return `${x.origin}${p}${x.search}`;
	} catch {
		return u;
	}
}

/**
 * Meta often returns HTTP 400 to bare server fetches. Sending the same navigation headers as Chrome
 * yields 302/200 + redirect chain to the real reel URL (e.g. web.facebook.com/reel/…).
 */
const browserLikeFacebookHeaders: Record<string, string> = {
	"User-Agent":
		"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
	Accept:
		"text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
	"Accept-Language": "en-US,en;q=0.9",
	"Sec-Fetch-Dest": "document",
	"Sec-Fetch-Mode": "navigate",
	"Sec-Fetch-Site": "none",
	"Sec-Fetch-User": "?1",
	"Upgrade-Insecure-Requests": "1",
	Referer: "https://www.facebook.com/",
};

function getFacebookGraphAccessToken(): string | null {
	const direct = process.env.FACEBOOK_APP_ACCESS_TOKEN?.trim();
	if (direct) return direct;
	const id = process.env.FACEBOOK_APP_ID?.trim();
	const secret = process.env.FACEBOOK_APP_SECRET?.trim();
	if (id && secret) return `${id}|${secret}`;
	return null;
}

async function tryResolveViaGraphApi(shareUrl: string, signal: AbortSignal): Promise<string | null> {
	const token = getFacebookGraphAccessToken();
	if (!token) return null;
	const apiUrl =
		`https://graph.facebook.com/v21.0/` +
		`?id=${encodeURIComponent(shareUrl)}` +
		`&fields=og_object{url}` +
		`&access_token=${encodeURIComponent(token)}`;
	try {
		const r = await fetch(apiUrl, { signal });
		if (!r.ok) return null;
		const j = (await r.json()) as { og_object?: { url?: string }; error?: { message?: string } };
		if (j.error) return null;
		const u = j.og_object?.url;
		if (typeof u !== "string" || !u.length) return null;
		const parsed = new URL(u);
		if (!isAllowedFacebookHost(parsed.hostname)) return null;
		return canonicalizeFacebookMediaUrl(u);
	} catch {
		return null;
	}
}

/**
 * Follows redirects and, if still on the same path, tries og:url / canonical from HTML, then Graph API (optional).
 * Returns original string on any failure.
 */
export async function resolveFacebookShareToCanonical(rawInput: string): Promise<string> {
	const trimmed = rawInput.trim();
	let inputUrl: URL;
	try {
		inputUrl = new URL(trimmed);
	} catch {
		return trimmed;
	}

	if (!isAllowedFacebookHost(inputUrl.hostname)) return trimmed;
	if (!facebookSharePathNeedsResolve(inputUrl.pathname)) return inputUrl.toString();

	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 22_000);

	const finish = (u: string) => canonicalizeFacebookMediaUrl(u);

	try {
		const r = await fetch(inputUrl.toString(), {
			method: "GET",
			redirect: "follow",
			signal: controller.signal,
			headers: browserLikeFacebookHeaders,
		});

		let out = r.url;
		try {
			if (!isAllowedFacebookHost(new URL(out).hostname)) return finish(inputUrl.toString());
		} catch {
			return finish(inputUrl.toString());
		}

		if (stripCompare(out) !== stripCompare(inputUrl.toString())) {
			return finish(out);
		}

		const ct = (r.headers.get("content-type") || "").toLowerCase();
		if (r.ok && ct.includes("text/html")) {
			const text = await r.text();
			const ogMatch =
				text.match(/property=["']og:url["'][^>]*content=["']([^"']+)["']/i) ||
				text.match(/content=["']([^"']+)["'][^>]*property=["']og:url["']/i);
			if (ogMatch?.[1]) {
				try {
					const c = new URL(ogMatch[1], inputUrl.origin);
					if (isAllowedFacebookHost(c.hostname)) return finish(c.toString());
				} catch {
					/* ignore */
				}
			}
			const linkMatch = text.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i);
			if (linkMatch?.[1]) {
				try {
					const c = new URL(linkMatch[1], inputUrl.origin);
					if (isAllowedFacebookHost(c.hostname)) return finish(c.toString());
				} catch {
					/* ignore */
				}
			}
		}

		const graphUrl = await tryResolveViaGraphApi(inputUrl.toString(), controller.signal);
		if (graphUrl) return graphUrl;

		return finish(inputUrl.toString());
	} catch (e) {
		console.warn("resolveFacebookShareToCanonical:", e);
		try {
			const graphUrl = await tryResolveViaGraphApi(inputUrl.toString(), AbortSignal.timeout(8000));
			if (graphUrl) return graphUrl;
		} catch {
			/* ignore */
		}
		return finish(inputUrl.toString());
	} finally {
		clearTimeout(timeout);
	}
}
