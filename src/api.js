import axios from 'axios';

// כתובת בסיס לשרת - כולל את קידומת ה-/api שהשרת מצפה לה
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://node-project-cvek.onrender.com/api';

// מופע axios מרכזי לכל האפליקציה
const api = axios.create({
  baseURL: API_BASE_URL,
});

// מוסיף אוטומטית את טוקן ההתחברות (אם קיים) לכל בקשה יוצאת
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// אם מתקבלת תשובת 401 (טוקן פג/לא תקין) - מנקים את הסשן המקומי
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

export default api;

// נשמר לשם תאימות לאחור עם קוד ישן שמייבא את הפונקציה הזו בשמה
export const getAllSeries = async () => {
  const response = await api.get('/series');
  return response.data?.data?.series || [];
};