// Axios client for API calls
import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL ||
        import.meta.env.REACT_APP_API_URL || 'http://localhost:5000/api',
    withCredentials: false
});

let unauthorizedHandler = null;

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response ? .status === 401 && unauthorizedHandler) {
            unauthorizedHandler();
        }
        return Promise.reject(error);
    }
);

export const setAuthToken = (token) => {
    if (token) {
        api.defaults.headers.common.Authorization = `Bearer ${token}`;
    } else {
        delete api.defaults.headers.common.Authorization;
    }
};

export const registerUnauthorizedHandler = (handler) => {
    unauthorizedHandler = handler;
};

export default api;