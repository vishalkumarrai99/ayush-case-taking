import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  bookAppointment,
  cancelAppointment,
  getApprovedDoctors,
  getMyAppointments,
} from '../../services/api'

function Appointments() {
  const navigate = useNavigate()

  const [doctors, setDoctors] = useState([])
  const [appointments, setAppointments] = useState([])
  const [selectedDoctor, setSelectedDoctor] = useState(null)

  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [reason, setReason] = useState('')

  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState(false)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadData = async () => {
    setLoading(true)
    setError('')

    try {
      const [doctorData, appointmentData] = await Promise.all([
        getApprovedDoctors(),
        getMyAppointments(),
      ])

      setDoctors(Array.isArray(doctorData) ? doctorData : [])
      setAppointments(Array.isArray(appointmentData) ? appointmentData : [])
    } catch (err) {
      setError(
        err.message ||
          'Unable to load doctors and appointments.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleBook = async (event) => {
    event.preventDefault()

    if (!selectedDoctor) {
      setError('Please select a doctor.')
      return
    }

    if (!date) {
      setError('Please select an appointment date.')
      return
    }

    if (!time) {
      setError('Please select an appointment time.')
      return
    }

    if (!reason.trim()) {
      setError('Please enter the reason for appointment.')
      return
    }

    setBooking(true)
    setError('')
    setSuccess('')

    try {
      await bookAppointment({
        doctorId: selectedDoctor.id,
        appointmentDate: date,
        appointmentTime: time,
        reason: reason.trim(),
      })

      setSuccess(
        `Appointment confirmed with ${selectedDoctor.name}.`
      )

      setSelectedDoctor(null)
      setDate('')
      setTime('')
      setReason('')

      await loadData()
    } catch (err) {
      setError(
        err.message ||
          'Unable to book appointment.'
      )
    } finally {
      setBooking(false)
    }
  }

  const startCase = (appointment) => {
    sessionStorage.setItem(
      'ayush-selected-appointment-id',
      String(appointment.id)
    )

    sessionStorage.setItem(
      'ayush-selected-appointment-doctor',
      appointment.doctor?.name || ''
    )

    navigate('/patient/case-taking')
  }

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this appointment?')) {
      return
    }

    setError('')
    setSuccess('')

    try {
      await cancelAppointment(id)

      setSuccess('Appointment cancelled successfully.')

      await loadData()
    } catch (err) {
      setError(
        err.message ||
          'Unable to cancel appointment.'
      )
    }
  }

  const today = new Date()
    .toISOString()
    .slice(0, 10)

  return (
    <div className="min-h-screen bg-slate-100 px-5 py-8">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">
              AYUSH Care
            </p>

            <h1 className="mt-1 text-3xl font-bold text-slate-900">
              Appointments
            </h1>

            <p className="mt-2 text-slate-500">
              Choose an approved doctor and book an appointment
              before starting a new case.
            </p>
          </div>

          <button
            onClick={() => navigate('/patient/dashboard')}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
          >
            Back to Dashboard
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">
            {success}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">

          {/* Doctors */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">
              1. Select Doctor
            </h2>

            {loading ? (
              <p className="mt-5 text-slate-500">
                Loading approved doctors...
              </p>
            ) : doctors.length === 0 ? (
              <p className="mt-5 rounded-xl bg-slate-50 p-4 text-slate-600">
                No approved doctors are currently available.
              </p>
            ) : (
              <div className="mt-5 space-y-3">
                {doctors.map((doctor) => (
                  <button
                    key={doctor.id}
                    type="button"
                    onClick={() =>
                      setSelectedDoctor(doctor)
                    }
                    className={`w-full rounded-xl border p-4 text-left transition ${
                      selectedDoctor?.id === doctor.id
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-slate-200 hover:border-emerald-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">

                      <div>
                        <p className="font-bold text-slate-900">
                          {doctor.name}
                        </p>

                        <p className="mt-1 text-sm text-emerald-700">
                          {doctor.specialization ||
                            doctor.medicalSystem ||
                            'AYUSH Doctor'}
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          {doctor.qualification ||
                            'Qualification not available'}

                          {doctor.experienceYears
                            ? ` • ${doctor.experienceYears} years experience`
                            : ''}
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          {doctor.hospital || 'Clinic'}

                          {doctor.city
                            ? ` • ${doctor.city}`
                            : ''}
                        </p>
                      </div>

                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                        Approved
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* Booking */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">
              2. Book Appointment
            </h2>

            {selectedDoctor ? (
              <form
                onSubmit={handleBook}
                className="mt-5 space-y-4"
              >
                <div className="rounded-xl bg-emerald-50 p-4">
                  <p className="text-xs font-semibold uppercase text-emerald-700">
                    Selected doctor
                  </p>

                  <p className="mt-1 font-bold text-slate-900">
                    {selectedDoctor.name}
                  </p>

                  <p className="mt-1 text-sm text-slate-600">
                    {selectedDoctor.specialization ||
                      selectedDoctor.medicalSystem ||
                      'AYUSH Doctor'}
                  </p>
                </div>

                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">
                    Date
                  </span>

                  <input
                    required
                    min={today}
                    type="date"
                    value={date}
                    onChange={(e) =>
                      setDate(e.target.value)
                    }
                    className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">
                    Time
                  </span>

                  <input
                    required
                    type="time"
                    value={time}
                    onChange={(e) =>
                      setTime(e.target.value)
                    }
                    className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">
                    Reason for appointment
                  </span>

                  <textarea
                    required
                    minLength={3}
                    value={reason}
                    onChange={(e) =>
                      setReason(e.target.value)
                    }
                    rows={4}
                    placeholder="Briefly describe why you want to consult the doctor"
                    className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3"
                  />
                </label>

                <button
                  disabled={booking}
                  type="submit"
                  className="w-full rounded-xl bg-emerald-600 px-5 py-3 font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {booking
                    ? 'Booking...'
                    : 'Confirm Appointment'}
                </button>
              </form>
            ) : (
              <p className="mt-5 rounded-xl bg-slate-50 p-4 text-slate-600">
                Select a doctor from the left to book an appointment.
              </p>
            )}
          </section>
        </div>

        {/* My appointments */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">
            My Appointments
          </h2>

          {loading ? (
            <p className="mt-4 text-slate-500">
              Loading...
            </p>
          ) : appointments.length === 0 ? (
            <p className="mt-4 text-slate-500">
              No appointments yet.
            </p>
          ) : (
            <div className="mt-4 space-y-3">

              {appointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">

                    <div>
                      <p className="font-bold text-slate-900">
                        Dr. {appointment.doctor?.name || 'Doctor'}
                      </p>

                      <p className="mt-1 text-sm text-slate-600">
                        {appointment.appointmentDate} at{' '}
                        {appointment.appointmentTime}
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        Reason: {appointment.reason}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        appointment.status === 'CONFIRMED'
                          ? 'bg-emerald-100 text-emerald-700'
                          : appointment.status === 'CANCELLED'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {appointment.status}
                    </span>
                  </div>

                  {appointment.status === 'CONFIRMED' && (
                    <div className="mt-4 flex flex-wrap gap-3">

                      <button
                        onClick={() =>
                          startCase(appointment)
                        }
                        className="rounded-xl bg-blue-600 px-4 py-2 font-bold text-white hover:bg-blue-700"
                      >
                        Start Case for This Appointment
                      </button>

                      <button
                        onClick={() =>
                          handleCancel(appointment.id)
                        }
                        className="rounded-xl border border-red-200 px-4 py-2 font-semibold text-red-600 hover:bg-red-50"
                      >
                        Cancel
                      </button>

                    </div>
                  )}
                </div>
              ))}

            </div>
          )}
        </section>

      </div>
    </div>
  )
}

export default Appointments