import { resolveApiBaseUrl } from '@/lib/api';
import { textWithoutLinks } from '@/lib/pendingShare';

/**
 * Detects platform from URL domain
 */
export function detectPlatformFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    
    // Remove www. prefix
    const domain = hostname.replace(/^www\./, '');
    
    // Platform detection
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
 * Extracts metadata from a URL using AI backend service
 * Falls back to client-side extraction if backend is unavailable
 */
function cleanField(value: string | undefined | null, url: string): string {
  return textWithoutLinks(value, url) ?? '';
}

function metadataFromShareContent(
  url: string,
  platform: string,
  providedContent?: string
): { title: string; description: string; platform: string } | null {
  const caption = cleanField(providedContent, url);
  if (!caption) return null;
  return {
    title: caption.slice(0, 120),
    description: caption.slice(0, 500),
    platform,
  };
}

export async function extractUrlMetadata(
  url: string,
  providedContent?: string
): Promise<{
  title: string;
  description: string;
  platform: string;
}> {
  const platform = detectPlatformFromUrl(url);
  const shareFallback = metadataFromShareContent(url, platform, providedContent);
  
  // Try backend AI service first
  try {
    const API_URL = resolveApiBaseUrl(import.meta.env.VITE_API_URL);
    const response = await fetch(`${API_URL}/metadata/extract`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url, content: providedContent }),
    });

    if (response.ok) {
      const data = await response.json();
      const title = cleanField(data.title, url);
      const description = cleanField(data.description, url) || shareFallback?.description || '';
      // Never accept a URL (or URL leftover) as title/description.
      if (title) {
        return {
          title,
          description,
          platform: data.platform || platform,
        };
      }
      if (description || shareFallback) {
        return {
          title: shareFallback?.title || '',
          description: description || shareFallback?.description || '',
          platform: data.platform || platform,
        };
      }
    }
  } catch (error) {
    console.warn('Backend AI metadata extraction failed, falling back to client-side:', error);
    // Continue to fallback method
  }

  if (shareFallback) {
    return shareFallback;
  }
  
  // Fallback: Try client-side extraction with CORS proxies
  return extractUrlMetadataFallback(url, platform);
}

/**
 * Fallback metadata extraction using CORS proxies
 */
async function extractUrlMetadataFallback(
  url: string,
  platform: string
): Promise<{
  title: string;
  description: string;
  platform: string;
}> {
  // Try multiple CORS proxies in case one fails
  const proxies = [
    `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
    `https://corsproxy.io/?${encodeURIComponent(url)}`,
    `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
  ];
  
  for (const proxyUrl of proxies) {
    try {
      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });
      
      if (!response.ok) {
        continue; // Try next proxy
      }
      
      let html = '';
      
      // Handle different proxy response formats
      if (proxyUrl.includes('allorigins.win')) {
        const data = await response.json();
        if (!data.contents) {
          continue;
        }
        html = data.contents;
      } else {
        html = await response.text();
      }
      
      if (!html || html.length < 100) {
        continue; // Not enough content, try next proxy
      }
      
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      // Try to get title from various sources
      let title = '';
      
      // Try Open Graph title first
      const ogTitle = doc.querySelector('meta[property="og:title"]')?.getAttribute('content');
      if (ogTitle && ogTitle.trim()) {
        title = ogTitle.trim();
      } else {
        // Try Twitter card title
        const twitterTitle = doc.querySelector('meta[name="twitter:title"]')?.getAttribute('content');
        if (twitterTitle && twitterTitle.trim()) {
          title = twitterTitle.trim();
        } else {
          // Try regular title tag
          const titleTag = doc.querySelector('title');
          if (titleTag && titleTag.textContent) {
            title = titleTag.textContent.trim();
          }
        }
      }
      
      // Try to get description
      let description = '';
      
      // Try Open Graph description first
      const ogDescription = doc.querySelector('meta[property="og:description"]')?.getAttribute('content');
      if (ogDescription && ogDescription.trim()) {
        description = ogDescription.trim();
      } else {
        // Try Twitter card description
        const twitterDescription = doc.querySelector('meta[name="twitter:description"]')?.getAttribute('content');
        if (twitterDescription && twitterDescription.trim()) {
          description = twitterDescription.trim();
        } else {
          // Try meta description
          const metaDescription = doc.querySelector('meta[name="description"]')?.getAttribute('content');
          if (metaDescription && metaDescription.trim()) {
            description = metaDescription.trim();
          }
        }
      }
      
      const cleanTitle = cleanField(title, url);
      const cleanDescription = cleanField(description, url);

      // If we got at least a title, return the results (never use the URL as title)
      if (cleanTitle) {
        return {
          title: cleanTitle,
          description: cleanDescription,
          platform,
        };
      }
    } catch (error) {
      console.error(`Error with proxy ${proxyUrl}:`, error);
      continue; // Try next proxy
    }
  }
  
  // If all proxies failed, leave title/description empty — never fill them with the link.
  console.warn('All metadata extraction methods failed, using fallback');
  return {
    title: '',
    description: '',
    platform,
  };
}

