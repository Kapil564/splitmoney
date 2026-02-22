import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// ======================== API URL Resolution ========================
// Priority: 1) EXPO_PUBLIC_API_URL env var  2) Expo dev host IP  3) platform default
const resolveApiUrl = (): string => {
  // Expo env var (set in .env or app.json extra)
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) return envUrl;

  // Reuse the IP that Expo dev server is already serving from
  const debuggerHost =
    Constants.expoConfig?.hostUri ??
    (Constants as any).manifest?.debuggerHost;
  if (debuggerHost) {
    const ip = debuggerHost.split(':')[0];
    return `http://${ip}:5000/api`;
  }

  // Android emulator → 10.0.2.2 maps to host machine localhost
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000/api';
  }

  return 'http://localhost:5000/api';
};

export const API_URL = resolveApiUrl();
const TOKEN_KEY = 'auth_token';
const REQUEST_TIMEOUT = 15_000; // 15 s

// ======================== Token Management ========================
export const getToken = async (): Promise<string | null> =>
  AsyncStorage.getItem(TOKEN_KEY);

export const setToken = async (token: string): Promise<void> =>
  AsyncStorage.setItem(TOKEN_KEY, token);

export const removeToken = async (): Promise<void> =>
  AsyncStorage.removeItem(TOKEN_KEY);

// ======================== Base Request ========================
const apiRequest = async <T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = await getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_URL}${endpoint}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Guard against non-JSON responses (e.g. HTML error pages)
    const ct = response.headers.get('content-type');
    if (!ct || !ct.includes('application/json')) {
      if (!response.ok) throw new Error(`Server error (${response.status})`);
      return {} as T;
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || `Request failed (${response.status})`);
    }

    return data;
  } catch (error: any) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      throw new Error('Request timed out. Check your connection and try again.');
    }
    if (error.message === 'Network request failed') {
      throw new Error(
        'Cannot reach the server. Make sure the backend is running and your device is on the same network.'
      );
    }
    throw error;
  }
};

// ======================== Health Check ========================
export const checkBackendHealth = async (): Promise<boolean> => {
  try {
    const data = await apiRequest<{ status: string }>('/health');
    return data.status === 'ok';
  } catch {
    return false;
  }
};

// ======================== Auth API ========================
export const authAPI = {
  signUp: async (
    email: string,
    password: string,
    userData: {
      first_name: string;
      last_name: string;
      phone?: string;
      username?: string;
      default_currency?: string;
    }
  ) => {
    const data = await apiRequest('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, ...userData }),
    });
    await setToken(data.token);
    return data;
  },

  signIn: async (email: string, password: string) => {
    const data = await apiRequest('/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    await setToken(data.token);
    return data;
  },

  signOut: async () => {
    await removeToken();
  },

  getMe: () => apiRequest('/auth/me'),

  updateProfile: (updates: Record<string, any>) =>
    apiRequest('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),

  forgotPassword: (email: string) =>
    apiRequest('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  changePassword: (currentPassword: string, newPassword: string) =>
    apiRequest('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
};

// ======================== Friends API ========================
export const friendsAPI = {
  getAll: () => apiRequest('/friends'),

  getPending: () => apiRequest('/friends/pending'),

  sendRequest: (email: string) =>
    apiRequest('/friends/request', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  acceptRequest: (friendshipId: string) =>
    apiRequest(`/friends/${friendshipId}/accept`, { method: 'PUT' }),

  remove: (friendshipId: string) =>
    apiRequest(`/friends/${friendshipId}`, { method: 'DELETE' }),
};

// ======================== Groups API ========================
export const groupsAPI = {
  getAll: () => apiRequest('/groups'),

  getById: (groupId: string) => apiRequest(`/groups/${groupId}`),

  create: (groupData: {
    name: string;
    type?: string;
    currency?: string;
    simplify_debts?: boolean;
    member_ids?: string[];
  }) =>
    apiRequest('/groups', {
      method: 'POST',
      body: JSON.stringify(groupData),
    }),

  update: (groupId: string, updates: Record<string, any>) =>
    apiRequest(`/groups/${groupId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),

  addMember: (groupId: string, userId: string) =>
    apiRequest(`/groups/${groupId}/members`, {
      method: 'POST',
      body: JSON.stringify({ user_id: userId }),
    }),

  delete: (groupId: string) =>
    apiRequest(`/groups/${groupId}`, { method: 'DELETE' }),
};

// ======================== Expenses API ========================
export const expensesAPI = {
  getAll: (groupId?: string) => {
    const query = groupId ? `?group_id=${groupId}` : '';
    return apiRequest(`/expenses${query}`);
  },

  getById: (expenseId: string) => apiRequest(`/expenses/${expenseId}`),

  create: (expenseData: {
    description: string;
    amount: number;
    currency?: string;
    category?: string;
    date?: string;
    group_id?: string;
    notes?: string;
    payers?: { user_id: string; amount_paid: number }[];
    splits?: { user_id: string; amount_owed: number }[];
  }) =>
    apiRequest('/expenses', {
      method: 'POST',
      body: JSON.stringify(expenseData),
    }),

  update: (expenseId: string, updates: Record<string, any>) =>
    apiRequest(`/expenses/${expenseId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),

  delete: (expenseId: string) =>
    apiRequest(`/expenses/${expenseId}`, { method: 'DELETE' }),
};

// ======================== Settlements API ========================
export const settlementsAPI = {
  getAll: (groupId?: string) => {
    const query = groupId ? `?group_id=${groupId}` : '';
    return apiRequest(`/settlements${query}`);
  },

  create: (settlementData: {
    to_user_id: string;
    amount: number;
    currency?: string;
    payment_method?: string;
    group_id?: string;
    notes?: string;
  }) =>
    apiRequest('/settlements', {
      method: 'POST',
      body: JSON.stringify(settlementData),
    }),
};

// ======================== Notifications API ========================
export const notificationsAPI = {
  getAll: () => apiRequest('/notifications'),

  markRead: (notificationId: string) =>
    apiRequest(`/notifications/${notificationId}/read`, { method: 'PUT' }),

  markAllRead: () =>
    apiRequest('/notifications/read-all', { method: 'PUT' }),
};
