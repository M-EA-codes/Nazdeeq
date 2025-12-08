import config from './config';

const API_BASE_URL = config.API_URL;

type ApiRequestOptions = RequestInit & {
  params?: Record<string, any>;
};

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private buildQuery(params?: Record<string, any>) {
    if (!params) return '';

    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      if (Array.isArray(value)) {
        value.forEach((v) => searchParams.append(key, String(v)));
      } else {
        searchParams.append(key, String(value));
      }
    });

    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : '';
  }

  async request(endpoint: string, options: ApiRequestOptions = {}) {
    const { params, ...fetchOptions } = options;
    const url = `${this.baseURL}${endpoint}${this.buildQuery(params)}`;

    const defaultHeaders = {
      'Content-Type': 'application/json',
    };

    const config: RequestInit = {
      ...fetchOptions,
      headers: {
        ...defaultHeaders,
        ...fetchOptions.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          (data && (data.message || data.error)) ||
          `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(message);
      }

      // Return an axios-like shape to match existing caller expectations
      return {
        data,
        status: response.status,
        ok: response.ok,
      };
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  async get(endpoint: string, options: ApiRequestOptions = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  async post(endpoint: string, data?: any, options: ApiRequestOptions = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put(endpoint: string, data?: any, options: ApiRequestOptions = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete(endpoint: string, options: ApiRequestOptions = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
}

const api = new ApiClient(API_BASE_URL);
export default api;
