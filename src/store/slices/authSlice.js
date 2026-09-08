import { createSlice } from '@reduxjs/toolkit'

const getStoredUser = () => {
  try {
    const value = localStorage.getItem('ayush-user')
    return value ? JSON.parse(value) : null
  } catch {
    return null
  }
}

const initialState = {
  user: getStoredUser(),
  role: localStorage.getItem('ayush-role') || null,
  isAuthenticated: Boolean(localStorage.getItem('ayush-token')),
}

const authSlice = createSlice({
  name: 'auth',

  initialState,

  reducers: {
    login: (state, action) => {
      state.user = action.payload.user
      state.role = action.payload.role
      state.isAuthenticated = true

      localStorage.setItem(
        'ayush-user',
        JSON.stringify(action.payload.user)
      )

      localStorage.setItem(
        'ayush-role',
        action.payload.role
      )
    },

    logout: (state) => {
      state.user = null
      state.role = null
      state.isAuthenticated = false

      localStorage.removeItem('ayush-token')
      localStorage.removeItem('ayush-user')
      localStorage.removeItem('ayush-role')
    },
  },
})

export const { login, logout } = authSlice.actions

export default authSlice.reducer