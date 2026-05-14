import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

export default function ProtectedRoute({ children, adminOnly = false }) {
  // מושכים את המשתמש המחובר מה-Redux
  const { currentUser } = useSelector((state) => state.user);
  
  const isLoggedIn = currentUser && Object.keys(currentUser).length > 0;
  const isAdmin = currentUser?.role === 'admin';

  // אם המשתמש לא מחובר בכלל - זורקים אותו לעמוד ההתחברות
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  // אם העמוד מיועד למנהלים בלבד, והמשתמש הוא לא מנהל - זורקים אותו לספרייה
  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  // אם הכל תקין, מציגים את העמוד המבוקש
  return children;
}