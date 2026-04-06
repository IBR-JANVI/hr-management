const DEFAULT_FETCH_TIMEOUT = 10000;

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function fetchWithTimeout(url, options = {}, timeout = DEFAULT_FETCH_TIMEOUT) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError' || (error instanceof DOMException && error.name === 'AbortError')) {
      throw new Error('Request timed out');
    }
    throw error;
  }
}

async function handleResponse(response) {
  const contentType = response.headers.get('content-type');
  let data;

  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const message = typeof data === 'string' && data.trim() ? data.trim() : (data?.message || 'An error occurred');
    throw new ApiError(
      message,
      response.status,
      data
    );
  }

  return data;
}

class TimeoutError extends Error {
  constructor(message) {
    super(message);
    this.name = 'TimeoutError';
  }
}

async function refreshAccessToken() {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) {
    throw new Error('No refresh token');
  }
  
  const response = await fetch(`${API_URL}/api/v1/auth/tokens`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  
  if (!response.ok) {
    throw new Error('Token refresh failed');
  }
  
  const data = await response.json();
  return data.data?.accessToken;
}

export async function apiClient(endpoint, options = {}, retry = true) {
  const token = localStorage.getItem('accessToken');

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetchWithTimeout(`${API_URL}/api/v1${endpoint}`, config);
    
    if (response.status === 401 && retry) {
      try {
        const newAccessToken = await refreshAccessToken();
        if (newAccessToken) {
          localStorage.setItem('accessToken', newAccessToken);
          headers.Authorization = `Bearer ${newAccessToken}`;
          const retryConfig = { ...config, headers };
          const retryResponse = await fetchWithTimeout(`${API_URL}/api/v1${endpoint}`, retryConfig);
          return handleResponse(retryResponse);
        }
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
      }
    }
    
    return handleResponse(response);
  } catch (error) {
    if (error.message === 'Request timed out') {
      throw new TimeoutError('Request timed out');
    }
    throw error;
  }
}

export const api = {
  get: (endpoint, options = {}) =>
    apiClient(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, data, options = {}) =>
    apiClient(endpoint, { ...options, method: 'POST', body: JSON.stringify(data) }),
  put: (endpoint, data, options = {}) =>
    apiClient(endpoint, { ...options, method: 'PUT', body: JSON.stringify(data) }),
  patch: (endpoint, data, options = {}) =>
    apiClient(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(data) }),
  delete: (endpoint, options = {}) =>
    apiClient(endpoint, { ...options, method: 'DELETE' }),
};

export default api;
