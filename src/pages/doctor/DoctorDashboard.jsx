import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { logout } from '../../store/slices/authSlice'
import { useNavigate } from 'react-router-dom'
import { apiRequest, getDoctorAppointments } from '../../services/api'
import NotificationBell from '../../components/common/NotificationBell'

function DoctorDashboard() {
  const { user } = useSelector((state) => state.auth)
  const { previousCases = [] } = useSelector((state) => state.case)

  const navigate = useNavigate()
  const dispatch = useDispatch()

  const [backendCases, setBackendCases] = useState([])
  const [isLoadingCases, setIsLoadingCases] = useState(true)
  const [casesError, setCasesError] = useState('')
  const [appointments, setAppointments] = useState([])
  const [appointmentsError, setAppointmentsError] = useState('')

  // =========================================================
  // LOAD CASES FROM BACKEND
  // =========================================================

  const parseSection = (value) => {
    if (!value) return {}

    if (typeof value === 'object') {
      return value
    }

    const result = {}

    const fieldAliases = {
      'full name': 'fullName',
      name: 'fullName',
      age: 'age',
      gender: 'gender',
      'mobile number': 'mobileNumber',
      mobile: 'mobileNumber',
      phone: 'mobileNumber',
      'phone number': 'mobileNumber',
      email: 'email',
      address: 'address',
      'main problem': 'mainProblem',
      complaint: 'mainProblem',
      'chief complaint': 'mainProblem',
      symptoms: 'symptoms',
      duration: 'duration',
      'pain severity': 'painSeverity',
      'previous illness': 'previousIllness',
      'previous surgery': 'previousSurgery',
      'current medication': 'currentMedication',
      allergies: 'allergies',
      hospitalization: 'hospitalization',
      prakriti: 'prakriti',
      vikriti: 'vikriti',
      agni: 'agni',
      koshtha: 'koshtha',
      'ahaar': 'ahaar',
      'ahara': 'ahara',
      'vihara': 'vihara',
      'nidana': 'nidana',
      'samprapti': 'samprapti',
    }

    const toCanonicalKey = (key) => {
      const cleaned = String(key)
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ')

      if (fieldAliases[cleaned]) {
        return fieldAliases[cleaned]
      }

      // Also support labels that arrive in camelCase / PascalCase.
      return cleaned
        .replace(/[^a-z0-9]+(.)/g, (_, char) => char.toUpperCase())
        .replace(/^[A-Z]/, (char) => char.toLowerCase())
    }

    String(value)
      .split(/\\n|\n/)
      .forEach((line) => {
        const separatorIndex = line.indexOf(':')
        if (separatorIndex === -1) return

        const rawKey = line.slice(0, separatorIndex).trim()
        const fieldValue = line.slice(separatorIndex + 1).trim()

        if (rawKey) {
          const key = toCanonicalKey(rawKey)
          result[key] = fieldValue
        }
      })

    return result
  }

  const normalizeBackendCase = (item) => {
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

  useEffect(() => {
    let isMounted = true

    const loadCases = async () => {
      setIsLoadingCases(true)
      setCasesError('')

      try {
        const response = await apiRequest('/cases', {
          method: 'GET',
        })

        const cases = Array.isArray(response)
          ? response.map(normalizeBackendCase)
          : []

        if (isMounted) {
          setBackendCases(cases)
        }
      } catch (error) {
        console.error('Failed to load doctor cases:', error)

        if (isMounted) {
          setCasesError(
            error.message || 'Unable to load patient cases from server.'
          )
          setBackendCases([])
        }
      } finally {
        if (isMounted) {
          setIsLoadingCases(false)
        }
      }
    }

    loadCases()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    const loadAppointments = async () => {
      try {
        const response = await getDoctorAppointments()
        if (isMounted) {
          setAppointments(Array.isArray(response) ? response : [])
        }
      } catch (error) {
        console.error('Failed to load doctor appointments:', error)
        if (isMounted) {
          setAppointmentsError(error.message || 'Unable to load appointments.')
        }
      }
    }

    loadAppointments()

    return () => {
      isMounted = false
    }
  }, [])

  const cases = backendCases

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [sortOrder, setSortOrder] = useState('latest')

  // =========================================================
  // CASE COUNTS
  // =========================================================

  const totalCases = cases.length

  const pendingCases = cases.filter(
    (item) => !item.status || item.status === 'Submitted'
  ).length

  const reviewedCases = cases.filter(
    (item) => item.status === 'Reviewed'
  ).length

  const rejectedCases = cases.filter(
    (item) => item.status === 'Rejected'
  ).length

  const attentionCases = cases.filter((item) => {
    const painSeverity =
      Number(item.chiefComplaint?.painSeverity) || 0

    const duration =
      item.chiefComplaint?.duration?.toLowerCase() || ''

    const hospitalization =
      item.medicalHistory?.hospitalization?.toLowerCase() || ''

    const allergies =
      item.medicalHistory?.allergies?.toLowerCase() || ''

    return (
      painSeverity >= 8 ||
      duration.includes('month') ||
      (hospitalization &&
        hospitalization !== 'no' &&
        hospitalization !== 'none') ||
      (allergies &&
        allergies !== 'no' &&
        allergies !== 'none')
    )
  }).length

  const completionRate =
    totalCases > 0
      ? Math.round((reviewedCases / totalCases) * 100)
      : 0

  // =========================================================
  // FILTER + SEARCH
  // =========================================================

  const filteredCases = useMemo(() => {
    let filtered = [...backendCases]

    if (search.trim()) {
      const query = search.toLowerCase()

      filtered = filtered.filter((item) => {
        const patientName =
          item.patientInformation?.fullName?.toLowerCase() || ''

        const complaint =
          item.chiefComplaint?.mainProblem?.toLowerCase() || ''

        const mobile =
          item.patientInformation?.mobileNumber?.toLowerCase() || ''

        return (
          patientName.includes(query) ||
          complaint.includes(query) ||
          mobile.includes(query)
        )
      })
    }

    if (statusFilter !== 'All') {
      filtered = filtered.filter((item) => {
        const status = item.status || 'Submitted'
        return status === statusFilter
      })
    }

    filtered.sort((a, b) => {
      const dateA = new Date(a.submittedAt || 0).getTime()
      const dateB = new Date(b.submittedAt || 0).getTime()

      return sortOrder === 'latest'
        ? dateB - dateA
        : dateA - dateB
    })

    return filtered
  }, [backendCases, search, statusFilter, sortOrder])

  // =========================================================
  // HELPERS
  // =========================================================

  const getInitial = (name) => {
    if (!name) return 'P'
    return name.charAt(0).toUpperCase()
  }

  const getStatus = (patientCase) => {
    return patientCase.status || 'Submitted'
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

  const hasRedFlag = (patientCase) => {
    const painSeverity =
      Number(patientCase.chiefComplaint?.painSeverity) || 0

    const duration =
      patientCase.chiefComplaint?.duration?.toLowerCase() || ''

    const hospitalization =
      patientCase.medicalHistory?.hospitalization?.toLowerCase() || ''

    return (
      painSeverity >= 8 ||
      duration.includes('month') ||
      (hospitalization &&
        hospitalization !== 'no' &&
        hospitalization !== 'none')
    )
  }

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="min-h-screen bg-slate-50">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-slate-200">

        <div className="max-w-7xl mx-auto px-5 sm:px-6 py-4">

          <div className="flex items-center justify-between">

            {/* Brand */}

            <div className="flex items-center gap-3">

              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">

                <span className="text-2xl">
                  ⚕
                </span>

              </div>

              <div>

                <h1 className="text-lg sm:text-xl font-bold text-slate-900">
                  AYUSH Care
                </h1>

                <p className="text-xs text-slate-500">
                  Clinical Portal
                </p>

              </div>

            </div>


            {/* Doctor Profile */}

            <div className="flex items-center gap-3">

              <div className="hidden sm:block text-right">

                <p className="text-sm font-semibold text-slate-800">
                  {user?.email || 'Doctor'}
                </p>

                <p className="text-xs text-blue-600 font-medium">
                  Doctor Account
                </p>

              </div>

              <div className="flex items-center gap-2">
                <NotificationBell />

                <button
                  onClick={handleLogout}
                  className="px-4 py-2 rounded-xl bg-red-50 text-red-600 border border-red-100 font-semibold text-sm hover:bg-red-100 transition"
                >
                  Logout
                </button>

                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 text-white flex items-center justify-center font-bold shadow-md">
                  D
                </div>
              </div>

            </div>

          </div>

        </div>

      </header>


      {/* =====================================================
          MAIN
      ====================================================== */}

      <main className="max-w-7xl mx-auto px-5 sm:px-6 py-8">

        {casesError && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-bold text-red-800">
              Unable to load live patient cases
            </p>
            <p className="text-sm text-red-700 mt-1">
              {casesError}
            </p>
          </div>
        )}

        {isLoadingCases && (
          <div className="mb-6 rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <p className="text-sm font-semibold text-blue-800">
              Loading patient cases from server...
            </p>
          </div>
        )}

        {/* =====================================================
            HERO
        ====================================================== */}

        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-blue-950 to-cyan-900 text-white p-7 sm:p-10 shadow-xl">

          <div className="absolute -top-24 -right-20 w-72 h-72 rounded-full bg-cyan-400/10 blur-3xl" />

          <div className="absolute -bottom-28 left-1/3 w-80 h-80 rounded-full bg-blue-400/10 blur-3xl" />

          <div className="absolute right-10 top-8 text-white/10 text-8xl">
            +
          </div>

          <div className="relative z-10">

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-blue-100 text-xs font-semibold backdrop-blur-md">

              <span className="w-2 h-2 rounded-full bg-cyan-300 animate-pulse" />

              Clinical Review Workspace

            </div>

            <div className="mt-5 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">

              <div>

                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
                  Good day, Doctor 👨‍⚕️
                </h2>

                <p className="mt-4 text-blue-50/80 max-w-2xl leading-7 text-sm sm:text-base">
                  Review structured patient histories, identify important
                  clinical information and verify cases before they move
                  forward in the care workflow.
                </p>

              </div>


              <div className="flex items-center gap-3">

                <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl px-5 py-4 min-w-[150px]">

                  <p className="text-xs text-blue-200">
                    Pending Review
                  </p>

                  <p className="text-3xl font-bold mt-1">
                    {pendingCases}
                  </p>

                </div>

                <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl px-5 py-4 min-w-[150px]">

                  <p className="text-xs text-blue-200">
                    Attention
                  </p>

                  <p className="text-3xl font-bold mt-1">
                    {attentionCases}
                  </p>

                </div>

              </div>

            </div>

          </div>

        </section>


        {/* =====================================================
            STAT CARDS
        ====================================================== */}

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">


          {/* Total */}

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm text-slate-500">
                  Total Cases
                </p>

                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {totalCases}
                </p>

              </div>

              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-2xl">
                📋
              </div>

            </div>

          </div>


          {/* Pending */}

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm text-slate-500">
                  Pending Review
                </p>

                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {pendingCases}
                </p>

              </div>

              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-2xl">
                ⏳
              </div>

            </div>

          </div>


          {/* Reviewed */}

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm text-slate-500">
                  Reviewed
                </p>

                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {reviewedCases}
                </p>

              </div>

              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl">
                ✓
              </div>

            </div>

          </div>


          {/* Attention */}

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm text-slate-500">
                  Requires Attention
                </p>

                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {attentionCases}
                </p>

              </div>

              <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center text-2xl">
                ⚠️
              </div>

            </div>

          </div>

        </section>


        {/* =====================================================
            WORKFLOW + COMPLETION
        ====================================================== */}

        <section className="grid lg:grid-cols-3 gap-5 mt-6">


          {/* Completion */}

          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm p-6">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-xs uppercase tracking-wider font-semibold text-blue-600">
                  Review Progress
                </p>

                <h3 className="text-xl font-bold text-slate-900 mt-1">
                  Case verification workflow
                </h3>

              </div>

              <span className="text-2xl font-bold text-blue-600">
                {completionRate}%
              </span>

            </div>


            <div className="mt-5 h-3 bg-slate-100 rounded-full overflow-hidden">

              <div
                className="h-full bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full transition-all duration-700"
                style={{ width: `${completionRate}%` }}
              />

            </div>


            <div className="grid grid-cols-3 gap-3 mt-5">

              <div className="rounded-xl bg-amber-50 p-3">

                <p className="text-xs text-amber-600">
                  Pending
                </p>

                <p className="text-xl font-bold text-amber-700 mt-1">
                  {pendingCases}
                </p>

              </div>


              <div className="rounded-xl bg-emerald-50 p-3">

                <p className="text-xs text-emerald-600">
                  Reviewed
                </p>

                <p className="text-xl font-bold text-emerald-700 mt-1">
                  {reviewedCases}
                </p>

              </div>


              <div className="rounded-xl bg-red-50 p-3">

                <p className="text-xs text-red-600">
                  Rejected
                </p>

                <p className="text-xl font-bold text-red-700 mt-1">
                  {rejectedCases}
                </p>

              </div>

            </div>

          </div>


          {/* Clinical Reminder */}

          <div className="rounded-3xl bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100 p-6">

            <div className="w-12 h-12 rounded-2xl bg-white text-blue-600 flex items-center justify-center text-2xl shadow-sm">
              🩺
            </div>

            <h3 className="text-lg font-bold text-slate-900 mt-5">
              Clinical Review
            </h3>

            <p className="text-sm text-slate-600 mt-2 leading-6">
              Review patient-provided information carefully before verifying
              a case. AI-assisted information should support, not replace,
              professional clinical judgment.
            </p>

            <div className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-blue-700">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              Doctor verification required
            </div>

          </div>

        </section>


        {/* =====================================================
            CASE MANAGEMENT
        ====================================================== */}

        <section className="mt-10">

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-5">

            <div>

              <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider">
                Patient Queue
              </p>

              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                Case Management
              </h3>

              <p className="text-sm text-slate-500 mt-1">
                Search, filter and review submitted patient cases.
              </p>

            </div>

            <div className="text-sm text-slate-500">
              Showing{' '}
              <span className="font-bold text-slate-800">
                {filteredCases.length}
              </span>{' '}
              cases
            </div>

          </div>


          {/* =====================================================
              SEARCH + FILTER
          ====================================================== */}

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-5">

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

              {/* Search */}

              <div className="md:col-span-1 relative">

                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  🔍
                </span>

                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search patient, complaint or mobile..."
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition"
                />

              </div>


              {/* Status */}

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 outline-none focus:bg-white focus:border-blue-500 transition"
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


              {/* Sort */}

              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 outline-none focus:bg-white focus:border-blue-500 transition"
              >

                <option value="latest">
                  Latest First
                </option>

                <option value="oldest">
                  Oldest First
                </option>

              </select>

            </div>


            {/* Quick filters */}

            <div className="flex flex-wrap gap-2 mt-4">

              {['All', 'Submitted', 'Reviewed', 'Rejected'].map(
                (status) => (

                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`
                      px-3.5 py-2 rounded-full text-xs font-semibold
                      border transition-all
                      ${
                        statusFilter === status
                          ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600'
                      }
                    `}
                  >
                    {status === 'Submitted'
                      ? 'Pending'
                      : status}

                  </button>

                )
              )}

            </div>

          </div>


          {/* =====================================================
              CASE LIST
          ====================================================== */}

          {filteredCases.length === 0 ? (

            <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-12 text-center">

              <div className="text-5xl">
                🔎
              </div>

              <h4 className="text-lg font-bold text-slate-800 mt-4">
                No cases found
              </h4>

              <p className="text-sm text-slate-500 mt-1">
                Try changing your search or filter.
              </p>

            </div>

          ) : (

            <div className="space-y-4">

              {filteredCases.map((patientCase) => {

                const patientName =
                  patientCase.patientInformation?.fullName ||
                  'Unknown Patient'

                const complaint =
                  patientCase.chiefComplaint?.mainProblem ||
                  'Medical case'

                const status = getStatus(patientCase)

                const redFlag = hasRedFlag(patientCase)

                return (

                  <div
                    key={patientCase.id}
                    className="group bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
                  >

                    <div className="p-5 sm:p-6">

                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">


                        {/* Patient */}

                        <div className="flex items-start gap-4">

                          <div className="w-14 h-14 shrink-0 rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 text-blue-700 flex items-center justify-center text-lg font-bold border border-blue-100">

                            {getInitial(patientName)}

                          </div>


                          <div>

                            <div className="flex flex-wrap items-center gap-2">

                              <h4 className="text-lg font-bold text-slate-900">
                                {patientName}
                              </h4>

                              {redFlag && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-50 text-red-600 border border-red-100 text-[10px] font-bold">
                                  ⚠️ Attention
                                </span>
                              )}

                            </div>

                            <p className="text-sm text-slate-500 mt-1">
                              Case #{patientCase.id}
                            </p>

                          </div>

                        </div>


                        {/* Status */}

                        <span
                          className={`inline-flex items-center justify-center px-3 py-1.5 rounded-full border text-xs font-bold ${getStatusStyle(
                            status
                          )}`}
                        >

                          <span className="w-1.5 h-1.5 rounded-full bg-current mr-2" />

                          {status}

                        </span>

                      </div>


                      {/* Case Info */}

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-5">

                        <div className="rounded-xl bg-slate-50 p-3">

                          <p className="text-[11px] text-slate-400 uppercase tracking-wider">
                            Main Complaint
                          </p>

                          <p className="text-sm font-semibold text-slate-700 mt-1 truncate">
                            {complaint}
                          </p>

                        </div>


                        <div className="rounded-xl bg-slate-50 p-3">

                          <p className="text-[11px] text-slate-400 uppercase tracking-wider">
                            Age
                          </p>

                          <p className="text-sm font-semibold text-slate-700 mt-1">
                            {patientCase.patientInformation?.age ||
                              'Not provided'}
                          </p>

                        </div>


                        <div className="rounded-xl bg-slate-50 p-3">

                          <p className="text-[11px] text-slate-400 uppercase tracking-wider">
                            Gender
                          </p>

                          <p className="text-sm font-semibold text-slate-700 mt-1">
                            {patientCase.patientInformation?.gender ||
                              'Not provided'}
                          </p>

                        </div>


                        <div className="rounded-xl bg-slate-50 p-3">

                          <p className="text-[11px] text-slate-400 uppercase tracking-wider">
                            Submitted
                          </p>

                          <p className="text-sm font-semibold text-slate-700 mt-1">
                            {patientCase.submittedAt
                              ? new Date(
                                  patientCase.submittedAt
                                ).toLocaleDateString()
                              : 'Recently'}
                          </p>

                        </div>

                      </div>


                      {/* Rejection Reason */}

                      {status === 'Rejected' &&
                        patientCase.rejectionReason && (

                          <div className="mt-4 rounded-xl bg-red-50 border border-red-100 px-4 py-3">

                            <p className="text-xs font-bold text-red-700">
                              Revision requested
                            </p>

                            <p className="text-sm text-red-600 mt-1">
                              {patientCase.rejectionReason}
                            </p>

                          </div>

                        )}


                      {/* Bottom Action */}

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-5 pt-5 border-t border-slate-100">

                        <div className="flex flex-wrap gap-4 text-xs text-slate-500">

                          <span>
                            📱{' '}
                            {patientCase.patientInformation
                              ?.mobileNumber || 'No mobile'}
                          </span>

                          <span>
                            🩺{' '}
                            {patientCase.ayushAssessment?.prakriti ||
                              'AYUSH assessment available'}
                          </span>

                        </div>


                        <button
                          onClick={() =>
                            navigate(
                              `/doctor/cases/${patientCase.id}`
                            )
                          }
                          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 hover:-translate-y-0.5 shadow-md shadow-blue-500/20 transition-all"
                        >
                          Review Case
                          <span>
                            →
                          </span>
                        </button>

                      </div>

                    </div>

                  </div>

                )
              })}

            </div>

          )}

        </section>


        {/* =====================================================
            SAFETY
        ====================================================== */}

        <section className="mt-8 rounded-2xl bg-amber-50 border border-amber-100 p-4 sm:p-5">

          <div className="flex items-start gap-3">

            <div className="text-xl">
              ⚠️
            </div>

            <div>

              <p className="text-sm font-bold text-amber-800">
                Clinical Safety Notice
              </p>

              <p className="text-xs sm:text-sm text-amber-700/80 mt-1 leading-5">
                Patient information and AI-assisted summaries are intended
                to support clinical review. Diagnosis, treatment and final
                clinical decisions remain the responsibility of the
                qualified healthcare professional.
              </p>

            </div>

          </div>

        </section>


        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900">My Appointments</h2>
              <p className="mt-1 text-sm text-slate-500">Appointments booked by patients with you.</p>
            </div>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-bold text-blue-700">{appointments.length}</span>
          </div>
          {appointmentsError && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{appointmentsError}</p>}
          {!appointmentsError && appointments.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No appointments yet.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {appointments.slice(0, 5).map((appointment) => (
                <div key={appointment.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-bold text-slate-900">{appointment.patient?.name || 'Patient'}</p>
                      <p className="text-sm text-slate-600">{appointment.appointmentDate} at {appointment.appointmentTime}</p>
                      <p className="mt-1 text-sm text-slate-500">{appointment.reason}</p>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">{appointment.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>


      {/* FOOTER */}

      <footer className="border-t border-slate-200 bg-white mt-10">

        <div className="max-w-7xl mx-auto px-5 sm:px-6 py-5">

          <p className="text-center text-xs text-slate-400">
            AYUSH Patient Case-Taking Software • Doctor Clinical Portal
          </p>

        </div>

      </footer>

    </div>
  )
}

export default DoctorDashboard