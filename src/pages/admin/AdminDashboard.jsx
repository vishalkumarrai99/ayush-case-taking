import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import { logout } from '../../store/slices/authSlice'
import { apiRequest } from '../../services/api'

function AdminDashboard() {
  const { user } = useSelector((state) => state.auth)
  const { previousCases = [] } = useSelector((state) => state.case)

  const [adminCases, setAdminCases] = useState([])
  const [isLoadingCases, setIsLoadingCases] = useState(true)
  const [loadError, setLoadError] = useState('')

  const normalizeCase = (item) => {
    const parseSection = (section) => {
      if (!section) return {}
      if (typeof section === 'object') return section
      return String(section).split('\\n').reduce((acc, line) => {
        const separator = line.indexOf(':')
        if (separator === -1) return acc
        const key = line.slice(0, separator).trim()
        const value = line.slice(separator + 1).trim()
        if (key) acc[key] = value
        return acc
      }, {})
    }

    const patient = parseSection(item?.patientInformation)
    const complaint = parseSection(item?.chiefComplaint)
    const history = parseSection(item?.medicalHistory)

    return {
      ...item,
      id: item?.id,
      patientInformation: {
        fullName: patient.fullName || patient['Full Name'] || patient.name || 'Unknown Patient',
        age: patient.age || patient.Age || '',
        gender: patient.gender || patient.Gender || '',
        mobileNumber: patient.mobileNumber || patient['Mobile Number'] || patient.mobile || '',
      },
      chiefComplaint: {
        mainProblem: complaint.mainProblem || complaint['Main Health Problem'] || complaint['Main Problem'] || complaint.mainHealthProblem || '',
        duration: complaint.duration || complaint.Duration || '',
        painSeverity: complaint.painSeverity || complaint['Pain Severity'] || '',
      },
      medicalHistory: {
        hospitalization: history.hospitalization || history.Hospitalization || '',
      },
      status: item?.status || 'Submitted',
    }
  }

  useEffect(() => {
    const loadAdminCases = async () => {
      try {
        setIsLoadingCases(true)
        setLoadError('')
        const response = await apiRequest('/cases', { method: 'GET' })
        const rawCases = Array.isArray(response)
          ? response
          : Array.isArray(response?.cases)
            ? response.cases
            : Array.isArray(response?.data)
              ? response.data
              : []
        setAdminCases(rawCases.map(normalizeCase))
      } catch (error) {
        setLoadError(error.message || 'Unable to load cases from the server.')
        setAdminCases([])
      } finally {
        setIsLoadingCases(false)
      }
    }
    loadAdminCases()
  }, [])

  const navigate = useNavigate()
  const dispatch = useDispatch()

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [sortOrder, setSortOrder] = useState('latest')

  // =========================================================
  // STATISTICS
  // =========================================================

  const casesSource = adminCases.length > 0 ? adminCases : previousCases

  const totalCases = casesSource.length

  const pendingCases = casesSource.filter(
    (item) => !item.status || item.status === 'Submitted'
  ).length

  const reviewedCases = casesSource.filter(
    (item) => item.status === 'Reviewed'
  ).length

  const rejectedCases = casesSource.filter(
    (item) => item.status === 'Rejected'
  ).length

  const attentionCases = casesSource.filter((item) => {
    const painSeverity =
      Number(item.chiefComplaint?.painSeverity) || 0

    const duration =
      item.chiefComplaint?.duration?.toLowerCase() || ''

    const hospitalization =
      item.medicalHistory?.hospitalization?.toLowerCase() || ''

    return (
      painSeverity >= 8 ||
      duration.includes('month') ||
      (hospitalization &&
        hospitalization !== 'no' &&
        hospitalization !== 'none')
    )
  }).length

  const completionRate =
    totalCases > 0
      ? Math.round((reviewedCases / totalCases) * 100)
      : 0

  // =========================================================
  // CASE FILTERING
  // =========================================================

  const filteredCases = useMemo(() => {
    let cases = [...casesSource]

    if (search.trim()) {
      const query = search.toLowerCase()

      cases = cases.filter((item) => {
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
      cases = cases.filter((item) => {
        const status = item.status || 'Submitted'
        return status === statusFilter
      })
    }

    cases.sort((a, b) => {
      const dateA = new Date(a.submittedAt || 0).getTime()
      const dateB = new Date(b.submittedAt || 0).getTime()

      return sortOrder === 'latest'
        ? dateB - dateA
        : dateA - dateB
    })

    return cases
  }, [casesSource, search, statusFilter, sortOrder])

  // =========================================================
  // HELPERS
  // =========================================================

  const getInitial = (name) => {
    if (!name) return 'P'
    return name.charAt(0).toUpperCase()
  }

  const getStatus = (item) => {
    return item.status || 'Submitted'
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

              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700 text-white flex items-center justify-center shadow-lg shadow-violet-500/20">

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


            {/* Admin */}

            <div className="flex items-center gap-3">

              <div className="hidden sm:block text-right">

                <p className="text-sm font-semibold text-slate-800">
                  {user?.email || 'Administrator'}
                </p>

                <p className="text-xs text-violet-600 font-medium">
                  System Administrator
                </p>

              </div>

              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-indigo-700 text-white flex items-center justify-center font-bold shadow-md">
                  A
                </div>

                <button
                  onClick={handleLogout}
                  className="px-4 py-2 rounded-xl bg-red-50 text-red-600 border border-red-100 font-semibold text-sm hover:bg-red-100 transition"
                >
                  Logout
                </button>
              </div>

            </div>

          </div>

        </div>

      </header>


      {/* =====================================================
          MAIN
      ====================================================== */}

      <main className="max-w-7xl mx-auto px-5 sm:px-6 py-8">


        {/* =====================================================
            HERO
        ====================================================== */}

        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-violet-950 to-indigo-900 text-white p-7 sm:p-10 shadow-xl">

          <div className="absolute -top-24 -right-20 w-72 h-72 rounded-full bg-violet-400/10 blur-3xl" />

          <div className="absolute -bottom-28 left-1/3 w-80 h-80 rounded-full bg-indigo-400/10 blur-3xl" />

          <div className="absolute right-10 top-8 text-white/10 text-8xl">
            +
          </div>

          <div className="relative z-10">

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-violet-100 text-xs font-semibold backdrop-blur-md">

              <span className="w-2 h-2 rounded-full bg-violet-300 animate-pulse" />

              System Administration

            </div>

            <div className="mt-5 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">

              <div>

                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
                  Welcome, Administrator 👋
                </h2>

                <p className="mt-4 text-violet-50/80 max-w-2xl leading-7 text-sm sm:text-base">
                  Monitor the patient case workflow, track review activity
                  and maintain visibility across the AYUSH case-taking
                  platform.
                </p>

              </div>


              <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl px-5 py-4 min-w-[190px]">

                <p className="text-xs text-violet-200">
                  Platform Status
                </p>

                <div className="flex items-center gap-2 mt-2">

                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />

                  <p className="text-sm font-bold">
                    Operational
                  </p>

                </div>

              </div>

            </div>

          </div>

        </section>


        {/* =====================================================
            STAT CARDS
        ====================================================== */}

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-6">


          {/* Total */}

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm text-slate-500">
                  Total Cases
                </p>

                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {totalCases}
                </p>

              </div>

              <div className="w-11 h-11 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center text-xl">
                📊
              </div>

            </div>

          </div>


          {/* Pending */}

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm text-slate-500">
                  Pending
                </p>

                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {pendingCases}
                </p>

              </div>

              <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl">
                ⏳
              </div>

            </div>

          </div>


          {/* Reviewed */}

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm text-slate-500">
                  Reviewed
                </p>

                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {reviewedCases}
                </p>

              </div>

              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl">
                ✓
              </div>

            </div>

          </div>


          {/* Rejected */}

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm text-slate-500">
                  Rejected
                </p>

                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {rejectedCases}
                </p>

              </div>

              <div className="w-11 h-11 rounded-xl bg-red-50 text-red-600 flex items-center justify-center text-xl">
                ✕
              </div>

            </div>

          </div>


          {/* Attention */}

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm text-slate-500">
                  Attention
                </p>

                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {attentionCases}
                </p>

              </div>

              <div className="w-11 h-11 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center text-xl">
                ⚠️
              </div>

            </div>

          </div>

        </section>


        {/* =====================================================
            ANALYTICS
        ====================================================== */}

        <section className="grid lg:grid-cols-3 gap-5 mt-6">


          {/* Review Progress */}

          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm p-6">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-xs uppercase tracking-wider font-semibold text-violet-600">
                  Workflow Analytics
                </p>

                <h3 className="text-xl font-bold text-slate-900 mt-1">
                  Case review completion
                </h3>

              </div>

              <div className="text-2xl font-bold text-violet-600">
                {completionRate}%
              </div>

            </div>


            <div className="mt-6 h-3 bg-slate-100 rounded-full overflow-hidden">

              <div
                className="h-full bg-gradient-to-r from-violet-600 to-indigo-500 rounded-full transition-all duration-700"
                style={{ width: `${completionRate}%` }}
              />

            </div>


            <div className="grid grid-cols-3 gap-3 mt-6">

              <div className="rounded-xl bg-amber-50 p-4">

                <p className="text-xs text-amber-600">
                  Pending
                </p>

                <p className="text-2xl font-bold text-amber-700 mt-1">
                  {pendingCases}
                </p>

              </div>


              <div className="rounded-xl bg-emerald-50 p-4">

                <p className="text-xs text-emerald-600">
                  Reviewed
                </p>

                <p className="text-2xl font-bold text-emerald-700 mt-1">
                  {reviewedCases}
                </p>

              </div>


              <div className="rounded-xl bg-red-50 p-4">

                <p className="text-xs text-red-600">
                  Rejected
                </p>

                <p className="text-2xl font-bold text-red-700 mt-1">
                  {rejectedCases}
                </p>

              </div>

            </div>

          </div>


          {/* System Overview */}

          <div className="rounded-3xl bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-100 p-6">

            <div className="w-12 h-12 rounded-2xl bg-white text-violet-600 flex items-center justify-center text-2xl shadow-sm">
              🛡️
            </div>

            <h3 className="text-lg font-bold text-slate-900 mt-5">
              System Overview
            </h3>

            <div className="mt-5 space-y-3">

              <div className="flex items-center justify-between">

                <span className="text-sm text-slate-500">
                  Patient workflow
                </span>

                <span className="text-xs font-bold text-emerald-600">
                  Active
                </span>

              </div>

              <div className="flex items-center justify-between">

                <span className="text-sm text-slate-500">
                  Doctor review
                </span>

                <span className="text-xs font-bold text-emerald-600">
                  Active
                </span>

              </div>

              <div className="flex items-center justify-between">

                <span className="text-sm text-slate-500">
                  Case storage
                </span>

                <span className="text-xs font-bold text-emerald-600">
                  Active
                </span>

              </div>

              <div className="flex items-center justify-between">

                <span className="text-sm text-slate-500">
                  Current cases
                </span>

                <span className="text-xs font-bold text-violet-600">
                  {totalCases}
                </span>

              </div>

            </div>

          </div>

        </section>


        {/* =====================================================
            CASE MANAGEMENT
        ====================================================== */}

        <section className="mt-10">

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-5">

            <div>

              <p className="text-sm font-semibold text-violet-600 uppercase tracking-wider">
                Administration
              </p>

              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                All Patient Cases
              </h3>

              <p className="text-sm text-slate-500 mt-1">
                Monitor and access the complete case workflow.
              </p>

            </div>

            <div className="flex items-center gap-3">

              <div className="text-sm text-slate-500">

                Showing{' '}

                <span className="font-bold text-slate-800">
                  {filteredCases.length}
                </span>

                {' '}cases

              </div>

              <button
                type="button"
                onClick={() => window.location.reload()}
                disabled={isLoadingCases}
                className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:border-violet-300 hover:text-violet-700 transition disabled:opacity-50"
              >
                {isLoadingCases ? 'Loading...' : '↻ Refresh'}
              </button>

            </div>

          </div>


          {/* =====================================================
              SEARCH
          ====================================================== */}

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-5">

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">


              {/* Search */}

              <div className="relative">

                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  🔍
                </span>

                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search patient, complaint or mobile..."
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:bg-white focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition"
                />

              </div>


              {/* Status */}

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 outline-none focus:bg-white focus:border-violet-500 transition"
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
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 outline-none focus:bg-white focus:border-violet-500 transition"
              >

                <option value="latest">
                  Latest First
                </option>

                <option value="oldest">
                  Oldest First
                </option>

              </select>

            </div>


            {/* Filters */}

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
                          ? 'bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-500/20'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-violet-300 hover:text-violet-600'
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

          {loadError && (
            <div className="mb-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              <span className="font-bold">Unable to load live admin data:</span>{' '}
              {loadError}
            </div>
          )}

          {isLoadingCases ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm">
              <div className="text-3xl animate-pulse">⏳</div>
              <h4 className="text-lg font-bold text-slate-800 mt-4">Loading cases...</h4>
              <p className="text-sm text-slate-500 mt-1">Fetching the latest cases from the server.</p>
            </div>
          ) : filteredCases.length === 0 ? (

            <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-12 text-center">

              <div className="text-5xl">
                📂
              </div>

              <h4 className="text-lg font-bold text-slate-800 mt-4">
                No cases found
              </h4>

              <p className="text-sm text-slate-500 mt-1">
                There are no cases matching the current filters.
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

                return (

                  <div
                    key={patientCase.id}
                    className="group bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
                  >

                    <div className="p-5 sm:p-6">

                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">


                        {/* Patient */}

                        <div className="flex items-start gap-4">

                          <div className="w-14 h-14 shrink-0 rounded-2xl bg-gradient-to-br from-violet-50 to-indigo-50 text-violet-700 flex items-center justify-center text-lg font-bold border border-violet-100">

                            {getInitial(patientName)}

                          </div>

                          <div>

                            <div className="flex flex-wrap items-center gap-2">

                              <h4 className="text-lg font-bold text-slate-900">
                                {patientName}
                              </h4>

                              {status === 'Submitted' && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-100 text-[10px] font-bold">
                                  New
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

                          {status === 'Submitted'
                            ? 'Pending'
                            : status}

                        </span>

                      </div>


                      {/* Information */}

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


                      {/* Rejection */}

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


                      {/* Bottom */}

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-5 pt-5 border-t border-slate-100">

                        <div className="flex flex-wrap gap-4 text-xs text-slate-500">

                          <span>
                            📱{' '}
                            {patientCase.patientInformation
                              ?.mobileNumber || 'No mobile'}
                          </span>

                          <span>
                            🩺 AYUSH assessment
                          </span>

                        </div>


                        <button
                          onClick={() =>
                            navigate(
                              `/doctor/cases/${patientCase.id}`
                            )
                          }
                          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-700 hover:-translate-y-0.5 shadow-md shadow-violet-500/20 transition-all"
                        >

                          View Case

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
            SECURITY
        ====================================================== */}

        <section className="mt-8 rounded-2xl bg-slate-900 text-white p-5">

          <div className="flex flex-col sm:flex-row sm:items-center gap-4">

            <div className="w-11 h-11 shrink-0 rounded-xl bg-white/10 flex items-center justify-center text-xl">
              🔐
            </div>

            <div>

              <p className="text-sm font-bold">
                Privacy & Security
              </p>

              <p className="text-xs text-slate-300 mt-1 leading-5">
                Patient information is sensitive clinical data. Access,
                storage and sharing should follow appropriate privacy,
                security and healthcare data protection practices.
              </p>

            </div>

          </div>

        </section>


        {/* =====================================================
            CLINICAL SAFETY
        ====================================================== */}

        <section className="mt-5 rounded-2xl bg-amber-50 border border-amber-100 p-5">

          <div className="flex items-start gap-3">

            <div className="text-xl">
              ⚠️
            </div>

            <div>

              <p className="text-sm font-bold text-amber-800">
                Clinical Safety Notice
              </p>

              <p className="text-xs sm:text-sm text-amber-700/80 mt-1 leading-5">
                The platform supports patient information collection and
                workflow management. It does not independently diagnose
                patients or replace qualified healthcare professionals.
              </p>

            </div>

          </div>

        </section>

      </main>


      {/* =====================================================
          FOOTER
      ====================================================== */}

      <footer className="border-t border-slate-200 bg-white mt-10">

        <div className="max-w-7xl mx-auto px-5 sm:px-6 py-5">

          <p className="text-center text-xs text-slate-400">
            AYUSH Patient Case-Taking Software • Administration Portal
          </p>

        </div>

      </footer>

    </div>
  )
}

export default AdminDashboard