import axios from 'axios';

// הגדרת כתובת השרת - משתמש במשתנה סביבה או בכתובת הישירה של Render
const API_URL = import.meta.env.VITE_API_URL || 'https://node-project-cvek.onrender.com/api';

// יצירת מופע של Axios
const api = axios.create({
  baseURL: API_URL
});

// הוספת ה-Token לכל בקשה באופן אוטומטי
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