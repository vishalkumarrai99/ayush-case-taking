
import { configureStore } from '@reduxjs/toolkit'

import authReducer from './slices/authSlice'
import caseReducer from './slices/caseSlice'

import {
  loadCaseState,
  saveCaseState,
} from './localStorage'

const preloadedState = loadCaseState()

export const store = configureStore({
  reducer: {
    auth: authReducer,
    case: caseReducer,
  },

  preloadedState,

  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
})

store.subscribe(() => {
  saveCaseState(store.getState().case)
})

