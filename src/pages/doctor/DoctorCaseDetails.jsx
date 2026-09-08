import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { apiRequest } from '../../services/api'


function parseBackendSection(value) {
  if (!value) return {}

  if (typeof value === 'object') {
    return value
  }

  const result = {}
  const lines = String(value)
    .split(/\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  lines.forEach((line) => {
    const separatorIndex = line.indexOf(':')
    if (separatorIndex === -1) return

    const rawKey = line.slice(0, separatorIndex).trim()
    const rawValue = line.slice(separatorIndex + 1).trim()
    if (!rawKey) return

    result[rawKey] = rawValue
  })

  return result
}

function pickValue(source, keys) {
  for (const key of keys) {
    if (
      source[key] !== undefined &&
      source[key] !== null &&
      String(source[key]).trim() !== ''
    ) {
      return source[key]
    }
  }

  return ''
}

function normalizeBackendCase(rawCase) {
  if (!rawCase) return null

  const patientRaw = parseBackendSection(rawCase.patientInformation)
  const complaintRaw = parseBackendSection(rawCase.chiefComplaint)
  const medicalHistoryRaw = parseBackendSection(rawCase.medicalHistory)
  const ayushRaw = parseBackendSection(rawCase.ayushAssessment)

  const patient = {
    fullName: pickValue(patientRaw, ['Full Name', 'Name']),
    age: pickValue(patientRaw, ['Age']),
    gender: pickValue(patientRaw, ['Gender']),
    mobileNumber: pickValue(patientRaw, ['Mobile Number', 'Mobile']),
    bloodGroup: pickValue(patientRaw, ['Blood Group']),
    height: pickValue(patientRaw, ['Height']),
    weight: pickValue(patientRaw, ['Weight']),
  }

  const complaint = {
    mainProblem: pickValue(complaintRaw, [
      'Main Health Problem',
      'Main Problem',
      'Chief Complaint',
    ]),
    duration: pickValue(complaintRaw, ['Duration']),
    symptoms: pickValue(complaintRaw, ['Symptoms']),
    hasPain: pickValue(complaintRaw, ['Pain']),
    painSeverity: pickValue(complaintRaw, ['Pain Severity']),
    aggravatingFactors: pickValue(complaintRaw, ['Aggravating Factors']),
    relievingFactors: pickValue(complaintRaw, ['Relieving Factors']),
    previousTreatment: pickValue(complaintRaw, ['Previous Treatment']),
  }

  const medicalHistory = {
    previousIllness: pickValue(medicalHistoryRaw, [
      'Previous Major Illness',
      'Previous Illness',
    ]),
    surgery: pickValue(medicalHistoryRaw, [
      'Previous Surgery',
      'Surgery',
    ]),
    medicines: pickValue(medicalHistoryRaw, [
      'Current Medicines',
      'Current Medication',
      'Medicines',
    ]),
    allergies: pickValue(medicalHistoryRaw, ['Allergies', 'Allergy']),
    hospitalization: pickValue(medicalHistoryRaw, ['Hospitalization']),
    familyHistory: pickValue(medicalHistoryRaw, [
      'Family Medical History',
      'Family History',
    ]),
    smoking: pickValue(medicalHistoryRaw, ['Smoking']),
    alcohol: pickValue(medicalHistoryRaw, ['Alcohol']),
    sleep: pickValue(medicalHistoryRaw, ['Sleep']),
    appetite: pickValue(medicalHistoryRaw, ['Appetite']),
    bowelHabits: pickValue(medicalHistoryRaw, [
      'Bowel Habits',
      'Bowel',
    ]),
    additionalInfo: pickValue(medicalHistoryRaw, [
      'Additional Medical Information',
      'Additional Information',
    ]),
  }

  const ayush = {
    prakriti: pickValue(ayushRaw, ['Prakriti']),
    vikriti: pickValue(ayushRaw, ['Vikriti']),
    agni: pickValue(ayushRaw, ['Agni']),
    koshtha: pickValue(ayushRaw, ['Koshtha']),
    mealFrequency: pickValue(ayushRaw, ['Meal Frequency']),
    dietDetails: pickValue(ayushRaw, ['Diet Details']),
    physicalActivity: pickValue(ayushRaw, ['Physical Activity']),
    dailyRoutine: pickValue(ayushRaw, ['Daily Routine']),
    dashavidhaPariksha: pickValue(ayushRaw, ['Dashavidha Pariksha']),
  }

  return {
    ...rawCase,
    patientInformation: patient,
    chiefComplaint: complaint,
    medicalHistory,
    ayushAssessment: ayush,
    medicalDocuments: rawCase.medicalDocuments || [],
    aiSummary: rawCase.aiSummary || '',
    doctorVerifiedSummary: rawCase.doctorVerifiedSummary || '',
    aiVerified: Boolean(rawCase.aiVerified),
    aiVerifiedAt: rawCase.aiVerifiedAt || '',
    aiVerifiedBy: rawCase.aiVerifiedBy || '',
    status: rawCase.status || 'SUBMITTED',
    doctorNotes: rawCase.doctorNotes || '',
  }
}


function extractAiSection(summary, sectionNames) {
  if (!summary) return ''

  const escapedNames = sectionNames.map((name) =>
    name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  )

  const headingPattern = escapedNames.join('|')
  const regex = new RegExp(
    `(?:^|\\n)\\s*(?:#{1,6}\\s*)?(?:\\d+[.)]\\s*)?(?:${headingPattern})\\s*:?[ \\t]*\\n([\\s\\S]*?)(?=\\n\\s*(?:#{1,6}\\s*)?(?:\\d+[.)]\\s*)?[A-Za-z][^\\n:]{2,100}:?[ \\t]*\\n|$)`,
    'i'
  )

  const match = summary.match(regex)
  return match ? match[1].trim() : ''
}

function cleanAiSection(text) {
  if (!text) return ''

  return text
    .replace(/^\s*[-*]\s*/gm, '• ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function DoctorCaseDetails() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [showSummary, setShowSummary] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editedSummary, setEditedSummary] = useState('')
  const [showRejectBox, setShowRejectBox] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [notes, setNotes] = useState('')
  const [patientCase, setPatientCase] = useState(null)
  const [medicalDocuments, setMedicalDocuments] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false)
  const [previewUrl, setPreviewUrl] = useState('')
  const [previewDocument, setPreviewDocument] = useState(null)
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)
  const [error, setError] = useState('')
  const [auditLogs, setAuditLogs] = useState([])
  const [isLoadingAudit, setIsLoadingAudit] = useState(false)
  const [auditError, setAuditError] = useState('')
  const [isSavingAiVerification, setIsSavingAiVerification] = useState(false)
  const [aiVerificationMessage, setAiVerificationMessage] = useState('')

  useEffect(() => {
    let cancelled = false

    const loadCase = async () => {
      try {
        setIsLoading(true)
        setError('')

        const response = await apiRequest(`/cases/${id}`, {
          method: 'GET',
        })

        if (!cancelled) {
          const normalizedCase = normalizeBackendCase(response)
          setPatientCase(normalizedCase)
          setNotes(response?.doctorNotes || '')
          setEditedSummary(response?.doctorVerifiedSummary || response?.aiSummary || '')
          setShowSummary(Boolean(response?.aiSummary || response?.doctorVerifiedSummary))
        }

        try {
          if (!cancelled) {
            setIsLoadingDocuments(true)
          }

          const documentResponse = await apiRequest(
            `/documents/case/${id}`,
            {
              method: 'GET',
            }
          )

          if (!cancelled) {
            setMedicalDocuments(
              Array.isArray(documentResponse)
                ? documentResponse
                : []
            )
          }
        } catch (documentError) {
          console.error(
            'Unable to load medical documents:',
            documentError
          )

          if (!cancelled) {
            setMedicalDocuments([])
          }
        } finally {
          if (!cancelled) {
            setIsLoadingDocuments(false)
          }
        }

        if (!cancelled) {
          setIsLoadingAudit(true)
        }

        try {
          const auditResponse = await apiRequest(`/audit/case/${id}`, {
            method: 'GET',
          })

          if (!cancelled) {
            setAuditLogs(Array.isArray(auditResponse) ? auditResponse : [])
            setAuditError('')
          }
        } catch (auditLoadError) {
          console.error('Unable to load audit history:', auditLoadError)
          if (!cancelled) {
            setAuditLogs([])
            setAuditError(auditLoadError.message || 'Audit history is unavailable.')
          }
        } finally {
          if (!cancelled) {
            setIsLoadingAudit(false)
          }
        }
      } catch (error) {
        if (!cancelled) {
          setError(error.message || 'Unable to load patient case.')
          setPatientCase(null)
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    loadCase()

    return () => {
      cancelled = true
    }
  }, [id])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center max-w-md w-full shadow-sm">
          <div className="text-4xl">⏳</div>
          <h1 className="text-2xl font-bold text-slate-800 mt-4">
            Loading Case...
          </h1>
          <p className="text-slate-500 mt-2">
            Fetching the patient case from the backend.
          </p>
        </div>
      </div>
    )
  }

  if (!patientCase) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center max-w-md w-full shadow-sm">
          <div className="text-5xl">🔍</div>
          <h1 className="text-2xl font-bold text-slate-800 mt-4">
            Case Not Found
          </h1>
          <p className="text-red-600 mt-2 font-medium">
            {error || 'The requested patient case could not be found.'}
          </p>
          <button
            type="button"
            onClick={() => navigate('/doctor/dashboard')}
            className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const backendError = error ? (
    <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700">
      <p className="font-semibold">Backend Error</p>
      <p className="text-sm mt-1">{error}</p>
    </div>
  ) : null

  const complaint = patientCase.chiefComplaint || {}
  const medicalHistory = patientCase.medicalHistory || {}
  const ayush = patientCase.ayushAssessment || {}
  const patient = patientCase.patientInformation || {}
  const openDocumentPreview = async (document) => {
    try {
      setIsPreviewLoading(true)
      const token = localStorage.getItem('ayush-token')
      const response = await fetch(`/api/documents/${document.id}/file`, {
        method: 'GET',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!response.ok) {
        const message = await response.text().catch(() => '')
        throw new Error(message || 'Could not open medical document.')
      }
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setPreviewUrl(url)
      setPreviewDocument(document)
    } catch (previewError) {
      window.alert(previewError.message || 'Could not open document.')
    } finally {
      setIsPreviewLoading(false)
    }
  }

  const downloadDocument = async (document) => {
    try {
      const token = localStorage.getItem('ayush-token')
      const response = await fetch(`/api/documents/${document.id}/file`, {
        method: 'GET',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!response.ok) {
        const message = await response.text().catch(() => '')
        throw new Error(message || 'Could not download medical document.')
      }
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = window.document.createElement('a')
      link.href = url
      link.download = document.fileName || 'medical-document'
      window.document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch (downloadError) {
      window.alert(downloadError.message || 'Could not download document.')
    }
  }

  const closeDocumentPreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl('')
    setPreviewDocument(null)
  }

  const documents = medicalDocuments

  const isReviewed = patientCase.status === 'REVIEWED'
  const isRejected = patientCase.status === 'REJECTED'

  const initialNotes = patientCase.doctorNotes || ''

  const aiSummary = patientCase.aiSummary || ''

  const aiRedFlags = cleanAiSection(
    extractAiSection(aiSummary, [
      'Red Flags / Points Requiring Doctor Attention',
      'Red Flags / Doctor Attention',
      'Red Flags',
    ])
  )

  const aiMissingInformation = cleanAiSection(
    extractAiSection(aiSummary, [
      'Information Missing / Needs Clarification',
      'Information Missing / Clarification',
      'Information Missing',
    ])
  )

  // Fallback safety checks are retained only when Gemini does not provide
  // a dedicated Red Flags section in the stored response.
  const fallbackRedFlags = []

  if (Number(complaint.painSeverity) >= 8) {
    fallbackRedFlags.push({
      severity: 'High',
      title: 'High pain severity',
      detail: 'Patient reported pain severity of 8 or above.',
    })
  }

  if (
    typeof complaint.duration === 'string' &&
    complaint.duration.toLowerCase().includes('month')
  ) {
    fallbackRedFlags.push({
      severity: 'Moderate',
      title: 'Prolonged symptoms',
      detail: 'The patient reported symptoms lasting for months.',
    })
  }

  if (
    medicalHistory.hospitalization &&
    String(medicalHistory.hospitalization).toLowerCase() !== 'no'
  ) {
    fallbackRedFlags.push({
      severity: 'Moderate',
      title: 'Previous hospitalization',
      detail: 'A previous hospitalization was reported.',
    })
  }

  if (
    medicalHistory.allergies &&
    String(medicalHistory.allergies).toLowerCase() !== 'no'
  ) {
    fallbackRedFlags.push({
      severity: 'High',
      title: 'Possible allergy',
      detail: String(medicalHistory.allergies),
    })
  }

  const redFlags = aiRedFlags
    ? aiRedFlags
        .split(/\n{2,}/)
        .map((item) => item.trim())
        .filter(Boolean)
        .map((item, index) => ({
          severity: /high|urgent|critical/i.test(item)
            ? 'High'
            : /moderate|medium/i.test(item)
              ? 'Moderate'
              : 'AI Review',
          title: `AI Flag ${index + 1}`,
          detail: item.replace(/^(?:[-*•]\s*)+/, '').trim(),
        }))
    : fallbackRedFlags

  const generateClinicalSummary = () => {
    const backendSummary = patientCase.aiSummary || ''

    if (backendSummary) {
      setEditedSummary(backendSummary)
      setShowSummary(true)
      setIsEditing(false)
    } else {
      setShowSummary(true)
      setEditedSummary(
        'AI summary is not available for this case. Please review the structured patient information manually.'
      )
    }
  }

  const displaySummary =
    editedSummary ||
    patientCase.aiSummary ||
    'AI summary is not available for this case. Please review the structured patient information manually.'

  const handleAiVerification = async () => {
    const summaryToVerify = (editedSummary || patientCase.aiSummary || '').trim()
    if (!summaryToVerify) {
      setError('AI summary is empty. There is nothing to verify.')
      return
    }
    try {
      setError('')
      setAiVerificationMessage('')
      setIsSavingAiVerification(true)
      const response = await apiRequest(`/cases/${id}/ai-verification`, {
        method: 'PUT',
        body: JSON.stringify({ verified: true, verifiedSummary: summaryToVerify }),
      })
      const normalizedCase = normalizeBackendCase(response)
      setPatientCase(normalizedCase)
      setEditedSummary(response?.doctorVerifiedSummary || summaryToVerify)
      setShowSummary(true)
      setIsEditing(false)
      setAiVerificationMessage('AI summary verified and saved successfully.')
    } catch (verificationError) {
      setError(verificationError.message || 'Unable to save AI summary verification.')
    } finally {
      setIsSavingAiVerification(false)
    }
  }

  const handleVerify = async () => {
    try {
      setError('')

      const response = await apiRequest(`/cases/${id}/verify`, {
        method: 'PUT',
      })

      const normalizedCase = normalizeBackendCase(response)
      setPatientCase(normalizedCase)
      setEditedSummary(response?.aiSummary || '')
      setShowSummary(Boolean(response?.aiSummary))
    } catch (error) {
      setError(error.message || 'Unable to verify the case.')
    }
  }

  const handleReject = async () => {
    const reason =
      rejectionReason.trim() ||
      'Doctor requested the patient case to be revised.'

    try {
      setError('')

      const response = await apiRequest(`/cases/${id}/reject`, {
        method: 'PUT',
        body: JSON.stringify({ reason }),
      })

      const normalizedCase = normalizeBackendCase(response)
      setPatientCase(normalizedCase)
      setEditedSummary(response?.aiSummary || '')
      setShowSummary(Boolean(response?.aiSummary))
      setShowRejectBox(false)
      setRejectionReason('')
    } catch (error) {
      setError(error.message || 'Unable to reject the case.')
    }
  }

  const handleSaveNotes = async () => {
    try {
      setError('')

      const response = await apiRequest(`/cases/${id}/notes`, {
        method: 'PUT',
        body: JSON.stringify({ notes }),
      })

      const normalizedCase = normalizeBackendCase(response)
      setPatientCase(normalizedCase)
      setEditedSummary(response?.aiSummary || '')
      setShowSummary(Boolean(response?.aiSummary))
    } catch (error) {
      setError(error.message || 'Unable to save doctor notes.')
    }
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
              Patient Case Details
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Doctor Review & Clinical Assessment
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/doctor/dashboard')}
            className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition"
          >
            ← Back
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {backendError}

        {/* Patient header */}
        <section className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 mb-6 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-xl">
                  👤
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">
                    {patient.fullName || 'Patient'}
                  </h2>
                  <p className="text-sm text-slate-500">
                    Case ID: {patientCase.id}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <StatusBadge status={patientCase.status} />

              {isReviewed && (
                <span className="px-3 py-2 rounded-full bg-blue-50 text-blue-700 text-sm font-semibold">
                  ✓ Doctor Verified
                </span>
              )}
            </div>
          </div>
        </section>

        {/* Quick overview */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <MetricCard label="Age" value={patient.age || '—'} />
          <MetricCard label="Gender" value={patient.gender || '—'} />
          <MetricCard
            label="Pain"
            value={
              complaint.painSeverity
                ? `${complaint.painSeverity}/10`
                : '—'
            }
          />
          <MetricCard
            label="Documents"
            value={documents.length}
          />
        </section>

        {/* AI Summary */}
        <section className="bg-white rounded-2xl border border-blue-200 p-5 sm:p-6 mb-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-xl font-bold text-slate-800">
                🤖 AI Clinical Summary
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Gemini-generated clinical documentation organized for doctor review.
              </p>
            </div>

            <span className="w-fit px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
              Gemini AI • Decision Support
            </span>
          </div>

          {/* Structured overview */}
          <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SummaryItem
              label="👤 Patient Overview"
              value={[
                patient.fullName && `Name: ${patient.fullName}`,
                patient.age && `Age: ${patient.age}`,
                patient.gender && `Gender: ${patient.gender}`,
                patient.bloodGroup && `Blood Group: ${patient.bloodGroup}`,
                patient.height && `Height: ${patient.height}`,
                patient.weight && `Weight: ${patient.weight}`,
              ].filter(Boolean).join('\n')}
            />

            <SummaryItem
              label="🩺 Chief Complaint & Symptoms"
              value={[
                complaint.mainProblem && `Main Problem: ${complaint.mainProblem}`,
                complaint.duration && `Duration: ${complaint.duration}`,
                complaint.symptoms && `Symptoms: ${complaint.symptoms}`,
                complaint.hasPain && `Pain: ${complaint.hasPain}`,
                complaint.painSeverity && `Pain Severity: ${complaint.painSeverity}/10`,
                complaint.aggravatingFactors && `Aggravating Factors: ${complaint.aggravatingFactors}`,
                complaint.relievingFactors && `Relieving Factors: ${complaint.relievingFactors}`,
              ].filter(Boolean).join('\n')}
            />

            <SummaryItem
              label="📋 Medical History"
              value={[
                medicalHistory.previousIllness && `Previous Illness: ${medicalHistory.previousIllness}`,
                medicalHistory.surgery && `Previous Surgery: ${medicalHistory.surgery}`,
                medicalHistory.medicines && `Current Medicines: ${medicalHistory.medicines}`,
                medicalHistory.allergies && `Allergies: ${medicalHistory.allergies}`,
                medicalHistory.hospitalization && `Hospitalization: ${medicalHistory.hospitalization}`,
                medicalHistory.familyHistory && `Family History: ${medicalHistory.familyHistory}`,
                medicalHistory.smoking && `Smoking: ${medicalHistory.smoking}`,
                medicalHistory.alcohol && `Alcohol: ${medicalHistory.alcohol}`,
                medicalHistory.sleep && `Sleep: ${medicalHistory.sleep}`,
                medicalHistory.appetite && `Appetite: ${medicalHistory.appetite}`,
                medicalHistory.bowelHabits && `Bowel Habits: ${medicalHistory.bowelHabits}`,
              ].filter(Boolean).join('\n')}
            />

            <SummaryItem
              label="🌿 AYUSH Assessment"
              value={[
                ayush.prakriti && `Prakriti: ${ayush.prakriti}`,
                ayush.vikriti && `Vikriti: ${ayush.vikriti}`,
                ayush.agni && `Agni: ${ayush.agni}`,
                ayush.koshtha && `Koshtha: ${ayush.koshtha}`,
                ayush.mealFrequency && `Meal Frequency: ${ayush.mealFrequency}`,
                ayush.dietDetails && `Diet Details: ${ayush.dietDetails}`,
                ayush.physicalActivity && `Physical Activity: ${ayush.physicalActivity}`,
                ayush.dailyRoutine && `Daily Routine: ${ayush.dailyRoutine}`,
                ayush.dashavidhaPariksha && `Dashavidha Pariksha: ${ayush.dashavidhaPariksha}`,
              ].filter(Boolean).join('\n')}
            />
          </div>

          {/* Gemini's actual generated output */}
          <div className="mt-5 p-5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h4 className="font-semibold text-slate-800">
                  🧠 Gemini Generated Findings
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Original AI-generated documentation from the submitted case.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!editedSummary) {
                    setEditedSummary(patientCase.aiSummary || '')
                  }
                  setIsEditing(!isEditing)
                }}
                className="w-fit px-4 py-2 text-sm rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-white transition"
              >
                {isEditing ? 'Cancel Edit' : '✏️ Edit AI Summary'}
              </button>
            </div>

            {isEditing ? (
              <div>
                <textarea
                  value={editedSummary}
                  onChange={(event) => setEditedSummary(event.target.value)}
                  rows={18}
                  className="w-full mt-4 px-4 py-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 resize-y bg-white"
                />

                <div className="flex flex-wrap gap-3 mt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setEditedSummary(patientCase.aiSummary || '')
                      setIsEditing(false)
                    }}
                    className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 transition"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
                  >
                    Keep Edited Version
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-xl bg-white border border-slate-200 p-5">
                <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {displaySummary}
                </p>
              </div>
            )}
          </div>

          {/* Doctor verification status */}
          <div className={`mt-5 p-5 rounded-xl border ${patientCase.aiVerified ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h4 className="font-bold text-slate-800">🩺 Doctor Verification of AI Summary</h4>
                <p className="text-sm text-slate-600 mt-1">
                  {patientCase.aiVerified ? `Verified${patientCase.aiVerifiedBy ? ` by ${patientCase.aiVerifiedBy}` : ''}${patientCase.aiVerifiedAt ? ` on ${formatAuditDate(patientCase.aiVerifiedAt)}` : ''}.` : 'Review the AI output, edit it if required, then save the doctor-verified version.'}
                </p>
              </div>
              <button type="button" onClick={handleAiVerification} disabled={isSavingAiVerification || !displaySummary.trim()} className={`px-5 py-2.5 rounded-lg font-semibold transition ${patientCase.aiVerified ? 'bg-emerald-100 text-emerald-700 cursor-not-allowed' : 'bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed'}`}>
                {isSavingAiVerification ? 'Saving...' : patientCase.aiVerified ? '✓ AI Summary Verified' : '✓ Verify & Save AI Summary'}
              </button>
            </div>
            {aiVerificationMessage && <p className="mt-3 text-sm font-semibold text-emerald-700">{aiVerificationMessage}</p>}
            {patientCase.doctorVerifiedSummary && (
              <div className="mt-4 p-4 rounded-xl bg-white border border-emerald-200">
                <p className="text-xs uppercase tracking-wide text-emerald-600 font-semibold">Doctor-Verified AI Summary</p>
                <p className="mt-2 text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">{patientCase.doctorVerifiedSummary}</p>
              </div>
            )}
          </div>

          {/* AI extracted sections */}
          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-red-50 border border-red-100">
              <h5 className="font-semibold text-red-800">
                🚨 Red Flags / Doctor Attention
              </h5>
              <div className="mt-2 text-sm text-red-700 whitespace-pre-wrap leading-relaxed">
                {aiRedFlags || 'No dedicated AI red-flag section was returned. Review the case manually.'}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
              <h5 className="font-semibold text-amber-800">
                📋 Information Missing / Clarification
              </h5>
              <div className="mt-2 text-sm text-amber-700 whitespace-pre-wrap leading-relaxed">
                {aiMissingInformation || 'No dedicated missing-information section was returned. Review the case manually.'}
              </div>
            </div>
          </div>

          <div className="mt-5 p-4 rounded-xl bg-blue-50 border border-blue-100">
            <p className="text-sm text-blue-800">
              ℹ The structured cards above summarize information already collected
              from the patient. Gemini-generated findings are shown separately so
              the doctor can compare AI output with the original case information.
            </p>
          </div>

          <p className="text-xs text-amber-700 mt-4 p-3 bg-amber-50 border border-amber-100 rounded-lg">
            ⚠ This is an AI-assisted clinical documentation feature. It does not
            diagnose the patient, prescribe treatment, or replace professional
            medical judgment. A qualified doctor must review and verify the information.
          </p>
        </section>

        {/* Red flags */}
        <section className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 mb-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-xl font-bold text-slate-800">
                🚨 Red Flag Detection
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                AI-assisted red flags with rule-based fallback checks.
              </p>
            </div>

            <span
              className={`w-fit px-3 py-1 rounded-full text-xs font-semibold ${
                redFlags.length
                  ? 'bg-red-50 text-red-700'
                  : 'bg-emerald-50 text-emerald-700'
              }`}
            >
              {redFlags.length
                ? `${redFlags.length} Flag(s)`
                : 'No Flags Detected'}
            </span>
          </div>

          <div className="mt-5">
            {redFlags.length === 0 ? (
              <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-100">
                <p className="font-medium text-emerald-700">
                  ✓ No red-flag conditions were identified from the available AI
                  and rule-based checks.
                </p>
                <p className="text-sm text-emerald-600 mt-1">
                  Doctor review is still required.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {redFlags.map((flag, index) => (
                  <div
                    key={`${flag.title}-${index}`}
                    className={`p-4 rounded-xl border ${
                      flag.severity === 'High'
                        ? 'bg-red-50 border-red-100'
                        : 'bg-amber-50 border-amber-100'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-xl">⚠️</span>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-slate-800">
                            {flag.title}
                          </p>
                          <span className="text-xs px-2 py-1 rounded-full bg-white text-slate-700 border border-slate-200">
                            {flag.severity}
                          </span>
                        </div>
                        <p className="text-sm text-slate-700 mt-1 whitespace-pre-wrap">
                          {flag.detail}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-5 p-4 rounded-xl bg-amber-50 border border-amber-100">
            <p className="text-sm text-amber-800">
              ⚠ Red flags are decision-support observations only. They are not
              a diagnosis and must be clinically verified by the doctor.
            </p>
          </div>
        </section>

        {/* Patient information */}
        <DataSection title="Patient Information" icon="👤">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <DetailItem label="Full Name" value={patient.fullName} />
            <DetailItem label="Age" value={patient.age} />
            <DetailItem label="Gender" value={patient.gender} />
            <DetailItem label="Mobile Number" value={patient.mobileNumber} />
            <DetailItem label="Blood Group" value={patient.bloodGroup} />
            <DetailItem label="Height" value={patient.height} />
            <DetailItem label="Weight" value={patient.weight} />
          </div>
        </DataSection>

        {/* Chief complaint */}
        <DataSection title="Chief Complaint & Symptoms" icon="🩺">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <DetailItem label="Main Health Problem" value={complaint.mainProblem} />
            <DetailItem label="Duration" value={complaint.duration} />
            <DetailItem label="Symptoms" value={complaint.symptoms} />
            <DetailItem label="Pain" value={complaint.hasPain} />
            <DetailItem label="Pain Severity" value={complaint.painSeverity} />
            <DetailItem label="Aggravating Factors" value={complaint.aggravatingFactors} />
            <DetailItem label="Relieving Factors" value={complaint.relievingFactors} />
            <DetailItem label="Previous Treatment" value={complaint.previousTreatment} />
          </div>
        </DataSection>

        {/* Medical history */}
        <DataSection title="Medical History" icon="📋">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <DetailItem label="Previous Major Illness" value={medicalHistory.previousIllness} />
            <DetailItem label="Previous Surgery" value={medicalHistory.surgery} />
            <DetailItem label="Current Medicines" value={medicalHistory.medicines} />
            <DetailItem label="Allergies" value={medicalHistory.allergies} />
            <DetailItem label="Hospitalization" value={medicalHistory.hospitalization} />
            <DetailItem label="Family Medical History" value={medicalHistory.familyHistory} />
            <DetailItem label="Smoking" value={medicalHistory.smoking} />
            <DetailItem label="Alcohol" value={medicalHistory.alcohol} />
            <DetailItem label="Sleep" value={medicalHistory.sleep} />
            <DetailItem label="Appetite" value={medicalHistory.appetite} />
            <DetailItem label="Bowel Habits" value={medicalHistory.bowelHabits} />
            <DetailItem label="Additional Medical Information" value={medicalHistory.additionalInfo} />
          </div>
        </DataSection>

        {/* AYUSH */}
        <DataSection title="AYUSH Assessment" icon="🌿">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <DetailItem label="Prakriti" value={ayush.prakriti} />
            <DetailItem label="Vikriti" value={ayush.vikriti} />
            <DetailItem label="Agni" value={ayush.agni} />
            <DetailItem label="Koshtha" value={ayush.koshtha} />
            <DetailItem label="Meal Frequency" value={ayush.mealFrequency} />
            <DetailItem label="Diet Details" value={ayush.dietDetails} />
            <DetailItem label="Physical Activity" value={ayush.physicalActivity} />
            <DetailItem label="Daily Routine" value={ayush.dailyRoutine} />

            <div className="md:col-span-2">
              <DetailItem
                label="Dashavidha Pariksha"
                value={ayush.dashavidhaPariksha}
              />
            </div>
          </div>
        </DataSection>

        {/* Medical Documents + Gemini AI */}
        <DataSection title="Medical Documents & AI Analysis" icon="📄">
          {isLoadingDocuments ? (
            <div className="p-5 rounded-xl bg-blue-50 border border-blue-100">
              <p className="font-medium text-blue-800">
                ⏳ Loading uploaded medical documents...
              </p>
              <p className="text-sm text-blue-700 mt-1">
                Fetching documents and Gemini AI analysis from the backend.
              </p>
            </div>
          ) : documents.length === 0 ? (
            <div>
              <EmptyBox text="No medical documents have been uploaded for this case." />

              <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-sm text-slate-600">
                  The patient can upload prescriptions, lab reports,
                  discharge summaries and medical images from the
                  Patient → Medical Documents page.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {documents.map((document, index) => {
                const documentAiSummary = document.aiSummary || ''
                const extractedText = document.extractedText || ''

                const uploadedDate = document.uploadedAt
                  ? new Date(document.uploadedAt).toLocaleString()
                  : 'Date not available'

                return (
                  <div
                    key={document.id || index}
                    className="rounded-2xl border border-slate-200 overflow-hidden"
                  >
                    {/* Document header */}
                    <div className="p-5 bg-slate-50">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-2xl">
                            {document.fileType === 'application/pdf'
                              ? '📕'
                              : '🖼️'}
                          </div>

                          <div>
                            <h4 className="font-bold text-slate-800">
                              {document.fileName ||
                                `Document ${index + 1}`}
                            </h4>

                            <div className="flex flex-wrap gap-2 mt-2">
                              <span className="px-3 py-1 rounded-full bg-white border border-slate-200 text-xs text-slate-600">
                                {document.fileType ||
                                  'Medical Document'}
                              </span>

                              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
                                ✓ Uploaded
                              </span>

                              <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
                                🤖 Gemini Analyzed
                              </span>
                            </div>

                            <p className="text-xs text-slate-500 mt-2">
                              Uploaded: {uploadedDate}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 lg:justify-end">
                          <button type="button" onClick={() => openDocumentPreview(document)} disabled={isPreviewLoading} className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 transition">
                            {isPreviewLoading ? 'Opening...' : '👁 Preview'}
                          </button>
                          <button type="button" onClick={() => downloadDocument(document)} className="px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition">
                            ⬇ Download
                          </button>
                        </div>

                        <div className="text-left lg:text-right">
                          <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold">
                            Document ID
                          </p>
                          <p className="text-sm font-semibold text-slate-700 mt-1">
                            {document.id || '—'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* AI analysis */}
                    <div className="p-5">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🤖</span>
                        <div>
                          <h4 className="font-bold text-slate-800">
                            Gemini AI Document Analysis
                          </h4>
                          <p className="text-xs text-slate-500">
                            OCR-extracted text and Gemini-assisted document summary
                          </p>
                        </div>
                      </div>

                      {documentAiSummary ? (
                        <div className="mt-4 p-5 rounded-xl bg-blue-50 border border-blue-100">
                          <p className="text-xs uppercase tracking-wide text-blue-600 font-semibold mb-2">Gemini AI Summary</p>
                          <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">{documentAiSummary}</p>
                        </div>
                      ) : (
                        <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-100">
                          <p className="text-sm text-amber-800">Gemini AI summary is not available for this document.</p>
                        </div>
                      )}

                      {extractedText && (
                        <details className="mt-4" open>
                          <summary className="cursor-pointer text-sm font-semibold text-slate-700">🔎 View OCR / Extracted Text</summary>
                          <div className="mt-3 p-4 rounded-xl bg-slate-50 border border-slate-200 max-h-96 overflow-auto">
                            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{extractedText}</p>
                          </div>
                        </details>
                      )}


                      <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-100">
                        <p className="text-sm text-amber-800">
                          ⚠ Gemini AI output is for medical document
                          extraction and clinical documentation assistance only.
                          It is not a diagnosis or treatment recommendation.
                          The doctor must verify all extracted information.
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </DataSection>


        {/* Audit History */}
        <DataSection title="Audit History" icon="🔐">
          <div className="mb-4 p-4 rounded-xl bg-blue-50 border border-blue-100">
            <p className="text-sm text-blue-800">
              This timeline records important access and workflow activities for this case.
              Medical document contents and complete clinical payloads are not stored in the audit metadata.
            </p>
          </div>

          {isLoadingAudit ? (
            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200">
              <p className="font-medium text-slate-700">⏳ Loading audit history...</p>
            </div>
          ) : auditError ? (
            <div className="p-5 rounded-xl bg-amber-50 border border-amber-200">
              <p className="font-medium text-amber-800">Audit history unavailable</p>
              <p className="text-sm text-amber-700 mt-1">{auditError}</p>
            </div>
          ) : auditLogs.length === 0 ? (
            <EmptyBox text="No audit activity has been recorded for this case yet." />
          ) : (
            <div className="relative">
              <div className="space-y-4">
                {auditLogs.map((log, index) => (
                  <div key={log.id || `${log.action}-${log.createdAt}-${index}`} className="relative pl-8">
                    <div className="absolute left-0 top-1 w-3 h-3 rounded-full bg-blue-600 ring-4 ring-blue-50" />
                    {index < auditLogs.length - 1 && (
                      <div className="absolute left-[5px] top-4 bottom-[-16px] w-px bg-slate-200" />
                    )}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                        <div>
                          <p className="font-bold text-slate-800">{formatAuditAction(log.action)}</p>
                          <p className="text-sm text-slate-600 mt-1">{log.description || 'Activity recorded.'}</p>
                        </div>
                        <span className="w-fit px-2.5 py-1 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-600">
                          {log.actorRole || 'UNKNOWN'}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-slate-500">
                        <span>Actor: {log.actorEmail || 'Unknown'}</span>
                        <span>{formatAuditDate(log.createdAt)}</span>
                      </div>
                      {log.metadata && (
                        <p className="mt-2 text-xs text-slate-400 break-words">{log.metadata}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DataSection>

        {/* Doctor notes */}
        <DataSection title="Doctor Notes" icon="📝">
          <p className="text-sm text-slate-500 mb-3">
            Add internal clinical review notes. These notes are saved with the
            case in the backend.
          </p>

          <textarea
            value={notes || initialNotes}
            onChange={(event) => setNotes(event.target.value)}
            onFocus={() => {
              if (!notes && initialNotes) setNotes(initialNotes)
            }}
            rows={6}
            placeholder="Write your observations, review notes or follow-up points..."
            className="w-full px-4 py-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />

          <button
            type="button"
            onClick={handleSaveNotes}
            className="mt-3 px-5 py-2.5 bg-slate-800 text-white rounded-lg font-semibold hover:bg-slate-900 transition"
          >
            Save Doctor Notes
          </button>
        </DataSection>

        {/* Doctor actions */}
        <section className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm">
          <h3 className="text-xl font-bold text-slate-800">
            Doctor Review & Decision
          </h3>
          <p className="text-sm text-slate-500 mt-2">
            The doctor should review the complete case before taking a final
            action.
          </p>

          <div className="flex flex-col sm:flex-row flex-wrap gap-3 mt-6">
            <button
              type="button"
              onClick={generateClinicalSummary}
              className="px-5 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              View AI Summary
            </button>

            <button
              type="button"
              onClick={handleVerify}
              disabled={isReviewed}
              className={`px-5 py-3 rounded-lg font-semibold transition ${
                isReviewed
                  ? 'bg-emerald-100 text-emerald-700 cursor-not-allowed'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
              }`}
            >
              {isReviewed ? '✓ Case Verified' : '✓ Verify Case'}
            </button>

            <button
              type="button"
              onClick={() => setShowRejectBox(!showRejectBox)}
              disabled={isReviewed}
              className="px-5 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition"
            >
              {isRejected ? 'Case Rejected' : '✕ Reject / Request Revision'}
            </button>
          </div>

          {showRejectBox && (
            <div className="mt-5 p-5 rounded-xl bg-red-50 border border-red-200">
              <h4 className="font-semibold text-red-800">
                Reason for rejection / revision
              </h4>

              <textarea
                value={rejectionReason}
                onChange={(event) =>
                  setRejectionReason(event.target.value)
                }
                rows={4}
                placeholder="Example: Please provide more details about previous treatment..."
                className="w-full mt-3 px-4 py-3 bg-white border border-red-200 rounded-lg outline-none focus:ring-2 focus:ring-red-400 resize-none"
              />

              <div className="flex flex-wrap gap-3 mt-3">
                <button
                  type="button"
                  onClick={handleReject}
                  className="px-5 py-2.5 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition"
                >
                  Confirm Rejection
                </button>

                <button
                  type="button"
                  onClick={() => setShowRejectBox(false)}
                  className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {isRejected && patientCase.rejectionReason && (
            <div className="mt-5 p-4 rounded-xl bg-red-50 border border-red-200">
              <p className="text-xs uppercase tracking-wide text-red-500 font-semibold">
                Revision Reason
              </p>
              <p className="text-sm text-red-800 mt-1">
                {patientCase.rejectionReason}
              </p>
            </div>
          )}

          <div className="mt-5 p-4 rounded-xl bg-amber-50 border border-amber-100">
            <p className="text-sm text-amber-800">
              ⚠ AI output and red-flag checks are decision-support features
              only. They must not replace professional medical judgment or
              diagnosis.
            </p>
          </div>
        </section>
      </main>

      {previewUrl && previewDocument && (
        <div className="fixed inset-0 z-50 bg-black/70 p-4 md:p-8 flex items-center justify-center">
          <div className="w-full h-full max-w-6xl bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <h3 className="font-bold text-slate-800 truncate">{previewDocument.fileName || 'Medical Document'}</h3>
                <p className="text-xs text-slate-500 mt-1">Original uploaded document • Doctor verification required</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button type="button" onClick={() => downloadDocument(previewDocument)} className="px-3 py-2 rounded-lg bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200">⬇ Download</button>
                <button type="button" onClick={closeDocumentPreview} className="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 text-xl hover:bg-slate-200" aria-label="Close document preview">×</button>
              </div>
            </div>
            <div className="flex-1 min-h-0 bg-slate-100 p-3 md:p-5 overflow-auto">
              {previewDocument.fileType === 'application/pdf' ? (
                <iframe src={previewUrl} title={previewDocument.fileName || 'Medical document'} className="w-full h-full min-h-[70vh] rounded-xl bg-white border border-slate-200" />
              ) : (
                <div className="w-full h-full min-h-[70vh] flex items-center justify-center">
                  <img src={previewUrl} alt={previewDocument.fileName || 'Medical document'} className="max-w-full max-h-full object-contain rounded-xl bg-white shadow-sm" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function formatAuditAction(action) {
  if (!action) return 'Activity'

  return String(action)
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function formatAuditDate(value) {
  if (!value) return 'Time not available'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)

  return date.toLocaleString()
}

function DataSection({ title, icon, children }) {
  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 mb-6 shadow-sm">
      <div className="flex items-center gap-2 mb-5">
        <span className="text-xl">{icon}</span>
        <h3 className="text-xl font-semibold text-slate-800">{title}</h3>
      </div>
      {children}
    </section>
  )
}

function MetricCard({ label, value }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold">
        {label}
      </p>
      <p className="text-lg font-bold text-slate-800 mt-1">{value}</p>
    </div>
  )
}

function StatusBadge({ status }) {
  const styles = {
    SUBMITTED: 'bg-amber-50 text-amber-700',
    REVIEWED: 'bg-emerald-50 text-emerald-700',
    REJECTED: 'bg-red-50 text-red-700',
    Submitted: 'bg-amber-50 text-amber-700',
    Reviewed: 'bg-emerald-50 text-emerald-700',
    Rejected: 'bg-red-50 text-red-700',
  }

  return (
    <span
      className={`px-3 py-2 rounded-full text-sm font-semibold ${
        styles[status] || 'bg-slate-100 text-slate-700'
      }`}
    >
      {status || 'Submitted'}
    </span>
  )
}

function DetailItem({ label, value }) {
  if (value === undefined || value === null || value === '') {
    return (
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
        <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold">
          {label}
        </p>
        <p className="text-sm text-slate-400 mt-1">Not provided</p>
      </div>
    )
  }

  return (
    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
      <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold">
        {label}
      </p>
      <p className="text-slate-800 mt-1 whitespace-pre-wrap">
        {String(value)}
      </p>
    </div>
  )
}

function SummaryItem({ label, value }) {
  return (
    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
      <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold">
        {label}
      </p>
      <p className="text-sm text-slate-800 mt-1 whitespace-pre-wrap">
        {value || 'Not provided'}
      </p>
    </div>
  )
}

function EmptyBox({ text }) {
  return (
    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
      <p className="text-sm text-slate-500">{text}</p>
    </div>
  )
}

export default DoctorCaseDetails
