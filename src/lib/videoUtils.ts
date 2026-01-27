// Utility functions to detect and handle video/reel URLs

export interface VideoInfo {
	isVideo: boolean;
	embedUrl?: string;
	platform: 'youtube' | 'instagram' | 'tiktok' | 'facebook' | 'vimeo' | 'unknown';
	videoId?: string;
}

/**
 * Detects if a URL is a video/reel and extracts embed information
 * @param url - The URL to check
 * @param platformHint - Optional platform name from the database to help detection
 */
export const detectVideoUrl = (url: string, platformHint?: string): VideoInfo => {
	try {
		const urlObj = new URL(url);
		const hostname = urlObj.hostname.toLowerCase();
		const pathname = urlObj.pathname; // Keep original case for IDs

		// YouTube - handle multiple URL formats
		if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
			let videoId: string | null = null;

			if (hostname.includes('youtu.be')) {
				// youtu.be/VIDEO_ID or youtu.be/VIDEO_ID?t=123
				const path = pathname.slice(1);
				videoId = path.split('?')[0].split('/')[0].split('#')[0];
			} else if (urlObj.searchParams.has('v')) {
				// youtube.com/watch?v=VIDEO_ID
				videoId = urlObj.searchParams.get('v');
			} else if (pathname.includes('/watch/')) {
				// youtube.com/watch/VIDEO_ID
				videoId = pathname.split('/watch/')[1]?.split('/')[0]?.split('?')[0]?.split('#')[0];
			} else if (pathname.includes('/embed/')) {
				// Already an embed URL - extract ID
				videoId = pathname.split('/embed/')[1]?.split('?')[0]?.split('#')[0];
			} else if (pathname.includes('/v/')) {
				// youtube.com/v/VIDEO_ID
				videoId = pathname.split('/v/')[1]?.split('/')[0]?.split('?')[0]?.split('#')[0];
			} else if (pathname.includes('/shorts/')) {
				// youtube.com/shorts/VIDEO_ID
				videoId = pathname.split('/shorts/')[1]?.split('/')[0]?.split('?')[0]?.split('#')[0];
			}

			if (videoId) {
				// Clean video ID (remove any extra characters)
				videoId = videoId.split('&')[0].split('#')[0].split('?')[0].trim();
				// YouTube video IDs are typically 11 characters, but accept 8+ for edge cases
				if (videoId.length >= 8 && /^[a-zA-Z0-9_-]+$/.test(videoId)) {
					return {
						isVideo: true,
						embedUrl: `https://www.youtube.com/embed/${videoId}`,
						platform: 'youtube',
						videoId,
					};
				}
			}
		}

		// Instagram Reels and TV posts (not regular posts - they might be photos)
		if (hostname.includes('instagram.com')) {
			// Only mark /reel/ and /tv/ as videos - /p/ posts might be photos
			const reelMatch = pathname.match(/\/(reel|tv)\/([a-zA-Z0-9_-]+)/i);
			if (reelMatch) {
				const reelId = reelMatch[2];
				// Instagram embed - use the full URL approach which works better
				return {
					isVideo: true,
					embedUrl: `https://www.instagram.com/p/${reelId}/embed/?cr=1&v=14&wp=1080&rd=${encodeURIComponent(url)}`,
					platform: 'instagram',
					videoId: reelId,
				};
			}
			// Don't mark regular /p/ posts as videos - they're often photos
		}

		// TikTok
		if (hostname.includes('tiktok.com')) {
			// TikTok pattern: /@username/video/[id] or /video/[id]
			const tiktokMatch = pathname.match(/\/video\/(\d+)/);
			if (tiktokMatch) {
				const videoId = tiktokMatch[1];
				// TikTok embed - use the full URL
				return {
					isVideo: true,
					embedUrl: `https://www.tiktok.com/embed/v2/${videoId}`,
					platform: 'tiktok',
					videoId,
				};
			}
		}

		// Facebook Videos and Reels
		if (hostname.includes('facebook.com') || hostname.includes('fb.com') || hostname.includes('fb.watch')) {
			// Facebook video patterns:
			// - /watch/?v=VIDEO_ID
			// - /PAGE_NAME/videos/VIDEO_ID
			// - /watch/live/?v=VIDEO_ID
			// - /reel/VIDEO_ID
			// - fb.watch/VIDEO_ID

			let videoId: string | null = null;

			// Check for /videos/ pattern
			const videosMatch = pathname.match(/\/videos\/(\d+)/);
			if (videosMatch) {
				videoId = videosMatch[1];
			}

			// Check for /reel/ pattern (Facebook Reels)
			if (!videoId) {
				const reelMatch = pathname.match(/\/reel\/([a-zA-Z0-9_-]+)/);
				if (reelMatch) {
					videoId = reelMatch[1];
				}
			}

			// Check for ?v= parameter
			if (!videoId && urlObj.searchParams.has('v')) {
				videoId = urlObj.searchParams.get('v');
			}

			// Check for fb.watch format
			if (!videoId && hostname.includes('fb.watch')) {
				videoId = pathname.slice(1).split('?')[0].split('/')[0];
			}

			// If we found a video ID or the URL looks like a video/reel, mark as video
			// Also check for common Facebook video indicators
			const isVideoUrl = videoId ||
				pathname.includes('/watch') ||
				pathname.includes('/reel') ||
				pathname.includes('/videos/') ||
				pathname.includes('/video/') ||
				hostname.includes('fb.watch');

			if (isVideoUrl) {
				return {
					isVideo: true,
					embedUrl: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false&width=500`,
					platform: 'facebook',
					videoId: videoId || undefined,
				};
			}
		}

		// Vimeo
		if (hostname.includes('vimeo.com')) {
			const vimeoMatch = pathname.match(/\/(\d+)/);
			if (vimeoMatch) {
				const videoId = vimeoMatch[1];
				return {
					isVideo: true,
					embedUrl: `https://player.vimeo.com/video/${videoId}`,
					platform: 'vimeo',
					videoId,
				};
			}
		}

		// Use platform hint to help detection if URL parsing didn't work
		// BUT only if we can actually extract a video ID - don't mark as video just because platform matches
		if (platformHint) {
			const platformLower = platformHint.toLowerCase();

			// YouTube - only mark as video if we can extract video ID
			if (platformLower === 'youtube' || platformLower.includes('youtube')) {
				// Try to extract video ID one more time with simpler logic
				const simpleMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{8,})/);
				if (simpleMatch && simpleMatch[1]) {
					return {
						isVideo: true,
						embedUrl: `https://www.youtube.com/embed/${simpleMatch[1]}`,
						platform: 'youtube',
						videoId: simpleMatch[1],
					};
				}
				// Don't mark as video if we can't extract ID - YouTube has many non-video pages
			}

			// Instagram - only mark as video if URL contains /reel/ or /tv/ (video indicators)
			// Regular /p/ posts might be photos, not videos
			if (platformLower === 'instagram' || platformLower.includes('instagram')) {
				// Only mark as video if it's a reel or TV post, or if we can extract ID from reel/tv
				const reelMatch = url.match(/instagram\.com\/(reel|tv)\/([a-zA-Z0-9_-]+)/i);
				if (reelMatch && reelMatch[2]) {
					return {
						isVideo: true,
						embedUrl: `https://www.instagram.com/p/${reelMatch[2]}/embed/`,
						platform: 'instagram',
						videoId: reelMatch[2],
					};
				}
				// For /p/ posts, don't assume they're videos - they might be photos
			}

			// TikTok - only mark as video if URL contains /video/
			if (platformLower === 'tiktok' || platformLower.includes('tiktok')) {
				// Try simpler TikTok detection - must have /video/ in URL
				const simpleMatch = url.match(/tiktok\.com\/.*\/video\/(\d+)/);
				if (simpleMatch && simpleMatch[1]) {
					return {
						isVideo: true,
						embedUrl: `https://www.tiktok.com/embed/v2/${simpleMatch[1]}`,
						platform: 'tiktok',
						videoId: simpleMatch[1],
					};
				}
				// Don't mark as video if no /video/ in URL - TikTok has profile pages, etc.
			}

			// Facebook - only mark as video if URL has clear video indicators
			if (platformLower === 'facebook' || platformLower.includes('facebook')) {
				// Only mark as video if URL has /videos/, /reel/, /watch, or fb.watch
				if (url.includes('/videos/') || url.includes('/reel/') || url.includes('/watch') || url.includes('fb.watch')) {
					return {
						isVideo: true,
						embedUrl: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false&width=500`,
						platform: 'facebook',
					};
				}
				// Don't mark regular Facebook pages as videos
			}

			// Vimeo - only mark as video if we can extract video ID
			if (platformLower === 'vimeo' || platformLower.includes('vimeo')) {
				const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
				if (vimeoMatch && vimeoMatch[1]) {
					return {
						isVideo: true,
						embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`,
						platform: 'vimeo',
						videoId: vimeoMatch[1],
					};
				}
				// Don't mark as video if no video ID found
			}
		}

		// REMOVED: Final fallback that marks all video platform links as videos
		// This was too lenient and caused false positives

		return {
			isVideo: false,
			platform: 'unknown',
		};
	} catch (error) {
		return {
			isVideo: false,
			platform: 'unknown',
		};
	}
};

/**
 * Gets a display-friendly platform name
 */
export const getVideoPlatformName = (platform: VideoInfo['platform']): string => {
	const names: Record<VideoInfo['platform'], string> = {
		youtube: 'YouTube',
		instagram: 'Instagram Reel',
		tiktok: 'TikTok',
		facebook: 'Facebook Video',
		vimeo: 'Vimeo',
		unknown: 'Video',
	};
	return names[platform] || 'Video';
};

