import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import { logout } from '../../store/slices/authSlice'
import NotificationBell from '../../components/common/NotificationBell'
import { usePatientLanguage } from '../../context/PatientLanguageContext'

function PatientDashboard() {
  const { user } = useSelector((state) => state.auth)
  const { previousCases, medicalDocuments } = useSelector(
    (state) => state.case
  )

  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { t } = usePatientLanguage()

  const [showCaseSubmitted, setShowCaseSubmitted] = useState(false)

  useEffect(() => {
    const submissionMessage = sessionStorage.getItem('ayush-case-submitted')

    if (submissionMessage) {
      setShowCaseSubmitted(true)
      sessionStorage.removeItem('ayush-case-submitted')

      const timer = setTimeout(() => {
        setShowCaseSubmitted(false)
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [])

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  const totalCases = previousCases?.length || 0
  const totalDocuments = medicalDocuments?.length || 0

  const latestCase =
    previousCases?.length > 0
      ? previousCases[previousCases.length - 1]
      : null
 
     

  const statusLabel = (status) => {
    if (status === 'Reviewed') return t('reviewed')
    if (status === 'Rejected') return t('rejected')
    if (status === 'Submitted') return t('submitted')
    return status || t('submitted')
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

  const getInitial = () => {
    const email = user?.email || ''

    if (!email) return 'P'

    return email.charAt(0).toUpperCase()
  }

  return (
    <div className="min-h-screen bg-slate-50">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-slate-200">

        <div className="max-w-7xl mx-auto px-5 sm:px-6 py-4">

          <div className="flex items-center justify-between">

            {/* Logo */}
            <div className="flex items-center gap-3">

              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">

                <span className="text-2xl">
                  ⚕
                </span>

              </div>

              <div>

                <h1 className="text-lg sm:text-xl font-bold text-slate-900">
                  AYUSH Care
                </h1>

                <p className="text-xs text-slate-500">{t('patientPortal')}</p>

              </div>

            </div>


            {/* User */}
            <div className="flex items-center gap-3">

              <div className="hidden sm:block text-right">

                <p className="text-sm font-semibold text-slate-800">
                  {user?.email || t('patient')}
                </p>

                <p className="text-xs text-emerald-600 font-medium">{t('patientAccount')}</p>

              </div>

              <NotificationBell />

              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center font-bold shadow-md">

                {getInitial()}

              </div>

              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-xl bg-red-50 text-red-600 border border-red-100 font-semibold text-sm hover:bg-red-100 transition"
              >{t('logout')}</button>

            </div>

          </div>

        </div>

      </header>


      {/* =====================================================
          MAIN
      ====================================================== */}

      <main className="max-w-7xl mx-auto px-5 sm:px-6 py-8">

        {showCaseSubmitted && (
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm animate-pulse">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-xl">
                ✓
              </div>

              <div className="flex-1">
                <p className="font-bold text-emerald-800">
                  Patient Case Submitted Successfully!
                </p>
                <p className="text-sm text-emerald-700 mt-1">
                  Your case has been submitted and is now available for doctor review.
                </p>
              </div>

              <button
                onClick={() => setShowCaseSubmitted(false)}
                className="text-emerald-600 hover:text-emerald-800 font-bold text-lg"
                aria-label={t('closeNotification')}
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* =====================================================
            HERO
        ====================================================== */}

        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900 via-teal-800 to-cyan-900 text-white p-7 sm:p-10 shadow-xl">

          {/* Decorative elements */}

          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/10 blur-3xl" />

          <div className="absolute -bottom-24 left-1/3 w-72 h-72 rounded-full bg-emerald-300/10 blur-3xl" />

          <div className="absolute right-8 top-8 text-white/10 text-8xl">
            +
          </div>

          <div className="relative z-10 max-w-3xl">

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-emerald-100 text-xs font-semibold backdrop-blur-md">

              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />{t('smartHealthcarePortal')}</div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mt-5 leading-tight">{t('welcomeBack')}</h2>

            <p className="mt-4 text-emerald-50/80 text-sm sm:text-base leading-7 max-w-2xl">

              {t('heroDescription')}

            </p>

            <button
              onClick={() => navigate('/patient/appointments')}
              className="mt-7 inline-flex items-center gap-3 bg-white text-emerald-800 px-6 py-3.5 rounded-xl font-bold shadow-lg hover:-translate-y-1 hover:shadow-xl transition-all duration-200"
            >

              <span className="text-xl">
                ✨
              </span>{t('startNewCase')}<span>
                →
              </span>

            </button>

          </div>

        </section>


        {/* =====================================================
            STATS
        ====================================================== */}

        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">

          {/* Cases */}

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm text-slate-500">{t('totalCases')}</p>

                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {totalCases}
                </p>

              </div>

              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl">
                📋
              </div>

            </div>

          </div>


          {/* Documents */}

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm text-slate-500">{t('medicalDocuments')}</p>

                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {totalDocuments}
                </p>

              </div>

              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-2xl">
                📄
              </div>

            </div>

          </div>


          {/* Latest Status */}

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm text-slate-500">{t('latestCase')}</p>

                <p className="text-lg font-bold text-slate-900 mt-2">
                  {latestCase ? statusLabel(latestCase.status) : t('noCaseYet')}
                </p>

              </div>

              <div className="w-12 h-12 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center text-2xl">
                🩺
              </div>

            </div>

          </div>

        </section>


        {/* =====================================================
            QUICK ACTIONS
        ====================================================== */}

        <section className="mt-10">

          <div className="flex items-end justify-between mb-5">

            <div>

              <p className="text-sm font-semibold text-emerald-600 uppercase tracking-wider">{t('quickActions')}</p>

              <h3 className="text-2xl font-bold text-slate-900 mt-1">{t('manageHealthRecords')}</h3>

            </div>

          </div>


          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">


            {/* NEW CASE */}

            <button
              onClick={() => navigate('/patient/appointments')}
              className="group text-left bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300"
            >

              <div className="flex items-start justify-between">

                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-3xl group-hover:scale-110 group-hover:rotate-3 transition-transform">
                  🩺
                </div>

                <span className="text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all text-xl">
                  →
                </span>

              </div>

              <h4 className="text-xl font-bold text-slate-900 mt-6">{t('startNewCase')}</h4>

              <p className="text-sm text-slate-500 mt-2 leading-6">
                {t('newCaseDescription')}
              </p>

              <div className="mt-5 text-sm font-bold text-emerald-600">{t('beginCaseTaking')}</div>

            </button>


            {/* DOCUMENTS */}

            <button
              onClick={() => navigate('/patient/documents')}
              className="group text-left bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300"
            >

              <div className="flex items-start justify-between">

                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-3xl group-hover:scale-110 group-hover:rotate-3 transition-transform">
                  📄
                </div>

                <span className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all text-xl">
                  →
                </span>

              </div>

              <h4 className="text-xl font-bold text-slate-900 mt-6">{t('medicalDocuments')}</h4>

              <p className="text-sm text-slate-500 mt-2 leading-6">
                {t('documentsDescription')}
              </p>

              <div className="mt-5 text-sm font-bold text-blue-600">{t('manageDocuments')}</div>

            </button>


            {/* NOTIFICATIONS */}

            <button
              onClick={() => navigate('/patient/notifications')}
              className="group text-left bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300"
            >

              <div className="flex items-start justify-between">

                <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-3xl group-hover:scale-110 group-hover:rotate-3 transition-transform">
                  🔔
                </div>

                <span className="text-slate-300 group-hover:text-amber-500 group-hover:translate-x-1 transition-all text-xl">
                  →
                </span>

              </div>

              <h4 className="text-xl font-bold text-slate-900 mt-6">
                Notifications
              </h4>

              <p className="text-sm text-slate-500 mt-2 leading-6">
                Check case updates, doctor reviews and important healthcare notifications.
              </p>

              <div className="mt-5 text-sm font-bold text-amber-600">
                View notifications →
              </div>

            </button>


            {/* ABHA PROFILE */}

            <button
              onClick={() => navigate('/patient/abha-profile')}
              className="group text-left bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300"
            >

              <div className="flex items-start justify-between">

                <div className="w-14 h-14 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center text-3xl group-hover:scale-110 group-hover:rotate-3 transition-transform">
                  🪪
                </div>

                <span className="text-slate-300 group-hover:text-cyan-500 group-hover:translate-x-1 transition-all text-xl">
                  →
                </span>

              </div>

              <h4 className="text-xl font-bold text-slate-900 mt-6">
                ABHA Profile
              </h4>

              <p className="text-sm text-slate-500 mt-2 leading-6">
                Manage your 14-digit ABHA number and digital health profile.
              </p>

              <div className="mt-5 text-sm font-bold text-cyan-600">
                Manage ABHA profile →
              </div>

            </button>


            {/* PREVIOUS CASES */}

            <button
              onClick={() => navigate('/patient/previous-cases')}
              className="group text-left bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300"
            >

              <div className="flex items-start justify-between">

                <div className="w-14 h-14 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center text-3xl group-hover:scale-110 group-hover:rotate-3 transition-transform">
                  🗂️
                </div>

                <span className="text-slate-300 group-hover:text-violet-500 group-hover:translate-x-1 transition-all text-xl">
                  →
                </span>

              </div>

              <h4 className="text-xl font-bold text-slate-900 mt-6">{t('previousCases')}</h4>

              <p className="text-sm text-slate-500 mt-2 leading-6">
                {t('previousCasesDescription')}
              </p>

              <div className="mt-5 text-sm font-bold text-violet-600">{t('viewCaseHistory')}</div>

            </button>

          </div>

        </section>


        {/* =====================================================
            RECENT CASE
        ====================================================== */}

        <section className="mt-10 grid lg:grid-cols-3 gap-6">


          {/* Latest Case */}

          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm p-6">

            <div className="flex items-center justify-between mb-5">

              <div>

                <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">{t('activity')}</p>

                <h3 className="text-xl font-bold text-slate-900 mt-1">{t('recentCase')}</h3>

              </div>

              <button
                onClick={() => navigate('/patient/previous-cases')}
                className="text-sm font-semibold text-emerald-600 hover:text-emerald-700"
              >{t('viewAll')}</button>

            </div>


            {latestCase ? (

              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5">

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

                  <div className="flex items-center gap-4">

                    <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-xl">
                      📋
                    </div>

                    <div>

                      <p className="font-bold text-slate-800">
                        Case #{latestCase.id}
                      </p>

                      <p className="text-sm text-slate-500 mt-1">
                        {latestCase.patientInformation?.fullName ||
                          t('patientCase')}
                      </p>

                    </div>

                  </div>


                  <span
                    className={`inline-flex items-center justify-center px-3 py-1.5 rounded-full border text-xs font-bold ${getStatusStyle(
                      latestCase.status
                    )}`}
                  >
                    {statusLabel(latestCase.status)}
                  </span>

                </div>


                <div className="mt-5 pt-4 border-t border-slate-200 flex flex-wrap gap-5 text-sm text-slate-500">

                  <span>
                    📅{' '}
                    {latestCase.submittedAt
                      ? new Date(
                          latestCase.submittedAt
                        ).toLocaleDateString()
                      : t('recently')}
                  </span>

                  <span>
                    🩺{' '}
                    {latestCase.chiefComplaint?.mainProblem ||
                      t('medicalCase')}
                  </span>

                </div>

              </div>

            ) : (

              <div className="rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center">

                <div className="text-4xl">
                  📋
                </div>

                <h4 className="font-bold text-slate-800 mt-3">{t('noCaseSubmittedYet')}</h4>

                <p className="text-sm text-slate-500 mt-1">
                  {t('startFirstCaseDescription')}
                </p>

                <button
                  onClick={() => navigate('/patient/appointments')}
                  className="mt-5 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition"
                >{t('startNewCase')}</button>

              </div>

            )}

          </div>


          {/* PROFILE CARD */}

          <div className="bg-gradient-to-br from-white to-emerald-50 rounded-3xl border border-emerald-100 shadow-sm p-6">

            <div className="flex items-center gap-4">

              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center text-xl font-bold shadow-lg">
                {getInitial()}
              </div>

              <div>

                <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
                  Your Profile
                </p>

                <h3 className="font-bold text-slate-900 mt-1">{t('patientAccount')}</h3>

              </div>

            </div>


            <div className="mt-6 space-y-3">

              <div className="bg-white/80 rounded-xl p-3 border border-emerald-100">

                <p className="text-xs text-slate-400">{t('email')}</p>

                <p className="text-sm font-semibold text-slate-700 mt-1 break-all">
                  {user?.email || 'Not available'}
                </p>

              </div>


              <div className="bg-white/80 rounded-xl p-3 border border-emerald-100">

                <p className="text-xs text-slate-400">{t('accountType')}</p>

                <p className="text-sm font-semibold text-emerald-700 mt-1">{t('patient')}</p>

              </div>


              <div className="bg-white/80 rounded-xl p-3 border border-emerald-100">

                <p className="text-xs text-slate-400">{t('caseRecords')}</p>

                <p className="text-sm font-semibold text-slate-700 mt-1">
                  {totalCases} submitted
                </p>

              </div>

            </div>

          </div>

        </section>


        {/* =====================================================
            SAFETY NOTE
        ====================================================== */}

        <section className="mt-8 rounded-2xl bg-amber-50 border border-amber-100 p-4 sm:p-5">

          <div className="flex items-start gap-3">

            <div className="text-xl">
              ⚠️
            </div>

            <div>

              <p className="text-sm font-bold text-amber-800">{t('importantClinicalNotice')}</p>

              <p className="text-xs sm:text-sm text-amber-700/80 mt-1 leading-5">
                {t('clinicalNoticeDescription')}
              </p>

            </div>

          </div>

        </section>


      </main>


      {/* FOOTER */}

      <footer className="border-t border-slate-200 bg-white mt-10">

        <div className="max-w-7xl mx-auto px-5 sm:px-6 py-5">

          <p className="text-center text-xs text-slate-400">
            AYUSH Patient Case-Taking Software • Smart Healthcare Prototype
          </p>

        </div>

      </footer>

    </div>
  )
}

export default PatientDashboard
