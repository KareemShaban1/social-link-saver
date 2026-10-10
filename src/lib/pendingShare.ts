export const PENDING_SHARE_STORAGE_KEY = "socialsaver.pendingShare";

/** Fired after a share payload is stored (cold URL or launchQueue). */
export const PENDING_SHARE_READY_EVENT = "socialsaver-pending-share-ready";

function normalizePathname(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname || "/";
}

export interface PendingShare {
  url: string;
  title?: string;
  text?: string;
  description?: string;
  content?: string;
  platform?: string;
  categoryId?: string;
  categoryName?: string;
}

const URL_IN_TEXT_RE = /https?:\/\/[^\s<>"'`]+/gi;
/** Bare social / short links without a scheme (common in share sheets). */
const BARE_LINK_RE =
  /(?:^|[\s<(])((?:www\.)?(?:instagram\.com|facebook\.com|fb\.com|fb\.watch|tiktok\.com|vm\.tiktok\.com|linkedin\.com|lnkd\.in|twitter\.com|x\.com|youtube\.com|youtu\.be|pinterest\.com|pin\.it|reddit\.com|redd\.it)\/[^\s<>"'`]+)/gi;

/** App/share-sheet labels that are not useful post titles. */
const USELESS_SHARE_LABELS = new Set([
  "instagram",
  "facebook",
  "tiktok",
  "twitter",
  "x",
  "linkedin",
  "youtube",
  "pinterest",
  "reddit",
  "share",
  "sent from facebook",
  "sent from instagram",
  "sent from tiktok",
]);

export function isShareableHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value.trim());
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
    return parsed.hostname.includes(".");
  } catch {
    return false;
  }
}

function sanitizeFoundUrl(raw: string): string | null {
  const cleaned = raw.trim().replace(/[.,;:!?)\]}>]+$/g, "");
  if (!isShareableHttpUrl(cleaned)) return null;
  try {
    return new URL(cleaned).href;
  } catch {
    return null;
  }
}

