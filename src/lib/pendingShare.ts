export const PENDING_SHARE_STORAGE_KEY = "socialsaver.pendingShare";

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

function usefulShareTitle(title: string | undefined, url: string): string | undefined {
  if (!title) return undefined;
  const trimmed = title.trim();
  if (!trimmed) return undefined;
  if (sanitizeFoundUrl(trimmed) === url || extractUrlFromSharePayload({ url: trimmed })) {
    return undefined;
  }
  return trimmed;
}

export function captureShareFromSearchParams(
  params: URLSearchParams,
  pathname: string,
): PendingShare | null {
  const isShareTarget = pathname === "/share-target";
  const isAddFlow = params.get("add") === "1";
  if (!isShareTarget && !isAddFlow) return null;

  const url = extractUrlFromSharePayload({
    url: params.get("url"),
    text: params.get("text"),
    title: params.get("title"),
  });
  if (!url) return null;

  const title = usefulShareTitle(params.get("title") || undefined, url);
  const description = params.get("description")?.trim() || undefined;
  const text = params.get("text")?.trim() || undefined;
  const contentParam = params.get("content")?.trim() || undefined;
  const content =
    contentParam ||
    (text && extractUrlFromSharePayload({ url: text }) !== text ? text : undefined);

  return {
    url,
    title,
    text,
    description,
    content,
    platform: params.get("platform")?.trim() || undefined,
    categoryId: params.get("categoryId")?.trim() || undefined,
    categoryName: params.get("categoryName")?.trim() || undefined,
  };
}

export function savePendingShare(share: PendingShare): void {
  try {
    sessionStorage.setItem(PENDING_SHARE_STORAGE_KEY, JSON.stringify(share));
  } catch {
    /* private mode / quota */
  }
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
  if (pathname === "/share-target") return true;
  if (pathname === "/" && (share || params.get("add") === "1")) return true;
  return false;
}

/** Run before React mounts so ProtectedRoute cannot drop share query params. */
export function bootstrapPendingShareFromWindow(): void {
  if (typeof window === "undefined") return;

  const { pathname, search } = window.location;
  const params = new URLSearchParams(search);
  const share = captureShareFromSearchParams(params, pathname);
  if (share) savePendingShare(share);

  if (shouldRedirectToApp(pathname, params, share)) {
    window.history.replaceState({}, "", "/app");
    return;
  }

  if (share && search) {
    window.history.replaceState({}, "", pathname);
  }
}

export function capturePendingShareFromLocation(pathname: string, search: string): boolean {
  const params = new URLSearchParams(search);
  const share = captureShareFromSearchParams(params, pathname);
  if (share) savePendingShare(share);
  return Boolean(share) || pathname === "/share-target" || (pathname === "/" && params.get("add") === "1");
}
