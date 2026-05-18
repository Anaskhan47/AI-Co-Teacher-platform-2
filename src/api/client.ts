import axios from 'axios';
import { toast } from 'sonner';

export interface ApiResponse<T = any> {
    success: boolean;
    data: T;
    error: string | null;
}

const api = axios.create({
    baseURL: '/api',
    timeout: 90000, // 90 seconds for AI synthesis
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Standardized Response & Error Interceptor
api.interceptors.response.use(
    (response: any) => {
        // Backend contract: always return the envelope `{ success, data, error, meta }`
        // Enforce strict client-side normalization & validation before it reaches any call-sites
        const rawData = response.data;
        const normalized = {
            success: Boolean(rawData?.success),
            data: rawData?.data ?? {},
            error: rawData?.error ?? null,
            meta: rawData?.meta ?? {}
        };
        
        return normalized as any;
    },
    (error) => {
        const errorResponse = error.response?.data;
        const errorMsg = errorResponse?.error?.message || errorResponse?.error || error.message || 'System error occurred';
        
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user_data');
            // Avoid redirect loops if already on login
            if (!window.location.pathname.includes('/login')) {
                window.location.href = '/login';
            }
        } else if (error.response?.status === 403) {
            toast.error("Security: Access denied to this protocol.");
        } else {
            toast.error(errorMsg);
        }
        
        // Return normalized failure envelope to satisfy client call-sites defensively
        return Promise.reject({
            success: false,
            data: null,
            error: {
                code: error.response?.data?.error?.code || 'NETWORK_FAILURE',
                message: errorMsg
            },
            meta: {}
        });
    }
);

export default api;
