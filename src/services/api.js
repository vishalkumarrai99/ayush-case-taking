const API_BASE_URL = '/api'

export const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('ayush-token')

  const isAuthRequest =
    endpoint === '/auth/login' ||
    endpoint === '/auth/register'

  const headers = {
    ...(options.body instanceof FormData
      ? {}
      : { 'Content-Type': 'application/json' }),
    ...(options.headers || {}),
  }

  if (token && !isAuthRequest) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(
      data?.message ||
        data?.error ||
        `Request failed with status ${response.status}`
    )
  }

  return data
}

// =========================================================
// AUTH
// =========================================================

export const loginUser = async (credentials) => {
  return apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  })
}

export const registerUser = async (userData) => {
  return apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  })
}

// =========================================================
// CASES
// =========================================================

export const submitPatientCase = async (caseData) => {
  return apiRequest('/cases', {
    method: 'POST',
    body: JSON.stringify(caseData),
  })
}

export const getMyCases = async () => {
  return apiRequest('/cases/my', {
    method: 'GET',
  })
}

export const getCaseById = async (caseId) => {
  return apiRequest(`/cases/${caseId}`, {
    method: 'GET',
  })
}

// =========================================================
// MEDICAL DOCUMENTS
// =========================================================

export const uploadMedicalDocument = async ({ caseId, file }) => {
  if (!caseId) {
    throw new Error(
      'Case ID is required before uploading a medical document.'
    )
  }

  if (!file) {
    throw new Error('Please select a medical document.')
  }

  const formData = new FormData()
  formData.append('file', file)

  return apiRequest(`/documents/upload/${caseId}`, {
    method: 'POST',
    body: formData,
  })
}

export const getCaseMedicalDocuments = async (caseId) => {
  if (!caseId) {
    throw new Error('Case ID is required.')
  }

  return apiRequest(`/documents/case/${caseId}`, {
    method: 'GET',
  })
}

export const getMyMedicalDocuments = async () => {
  return []
}

export const getMedicalDocument = async (documentId) => {
  return apiRequest(`/documents/${documentId}`, {
    method: 'GET',
  })
}

export const getMedicalDocumentFile = async (documentId) => {
  return apiRequest(`/documents/${documentId}/file`, {
    method: 'GET',
  })
}

// =========================================================
// PATIENT CONSENT
// =========================================================

export const givePatientConsent = async (consentData) => {
  return apiRequest('/consents', {
    method: 'POST',
    body: JSON.stringify(consentData),
  })
}

export const getMyConsent = async () => {
  return apiRequest('/consents/my', {
    method: 'GET',
  })
}

export const getLatestConsent = async () => {
  return apiRequest('/consents/my/latest', {
    method: 'GET',
  })
}

// =========================================================
// ABHA
// =========================================================

export const saveAbhaProfile = async (abhaData) => {
  return apiRequest('/abha/profile', {
    method: 'POST',
    body: JSON.stringify(abhaData),
  })
}

export const getMyAbhaProfile = async () => {
  return apiRequest('/abha/profile/my', {
    method: 'GET',
  })
}

export const checkAbhaProfileExists = async () => {
  return apiRequest('/abha/profile/my/exists', {
    method: 'GET',
  })
}

// =========================================================
// NOTIFICATIONS
// =========================================================

export const getMyNotifications = async () => {
  return apiRequest('/notifications/my', {
    method: 'GET',
  })
}

export const getUnreadNotifications = async () => {
  return apiRequest('/notifications/my/unread', {
    method: 'GET',
  })
}

export const getUnreadNotificationCount = async () => {
  return apiRequest('/notifications/my/unread/count', {
    method: 'GET',
  })
}

export const markNotificationRead = async (notificationId) => {
  return apiRequest(`/notifications/${notificationId}/read`, {
    method: 'PUT',
  })
}

export const markAllNotificationsRead = async () => {
  return apiRequest('/notifications/my/read-all', {
    method: 'PUT',
  })
}

// =========================================================
// BHASHINI / AI4BHARAT - VOICE ASR
// =========================================================

export const transcribeVoiceWithBhashini = async ({
  audioBlob,
  language = 'hi',
}) => {
  if (!audioBlob) {
    throw new Error('Audio recording is required.')
  }

  const formData = new FormData()

  const file = new File(
    [audioBlob],
    'patient-voice.wav',
    {
      type: 'audio/wav',
    }
  )

  formData.append('audio', file)
  formData.append('language', language)

  return apiRequest('/voice/transcribe', {
    method: 'POST',
    body: formData,
  })
}