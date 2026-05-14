import axios from 'axios';

// יוצרים מופע של Axios עם כתובת הבסיס של השרת
// דוגמה לקוד ב-Frontend
const API_URL = import.meta.env.VITE_API_URL || 'https://node-project-cvek.onrender.com';

// ואז בבקשה (fetch/axios):
fetch(`${API_URL}/api/auth/register`, { ... });

// הגדרה גלובלית: הוספת ה-Token (JWT) אוטומטית לכל בקשה שיוצאת לשרת
const api = axios.create({
  baseURL: API_URL
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;