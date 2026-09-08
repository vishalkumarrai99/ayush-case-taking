import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  patientInformation: {},
  chiefComplaint: {},
  medicalHistory: {},
  ayushAssessment: {},
  medicalDocuments: [],
  submittedAt: null,
  previousCases: [],
}

const caseSlice = createSlice({
  name: 'case',
  initialState,

  reducers: {
    savePatientInformation: (state, action) => {
      state.patientInformation = action.payload
    },

    saveChiefComplaint: (state, action) => {
      state.chiefComplaint = action.payload
    },

    saveMedicalHistory: (state, action) => {
      state.medicalHistory = action.payload
    },

    saveAyushAssessment: (state, action) => {
      state.ayushAssessment = action.payload
    },

    saveMedicalDocuments: (state, action) => {
      state.medicalDocuments = action.payload
    },

    // Patient submits a complete case
    submitCase: (state) => {
      const completeCase = {
        id: Date.now(),

        patientInformation: state.patientInformation,

        chiefComplaint: state.chiefComplaint,

        medicalHistory: state.medicalHistory,

        ayushAssessment: state.ayushAssessment,

        medicalDocuments: state.medicalDocuments,

        submittedAt: new Date().toISOString(),

        status: 'Submitted',

        doctorNotes: '',
      }

      state.previousCases.push(completeCase)

      state.submittedAt = completeCase.submittedAt
    },

    // Doctor verifies the case
    verifyCase: (state, action) => {
      const caseId = action.payload

      const patientCase = state.previousCases.find(
        (item) => String(item.id) === String(caseId)
      )

      if (patientCase) {
        patientCase.status = 'Reviewed'

        patientCase.verifiedAt = new Date().toISOString()

        patientCase.rejectionReason = ''
      }
    },

    // Doctor rejects the case / requests revision
    rejectCase: (state, action) => {
      const { caseId, reason } = action.payload

      const patientCase = state.previousCases.find(
        (item) => String(item.id) === String(caseId)
      )

      if (patientCase) {
        patientCase.status = 'Rejected'

        patientCase.rejectionReason =
          reason || 'Doctor requested revision.'

        patientCase.rejectedAt = new Date().toISOString()
      }
    },

    // Save doctor's notes
    saveDoctorNotes: (state, action) => {
      const { caseId, notes } = action.payload

      const patientCase = state.previousCases.find(
        (item) => String(item.id) === String(caseId)
      )

      if (patientCase) {
        patientCase.doctorNotes = notes

        patientCase.notesUpdatedAt = new Date().toISOString()
      }
    },

    // Clear current case form
    clearCase: (state) => {
      state.patientInformation = {}

      state.chiefComplaint = {}

      state.medicalHistory = {}

      state.ayushAssessment = {}

      state.medicalDocuments = []

      state.submittedAt = null
    },
  },
})

export const {
  savePatientInformation,
  saveChiefComplaint,
  saveMedicalHistory,
  saveAyushAssessment,
  saveMedicalDocuments,
  submitCase,
  verifyCase,
  rejectCase,
  saveDoctorNotes,
  clearCase,
} = caseSlice.actions

export default caseSlice.reducer