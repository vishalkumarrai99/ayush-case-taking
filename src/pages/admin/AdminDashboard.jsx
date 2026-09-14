import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import { logout } from '../../store/slices/authSlice'
import { apiRequest } from '../../services/api'

function AdminDashboard() {
  const { user } = useSelector((state) => state.auth)

  const navigate = useNavigate()
  const dispatch = useDispatch()

  // =========================================================
  // CASE STATE
  // =========================================================

  const [adminCases, setAdminCases] = useState([])
  const [isLoadingCases, setIsLoadingCases] = useState(true)
  const [caseError, setCaseError] = useState('')

  // =========================================================
  // DOCTOR STATE
  // =========================================================

  const [pendingDoctors, setPendingDoctors] = useState([])
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(true)
  const [doctorError, setDoctorError] = useState('')

  const [processingDoctorId, setProcessingDoctorId] = useState(null)

  const [selectedDoctor, setSelectedDoctor] = useState(null)

  const [rejectingDoctor, setRejectingDoctor] = useState(null)
  const [rejectionReason, setRejectionReason] = useState('')

  const [successMessage, setSuccessMessage] = useState('')

  // =========================================================
  // NOTIFICATION STATE
  // =========================================================

  const [unreadNotificationCount, setUnreadNotificationCount] =
    useState(0)

  // =========================================================
  // CASE NORMALIZATION
  // =========================================================

  const parseSection = (section) => {
    if (!section) {
      return {}
    }

    if (typeof section === 'object') {
      return section
    }

    return String(section)
      .split(/\r?\n/)
      .reduce((acc, line) => {
        const separator = line.indexOf(':')

        if (separator === -1) {
          return acc
        }

        const key = line.slice(0, separator).trim()
        const value = line.slice(separator + 1).trim()

        if (key) {
          acc[key] = value
        }

        return acc
      }, {})
  }

  const normalizeCase = (item) => {
    const patient = parseSection(item?.patientInformation)
    const complaint = parseSection(item?.chiefComplaint)
    const history = parseSection(item?.medicalHistory)

    return {
      ...item,

      id: item?.id,

      patientInformation: {
        fullName:
          patient.fullName ||
          patient['Full Name'] ||
          patient.name ||
          'Unknown Patient',

        age:
          patient.age ||
          patient.Age ||
          '',

        gender:
          patient.gender ||
          patient.Gender ||
          '',

        mobileNumber:
          patient.mobileNumber ||
          patient['Mobile Number'] ||
          patient.mobile ||
          '',
      },

      chiefComplaint: {
        mainProblem:
          complaint.mainProblem ||
          complaint['Main Health Problem'] ||
          complaint['Main Problem'] ||
          complaint.mainHealthProblem ||
          '',

        duration:
          complaint.duration ||
          complaint.Duration ||
          '',

        painSeverity:
          complaint.painSeverity ||
          complaint['Pain Severity'] ||
          '',
      },

      medicalHistory: {
        hospitalization:
          history.hospitalization ||
          history.Hospitalization ||
          '',
      },

      status: item?.status || 'Submitted',
    }
  }

  // =========================================================
  // LOAD CASES
  // =========================================================

  const loadCases = async () => {
    setIsLoadingCases(true)
    setCaseError('')

    try {
      const response = await apiRequest('/cases', {
        method: 'GET',
      })

      const rawCases =
        Array.isArray(response)
          ? response
          : Array.isArray(response?.cases)
            ? response.cases
            : Array.isArray(response?.data)
              ? response.data
              : []

      setAdminCases(rawCases.map(normalizeCase))
    } catch (error) {
      console.error('Failed to load admin cases:', error)

      setCaseError(
        error?.message ||
          'Unable to load patient cases.'
      )

      setAdminCases([])
    } finally {
      setIsLoadingCases(false)
    }
  }

  // =========================================================
  // LOAD PENDING DOCTORS
  // =========================================================

  const loadPendingDoctors = async () => {
    setIsLoadingDoctors(true)
    setDoctorError('')

    try {
      const response = await apiRequest(
        '/admin/doctors/pending',
        {
          method: 'GET',
        }
      )

      const doctors =
        Array.isArray(response)
          ? response
          : Array.isArray(response?.doctors)
            ? response.doctors
            : Array.isArray(response?.data)
              ? response.data
              : []

      setPendingDoctors(doctors)
    } catch (error) {
      console.error(
        'Failed to load pending doctors:',
        error
      )

      setDoctorError(
        error?.message ||
          'Unable to load pending doctor registrations.'
      )

      setPendingDoctors([])
    } finally {
      setIsLoadingDoctors(false)
    }
  }

  // =========================================================
  // LOAD NOTIFICATION COUNT
  // =========================================================

  const loadNotificationCount = async () => {
    try {
      const response = await apiRequest(
        '/notifications/my/unread/count',
        {
          method: 'GET',
        }
      )

      const count =
        typeof response === 'number'
          ? response
          : Number(
              response?.count ??
              response?.unreadCount ??
              response?.data ??
              0
            )

      setUnreadNotificationCount(
        Number.isFinite(count) ? count : 0
      )
    } catch (error) {
      console.error(
        'Failed to load notification count:',
        error
      )
    }
  }

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    loadCases()
    loadPendingDoctors()
    loadNotificationCount()
  }, [])

  // =========================================================
  // LOGOUT
  // =========================================================

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  // =========================================================
  // CASE STATISTICS
  // =========================================================

  const totalCases = adminCases.length

  const pendingCases =
    adminCases.filter(
      (item) =>
        !item.status ||
        item.status === 'Submitted'
    ).length

  const reviewedCases =
    adminCases.filter(
      (item) =>
        item.status === 'Reviewed'
    ).length

  const rejectedCases =
    adminCases.filter(
      (item) =>
        item.status === 'Rejected'
    ).length

  const attentionCases =
    adminCases.filter((item) => {
      const pain =
        Number(
          item.chiefComplaint?.painSeverity
        ) || 0

      const duration =
        item.chiefComplaint?.duration
          ?.toLowerCase() || ''

      const hospitalization =
        item.medicalHistory?.hospitalization
          ?.toLowerCase() || ''

      return (
        pain >= 8 ||
        duration.includes('month') ||
        (
          hospitalization &&
          hospitalization !== 'no' &&
          hospitalization !== 'none'
        )
      )
    }).length

  const completionRate =
    totalCases > 0
      ? Math.round(
          (reviewedCases / totalCases) * 100
        )
      : 0

  // =========================================================
  // CASE FILTER
  // =========================================================

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] =
    useState('All')
  const [sortOrder, setSortOrder] =
    useState('latest')

  const filteredCases = useMemo(() => {
    let cases = [...adminCases]

    if (search.trim()) {
      const query =
        search.toLowerCase().trim()

      cases = cases.filter((item) => {
        const name =
          item.patientInformation
            ?.fullName
            ?.toLowerCase() || ''

        const complaint =
          item.chiefComplaint
            ?.mainProblem
            ?.toLowerCase() || ''

        const mobile =
          item.patientInformation
            ?.mobileNumber
            ?.toLowerCase() || ''

        return (
          name.includes(query) ||
          complaint.includes(query) ||
          mobile.includes(query)
        )
      })
    }

    if (statusFilter !== 'All') {
      cases = cases.filter(
        (item) =>
          (item.status || 'Submitted') ===
          statusFilter
      )
    }

    cases.sort((a, b) => {
      const first =
        new Date(
          a.submittedAt || 0
        ).getTime()

      const second =
        new Date(
          b.submittedAt || 0
        ).getTime()

      return sortOrder === 'latest'
        ? second - first
        : first - second
    })

    return cases
  }, [
    adminCases,
    search,
    statusFilter,
    sortOrder,
  ])

  // =========================================================
  // APPROVE DOCTOR
  // =========================================================

  const handleApproveDoctor = async (
    doctor
  ) => {
    const confirmed =
      window.confirm(
        `Approve Dr. ${
          doctor.name || 'this doctor'
        }?\n\n` +
        `Registration No: ${
          doctor.registrationNumber ||
          'Not provided'
        }\n` +
        `Qualification: ${
          doctor.qualification ||
          'Not provided'
        }\n` +
        `Specialization: ${
          doctor.specialization ||
          'Not provided'
        }`
      )

    if (!confirmed) {
      return
    }

    setProcessingDoctorId(
      doctor.userId
    )

    setDoctorError('')
    setSuccessMessage('')

    try {
      const response =
        await apiRequest(
          `/admin/doctors/${doctor.userId}/approve`,
          {
            method: 'PUT',
          }
        )

      setPendingDoctors(
        (previous) =>
          previous.filter(
            (item) =>
              item.userId !==
              doctor.userId
          )
      )

      setSelectedDoctor(null)

      setSuccessMessage(
        response?.message ||
          'Doctor approved successfully.'
      )

      loadNotificationCount()

      setTimeout(() => {
        setSuccessMessage('')
      }, 5000)
    } catch (error) {
      console.error(
        'Doctor approval failed:',
        error
      )

      setDoctorError(
        error?.message ||
          'Unable to approve doctor.'
      )
    } finally {
      setProcessingDoctorId(null)
    }
  }

  // =========================================================
  // OPEN REJECT DIALOG
  // =========================================================

  const openRejectDialog = (
    doctor
  ) => {
    setRejectingDoctor(doctor)
    setRejectionReason('')
    setDoctorError('')
  }

  // =========================================================
  // REJECT DOCTOR
  // =========================================================

  const handleRejectDoctor = async () => {
    if (!rejectingDoctor) {
      return
    }

    setProcessingDoctorId(
      rejectingDoctor.userId
    )

    setDoctorError('')
    setSuccessMessage('')

    try {
      const reason =
        rejectionReason.trim() ||
        'Registration was not approved by the administrator.'

      const response =
        await apiRequest(
          `/admin/doctors/${rejectingDoctor.userId}/reject`,
          {
            method: 'PUT',
            body: JSON.stringify({
              reason,
            }),
          }
        )

      setPendingDoctors(
        (previous) =>
          previous.filter(
            (item) =>
              item.userId !==
              rejectingDoctor.userId
          )
      )

      setSelectedDoctor(null)
      setRejectingDoctor(null)
      setRejectionReason('')

      setSuccessMessage(
        response?.message ||
          'Doctor registration rejected.'
      )

      loadNotificationCount()

      setTimeout(() => {
        setSuccessMessage('')
      }, 5000)
    } catch (error) {
      console.error(
        'Doctor rejection failed:',
        error
      )

      setDoctorError(
        error?.message ||
          'Unable to reject doctor.'
      )
    } finally {
      setProcessingDoctorId(null)
    }
  }

  // =========================================================
  // HELPERS
  // =========================================================

  const getInitial = (name) => {
    if (!name) {
      return 'D'
    }

    return name
      .charAt(0)
      .toUpperCase()
  }

  const formatDate = (value) => {
    if (!value) {
      return 'Not available'
    }

    const date = new Date(value)

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return 'Not available'
    }

    return date.toLocaleString(
      'en-IN',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }
    )
  }

  const getStatusStyle = (status) => {
    if (status === 'Reviewed') {
      return 'bg-emerald-50 text-emerald-700 border-emerald-100'
    }

    if (status === 'Rejected') {
      return 'bg-red-50 text-red-700 border-red-100'
    }

    return 'bg-amber-50 text-amber-700 border-amber-100'
  }

  const doctorField = (
    label,
    value
  ) => (
    <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
      <p className="text-[11px] text-slate-400 uppercase tracking-wide">
        {label}
      </p>

      <p className="text-sm font-bold text-slate-800 mt-1 break-words">
        {value !== null &&
        value !== undefined &&
        String(value).trim() !== ''
          ? value
          : 'Not provided'}
      </p>
    </div>
  )

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="min-h-screen bg-slate-50">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 py-4">

          <div className="flex items-center justify-between gap-4">

            {/* BRAND */}

            <div className="flex items-center gap-3">

              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700 text-white flex items-center justify-center shadow-lg">
                <span className="text-2xl">
                  ⚕
                </span>
              </div>

              <div>
                <h1 className="text-lg sm:text-xl font-bold text-slate-900">
                  AYUSH Care
                </h1>

                <p className="text-xs text-slate-500">
                  Administration Portal
                </p>
              </div>

            </div>

            {/* ADMIN */}

            <div className="flex items-center gap-3">

              <button
                type="button"
                onClick={() =>
                  navigate(
                    '/admin/notifications'
                  )
                }
                className="relative w-10 h-10 rounded-xl border border-violet-100 bg-violet-50 text-violet-700 hover:bg-violet-100 transition"
                title="Admin Notifications"
              >
                🔔

                {unreadNotificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">
                    {unreadNotificationCount > 9
                      ? '9+'
                      : unreadNotificationCount}
                  </span>
                )}
              </button>

              <div className="hidden sm:block text-right">
                <p className="text-sm font-semibold text-slate-800">
                  {user?.email ||
                    'Administrator'}
                </p>

                <p className="text-xs text-violet-600 font-medium">
                  System Administrator
                </p>
              </div>

              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-indigo-700 text-white flex items-center justify-center font-bold">
                A
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="px-4 py-2 rounded-xl bg-red-50 text-red-600 border border-red-100 font-semibold text-sm hover:bg-red-100 transition"
              >
                Logout
              </button>

            </div>

          </div>

        </div>
      </header>

      {/* =====================================================
          MAIN
      ====================================================== */}

      <main className="max-w-7xl mx-auto px-5 sm:px-6 py-8">

        {/* SUCCESS */}

        {successMessage && (
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-700">
            ✓ {successMessage}
          </div>
        )}

        {/* =====================================================
            HERO
        ====================================================== */}

        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-violet-950 to-indigo-900 text-white p-7 sm:p-10 shadow-xl">

          <div className="absolute -top-24 -right-20 w-72 h-72 rounded-full bg-violet-400/10 blur-3xl" />

          <div className="absolute -bottom-28 left-1/3 w-80 h-80 rounded-full bg-indigo-400/10 blur-3xl" />

          <div className="relative z-10">

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-violet-100 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-violet-300 animate-pulse" />
              System Administration
            </div>

            <div className="mt-5 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">

              <div>

                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
                  Welcome, Administrator 👋
                </h2>

                <p className="mt-4 text-violet-50/80 max-w-2xl leading-7 text-sm sm:text-base">
                  Manage doctor registrations,
                  review patient cases and
                  monitor the complete AYUSH
                  healthcare workflow.
                </p>

              </div>

              <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl px-5 py-4 min-w-[220px]">

                <p className="text-xs text-violet-200">
                  Doctor Approval Queue
                </p>

                <div className="flex items-center gap-2 mt-2">

                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />

                  <p className="text-2xl font-bold">
                    {pendingDoctors.length}
                  </p>

                  <p className="text-sm text-violet-100">
                    pending
                  </p>

                </div>

              </div>

            </div>

          </div>

        </section>

        {/* =====================================================
            DOCTOR APPROVAL SECTION
        ====================================================== */}

        <section className="mt-8">

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-5">

            <div>

              <p className="text-sm font-bold text-violet-600 uppercase tracking-wider">
                Doctor Verification
              </p>

              <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
                Pending Doctor Registrations
              </h3>

              <p className="text-sm text-slate-500 mt-2 max-w-2xl">
                Review the complete professional
                information before granting
                doctor access.
              </p>

            </div>

            <button
              type="button"
              onClick={() => {
                loadPendingDoctors()
                loadNotificationCount()
              }}
              disabled={isLoadingDoctors}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-bold hover:bg-slate-50 disabled:opacity-50"
            >
              {isLoadingDoctors
                ? 'Refreshing...'
                : '↻ Refresh'}
            </button>

          </div>

          {doctorError && (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
              ⚠️ {doctorError}
            </div>
          )}

          {isLoadingDoctors ? (

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-12 text-center">
              <div className="text-4xl">
                ⏳
              </div>

              <h4 className="font-bold text-slate-800 mt-4">
                Loading doctor registrations...
              </h4>
            </div>

          ) : pendingDoctors.length === 0 ? (

            <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-12 text-center">

              <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-3xl">
                ✓
              </div>

              <h4 className="text-xl font-bold text-slate-800 mt-5">
                No pending doctor registrations
              </h4>

              <p className="text-sm text-slate-500 mt-2">
                New doctor registrations will
                appear here automatically.
              </p>

            </div>

          ) : (

            <div className="space-y-5">

              {pendingDoctors.map(
                (doctor) => (

                  <div
                    key={doctor.userId}
                    className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden"
                  >

                    {/* DOCTOR HEADER */}

                    <div className="p-6 border-b border-slate-100">

                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

                        <div className="flex items-start gap-4">

                          <div className="w-16 h-16 shrink-0 rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-100 text-violet-700 flex items-center justify-center text-2xl font-bold border border-violet-200">
                            {getInitial(
                              doctor.name
                            )}
                          </div>

                          <div>

                            <div className="flex flex-wrap items-center gap-2">

                              <h4 className="text-xl font-bold text-slate-900">
                                Dr.{' '}
                                {doctor.name ||
                                  'Doctor'}
                              </h4>

                              <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100 text-xs font-bold">
                                PENDING
                              </span>

                            </div>

                            <p className="text-sm text-slate-500 mt-1">
                              {doctor.email ||
                                'No email'}
                            </p>

                            <p className="text-sm text-slate-500 mt-1">
                              Registered:{' '}
                              {formatDate(
                                doctor.createdAt
                              )}
                            </p>

                          </div>

                        </div>

                        <div className="flex flex-wrap gap-2">

                          <button
                            type="button"
                            onClick={() =>
                              setSelectedDoctor(
                                doctor
                              )
                            }
                            className="px-5 py-2.5 rounded-xl bg-violet-50 text-violet-700 border border-violet-100 text-sm font-bold hover:bg-violet-100 transition"
                          >
                            👁 View Full Details
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleApproveDoctor(
                                doctor
                              )
                            }
                            disabled={
                              processingDoctorId ===
                              doctor.userId
                            }
                            className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 disabled:opacity-50 transition"
                          >
                            {processingDoctorId ===
                            doctor.userId
                              ? 'Processing...'
                              : '✓ Approve'}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              openRejectDialog(
                                doctor
                              )
                            }
                            disabled={
                              processingDoctorId ===
                              doctor.userId
                            }
                            className="px-5 py-2.5 rounded-xl bg-red-50 text-red-600 border border-red-100 text-sm font-bold hover:bg-red-100 disabled:opacity-50 transition"
                          >
                            ✕ Reject
                          </button>

                        </div>

                      </div>

                    </div>

                    {/* QUICK INFORMATION */}

                    <div className="p-6">

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

                        {doctorField(
                          'Medical System',
                          doctor.medicalSystem
                        )}

                        {doctorField(
                          'Registration No.',
                          doctor.registrationNumber
                        )}

                        {doctorField(
                          'Qualification',
                          doctor.qualification
                        )}

                        {doctorField(
                          'Specialization',
                          doctor.specialization
                        )}

                      </div>

                      <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4">

                        <div className="flex gap-3">

                          <div className="text-xl">
                            🔎
                          </div>

                          <div>

                            <p className="text-sm font-bold text-blue-900">
                              Admin verification required
                            </p>

                            <p className="text-xs sm:text-sm text-blue-800/80 mt-1 leading-5">
                              Open full details and
                              verify registration,
                              qualification,
                              specialization,
                              experience and
                              professional information
                              before approval.
                            </p>

                          </div>

                        </div>

                      </div>

                    </div>

                  </div>

                )
              )}

            </div>

          )}

        </section>

        {/* =====================================================
            CASE STATISTICS
        ====================================================== */}

        <section className="mt-10">

          <div className="flex items-end justify-between mb-5">

            <div>

              <p className="text-sm font-bold text-violet-600 uppercase tracking-wider">
                Administration
              </p>

              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                Patient Case Workflow
              </h3>

            </div>

            <button
              type="button"
              onClick={loadCases}
              disabled={isLoadingCases}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-bold hover:bg-slate-50 disabled:opacity-50"
            >
              {isLoadingCases
                ? 'Loading...'
                : '↻ Refresh'}
            </button>

          </div>

          {caseError && (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
              ⚠️ {caseError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <p className="text-sm text-slate-500">
                Total Cases
              </p>

              <p className="text-3xl font-bold text-slate-900 mt-1">
                {totalCases}
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <p className="text-sm text-slate-500">
                Pending
              </p>

              <p className="text-3xl font-bold text-amber-600 mt-1">
                {pendingCases}
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <p className="text-sm text-slate-500">
                Reviewed
              </p>

              <p className="text-3xl font-bold text-emerald-600 mt-1">
                {reviewedCases}
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <p className="text-sm text-slate-500">
                Rejected
              </p>

              <p className="text-3xl font-bold text-red-600 mt-1">
                {rejectedCases}
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <p className="text-sm text-slate-500">
                Attention
              </p>

              <p className="text-3xl font-bold text-orange-600 mt-1">
                {attentionCases}
              </p>
            </div>

          </div>

          {/* PROGRESS */}

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 mt-5">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-xs uppercase tracking-wider font-bold text-violet-600">
                  Workflow Analytics
                </p>

                <h3 className="text-xl font-bold text-slate-900 mt-1">
                  Case review completion
                </h3>

              </div>

              <span className="text-2xl font-bold text-violet-600">
                {completionRate}%
              </span>

            </div>

            <div className="mt-5 h-3 bg-slate-100 rounded-full overflow-hidden">

              <div
                className="h-full bg-gradient-to-r from-violet-600 to-indigo-500 rounded-full transition-all duration-700"
                style={{
                  width: `${completionRate}%`,
                }}
              />

            </div>

          </div>

        </section>

        {/* =====================================================
            CASE MANAGEMENT
        ====================================================== */}

        <section className="mt-10">

          <div className="mb-5">

            <p className="text-sm font-bold text-violet-600 uppercase tracking-wider">
              Patient Queue
            </p>

            <h3 className="text-2xl font-bold text-slate-900 mt-1">
              All Patient Cases
            </h3>

            <p className="text-sm text-slate-500 mt-1">
              Monitor and access the complete case workflow.
            </p>

          </div>

          {/* SEARCH */}

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-5">

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search patient, complaint or mobile..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:bg-white focus:border-violet-500"
              />

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value
                  )
                }
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50"
              >

                <option value="All">
                  All Status
                </option>

                <option value="Submitted">
                  Pending
                </option>

                <option value="Reviewed">
                  Reviewed
                </option>

                <option value="Rejected">
                  Rejected
                </option>

              </select>

              <select
                value={sortOrder}
                onChange={(event) =>
                  setSortOrder(
                    event.target.value
                  )
                }
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50"
              >

                <option value="latest">
                  Latest First
                </option>

                <option value="oldest">
                  Oldest First
                </option>

              </select>

            </div>

          </div>

          {isLoadingCases ? (

            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center">
              ⏳ Loading patient cases...
            </div>

          ) : filteredCases.length === 0 ? (

            <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-12 text-center">

              <div className="text-5xl">
                🔎
              </div>

              <h4 className="text-lg font-bold text-slate-800 mt-4">
                No cases found
              </h4>

            </div>

          ) : (

            <div className="space-y-4">

              {filteredCases.map(
                (patientCase) => {

                  const patientName =
                    patientCase
                      .patientInformation
                      ?.fullName ||
                    'Unknown Patient'

                  const complaint =
                    patientCase
                      .chiefComplaint
                      ?.mainProblem ||
                    'Medical case'

                  const status =
                    patientCase.status ||
                    'Submitted'

                  return (

                    <div
                      key={patientCase.id}
                      className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden"
                    >

                      <div className="p-6">

                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

                          <div className="flex items-start gap-4">

                            <div className="w-14 h-14 rounded-2xl bg-violet-50 text-violet-700 flex items-center justify-center text-lg font-bold">
                              {getInitial(
                                patientName
                              )}
                            </div>

                            <div>

                              <h4 className="text-lg font-bold text-slate-900">
                                {patientName}
                              </h4>

                              <p className="text-sm text-slate-500 mt-1">
                                Case #{patientCase.id}
                              </p>

                            </div>

                          </div>

                          <span
                            className={`inline-flex items-center px-3 py-1.5 rounded-full border text-xs font-bold ${getStatusStyle(
                              status
                            )}`}
                          >
                            {status}
                          </span>

                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-5">

                          <div className="rounded-xl bg-slate-50 p-3">

                            <p className="text-[11px] text-slate-400 uppercase">
                              Main Complaint
                            </p>

                            <p className="text-sm font-semibold text-slate-700 mt-1 truncate">
                              {complaint}
                            </p>

                          </div>

                          <div className="rounded-xl bg-slate-50 p-3">

                            <p className="text-[11px] text-slate-400 uppercase">
                              Age
                            </p>

                            <p className="text-sm font-semibold text-slate-700 mt-1">
                              {patientCase
                                .patientInformation
                                ?.age ||
                                'Not provided'}
                            </p>

                          </div>

                          <div className="rounded-xl bg-slate-50 p-3">

                            <p className="text-[11px] text-slate-400 uppercase">
                              Gender
                            </p>

                            <p className="text-sm font-semibold text-slate-700 mt-1">
                              {patientCase
                                .patientInformation
                                ?.gender ||
                                'Not provided'}
                            </p>

                          </div>

                          <div className="rounded-xl bg-slate-50 p-3">

                            <p className="text-[11px] text-slate-400 uppercase">
                              Submitted
                            </p>

                            <p className="text-sm font-semibold text-slate-700 mt-1">
                              {formatDate(
                                patientCase.submittedAt
                              )}
                            </p>

                          </div>

                        </div>

                        <div className="flex justify-end mt-5 pt-5 border-t border-slate-100">

                          <button
                            type="button"
                            onClick={() =>
                              navigate(
                                `/doctor/cases/${patientCase.id}`
                              )
                            }
                            className="px-5 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-700"
                          >
                            View Case →
                          </button>

                        </div>

                      </div>

                    </div>

                  )
                }
              )}

            </div>

          )}

        </section>

        {/* =====================================================
            SECURITY
        ====================================================== */}

        <section className="mt-8 rounded-2xl bg-slate-900 text-white p-5">

          <div className="flex items-start gap-4">

            <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center text-xl">
              🔐
            </div>

            <div>

              <p className="text-sm font-bold">
                Privacy & Security
              </p>

              <p className="text-xs text-slate-300 mt-1 leading-5">
                Doctor approval is controlled by
                the backend. Frontend buttons do
                not bypass server-side authorization.
              </p>

            </div>

          </div>

        </section>

      </main>

      {/* =====================================================
          DOCTOR DETAILS MODAL
      ====================================================== */}

      {selectedDoctor && (

        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">

          <div className="w-full max-w-5xl max-h-[92vh] overflow-hidden bg-white rounded-3xl shadow-2xl">

            {/* MODAL HEADER */}

            <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-6 py-5">

              <div className="flex items-center justify-between gap-4">

                <div className="flex items-center gap-4">

                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-100 text-violet-700 flex items-center justify-center text-xl font-bold">
                    {getInitial(
                      selectedDoctor.name
                    )}
                  </div>

                  <div>

                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                      Dr.{' '}
                      {selectedDoctor.name ||
                        'Doctor'}
                    </h2>

                    <p className="text-sm text-slate-500">
                      Complete Registration Details
                    </p>

                  </div>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedDoctor(null)
                  }
                  className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 text-xl"
                >
                  ×
                </button>

              </div>

            </div>

            {/* MODAL CONTENT */}

            <div className="overflow-y-auto max-h-[calc(92vh-170px)] p-6">

              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 mb-6">

                <div className="flex gap-3">

                  <div className="text-xl">
                    ⚠️
                  </div>

                  <div>

                    <p className="font-bold text-amber-900">
                      Pending admin verification
                    </p>

                    <p className="text-sm text-amber-800 mt-1">
                      Verify the information below
                      before approving this doctor.
                    </p>

                  </div>

                </div>

              </div>

              {/* PERSONAL */}

              <section>

                <h3 className="text-sm font-bold text-violet-600 uppercase tracking-wider mb-4">
                  Account Information
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

                  {doctorField(
                    'Full Name',
                    selectedDoctor.name
                  )}

                  {doctorField(
                    'Email',
                    selectedDoctor.email
                  )}

                  {doctorField(
                    'Mobile',
                    selectedDoctor.mobile
                  )}

                  {doctorField(
                    'Account Status',
                    selectedDoctor.status
                  )}

                  {doctorField(
                    'User ID',
                    selectedDoctor.userId
                  )}

                  {doctorField(
                    'Registered At',
                    formatDate(
                      selectedDoctor.createdAt
                    )
                  )}

                </div>

              </section>

              {/* PROFESSIONAL */}

              <section className="mt-8">

                <h3 className="text-sm font-bold text-violet-600 uppercase tracking-wider mb-4">
                  Professional Information
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

                  {doctorField(
                    'Medical System',
                    selectedDoctor.medicalSystem
                  )}

                  {doctorField(
                    'Registration Number',
                    selectedDoctor.registrationNumber
                  )}

                  {doctorField(
                    'Qualification',
                    selectedDoctor.qualification
                  )}

                  {doctorField(
                    'Specialization',
                    selectedDoctor.specialization
                  )}

                  {doctorField(
                    'Experience',
                    selectedDoctor.experienceYears !==
                    null &&
                    selectedDoctor.experienceYears !==
                    undefined
                      ? `${selectedDoctor.experienceYears} years`
                      : null
                  )}

                </div>

              </section>

              {/* WORKPLACE */}

              <section className="mt-8">

                <h3 className="text-sm font-bold text-violet-600 uppercase tracking-wider mb-4">
                  Workplace Information
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

                  {doctorField(
                    'Hospital / Clinic',
                    selectedDoctor.hospital
                  )}

                  {doctorField(
                    'Department',
                    selectedDoctor.department
                  )}

                  {doctorField(
                    'City',
                    selectedDoctor.city
                  )}

                  {doctorField(
                    'State',
                    selectedDoctor.state
                  )}

                </div>

              </section>

            </div>

            {/* MODAL FOOTER */}

            <div className="border-t border-slate-100 bg-slate-50 px-6 py-4">

              <div className="flex flex-col sm:flex-row justify-end gap-3">

                <button
                  type="button"
                  onClick={() =>
                    setSelectedDoctor(null)
                  }
                  className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 font-bold text-sm"
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={() =>
                    openRejectDialog(
                      selectedDoctor
                    )
                  }
                  disabled={
                    processingDoctorId ===
                    selectedDoctor.userId
                  }
                  className="px-5 py-2.5 rounded-xl bg-red-50 text-red-600 border border-red-100 font-bold text-sm"
                >
                  ✕ Reject
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleApproveDoctor(
                      selectedDoctor
                    )
                  }
                  disabled={
                    processingDoctorId ===
                    selectedDoctor.userId
                  }
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm"
                >
                  {processingDoctorId ===
                  selectedDoctor.userId
                    ? 'Processing...'
                    : '✓ Approve Doctor'}
                </button>

              </div>

            </div>

          </div>

        </div>

      )}

      {/* =====================================================
          REJECT MODAL
      ====================================================== */}

      {rejectingDoctor && (

        <div className="fixed inset-0 z-[60] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-5">

          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden">

            <div className="p-6 border-b border-slate-100">

              <div className="flex items-center justify-between">

                <div>

                  <h3 className="text-xl font-bold text-slate-900">
                    Reject Doctor Registration
                  </h3>

                  <p className="text-sm text-slate-500 mt-1">
                    Dr.{' '}
                    {rejectingDoctor.name}
                  </p>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    setRejectingDoctor(null)
                  }
                  className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 text-xl"
                >
                  ×
                </button>

              </div>

            </div>

            <div className="p-6">

              <label className="block text-sm font-bold text-slate-700 mb-2">
                Reason for rejection
              </label>

              <textarea
                value={rejectionReason}
                onChange={(event) =>
                  setRejectionReason(
                    event.target.value
                  )
                }
                rows={5}
                placeholder="Enter the reason for rejecting this registration..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:bg-white focus:border-red-400 focus:ring-4 focus:ring-red-500/10 resize-none"
              />

              <p className="text-xs text-slate-400 mt-2">
                This reason will be sent to the doctor
                through their notification.
              </p>

            </div>

            <div className="px-6 py-5 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row justify-end gap-3">

              <button
                type="button"
                onClick={() => {
                  setRejectingDoctor(null)
                  setRejectionReason('')
                }}
                className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 font-bold text-sm"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleRejectDoctor}
                disabled={
                  processingDoctorId ===
                  rejectingDoctor.userId
                }
                className="px-5 py-2.5 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 disabled:opacity-50"
              >
                {processingDoctorId ===
                rejectingDoctor.userId
                  ? 'Rejecting...'
                  : 'Confirm Rejection'}
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  )
}

export default AdminDashboard