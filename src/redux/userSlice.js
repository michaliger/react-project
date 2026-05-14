import { createSlice } from '@reduxjs/toolkit';

// מנסים לשלוף משתמש קיים מהזיכרון המקומי כדי שאם נעשה רענון לדף, נישאר מחוברים
const storedUser = JSON.parse(localStorage.getItem('user') || 'null');

const initialState = {
  currentUser: storedUser,
  isAuthenticated: !!storedUser,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    loginUser: (state, action) => {
      state.currentUser = action.payload;
      state.isAuthenticated = true;
      localStorage.setItem('user', JSON.stringify(action.payload));
    },
    logoutUser: (state) => {
      state.currentUser = null;
      state.isAuthenticated = false;
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    },
  },
});

export const { loginUser, logoutUser } = userSlice.actions;
export default userSlice.reducer;