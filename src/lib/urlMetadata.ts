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
 * Extracts metadata from a URL
 * Uses a CORS proxy to fetch the page and extract Open Graph and meta tags
 */
export async function extractUrlMetadata(url: string): Promise<{
  title: string;
  description: string;
  platform: string;
}> {
  const platform = detectPlatformFromUrl(url);
  
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
      
      // If we got at least a title, return the results
      if (title) {
        return {
          title: title || extractTitleFromUrl(url),
          description: description || '',
          platform,
        };
      }
    } catch (error) {
      console.error(`Error with proxy ${proxyUrl}:`, error);
      continue; // Try next proxy
    }
  }
  
  // If all proxies failed, return basic info with platform detection
  console.warn('All metadata extraction methods failed, using fallback');
  return {
    title: extractTitleFromUrl(url),
    description: '',
    platform,
  };
}

/**
 * Extracts a readable title from URL
 */
function extractTitleFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    
    // Remove leading/trailing slashes and split
    const parts = pathname.replace(/^\/|\/$/g, '').split('/').filter(Boolean);
    
    // Take the last meaningful part
    if (parts.length > 0) {
      const lastPart = parts[parts.length - 1];
      // Decode URL encoding and replace hyphens/underscores with spaces
      return decodeURIComponent(lastPart)
        .replace(/[-_]/g, ' ')
        .replace(/\.[^.]+$/, '') // Remove file extension
        .split('?')[0] // Remove query params
        .trim();
    }
    
    // Fallback to hostname
    return urlObj.hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

