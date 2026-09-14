import {
  Routes,
  Route,
} from 'react-router-dom'

import Login from '../pages/auth/Login'
import Register from '../pages/auth/Register'
import ProtectedRoute from './ProtectedRoute'

import PatientDashboard from '../pages/patient/PatientDashboard'
import CaseTaking from '../pages/patient/CaseTaking'
import Appointments from '../pages/patient/Appointments'
import MedicalDocuments from '../pages/patient/MedicalDocuments'
import PreviousCases from '../pages/patient/PreviousCases'
import Notifications from '../pages/patient/Notifications'
import AbhaProfile from '../pages/patient/AbhaProfile'

import DoctorDashboard from '../pages/doctor/DoctorDashboard'
import DoctorCaseDetails from '../pages/doctor/DoctorCaseDetails'

import AdminDashboard from '../pages/admin/AdminDashboard'
import AdminNotifications from '../pages/admin/AdminNotifications'

import {
  PatientLanguageProvider,
} from '../context/PatientLanguageContext'

import LanguageSelector from '../components/common/LanguageSelector'


function PatientLayout({
  children,
}) {
  return (
    <PatientLanguageProvider>

      <div className="min-h-screen">

        <div className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 px-4 py-2 shadow-sm backdrop-blur">

          <div className="mx-auto flex max-w-5xl items-center justify-end">

            <div className="w-full max-w-xs">
              <LanguageSelector compact />
            </div>

          </div>

        </div>

        {children}

      </div>

    </PatientLanguageProvider>
  )
}


function PatientRoute({
  children,
}) {
  return (
    <ProtectedRoute
      allowedRole="patient"
    >
      <PatientLayout>
        {children}
      </PatientLayout>
    </ProtectedRoute>
  )
}


function AppRoutes() {
  return (
    <Routes>

      {/* =====================================================
          HOME
      ====================================================== */}

      <Route
        path="/"
        element={
          <h1>
            Home Page
          </h1>
        }
      />


      {/* =====================================================
          AUTH
      ====================================================== */}

      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/register"
        element={<Register />}
      />


      {/* =====================================================
          PATIENT
      ====================================================== */}

      <Route
        path="/patient/dashboard"
        element={
          <PatientRoute>
            <PatientDashboard />
          </PatientRoute>
        }
      />

      <Route
        path="/patient/appointments"
        element={
          <PatientRoute>
            <Appointments />
          </PatientRoute>
        }
      />

      <Route
        path="/patient/case-taking"
        element={
          <PatientRoute>
            <CaseTaking />
          </PatientRoute>
        }
      />

      <Route
        path="/patient/documents"
        element={
          <PatientRoute>
            <MedicalDocuments />
          </PatientRoute>
        }
      />

      <Route
        path="/patient/previous-cases"
        element={
          <PatientRoute>
            <PreviousCases />
          </PatientRoute>
        }
      />

      <Route
        path="/patient/notifications"
        element={
          <PatientRoute>
            <Notifications />
          </PatientRoute>
        }
      />

      <Route
        path="/patient/abha-profile"
        element={
          <PatientRoute>
            <AbhaProfile />
          </PatientRoute>
        }
      />


      {/* =====================================================
          DOCTOR
      ====================================================== */}

      <Route
        path="/doctor/dashboard"
        element={
          <ProtectedRoute
            allowedRole="doctor"
          >
            <DoctorDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/doctor/cases/:id"
        element={
          <ProtectedRoute
            allowedRole="doctor"
          >
            <DoctorCaseDetails />
          </ProtectedRoute>
        }
      />


      {/* =====================================================
          ADMIN
      ====================================================== */}

      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute
            allowedRole="admin"
          >
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/notifications"
        element={
          <ProtectedRoute
            allowedRole="admin"
          >
            <AdminNotifications />
          </ProtectedRoute>
        }
      />

    </Routes>
  )
}

export default AppRoutes