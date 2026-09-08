import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePatientLanguage } from '../../context/PatientLanguageContext'
import LanguageSelector from '../../components/common/LanguageSelector'
import { apiRequest } from '../../services/api'

function parseSection(value) {
  if (!value) return {}
  if (typeof value === 'object') return value

  const result = {}

  String(value)
    .split(/\\n|\n/)
    .forEach((line) => {
      const separatorIndex = line.indexOf(':')
      if (separatorIndex === -1) return

      const key = line.slice(0, separatorIndex).trim()
      const fieldValue = line.slice(separatorIndex + 1).trim()

      if (key) {
        result[key] = fieldValue
      }
    })

  return result
}

function normalizeCase(item) {
  const statusMap = {
    SUBMITTED: 'Submitted',
    REVIEWED: 'Reviewed',
    REJECTED: 'Rejected',
  }

  return {
    ...item,
    patientInformation: parseSection(item.patientInformation),
    chiefComplaint: parseSection(item.chiefComplaint),
    medicalHistory: parseSection(item.medicalHistory),
    ayushAssessment: parseSection(item.ayushAssessment),
    status: statusMap[item.status] || item.status || 'Submitted',
  }
}

function formatDate(value) {
  if (!value) return 'Date not available'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Date not available'
  }

  return date.toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getStatusStyle(status) {
  if (status === 'Reviewed') {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  }

  if (status === 'Rejected') {
    return 'bg-red-50 text-red-700 border-red-200'
  }

  return 'bg-amber-50 text-amber-700 border-amber-200'
}

/*
 * Convert the normalized frontend object back into the
 * backend's section string format.
 *
 * Example:
 * {
 *   fullName: "Rahul",
 *   age: "25"
 * }
 *
 * becomes:
 *
 * fullName: Rahul
 * age: 25
 */
function serializeSection(section) {
  if (!section || typeof section !== 'object') {
    return String(section || '')
  }

  return Object.entries(section)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => {
      if (typeof value === 'object') {
        return `${key}: ${JSON.stringify(value)}`
      }

      return `${key}: ${String(value)}`
    })
    .join('\n')
}

/*
 * Convert a backend section into editable text.
 */
function sectionToEditableText(section) {
  return serializeSection(parseSection(section))
}

/*
 * Revision editor.
 */