function looksLikeLinkOnly(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  if (sanitizeFoundUrl(trimmed)) return true;
  if (/^www\./i.test(trimmed) && trimmed.includes(".")) return true;
  // Path-only leftovers like "/reel/123" or "instagram.com/p/abc"
  if (/^[a-z0-9.-]+\.[a-z]{2,}\//i.test(trimmed)) return true;
  if (/^\/?(reel|p|posts?|video|share|v|t)\//i.test(trimmed)) return true;
  return false;
}

/** Remove http(s) and bare social links from share text so captions can become title/description. */
export function stripUrlsFromShareText(value: string, knownUrl?: string): string {
  let next = value.replace(URL_IN_TEXT_RE, " ");

  next = next.replace(BARE_LINK_RE, (match, link: string) => match.replace(link, " "));

  if (knownUrl) {
    const variants = new Set<string>([knownUrl]);
    try {
      const parsed = new URL(knownUrl);
      variants.add(parsed.href);
      variants.add(parsed.toString());
      variants.add(`${parsed.host}${parsed.pathname}`);
      variants.add(`${parsed.hostname}${parsed.pathname}`);
      variants.add(`www.${parsed.hostname}${parsed.pathname}`);
      variants.add(parsed.pathname);
    } catch {
      /* ignore */
    }
    for (const variant of variants) {
      if (!variant || variant === "/") continue;
      next = next.split(variant).join(" ");
    }
  }

  next = next.replace(/\s+/g, " ").trim();
  return looksLikeLinkOnly(next) ? "" : next;
}

/** Return caption text only — never a URL or link-like leftover. */
export function textWithoutLinks(
  value: string | undefined | null,
  knownUrl?: string,
): string | undefined {
  if (!value) return undefined;
  const cleaned = stripUrlsFromShareText(value, knownUrl);
  if (!cleaned) return undefined;
  if (USELESS_SHARE_LABELS.has(cleaned.toLowerCase())) return undefined;
  if (looksLikeLinkOnly(cleaned)) return undefined;
  return cleaned;
}

/** Pull the first http(s) URL from a share-sheet payload (Instagram/TikTok often put it in `text`). */
export function extractUrlFromSharePayload(payload: {
  url?: string | null;
  text?: string | null;
  title?: string | null;
}): string | null {
  const tryValue = (value?: string | null): string | null => {
    if (!value) return null;
    const trimmed = value.trim();
    if (!trimmed) return null;

    const direct = sanitizeFoundUrl(trimmed);
    if (direct) return direct;

    const matches = trimmed.match(URL_IN_TEXT_RE);
    if (!matches) return null;
    for (const match of matches) {
      const ok = sanitizeFoundUrl(match);
      if (ok) return ok;
    }
    return null;
  };

  return tryValue(payload.url) ?? tryValue(payload.text) ?? tryValue(payload.title);
}

/**
 * Build title/description/content from a Web Share Target payload.
 * LinkedIn usually sends a real title; Instagram/TikTok/Facebook often only send caption+URL in `text`.
 * Never puts the shared link itself into title/description.
 */
export function deriveShareMetadata(payload: {
  url: string;
  title?: string | null;
  text?: string | null;
  description?: string | null;
  content?: string | null;
}): Pick<PendingShare, "title" | "description" | "content" | "text"> {
  const text = payload.text?.trim() || undefined;
  const contentParam = payload.content?.trim() || undefined;
  const titleFromParam = textWithoutLinks(payload.title, payload.url);
  const captionFromText = textWithoutLinks(text, payload.url);
  const captionFromContent = textWithoutLinks(contentParam, payload.url);
  const caption = captionFromText || captionFromContent;

  const title = titleFromParam || (caption ? caption.slice(0, 120) : undefined);
  const descriptionParam = textWithoutLinks(payload.description, payload.url);
  // When apps only send a caption (common for IG/TikTok), use it for both fields.
  const description = descriptionParam || caption || undefined;

  // Keep raw share text for backend metadata only when it has caption beyond the URL.
  const content =
    textWithoutLinks(contentParam, payload.url) || textWithoutLinks(text, payload.url)
      ? contentParam || text
      : undefined;

  return { title, description, content, text };
}

export function captureShareFromSearchParams(
  params: URLSearchParams,
  pathname: string,
): PendingShare | null {
  const normalizedPath = normalizePathname(pathname);
  const isShareTarget = normalizedPath === "/share-target";
  const isAddFlow = params.get("add") === "1";
  if (!isShareTarget && !isAddFlow) return null;

  let url = extractUrlFromSharePayload({
    url: params.get("url"),
    text: params.get("text"),
    title: params.get("title"),
  });

  // Some Android builds only pass a single combined field or odd param names.
  if (!url && isShareTarget) {
    const combined = [...params.entries()]
      .map(([, value]) => value)
      .filter(Boolean)
      .join("\n");
    url = extractUrlFromSharePayload({ text: combined, title: combined });
  }

  if (!url) return null;

  const derived = deriveShareMetadata({
    url,
    title: params.get("title"),
    text: params.get("text"),
    description: params.get("description"),
    content: params.get("content"),
  });

  return {
    url,
    ...derived,
    platform: params.get("platform")?.trim() || undefined,
    categoryId: params.get("categoryId")?.trim() || undefined,
    categoryName: params.get("categoryName")?.trim() || undefined,
  };
}

export function savePendingShare(share: PendingShare): void {
  try {
    sessionStorage.setItem(PENDING_SHARE_STORAGE_KEY, JSON.stringify(share));
    window.dispatchEvent(new Event(PENDING_SHARE_READY_EVENT));
  } catch {
    /* private mode / quota */
  }
}

/** Parse a full share-target or deep-link URL (used by launchQueue.targetURL). */
export function captureShareFromAbsoluteUrl(rawUrl: string): PendingShare | null {
  try {
    const parsed = new URL(rawUrl, window.location.origin);
    return captureShareFromSearchParams(parsed.searchParams, normalizePathname(parsed.pathname));
  } catch {
    return null;
  }
}

export function ingestShareFromAbsoluteUrl(rawUrl: string): boolean {
  const share = captureShareFromAbsoluteUrl(rawUrl);
  if (!share) return false;
  savePendingShare(share);
  return true;
}

/** Android reuses an open PWA window and delivers the share via launchQueue, not location.search. */
export function registerShareLaunchQueue(onCaptured?: () => void): void {
  if (!window.launchQueue?.setConsumer) return;
  const { launchQueue } = window;

  launchQueue.setConsumer((launchParams) => {
    const targetURL = launchParams.targetURL;
    if (!targetURL) return;
    if (ingestShareFromAbsoluteUrl(targetURL)) {
      onCaptured?.();
    }
  });
}

export function peekPendingShare(): PendingShare | null {
  try {
    const raw = sessionStorage.getItem(PENDING_SHARE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingShare;
    if (!parsed?.url) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function consumePendingShare(): PendingShare | null {
  const pending = peekPendingShare();
  try {
    sessionStorage.removeItem(PENDING_SHARE_STORAGE_KEY);
  } catch {
    /* ignore */
  }
  return pending;
}

function shouldRedirectToApp(pathname: string, params: URLSearchParams, share: PendingShare | null): boolean {
  const normalizedPath = normalizePathname(pathname);
  if (normalizedPath === "/share-target") return true;
  if (normalizedPath === "/" && (share || params.get("add") === "1")) return true;
  return false;
}

/** Run before React mounts so ProtectedRoute cannot drop share query params. */
export function bootstrapPendingShareFromWindow(): void {
  if (typeof window === "undefined") return;

  const { pathname, search } = window.location;
  const normalizedPath = normalizePathname(pathname);
  const params = new URLSearchParams(search);
  const share = captureShareFromSearchParams(params, normalizedPath);
  if (share) savePendingShare(share);

  if (shouldRedirectToApp(normalizedPath, params, share)) {
    window.history.replaceState({}, "", "/app");
    window.dispatchEvent(new PopStateEvent("popstate"));
    return;
  }

  if (share && search) {
    window.history.replaceState({}, "", normalizedPath);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }
}

export function registerShareLaunchQueueNavigation(): void {
  registerShareLaunchQueue(() => {
    if (normalizePathname(window.location.pathname) !== "/app") {
      window.history.replaceState({}, "", "/app");
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  });
}

export function capturePendingShareFromLocation(pathname: string, search: string): boolean {
  const normalizedPath = normalizePathname(pathname);
  const params = new URLSearchParams(search);
  const share = captureShareFromSearchParams(params, normalizedPath);
  if (share) savePendingShare(share);
  return (
    Boolean(share) ||
    normalizedPath === "/share-target" ||
    (normalizedPath === "/" && params.get("add") === "1")
  );
}
