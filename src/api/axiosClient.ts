// src/api/axiosClient.ts (tiếp)
import axios from 'axios';
import { useAuthStore } from '@store/useAuthStore';
import { API_BASE_URL } from '@constants/api';

const axiosClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: { 'Content-Type': 'application/json' },
});

// REQUEST INTERCEPTOR: Chạy TRƯỚC mỗi Request — tự động lấy Token từ Zustand và gắn vào Header
axiosClient.interceptors.request.use((config) => {
    const token = useAuthStore.getState().token; // Lấy State ngay lập tức, không cần Hook/Component
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// RESPONSE INTERCEPTOR: Chạy KHI Response về — bắt lỗi 401 (Token hết hạn) tập trung một chỗ
axiosClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            console.warn('⚠️ Token hết hạn hoặc không hợp lệ — tự động đăng xuất!');
            useAuthStore.getState().logout(); // Bắn logout ngay, không cần chờ UI xử lý
        }
        return Promise.reject(error);
    }
);

export default axiosClient;