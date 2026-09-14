import { useEffect, useState } from 'react'
import { apiRequest } from '../../services/api'

function DoctorApprovalPanel() {
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const [selectedDoctor, setSelectedDoctor] = useState(null)

  const [processingId, setProcessingId] = useState(null)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [showRejectBox, setShowRejectBox] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  const loadPendingDoctors = async (silent = false) => {
    try {
      if (silent) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      setError('')

      const response = await apiRequest(
        '/admin/doctors/pending',
        {
          method: 'GET',
        }
      )

      const list =
        Array.isArray(response)
          ? response
          : Array.isArray(response?.doctors)
            ? response.doctors
            : Array.isArray(response?.data)
              ? response.data
              : []

      setDoctors(list)
    } catch (err) {
      setError(
        err?.message ||
        'Unable to load pending doctor applications.'
      )
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadPendingDoctors()
  }, [])

  const handleApprove = async (doctor) => {
    if (!doctor?.userId) {
      setError('Doctor user ID is missing.')
      return
    }

    const confirmed = window.confirm(
      `Approve Dr. ${doctor.name || 'this doctor'}?`
    )

    if (!confirmed) {
      return
    }

    try {
      setProcessingId(doctor.userId)
      setError('')
      setSuccess('')

      await apiRequest(
        `/admin/doctors/${doctor.userId}/approve`,
        {
          method: 'PUT',
        }
      )

      setSuccess(
        `${doctor.name || 'Doctor'} has been approved successfully.`
      )

      setDoctors((previous) =>
        previous.filter(
          (item) => item.userId !== doctor.userId
        )
      )

      setSelectedDoctor(null)
      setShowRejectBox(false)
    } catch (err) {
      setError(
        err?.message ||
        'Unable to approve this doctor.'
      )
    } finally {
      setProcessingId(null)
    }
  }

  const openRejectBox = () => {
    setRejectReason('')
    setShowRejectBox(true)
  }

  const handleReject = async () => {
    if (!selectedDoctor?.userId) {
      setError('Doctor user ID is missing.')
      return
    }

    if (!rejectReason.trim()) {
      setError('Please enter a rejection reason.')
      return
    }

    const confirmed = window.confirm(
      `Reject Dr. ${selectedDoctor.name || 'this doctor'}?`
    )

    if (!confirmed) {
      return
    }

    try {
      setProcessingId(selectedDoctor.userId)
      setError('')
      setSuccess('')

      await apiRequest(
        `/admin/doctors/${selectedDoctor.userId}/reject`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            reason: rejectReason.trim(),
          }),
        }
      )

      setSuccess(
        `${selectedDoctor.name || 'Doctor'} has been rejected.`
      )

      setDoctors((previous) =>
        previous.filter(
          (item) =>
            item.userId !== selectedDoctor.userId
        )
      )

      setSelectedDoctor(null)
      setShowRejectBox(false)
      setRejectReason('')
    } catch (err) {
      setError(
        err?.message ||
        'Unable to reject this doctor.'
      )
    } finally {
      setProcessingId(null)
    }
  }

  const formatDate = (value) => {
    if (!value) {
      return 'Not available'
    }

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
      return 'Not available'
    }

    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <>
      <section className="mt-10">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-5">

          <div>
            <p className="text-sm font-semibold text-violet-600 uppercase tracking-wider">
              Doctor Management
            </p>

            <h3 className="text-2xl font-bold text-slate-900 mt-1">
              Doctor Approval Requests
            </h3>

            <p className="text-sm text-slate-500 mt-1">
              Review doctor registration details before approving access to the doctor portal.
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadPendingDoctors(true)}
            disabled={refreshing}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 hover:border-violet-300 hover:text-violet-700 transition disabled:opacity-50"
          >
            {refreshing ? 'Refreshing...' : '↻ Refresh'}
          </button>

        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
            ⚠️ {error}
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-700">
            ✓ {success}
          </div>
        )}

        {/* Count */}
        <div className="mb-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 border border-amber-100 text-amber-700 text-sm font-bold">
          <span>⏳</span>
          {doctors.length} pending application
          {doctors.length === 1 ? '' : 's'}
        </div>

        {/* Loading */}
        {loading ? (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-12 text-center">
            <div className="text-4xl animate-pulse">
              👨‍⚕️
            </div>

            <p className="mt-4 text-sm font-semibold text-slate-600">
              Loading doctor applications...
            </p>
          </div>
        ) : doctors.length === 0 ? (
          <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-12 text-center">

            <div className="text-5xl">
              ✓
            </div>

            <h4 className="text-lg font-bold text-slate-800 mt-4">
              No pending doctor applications
            </h4>

            <p className="text-sm text-slate-500 mt-1">
              New doctor registrations waiting for approval will appear here.
            </p>

          </div>
        ) : (
          <div className="space-y-4">

            {doctors.map((doctor) => (

              <div
                key={doctor.userId}
                className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-lg transition overflow-hidden"
              >

                <div className="p-5 sm:p-6">

                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

                    {/* Doctor identity */}
                    <div className="flex items-start gap-4">

                      <div className="w-14 h-14 shrink-0 rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-100 text-violet-700 flex items-center justify-center text-xl font-bold border border-violet-200">
                        {(doctor.name || 'D')
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div>

                        <div className="flex flex-wrap items-center gap-2">

                          <h4 className="text-lg font-bold text-slate-900">
                            {doctor.name || 'Doctor'}
                          </h4>

                          <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100 text-[10px] font-bold">
                            PENDING
                          </span>

                        </div>

                        <p className="text-sm text-slate-500 mt-1">
                          {doctor.qualification || 'Qualification not provided'}
                          {doctor.specialization
                            ? ` • ${doctor.specialization}`
                            : ''}
                        </p>

                        <p className="text-xs text-slate-400 mt-1">
                          Registration No: {doctor.registrationNumber || 'Not provided'}
                        </p>

                      </div>

                    </div>

                    {/* Action */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDoctor(doctor)
                        setShowRejectBox(false)
                        setRejectReason('')
                        setError('')
                      }}
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-700 shadow-md shadow-violet-500/20 transition"
                    >
                      Review Application →
                    </button>

                  </div>

                  {/* Quick information */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-5">

                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-[11px] text-slate-400 uppercase tracking-wider">
                        Medical System
                      </p>
                      <p className="text-sm font-semibold text-slate-700 mt-1">
                        {doctor.medicalSystem || 'Not provided'}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-[11px] text-slate-400 uppercase tracking-wider">
                        Experience
                      </p>
                      <p className="text-sm font-semibold text-slate-700 mt-1">
                        {doctor.experienceYears != null
                          ? `${doctor.experienceYears} years`
                          : 'Not provided'}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-[11px] text-slate-400 uppercase tracking-wider">
                        Hospital
                      </p>
                      <p className="text-sm font-semibold text-slate-700 mt-1 truncate">
                        {doctor.hospital || 'Not provided'}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-[11px] text-slate-400 uppercase tracking-wider">
                        Location
                      </p>
                      <p className="text-sm font-semibold text-slate-700 mt-1">
                        {[doctor.city, doctor.state]
                          .filter(Boolean)
                          .join(', ') || 'Not provided'}
                      </p>
                    </div>

                  </div>

                </div>

              </div>

            ))}

          </div>
        )}

      </section>

      {/* =========================================================
          REVIEW MODAL
      ========================================================== */}

      {selectedDoctor && (

        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">

          {/* Backdrop */}
          <button
            type="button"
            aria-label="Close"
            onClick={() => {
              if (!processingId) {
                setSelectedDoctor(null)
                setShowRejectBox(false)
              }
            }}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm cursor-default"
          />

          {/* Modal */}
          <div className="relative z-10 w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-2xl">

            {/* Modal Header */}
            <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-6 py-5">

              <div className="flex items-start justify-between gap-4">

                <div>

                  <p className="text-xs font-bold text-violet-600 uppercase tracking-wider">
                    Doctor Application Review
                  </p>

                  <h3 className="text-2xl font-bold text-slate-900 mt-1">
                    {selectedDoctor.name}
                  </h3>

                  <p className="text-sm text-slate-500 mt-1">
                    Submitted on {formatDate(selectedDoctor.createdAt)}
                  </p>

                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (!processingId) {
                      setSelectedDoctor(null)
                      setShowRejectBox(false)
                    }
                  }}
                  className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center text-lg"
                >
                  ✕
                </button>

              </div>

            </div>

            <div className="p-6">

              {/* Status */}
              <div className="rounded-2xl bg-amber-50 border border-amber-100 p-4 mb-6">

                <div className="flex items-center gap-3">

                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center">
                    ⏳
                  </div>

                  <div>
                    <p className="text-sm font-bold text-amber-800">
                      Pending Admin Approval
                    </p>

                    <p className="text-xs text-amber-700 mt-1">
                      Verify the submitted professional information before granting portal access.
                    </p>
                  </div>

                </div>

              </div>

              {/* Basic Information */}
              <div className="mb-6">

                <h4 className="text-sm font-bold text-slate-900 mb-3">
                  Personal & Contact Information
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                  <InfoItem
                    label="Full Name"
                    value={selectedDoctor.name}
                  />

                  <InfoItem
                    label="Email"
                    value={selectedDoctor.email}
                  />

                  <InfoItem
                    label="Mobile"
                    value={selectedDoctor.mobile}
                  />

                  <InfoItem
                    label="Account Status"
                    value={selectedDoctor.status}
                  />

                </div>

              </div>

              {/* Professional Information */}
              <div className="mb-6">

                <h4 className="text-sm font-bold text-slate-900 mb-3">
                  Professional Information
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                  <InfoItem
                    label="Medical System"
                    value={selectedDoctor.medicalSystem}
                  />

                  <InfoItem
                    label="Registration Number"
                    value={selectedDoctor.registrationNumber}
                  />

                  <InfoItem
                    label="Qualification"
                    value={selectedDoctor.qualification}
                  />

                  <InfoItem
                    label="Specialization"
                    value={selectedDoctor.specialization}
                  />

                  <InfoItem
                    label="Experience"
                    value={
                      selectedDoctor.experienceYears != null
                        ? `${selectedDoctor.experienceYears} years`
                        : null
                    }
                  />

                  <InfoItem
                    label="Hospital"
                    value={selectedDoctor.hospital}
                  />

                  <InfoItem
                    label="Department"
                    value={selectedDoctor.department}
                  />

                  <InfoItem
                    label="City"
                    value={selectedDoctor.city}
                  />

                  <InfoItem
                    label="State"
                    value={selectedDoctor.state}
                  />

                </div>

              </div>

              {/* Verification Notice */}
              <div className="rounded-2xl border border-violet-100 bg-violet-50 p-4 mb-6">

                <div className="flex items-start gap-3">

                  <div className="text-xl">
                    🛡️
                  </div>

                  <div>

                    <p className="text-sm font-bold text-violet-900">
                      Before approving
                    </p>

                    <p className="text-xs text-violet-700 mt-1 leading-5">
                      Please review the doctor's registration number,
                      qualification, specialization and professional
                      details carefully before granting access.
                    </p>

                  </div>

                </div>

              </div>

              {/* Reject reason */}
              {showRejectBox && (

                <div className="rounded-2xl border border-red-100 bg-red-50 p-4 mb-6">

                  <label className="block text-sm font-bold text-red-800 mb-2">
                    Rejection Reason
                  </label>

                  <textarea
                    value={rejectReason}
                    onChange={(e) =>
                      setRejectReason(e.target.value)
                    }
                    rows={4}
                    placeholder="Enter the reason for rejecting this doctor application..."
                    className="w-full rounded-xl border border-red-200 bg-white px-4 py-3 text-sm outline-none focus:border-red-400 focus:ring-4 focus:ring-red-500/10 resize-none"
                  />

                </div>

              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3">

                <button
                  type="button"
                  onClick={showRejectBox
                    ? handleReject
                    : openRejectBox
                  }
                  disabled={
                    processingId === selectedDoctor.userId
                  }
                  className="flex-1 px-5 py-3 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm font-bold hover:bg-red-100 transition disabled:opacity-50"
                >
                  {processingId === selectedDoctor.userId
                    ? 'Processing...'
                    : showRejectBox
                      ? '✕ Confirm Rejection'
                      : '✕ Reject'}
                </button>

                {!showRejectBox && (

                  <button
                    type="button"
                    onClick={() =>
                      handleApprove(selectedDoctor)
                    }
                    disabled={
                      processingId === selectedDoctor.userId
                    }
                    className="flex-1 px-5 py-3 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 shadow-md shadow-emerald-500/20 transition disabled:opacity-50"
                  >
                    {processingId === selectedDoctor.userId
                      ? 'Approving...'
                      : '✓ Approve Doctor'}
                  </button>

                )}

              </div>

            </div>

          </div>

        </div>

      )}

    </>
  )
}

function InfoItem({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">

      <p className="text-[11px] text-slate-400 uppercase tracking-wider">
        {label}
      </p>

      <p className="text-sm font-semibold text-slate-800 mt-1 break-words">
        {value || 'Not provided'}
      </p>

    </div>
  )
}

export default DoctorApprovalPanel