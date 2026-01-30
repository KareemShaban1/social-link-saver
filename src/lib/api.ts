// API client for Express.js backend

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

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
  }) {
    const params = new URLSearchParams();
    if (filters?.categoryId) params.append('categoryId', filters.categoryId);
    if (filters?.platform) params.append('platform', filters.platform);
    if (filters?.search) params.append('search', filters.search);

    const query = params.toString();
    const response = await this.request<{ links: any[] }>(
      `/links${query ? `?${query}` : ''}`
    );
    // Transform response to match frontend expectations
    return {
      links: response.links.map((link: any) => ({
        ...link,
        category_id: link.categoryId,
        categoryId: link.categoryId,
      })),
    };
  }

  async getLink(id: string) {
    return this.request<{ link: any }>(`/links/${id}`);
  }

  async createLink(link: {
    url: string;
    title: string;
    description?: string;
    platform: string;
    categoryId?: string;
  }) {
    return this.request<{ link: any }>('/links', {
      method: 'POST',
      body: JSON.stringify(link),
    });
  }

  async updateLink(
    id: string,
    link: {
      url?: string;
      title?: string;
      description?: string;
      platform?: string;
      categoryId?: string;
    }
  ) {
    return this.request<{ link: any }>(`/links/${id}`, {
      method: 'PUT',
      body: JSON.stringify(link),
    });
  }

  async deleteLink(id: string) {
    return this.request<{ message: string }>(`/links/${id}`, {
      method: 'DELETE',
    });
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
