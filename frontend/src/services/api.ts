import axios from 'axios';
import { useAuthStore } from '@/store/auth.store';
import { toast } from 'sonner';

// Create axios instance
const api = axios.create({
    baseURL: '/api', // Vite proxy will handle this
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor for API calls
api.interceptors.request.use(
    (config) => {
        const token = useAuthStore.getState().token;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for API calls
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (!error.response) {
            toast.error("Internet aloqasi yo'q. Qayta urinib ko'ring.");
            return Promise.reject(error);
        }

        const status = error.response.status;

        // Handle 401 Unauthorized
        if (status === 401 && !originalRequest._retry) {
            useAuthStore.getState().logout();
            // Optional: Redirect to login
            window.location.href = '/login';
            return Promise.reject(error);
        }

        // Handle 403 Forbidden
        if (status === 403) {
            toast.error("Sizda bu amalni bajarish uchun ruxsat yo'q.");
            return Promise.reject(error);
        }

        // Handle other errors (500, 400, etc)
        // Hide technical error messages, show user friendly ones
        if (status >= 500) {
            toast.error("Serverda xatolik yuz berdi. Birozdan so'ng urinib ko'ring.");
        } else if (status >= 400) {
            const message = error.response.data?.message;
            // Check if message is a clean string (not a stack trace or code)
            if (message && typeof message === 'string' && !message.includes('Error') && !message.includes('Exception') && message.length < 100) {
                toast.error(message);
            } else {
                toast.error("Xatolik yuz berdi. Ma'lumotlarni tekshirib qayta urinib ko'ring.");
            }
        }

        return Promise.reject(error);
    }
);

export default api;
