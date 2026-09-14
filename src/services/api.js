const API_BASE_URL = '/api'

// =========================================================
// GENERIC API REQUEST
// =========================================================

export const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('ayush-token')

  // Public authentication endpoints
  // These requests must NOT receive an old/expired JWT token.
  const isAuthRequest =
    endpoint === '/auth/login' ||
    endpoint === '/auth/register/patient' ||
    endpoint === '/auth/register/doctor'

  const headers = {
    ...(options.body instanceof FormData
      ? {}
      : {
          'Content-Type': 'application/json',
        }),
    ...(options.headers || {}),
  }

  // Add JWT only for protected requests
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

// ---------------------------------------------------------
// PATIENT REGISTRATION
// ---------------------------------------------------------

export const registerPatient = async (patientData) => {
  return apiRequest('/auth/register/patient', {
    method: 'POST',
    body: JSON.stringify(patientData),
  })
}

// ---------------------------------------------------------
// DOCTOR REGISTRATION
// ---------------------------------------------------------

export const registerDoctor = async (doctorData) => {
  return apiRequest('/auth/register/doctor', {
    method: 'POST',
    body: JSON.stringify(doctorData),
  })
}

// =========================================================
// CASES
// =========================================================

// ---------------------------------------------------------
// PATIENT - SUBMIT CASE
// ---------------------------------------------------------

export const submitPatientCase = async (caseData) => {
  return apiRequest('/cases', {
    method: 'POST',
    body: JSON.stringify(caseData),
  })
}

// ---------------------------------------------------------
// PATIENT - MY CASES
// ---------------------------------------------------------

export const getMyCases = async () => {
  return apiRequest('/cases/my', {
    method: 'GET',
  })
}

// ---------------------------------------------------------
// CASE - GET BY ID
// ---------------------------------------------------------

export const getCaseById = async (caseId) => {
  if (!caseId) {
    throw new Error('Case ID is required.')
  }

  return apiRequest(`/cases/${caseId}`, {
    method: 'GET',
  })
}

// ---------------------------------------------------------
// DOCTOR - ASSIGNED CASES
// ---------------------------------------------------------

export const getAssignedCases = async () => {
  return apiRequest('/cases/assigned', {
    method: 'GET',
  })
}

// ---------------------------------------------------------
// DOCTOR - ASSIGNED CASES BY STATUS
// ---------------------------------------------------------

export const getAssignedCasesByStatus = async (status) => {
  if (!status) {
    throw new Error('Case status is required.')
  }

  return apiRequest(`/cases/assigned/status/${status}`, {
    method: 'GET',
  })
}

// =========================================================
// MEDICAL DOCUMENTS
// =========================================================

// ---------------------------------------------------------
// UPLOAD MEDICAL DOCUMENT
// ---------------------------------------------------------

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

// ---------------------------------------------------------
// GET CASE MEDICAL DOCUMENTS
// ---------------------------------------------------------

export const getCaseMedicalDocuments = async (caseId) => {
  if (!caseId) {
    throw new Error('Case ID is required.')
  }

  return apiRequest(`/documents/case/${caseId}`, {
    method: 'GET',
  })
}

// ---------------------------------------------------------
// GET MY MEDICAL DOCUMENTS
// ---------------------------------------------------------

export const getMyMedicalDocuments = async () => {
  return []
}

// ---------------------------------------------------------
// GET MEDICAL DOCUMENT
// ---------------------------------------------------------

export const getMedicalDocument = async (documentId) => {
  if (!documentId) {
    throw new Error('Document ID is required.')
  }

  return apiRequest(`/documents/${documentId}`, {
    method: 'GET',
  })
}

// ---------------------------------------------------------
// GET MEDICAL DOCUMENT FILE
// ---------------------------------------------------------

export const getMedicalDocumentFile = async (documentId) => {
  if (!documentId) {
    throw new Error('Document ID is required.')
  }

  return apiRequest(`/documents/${documentId}/file`, {
    method: 'GET',
  })
}

// =========================================================
// PATIENT CONSENT
// =========================================================

// ---------------------------------------------------------
// GIVE PATIENT CONSENT
// ---------------------------------------------------------

