// API client for Express.js backend

/** Ensure API base is absolute. Host-only values become relative and double the domain. */
export function resolveApiBaseUrl(raw?: string): string {
  const fallback = 'http://localhost:3001/api';
  const value = (raw ?? '').trim().replace(/\/+$/, '');
  if (!value) return fallback;
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith('/')) return value;
  return `https://${value}`;
}

const API_URL = resolveApiBaseUrl(import.meta.env.VITE_API_URL);

function normalizeLink(link: Record<string, unknown>) {
  const isFavorite = Boolean(link.isFavorite ?? link.is_favorite ?? false);
  const remindAt = (link.remindAt ?? link.remind_at ?? null) as string | null;
  const tagsRaw = Array.isArray(link.tags) ? link.tags : [];
  const tags = tagsRaw
    .map((tag) => {
      if (typeof tag === 'string') return { id: tag, name: tag };
      if (tag && typeof tag === 'object') {
        const t = tag as { id?: string; name?: string; tag?: { id?: string; name?: string } };
        if (t.tag?.name) return { id: t.tag.id ?? t.tag.name, name: t.tag.name };
        if (t.name) return { id: t.id ?? t.name, name: t.name };
      }
      return null;
    })
    .filter((t): t is { id: string; name: string } => Boolean(t?.name));

  return {
    ...link,
    category_id: link.categoryId,
    categoryId: link.categoryId,
    isFavorite,
    is_favorite: isFavorite,
    remindAt,
    remind_at: remindAt,
    tags,
  };
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    // Load token from localStorage
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('auth_token', token);
      } else {
        localStorage.removeItem('auth_token');
      }
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: 'An error occurred',
      }));
      throw new Error(error.error || error.message || 'Request failed');
    }

    return response.json();
  }

  // Auth endpoints
  async register(email: string, password: string, fullName?: string) {
    const data = await this.request<{ user: any; token: string }>(
      '/auth/register',
      {
        method: 'POST',
        body: JSON.stringify({ email, password, fullName }),
      }
    );
    this.setToken(data.token);
    return data;
  }

  async login(email: string, password: string) {
    const data = await this.request<{ user: any; token: string }>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }
    );
    this.setToken(data.token);
    return data;
  }

  async getCurrentUser() {
    return this.request<{ user: any }>('/auth/me');
  }

  // Link endpoints
  async getLinks(filters?: {
    categoryId?: string;
    platform?: string;
    search?: string;
    favorite?: boolean;
    tag?: string;
    due?: 'true' | 'upcoming' | 'any';
  }) {
    const params = new URLSearchParams();
    if (filters?.categoryId) params.append('categoryId', filters.categoryId);
    if (filters?.platform) params.append('platform', filters.platform);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.favorite) params.append('favorite', 'true');
    if (filters?.tag) params.append('tag', filters.tag);
    if (filters?.due) params.append('due', filters.due);

    const query = params.toString();
    const response = await this.request<{ links: any[] }>(
      `/links${query ? `?${query}` : ''}`
    );
    // Transform response to match frontend expectations
    return {
      links: response.links.map((link: any) => normalizeLink(link)),
    };
  }

  async getLink(id: string) {
    const response = await this.request<{ link: any }>(`/links/${id}`);
    return { link: normalizeLink(response.link) };
  }

  async createLink(link: {
    url: string;
    title: string;
    description?: string;
    platform: string;
    categoryId?: string;
    isFavorite?: boolean;
    tags?: string[];
    remindAt?: string | null;
  }) {
    const response = await this.request<{ link: any }>('/links', {
      method: 'POST',
      body: JSON.stringify(link),
    });
    return { link: normalizeLink(response.link) };
  }

  async updateLink(
    id: string,
    link: {
      url?: string;
      title?: string;
      description?: string;
      platform?: string;
      categoryId?: string;
      isFavorite?: boolean;
      tags?: string[];
      remindAt?: string | null;
    }
  ) {
    const response = await this.request<{ link: any }>(`/links/${id}`, {
      method: 'PUT',
      body: JSON.stringify(link),
    });
    return { link: normalizeLink(response.link) };
  }

  async exportLinks(format: 'json' | 'csv' = 'json') {
    const url = `${this.baseUrl}/links/export?format=${format}`;
    const headers: HeadersInit = {};
    if (this.token) headers.Authorization = `Bearer ${this.token}`;
    const response = await fetch(url, { headers });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Export failed' }));
      throw new Error(error.error || 'Export failed');
    }
    if (format === 'csv') {
      return { blob: await response.blob(), filename: 'links-export.csv' };
    }
    return { json: await response.json(), filename: 'links-export.json' };
  }

  async importLinks(links: Array<Record<string, unknown>>) {
    return this.request<{ imported: number; skipped: number; errors: string[] }>(
      '/links/import',
      {
        method: 'POST',
        body: JSON.stringify({ links }),
      }
    );
  }

  async getTags() {
    return this.request<{
      tags: Array<{ id: string; name: string; count: number; createdAt: string }>;
    }>('/tags');
  }

  async deleteTag(id: string) {
    return this.request<{ message: string }>(`/tags/${id}`, { method: 'DELETE' });
  }

  async toggleLinkFavorite(id: string, isFavorite: boolean) {
    const response = await this.request<{ link: any }>(`/links/${id}/favorite`, {
      method: 'PATCH',
      body: JSON.stringify({ isFavorite }),
    });
    return { link: normalizeLink(response.link) };
  }

  async deleteLink(id: string) {
    return this.request<{ message: string }>(`/links/${id}`, {
      method: 'DELETE',
    });
  }

	/** Public: turn Facebook `/share/r/...` (etc.) into the canonical `.../reel/...` URL for embeds. */
	async resolveFacebookShareUrl(url: string): Promise<{ url: string }> {
		const qs = new URLSearchParams({ url }).toString();
		const headers: HeadersInit = {};
		if (this.token) {
			headers.Authorization = `Bearer ${this.token}`;
		}
		const candidates = [
			`${this.baseUrl}/metadata/resolve-facebook-url?${qs}`,
			`${this.baseUrl}/fb-share-resolve?${qs}`,
		];
		let lastStatus = 0;
		for (const fullUrl of candidates) {
			const response = await fetch(fullUrl, { method: "GET", headers });
			lastStatus = response.status;
			if (response.ok) {
				return response.json() as Promise<{ url: string }>;
			}
		}
		const err = { error: `Resolve failed (${lastStatus})` };
		throw new Error(err.error);
	}

	// Metadata extraction endpoint - uses AI to generate title and description
	async extractMetadata(url: string, content?: string) {
		// This endpoint doesn't require authentication
		const response = await fetch(`${this.baseUrl}/metadata/extract`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ url, content }),
		});

		if (!response.ok) {
			const error = await response.json().catch(() => ({
				error: 'Failed to extract metadata',
			}));
			throw new Error(error.error || error.message || 'Request failed');
		}

		return response.json();
	}

  // Category endpoints
  async getCategories() {
    const response = await this.request<{ categories: any[] }>('/categories');
    // Transform response to match frontend expectations
    return {
      categories: response.categories.map((cat: any) => ({
        ...cat,
        // Normalize parent id strictly (avoid `||` dropping null → undefined)
        parent_id: cat.parentId ?? cat.parent_id ?? null,
        parentId: cat.parentId ?? cat.parent_id ?? null,
      })),
    };
  }

  async getCategory(id: string) {
    return this.request<{ category: any }>(`/categories/${id}`);
  }

  async createCategory(category: {
    name: string;
    color?: string;
    parentId?: string;
  }) {
    return this.request<{ category: any }>('/categories', {
      method: 'POST',
      body: JSON.stringify(category),
    });
  }

  async updateCategory(
    id: string,
    category: {
      name?: string;
      color?: string;
      parentId?: string;
    }
  ) {
    return this.request<{ category: any }>(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(category),
    });
  }

  async deleteCategory(id: string) {
    return this.request<{ message: string }>(`/categories/${id}`, {
      method: 'DELETE',
    });
  }

  // User endpoints
  async getUserProfile() {
    return this.request<{ user: any }>('/users/profile');
  }

  // Public stats endpoint (no authentication required)
  async getPublicStats() {
    const response = await fetch(`${this.baseUrl}/public/stats`);
    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: 'Failed to fetch public stats',
      }));
      throw new Error(error.error || error.message || 'Request failed');
    }
    return response.json() as Promise<{
      stats: {
        totalUsers: number;
        totalLinks: number;
        totalCategories: number;
        totalPlatforms: number;
        linksLast24Hours: number;
      };
      generatedAt: string;
    }>;
  }

  async updateUserProfile(profile: {
    fullName?: string;
    avatarUrl?: string;
  }) {
    return this.request<{ user: any }>('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(profile),
    });
  }
}

export const api = new ApiClient(API_URL);
