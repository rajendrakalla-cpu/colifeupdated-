'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, usersApi } from './api';

interface User {
    id: string;
    name: string;
    phone: string;
    email?: string;
    role: string;
    gender?: string;
    avatar?: string;
    kycStatus?: string;
    isActive: boolean;
}

interface AuthState {
    user: User | null;
    token: string | null;
    loading: boolean;
    isLoggedIn: boolean;
    login: (phone: string, otp: string) => Promise<{ user: User; isNew: boolean }>;
    register: (data: { phone: string; name: string; role?: string }) => Promise<User>;
    logout: () => void;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
    user: null,
    token: null,
    loading: true,
    isLoggedIn: false,
    login: async () => ({ user: {} as User, isNew: false }),
    register: async () => ({} as User),
    logout: () => { },
    refreshUser: async () => { },
});

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Load token on mount and fetch user
    useEffect(() => {
        const savedToken = localStorage.getItem('colife_token');
        if (savedToken) {
            setToken(savedToken);
            usersApi.getMe()
                .then((res: any) => {
                    // The getMe API returns { user: {...}, properties/bookings: [...] }
                    const userData = res?.user || res;
                    setUser(userData);
                })
                .catch(() => {
                    localStorage.removeItem('colife_token');
                    localStorage.removeItem('colife_refresh');
                })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (phone: string, otp: string) => {
        const res = await authApi.verifyOtp(phone, otp);

        if (!res.isRegistered) {
            // New user — store tempToken for registration step
            localStorage.setItem('colife_temp_token', phone);
            return { user: { phone } as User, isNew: true };
        }

        // Existing user — store access tokens and fetch profile
        localStorage.setItem('colife_token', res.accessToken);
        localStorage.setItem('colife_refresh', res.refreshToken);
        setToken(res.accessToken);

        let userData = res.user;
        if (!userData?.id) {
            try { userData = await usersApi.getMe(); } catch { /* ignore */ }
        }
        if (userData) setUser(userData);

        return { user: userData || ({ phone } as User), isNew: false };
    };

    const register = async (data: { phone: string; name: string; role?: string }) => {
        // Use tempToken from login flow for new user registration
        const tempToken = localStorage.getItem('colife_temp_token');
        const headers: Record<string, string> = {};
        if (tempToken) headers['Authorization'] = `Bearer ${tempToken}`;

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/v1/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...headers },
            body: JSON.stringify(data),
        }).then(async r => {
            if (!r.ok) {
                const errorData = await r.json().catch(() => ({}));
                throw new Error(errorData.message || 'Registration failed');
            }
            return r.json();
        });

        if (res.accessToken) {
            localStorage.setItem('colife_token', res.accessToken);
            localStorage.removeItem('colife_temp_token');
            if (res.refreshToken) localStorage.setItem('colife_refresh', res.refreshToken);
            setToken(res.accessToken);
        }
        const userData = res.user;
        if (userData) setUser(userData);
        return userData;
    };

    const logout = () => {
        localStorage.removeItem('colife_token');
        localStorage.removeItem('colife_refresh');
        setToken(null);
        setUser(null);
        window.location.href = '/';
    };

    const refreshUser = async () => {
        const res: any = await usersApi.getMe();
        setUser(res?.user || res);
    };

    return (
        <AuthContext.Provider value={{
            user, token, loading,
            isLoggedIn: !!user,
            login, register, logout, refreshUser,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