export const givePatientConsent = async (consentData) => {
  return apiRequest('/consents', {
    method: 'POST',
    body: JSON.stringify(consentData),
  })
}

// ---------------------------------------------------------
// GET MY CONSENT
// ---------------------------------------------------------

export const getMyConsent = async () => {
  return apiRequest('/consents/my', {
    method: 'GET',
  })
}

// ---------------------------------------------------------
// GET LATEST CONSENT
// ---------------------------------------------------------

export const getLatestConsent = async () => {
  return apiRequest('/consents/my/latest', {
    method: 'GET',
  })
}

// =========================================================
// ABHA
// =========================================================

// ---------------------------------------------------------
// SAVE ABHA PROFILE
// ---------------------------------------------------------

export const saveAbhaProfile = async (abhaData) => {
  return apiRequest('/abha/profile', {
    method: 'POST',
    body: JSON.stringify(abhaData),
  })
}

// ---------------------------------------------------------
// GET MY ABHA PROFILE
// ---------------------------------------------------------

export const getMyAbhaProfile = async () => {
  return apiRequest('/abha/profile/my', {
    method: 'GET',
  })
}

// ---------------------------------------------------------
// CHECK ABHA PROFILE EXISTS
// ---------------------------------------------------------

export const checkAbhaProfileExists = async () => {
  return apiRequest('/abha/profile/my/exists', {
    method: 'GET',
  })
}

// =========================================================
// DOCTORS
// =========================================================

// ---------------------------------------------------------
// GET APPROVED DOCTORS
// ---------------------------------------------------------

export const getApprovedDoctors = async () => {
  return apiRequest('/doctors/approved', {
    method: 'GET',
  })
}

// =========================================================
// APPOINTMENTS
// =========================================================

// ---------------------------------------------------------
// BOOK APPOINTMENT
// ---------------------------------------------------------

export const bookAppointment = async (appointmentData) => {
  if (!appointmentData) {
    throw new Error('Appointment data is required.')
  }

  return apiRequest('/appointments', {
    method: 'POST',
    body: JSON.stringify(appointmentData),
  })
}

// ---------------------------------------------------------
// GET MY APPOINTMENTS
// ---------------------------------------------------------

export const getMyAppointments = async () => {
  return apiRequest('/appointments/my', {
    method: 'GET',
  })
}

// ---------------------------------------------------------
// GET DOCTOR APPOINTMENTS
// ---------------------------------------------------------

export const getDoctorAppointments = async () => {
  return apiRequest('/appointments/doctor/my', {
    method: 'GET',
  })
}

// ---------------------------------------------------------
// CANCEL APPOINTMENT
// ---------------------------------------------------------

export const cancelAppointment = async (appointmentId) => {
  if (!appointmentId) {
    throw new Error('Appointment ID is required.')
  }

  return apiRequest(`/appointments/${appointmentId}/cancel`, {
    method: 'PUT',
  })
}

// =========================================================
// NOTIFICATIONS
// =========================================================

// ---------------------------------------------------------
// GET MY NOTIFICATIONS
// ---------------------------------------------------------

export const getMyNotifications = async () => {
  return apiRequest('/notifications/my', {
    method: 'GET',
  })
}

// ---------------------------------------------------------
// GET UNREAD NOTIFICATIONS
// ---------------------------------------------------------

export const getUnreadNotifications = async () => {
  return apiRequest('/notifications/my/unread', {
    method: 'GET',
  })
}

// ---------------------------------------------------------
// GET UNREAD NOTIFICATION COUNT
// ---------------------------------------------------------

export const getUnreadNotificationCount = async () => {
  return apiRequest('/notifications/my/unread/count', {
    method: 'GET',
  })
}

// ---------------------------------------------------------
// MARK NOTIFICATION AS READ
// ---------------------------------------------------------

export const markNotificationRead = async (notificationId) => {
  if (!notificationId) {
    throw new Error('Notification ID is required.')
  }

  return apiRequest(`/notifications/${notificationId}/read`, {
    method: 'PUT',
  })
}

// ---------------------------------------------------------
// MARK ALL NOTIFICATIONS AS READ
// ---------------------------------------------------------

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