// src/api.js
// ⚠️ מיקום הקובץ לא השתנה: הקומפוננטות ממשיכות להשתמש ב-`import api from '../api';`
//    אם הקובץ הקיים אצלך הוא src/api.js — החלף אותו.
//    אם הוא src/api/index.js — החלף את התוכן של אותו קובץ, בלי להזיז אותו.
import axios from 'axios';

// ✓ Vite (לא process.env של CRA)
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({ baseURL });

// ✓ הוספת ה-token לכל בקשה
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        // חשוב: כשמשתמשים ב-FormData, אין לקבוע Content-Type ידנית —
        // הדפדפן מוסיף boundary בעצמו.
        if (config.data instanceof FormData) {
            delete config.headers['Content-Type'];
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// טיפול בשגיאות אימות
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        }
        return Promise.reject(error);
    }
);

export default api;