function RevisionEditor({
  patientCase,
  onClose,
  onSuccess,
}) {
  const [patientInformation, setPatientInformation] = useState(
    sectionToEditableText(patientCase.patientInformation)
  )

  const [chiefComplaint, setChiefComplaint] = useState(
    sectionToEditableText(patientCase.chiefComplaint)
  )

  const [medicalHistory, setMedicalHistory] = useState(
    sectionToEditableText(patientCase.medicalHistory)
  )

  const [ayushAssessment, setAyushAssessment] = useState(
    sectionToEditableText(patientCase.ayushAssessment)
  )

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleResubmit = async (event) => {
    event.preventDefault()

    try {
      setIsSubmitting(true)
      setError('')
      setSuccess('')

      const revisedCase = {
        patientInformation,
        chiefComplaint,
        medicalHistory,
        ayushAssessment,
      }

      const response = await apiRequest(
        `/cases/${patientCase.id}/resubmit`,
        {
          method: 'PUT',
          body: JSON.stringify(revisedCase),
        }
      )

      setSuccess(
        'Your revised case has been submitted successfully.'
      )

      setTimeout(() => {
        onSuccess(response)
      }, 1000)
    } catch (requestError) {
      console.error('Case resubmission failed:', requestError)

      setError(
        requestError.message ||
          'Unable to resubmit the case. Please try again.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
      <div className="min-h-full flex items-center justify-center p-4">
        <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="px-5 sm:px-7 py-5 border-b border-slate-200 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide font-bold text-red-600">
                Revision Required
              </p>

              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                Revise Case #{patientCase.id}
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Update the information requested by your doctor and
                resubmit the same case.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 disabled:opacity-50"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleResubmit}>
            <div className="p-5 sm:p-7 space-y-6 max-h-[70vh] overflow-y-auto">

              {patientCase.rejectionReason && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                  <p className="text-xs uppercase tracking-wide font-bold text-red-600">
                    Doctor's Revision Reason
                  </p>

                  <p className="text-sm text-red-800 mt-2 whitespace-pre-wrap leading-6">
                    {patientCase.rejectionReason}
                  </p>
                </div>
              )}

              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
                <p className="font-bold text-blue-900">
                  How to revise
                </p>

                <p className="text-sm text-blue-800 mt-1 leading-6">
                  Update the relevant information below. Keep each
                  field in the format <strong>field: value</strong>.
                  You can edit only the information that needs correction.
                </p>
              </div>

              <RevisionTextarea
                label="Patient Information"
                value={patientInformation}
                onChange={setPatientInformation}
                placeholder={`fullName: Your Name
age: 25
gender: Male
mobileNumber: 9999999999`}
              />

              <RevisionTextarea
                label="Chief Complaint"
                value={chiefComplaint}
                onChange={setChiefComplaint}
                placeholder={`mainProblem: Headache
symptoms: Headache and fatigue
duration: 5 days
painSeverity: 6`}
              />

              <RevisionTextarea
                label="Medical History"
                value={medicalHistory}
                onChange={setMedicalHistory}
                placeholder={`previousIllness: None
previousSurgery: None
currentMedication: None
allergies: None`}
              />

              <RevisionTextarea
                label="AYUSH Assessment"
                value={ayushAssessment}
                onChange={setAyushAssessment}
                placeholder={`Prakriti: Pitta
Vikriti: Headache
Agni: Tikshna
Koshtha: Madhyama`}
              />

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                  <p className="font-bold text-red-800">
                    Resubmission Failed
                  </p>

                  <p className="text-sm text-red-700 mt-1">
                    {error}
                  </p>
                </div>
              )}

              {success && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="font-bold text-emerald-800">
                    ✓ Resubmitted Successfully
                  </p>

                  <p className="text-sm text-emerald-700 mt-1">
                    {success}
                  </p>
                </div>
              )}
            </div>

            <div className="px-5 sm:px-7 py-5 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-white disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 disabled:opacity-60"
              >
                {isSubmitting
                  ? 'Resubmitting...'
                  : 'Submit Revision'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

function RevisionTextarea({
  label,
  value,
  onChange,
  placeholder,
}) {
  return (
    <div>
      <label className="block text-sm font-bold text-slate-800 mb-2">
        {label}
      </label>

      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={8}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-2xl border border-slate-300 bg-white text-sm text-slate-700 outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 resize-y font-mono leading-6"
      />

      <p className="text-xs text-slate-400 mt-1">
        Edit the existing values carefully. Do not remove fields
        unless they are no longer applicable.
      </p>
    </div>
  )
}

function PreviousCases() {
  const lang = usePatientLanguage()
  const t = lang.t
  const navigate = useNavigate()

  const [cases, setCases] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const [search, setSearch] = useState('')

  const [revisionCase, setRevisionCase] = useState(null)

  const loadCases = async () => {
    try {
      setIsLoading(true)
      setError('')

      const response = await apiRequest(
        '/cases/my',
        {
          method: 'GET',
        }
      )

      const normalized = Array.isArray(response)
        ? response.map(normalizeCase)
        : []

      normalized.sort(
        (a, b) =>
          new Date(b.submittedAt || 0).getTime() -
          new Date(a.submittedAt || 0).getTime()
      )

      setCases(normalized)
    } catch (requestError) {
      console.error('Unable to load previous cases:', requestError)

      setCases([])

      setError(
        requestError.message ||
          'Unable to load previous cases.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    const loadInitialCases = async () => {
      try {
        setIsLoading(true)
        setError('')

        const response = await apiRequest(
          '/cases/my',
          {
            method: 'GET',
          }
        )

        const normalized = Array.isArray(response)
          ? response.map(normalizeCase)
          : []

        normalized.sort(
          (a, b) =>
            new Date(b.submittedAt || 0).getTime() -
            new Date(a.submittedAt || 0).getTime()
        )

        if (!cancelled) {
          setCases(normalized)
        }
      } catch (requestError) {
        if (!cancelled) {
          setCases([])

          setError(
            requestError.message ||
              'Unable to load previous cases.'
          )
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    loadInitialCases()

    return () => {
      cancelled = true
    }
  }, [])

  const filteredCases = useMemo(() => {
    const query = search.trim().toLowerCase()

    if (!query) {
      return cases
    }

    return cases.filter((item) => {
      const complaint = String(
        item.chiefComplaint?.mainProblem || ''
      ).toLowerCase()

      const patientName = String(
        item.patientInformation?.fullName || ''
      ).toLowerCase()

      const ayushProfile = String(
        item.ayushAssessment?.prakritiIndicativeProfile || ''
      ).toLowerCase()

      return (
        complaint.includes(query) ||
        patientName.includes(query) ||
        ayushProfile.includes(query) ||
        String(item.status || '')
          .toLowerCase()
          .includes(query)
      )
    })
  }, [cases, search])

  const totalReviewed = cases.filter(
    (item) => item.status === 'Reviewed'
  ).length

  const totalPending = cases.filter(
    (item) => item.status === 'Submitted'
  ).length

  const totalRejected = cases.filter(
    (item) => item.status === 'Rejected'
  ).length

  const handleRevisionSuccess = async () => {
    setRevisionCase(null)
    setExpandedId(null)
    await loadCases()
  }

  return (
    <div className="min-h-screen bg-slate-50">

      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">

          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{t('patientHistoryTimeline')}</h1>

            <p className="text-sm text-slate-500 mt-1">{t('previousConsultations')}</p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/patient/dashboard')}
            className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition"
          >
            ← Dashboard
          </button>
        </div>
      </header>

      <div className="fixed top-4 right-4 z-50"><LanguageSelector compact /></div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

        <section className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">

          <StatCard
            icon="📋"
            label="Total Cases"
            value={cases.length}
          />

          <StatCard
            icon="✅"
            label="Reviewed"
            value={totalReviewed}
          />

          <StatCard
            icon="⏳"
            label="Pending"
            value={totalPending}
          />

          <StatCard
            icon="🔄"
            label="Revision Required"
            value={totalRejected}
          />

        </section>

        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 mb-6">

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">

            <div>
              <h2 className="text-lg font-bold text-slate-800">
                Consultation Timeline
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Cases are loaded from the server so your history
                remains available after refresh.
              </p>
            </div>

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search complaint, status or Prakriti..."
              className="w-full md:w-80 px-4 py-2.5 rounded-xl border border-slate-300 outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500"
            />

          </div>
        </section>

        {isLoading && (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center shadow-sm">

            <div className="text-4xl">
              ⏳
            </div>

            <h3 className="font-bold text-slate-800 mt-3">
              Loading your history...
            </h3>

            <p className="text-sm text-slate-500 mt-1">
              Fetching previous cases from the server.
            </p>

          </div>
        )}

        {!isLoading && error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-red-800">

            <p className="font-bold">
              Unable to load history
            </p>

            <p className="text-sm mt-1">
              {error}
            </p>

            <button
              type="button"
              onClick={loadCases}
              className="mt-4 px-4 py-2 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700"
            >
              Try Again
            </button>

          </div>
        )}

        {!isLoading &&
          !error &&
          filteredCases.length === 0 && (
            <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-10 text-center shadow-sm">

              <div className="text-5xl">
                🩺
              </div>

              <h3 className="text-xl font-bold text-slate-800 mt-4">
                {cases.length
                  ? 'No matching cases'
                  : 'No previous cases yet'}
              </h3>

              <p className="text-sm text-slate-500 mt-2">
                {cases.length
                  ? 'Try a different search term.'
                  : 'Complete your first case-taking session to build your clinical history.'}
              </p>

              {!cases.length && (
                <button
                  type="button"
                  onClick={() =>
                    navigate('/patient/case-taking')
                  }
                  className="mt-5 px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700"
                >{t('startNewCase')}</button>
              )}

            </div>
          )}

        {!isLoading &&
          !error &&
          filteredCases.length > 0 && (

            <div className="relative">

              <div className="absolute left-[23px] top-5 bottom-5 w-px bg-slate-200 hidden sm:block" />

              <div className="space-y-5">

                {filteredCases.map((item, index) => {

                  const complaint =
                    item.chiefComplaint || {}

                  const ayush =
                    item.ayushAssessment || {}

                  const expanded =
                    expandedId === item.id

                  const summary =
                    item.doctorVerifiedSummary ||
                    item.aiSummary ||
                    ''

                  const isRejected =
                    item.status === 'Rejected'

                  return (
                    <article
                      key={item.id || index}
                      className="relative sm:pl-12"
                    >

                      <div className="hidden sm:flex absolute left-0 top-5 w-12 h-12 rounded-full bg-emerald-50 border-4 border-slate-50 items-center justify-center text-xl z-10">
                        🩺
                      </div>

                      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

                        <div className="p-5">

                          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">

                            <div>

                              <div className="flex flex-wrap items-center gap-2">

                                <span className="text-xs font-bold uppercase tracking-wide text-slate-400">
                                  Case #{item.id}
                                </span>

                                <span
                                  className={`px-2.5 py-1 rounded-full border text-xs font-bold ${getStatusStyle(item.status)}`}
                                >
                                  {item.status}
                                </span>

                                {item.doctorVerifiedSummary && (
                                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                                    ✓ Doctor Verified
                                  </span>
                                )}

                              </div>

                              <h3 className="text-lg font-bold text-slate-800 mt-2">
                                {complaint.mainProblem ||
                                  'Medical consultation'}
                              </h3>

                              <p className="text-sm text-slate-500 mt-1">
                                📅 {formatDate(item.submittedAt)}
                              </p>

                            </div>

                            <div className="flex flex-wrap gap-2">

                              {isRejected && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setRevisionCase(item)
                                  }
                                  className="px-4 py-2 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition"
                                >
                                  🔄 Revise & Resubmit
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedId(
                                    expanded
                                      ? null
                                      : item.id
                                  )
                                }
                                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 transition"
                              >
                                {expanded
                                  ? 'Hide Details'
                                  : 'View Details'}
                              </button>

                            </div>

                          </div>

                          {isRejected && (
                            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">

                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

                                <div>
                                  <p className="text-xs uppercase tracking-wide font-bold text-red-600">
                                    Revision Required
                                  </p>

                                  <p className="text-sm text-red-800 mt-1">
                                    Your doctor has requested changes
                                    before this case can be reviewed again.
                                  </p>
                                </div>

                                <button
                                  type="button"
                                  onClick={() =>
                                    setRevisionCase(item)
                                  }
                                  className="shrink-0 px-4 py-2 rounded-xl bg-white border border-red-300 text-red-700 font-bold hover:bg-red-100"
                                >
                                  Edit Case
                                </button>

                              </div>

                              {item.rejectionReason && (
                                <div className="mt-3 pt-3 border-t border-red-200">
                                  <p className="text-xs uppercase tracking-wide font-bold text-red-600">
                                    Doctor's Reason
                                  </p>

                                  <p className="text-sm text-red-800 mt-1 whitespace-pre-wrap">
                                    {item.rejectionReason}
                                  </p>
                                </div>
                              )}

                            </div>
                          )}

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">

                            <MiniInfo
                              label="Duration"
                              value={complaint.duration}
                            />

                            <MiniInfo
                              label="Pain Severity"
                              value={
                                complaint.painSeverity
                                  ? `${complaint.painSeverity}/10`
                                  : ''
                              }
                            />

                            <MiniInfo
                              label="Prakriti"
                              value={
                                ayush.prakritiIndicativeProfile ||
                                ayush.prakriti
                              }
                            />

                          </div>

                          {expanded && (
                            <div className="mt-5 pt-5 border-t border-slate-200 space-y-5">

                              <TimelineSection
                                title="Chief Complaint"
                                icon="🩺"
                              >
                                <Detail
                                  label="Main Problem"
                                  value={complaint.mainProblem}
                                />

                                <Detail
                                  label="Symptoms"
                                  value={complaint.symptoms}
                                />

                                <Detail
                                  label="Duration"
                                  value={complaint.duration}
                                />

                                <Detail
                                  label="Pain Severity"
                                  value={complaint.painSeverity}
                                />
                              </TimelineSection>

                              <TimelineSection
                                title="AYUSH Assessment"
                                icon="🌿"
                              >

                                <Detail
                                  label="Prakriti"
                                  value={
                                    ayush.prakritiIndicativeProfile ||
                                    ayush.prakriti
                                  }
                                />

                                <Detail
                                  label="Prakriti Score"
                                  value={ayush.prakritiScore}
                                />

                                <Detail
                                  label="Vikriti"
                                  value={ayush.vikriti}
                                />

                                <Detail
                                  label="Agni"
                                  value={ayush.agni}
                                />

                                <Detail
                                  label="Koshtha"
                                  value={ayush.koshtha}
                                />

                                <Detail
                                  label="Ahara"
                                  value={
                                    ayush.dietDetails ||
                                    ayush.ahara ||
                                    ayush.ahaar
                                  }
                                />

                                <Detail
                                  label="Vihara"
                                  value={
                                    ayush.dailyRoutine ||
                                    ayush.vihara
                                  }
                                />

                                <Detail
                                  label="Nidana"
                                  value={ayush.nidana}
                                />

                                <Detail
                                  label="Samprapti"
                                  value={ayush.samprapti}
                                />

                                <Detail
                                  label="Dashavidha Pariksha"
                                  value={
                                    ayush.dashavidhaPariksha
                                  }
                                />

                              </TimelineSection>

                              <TimelineSection
                                title="Clinical Summary"
                                icon="🤖"
                              >

                                {summary ? (
                                  <p className="text-sm text-slate-700 whitespace-pre-wrap leading-6">
                                    {summary}
                                  </p>
                                ) : (
                                  <p className="text-sm text-slate-500">
                                    No AI or doctor-verified summary
                                    is available.
                                  </p>
                                )}

                                {item.doctorVerifiedSummary && (
                                  <span className="inline-flex mt-3 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                                    ✓ Doctor Verified Summary
                                  </span>
                                )}

                              </TimelineSection>

                              {item.doctorNotes && (
                                <TimelineSection
                                  title="Doctor Notes"
                                  icon="👨‍⚕️"
                                >
                                  <p className="text-sm text-slate-700 whitespace-pre-wrap leading-6">
                                    {item.doctorNotes}
                                  </p>
                                </TimelineSection>
                              )}

                              {item.rejectionReason && (
                                <div className="rounded-xl border border-red-200 bg-red-50 p-4">

                                  <p className="text-xs uppercase tracking-wide font-bold text-red-600">
                                    Revision Reason
                                  </p>

                                  <p className="text-sm text-red-800 mt-1 whitespace-pre-wrap">
                                    {item.rejectionReason}
                                  </p>

                                </div>
                              )}

                            </div>
                          )}

                        </div>
                      </div>
                    </article>
                  )
                })}

              </div>
            </div>
          )}

        <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-4">

          <p className="text-sm text-amber-800">
            ⚠ Your history is for clinical documentation and continuity
            of care. AI-generated information is decision-support only
            and should be verified by a qualified doctor.
          </p>

        </div>

      </main>

      {revisionCase && (
        <RevisionEditor
          patientCase={revisionCase}
          onClose={() => setRevisionCase(null)}
          onSuccess={handleRevisionSuccess}
        />
      )}

    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">

      <div className="flex items-center gap-3">

        <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center text-xl">
          {icon}
        </div>

        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400 font-bold">
            {label}
          </p>

          <p className="text-2xl font-bold text-slate-800 mt-1">
            {value}
          </p>
        </div>

      </div>
    </div>
  )
}

function MiniInfo({
  label,
  value,
}) {
  if (!value) {
    return null
  }

  return (
    <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">

      <p className="text-[11px] uppercase tracking-wide text-slate-400 font-bold">
        {label}
      </p>

      <p className="text-sm font-semibold text-slate-700 mt-1 break-words">
        {String(value)}
      </p>

    </div>
  )
}

function TimelineSection({
  title,
  icon,
  children,
}) {
  return (
    <section>

      <div className="flex items-center gap-2 mb-3">

        <span>{icon}</span>

        <h4 className="font-bold text-slate-800">
          {title}
        </h4>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {children}
      </div>

    </section>
  )
}

function Detail({
  label,
  value,
}) {
  if (!value) {
    return null
  }

  return (
    <div className="rounded-xl border border-slate-200 p-3">

      <p className="text-[11px] uppercase tracking-wide text-slate-400 font-bold">
        {label}
      </p>

      <p className="text-sm text-slate-700 mt-1 whitespace-pre-wrap break-words">
        {String(value)}
      </p>

    </div>
  )
}

export default PreviousCases