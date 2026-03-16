const BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

interface ApiOptions {
    headers?: Record<string, string>;
    body?: unknown;
}

function getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('colife_token');
}

async function request<T>(method: string, path: string, opts?: ApiOptions): Promise<T> {
    const token = getToken();
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...opts?.headers,
    };

    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${BASE_URL}${path}`, {
        method,
        headers,
        body: opts?.body ? JSON.stringify(opts.body) : undefined,
    });

    if (!res.ok) {
        const error = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(error.message || `API Error ${res.status}`);
    }

    // Handle 204 No Content
    if (res.status === 204) return {} as T;
    return res.json();
}

export const api = {
    get: <T>(path: string) => request<T>('GET', path),
    post: <T>(path: string, body?: unknown) => request<T>('POST', path, { body }),
    patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, { body }),
    delete: <T>(path: string) => request<T>('DELETE', path),
};

// ─── Auth API ───
export const authApi = {
    sendOtp: (phone: string) => api.post<{ message: string }>('/api/v1/auth/send-otp', { phone }),
    verifyOtp: (firebaseIdToken: string) =>
        api.post<any>('/api/v1/auth/verify-otp', { firebaseIdToken }),
    register: (data: { phone: string; name: string; role?: string }) =>
        api.post<{ accessToken: string; user: any }>('/api/v1/auth/register', data),
    refresh: (refreshToken: string) =>
        api.post<{ accessToken: string }>('/api/v1/auth/refresh', { refreshToken }),
};

// ─── Users API ───
export const usersApi = {
    getMe: () => api.get<any>('/api/v1/users/me'),
    updateMe: (data: any) => api.patch<any>('/api/v1/users/me', data),
};

// ─── Properties API ───
export const propertiesApi = {
    search: (params?: Record<string, string>) => {
        const qs = params ? '?' + new URLSearchParams(params).toString() : '';
        return api.get<{ properties: any[]; total: number; page: number }>(`/api/v1/properties${qs}`);
    },
    getById: (id: string) => api.get<any>(`/api/v1/properties/${id}`),
    getOwnerProperty: (id: string) => api.get<{ property: any, metrics: any, payments: any[] }>(`/api/v1/owner/properties/${id}`),
    create: (data: any) => api.post<any>('/api/v1/properties', data),
    assignBed: (propertyId: string, data: any) =>
        api.post<any>(`/api/v1/owner/properties/${propertyId}/assign-bed`, data),
    confirmBooking: (propertyId: string, data: { bookingId: string; depositAmount?: number; rentAmount: number; paymentMethod: 'CASH' | 'LINK'; splitPayment?: boolean }) =>
        api.post<any>(`/api/v1/owner/properties/${propertyId}/confirm-booking`, data),
    tenantLookup: (phone: string) =>
        api.get<{ found: boolean; user?: any }>(`/api/v1/owner/tenant-lookup?phone=${encodeURIComponent(phone)}`),
};

// ─── Bookings API ───
export const bookingsApi = {
    create: (data: any) => api.post<any>('/api/v1/bookings', data),
    initiate: (data: { propertyId: string; moveInDate?: string }) =>
        api.post<any>('/api/v1/bookings/initiate', data),
    getAll: () => api.get<{ bookings: any[] }>('/api/v1/bookings'),
    getById: (id: string) => api.get<any>(`/api/v1/bookings/${id}`),
    confirm: (id: string) => api.patch<any>(`/api/v1/bookings/${id}/confirm`),
    cancel: (id: string) => api.patch<any>(`/api/v1/bookings/${id}/cancel`),
};

// ─── Tickets API ───
export const ticketsApi = {
    create: (data: any) => api.post<any>('/api/v1/tickets', data),
    getAll: () => api.get<{ tickets: any[] }>('/api/v1/tickets'),
    getById: (id: string) => api.get<any>(`/api/v1/tickets/${id}`),
    update: (id: string, data: any) => api.patch<any>(`/api/v1/tickets/${id}`, data),
};

// ─── Payments API ───
export const paymentsApi = {
    createOrder: (paymentId: string) => api.post<any>('/api/v1/payments/create-order', { paymentId }),
    verify: (data: any) => api.post<any>('/api/v1/payments/verify', data),
    getHistory: () => api.get<{ payments: any[] }>('/api/v1/payments'),
    collectRent: (data: { bookingId: string, amount: number, method: 'CASH' | 'LINK' }) => api.post<any>('/api/v1/payments/collect', data),
};

// ─── Notifications API ───
export const notificationsApi = {
    getAll: (page = 1) => api.get<{ notifications: any[]; unreadCount: number }>(`/api/v1/notifications?page=${page}`),
    markRead: (id: string) => api.patch<void>(`/api/v1/notifications/${id}/read`),
    markAllRead: () => api.patch<void>('/api/v1/notifications/read-all'),
};

// ─── Community API ───
export const communityApi = {
    getFeed: (propertyId: string) => api.get<{ posts: any[] }>(`/api/v1/community/${propertyId}`),
    createPost: (propertyId: string, data: any) => api.post<any>(`/api/v1/community/${propertyId}`, data),
    deletePost: (propertyId: string, postId: string) => api.delete<void>(`/api/v1/community/${propertyId}/${postId}`),
    rsvp: (propertyId: string, postId: string, status: string) =>
        api.post<any>(`/api/v1/community/${propertyId}/rsvp`, { postId, status }),
};

// ─── Admin API ───
export const adminApi = {
    getStats: () => api.get<any>('/api/v1/admin/stats'),
    getUsers: (params?: Record<string, string>) => {
        const qs = params ? '?' + new URLSearchParams(params).toString() : '';
        return api.get<{ users: any[] }>(`/api/v1/admin/users${qs}`);
    },
    createUser: (data: any) => api.post<any>('/api/v1/admin/users', data),
    updateUser: (id: string, data: any) => api.patch<any>(`/api/v1/admin/users/${id}`, data),
    getPayments: () => api.get<{ payments: any[]; totalRevenue?: number; platformRevenue?: number }>('/api/v1/admin/payments'),
    updateProperty: (id: string, data: any) => api.patch<any>(`/api/v1/admin/properties/${id}`, data),
};

// ─── AI API ───
export const aiApi = {
    getRecommendations: (limit = 10) => api.get<any[]>(`/api/v1/ai/recommendations?limit=${limit}`),
    getSuggestedPrice: (roomId: string) => api.get<any>(`/api/v1/ai/pricing/${roomId}`),
    applySuggestedPrice: (roomId: string) => api.post<any>(`/api/v1/ai/pricing/${roomId}/apply`),
    getCompatibility: (u1: string, u2: string) => api.get<any>(`/api/v1/ai/compatibility?userId1=${u1}&userId2=${u2}`),
};
