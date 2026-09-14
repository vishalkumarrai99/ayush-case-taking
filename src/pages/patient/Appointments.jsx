import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  useNavigate,
} from 'react-router-dom'

import {
  bookAppointment,
  cancelAppointment,
  getApprovedDoctors,
  getMyAppointments,
} from '../../services/api'


function getToday() {
  const now = new Date()

  const year = now.getFullYear()

  const month = String(
    now.getMonth() + 1
  ).padStart(2, '0')

  const day = String(
    now.getDate()
  ).padStart(2, '0')

  return `${year}-${month}-${day}`
}


function formatDate(value) {
  if (!value) {
    return 'Date not available'
  }

  const date = new Date(
    `${value}T00:00:00`
  )

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleDateString(
    undefined,
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }
  )
}


function formatTime(value) {
  if (!value) {
    return 'Time not available'
  }

  const [hour, minute] =
    String(value).split(':')

  const date = new Date()

  date.setHours(
    Number(hour),
    Number(minute),
    0,
    0
  )

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleTimeString(
    undefined,
    {
      hour: '2-digit',
      minute: '2-digit',
    }
  )
}


function getDoctorName(doctor) {
  return (
    doctor?.name ||
    doctor?.user?.name ||
    doctor?.fullName ||
    'Approved Doctor'
  )
}


function getDoctorId(doctor) {
  return (
    doctor?.id ||
    doctor?.user?.id ||
    doctor?.userId
  )
}


function getDoctorDetails(doctor) {
  return [
    doctor?.qualification,
    doctor?.specialization,
    doctor?.medicalSystem,
    doctor?.hospital,
    doctor?.city,
    doctor?.state,
  ].filter(Boolean)
}


function Appointments() {
  const navigate = useNavigate()

  const [doctors, setDoctors] =
    useState([])

  const [appointments, setAppointments] =
    useState([])

  const [selectedDoctorId, setSelectedDoctorId] =
    useState('')

  const [appointmentDate, setAppointmentDate] =
    useState(getToday())

  const [appointmentTime, setAppointmentTime] =
    useState('10:00')

  const [reason, setReason] =
    useState('')

  const [loading, setLoading] =
    useState(true)

  const [booking, setBooking] =
    useState(false)

  const [cancellingId, setCancellingId] =
    useState(null)

  const [error, setError] =
    useState('')

  const [success, setSuccess] =
    useState('')


  const selectedDoctor = useMemo(
    () => {
      return doctors.find(
        (doctor) =>
          String(
            getDoctorId(doctor)
          ) === String(
            selectedDoctorId
          )
      )
    },
    [
      doctors,
      selectedDoctorId,
    ]
  )


  const loadData = async () => {
    setLoading(true)
    setError('')

    try {

      const [
        doctorResponse,
        appointmentResponse,
      ] = await Promise.all([
        getApprovedDoctors(),
        getMyAppointments(),
      ])

      const approvedDoctors =
        Array.isArray(doctorResponse)
          ? doctorResponse
          : []

      const myAppointments =
        Array.isArray(appointmentResponse)
          ? appointmentResponse
          : []

      setDoctors(
        approvedDoctors
      )

      setAppointments(
        myAppointments
      )

      if (
        !selectedDoctorId &&
        approvedDoctors.length > 0
      ) {

        const firstDoctorId =
          getDoctorId(
            approvedDoctors[0]
          )

        if (firstDoctorId) {
          setSelectedDoctorId(
            String(firstDoctorId)
          )
        }
      }

    } catch (requestError) {

      setError(
        requestError?.message ||
          'Unable to load doctors and appointments.'
      )

    } finally {

      setLoading(false)

    }
  }


  useEffect(() => {
    loadData()
  }, [])


  const handleBookAppointment = async (
    event
  ) => {

    event.preventDefault()

    setError('')
    setSuccess('')

    if (!selectedDoctorId) {
      setError(
        'Please select an approved doctor.'
      )
      return
    }

    if (!appointmentDate) {
      setError(
        'Please select an appointment date.'
      )
      return
    }

    if (!appointmentTime) {
      setError(
        'Please select an appointment time.'
      )
      return
    }

    if (!reason.trim()) {
      setError(
        'Please enter the reason for your appointment.'
      )
      return
    }

    setBooking(true)

    try {

      const createdAppointment =
        await bookAppointment({
          doctorId:
            Number(selectedDoctorId),

          appointmentDate:
            appointmentDate,

          appointmentTime:
            appointmentTime,

          reason:
            reason.trim(),
        })


      if (createdAppointment?.id) {

        setAppointments(
          (previous) => [
            createdAppointment,
            ...previous,
          ]
        )

        sessionStorage.setItem(
          'ayush-selected-appointment-id',
          String(
            createdAppointment.id
          )
        )

        sessionStorage.setItem(
          'ayush-selected-appointment-doctor',
          getDoctorName(
            selectedDoctor
          )
        )

        setReason('')

        navigate(
          '/patient/case-taking'
        )

        return
      }


      await loadData()

      setSuccess(
        'Appointment booked successfully.'
      )

    } catch (requestError) {

      setError(
        requestError?.message ||
          'Unable to book the appointment.'
      )

    } finally {

      setBooking(false)

    }
  }


  const handleUseAppointment = (
    appointment
  ) => {

    if (!appointment?.id) {
      setError(
        'This appointment does not have a valid ID.'
      )
      return
    }

    const doctorName =
      getDoctorName(
        appointment?.doctor
      )

    sessionStorage.setItem(
      'ayush-selected-appointment-id',
      String(
        appointment.id
      )
    )

    sessionStorage.setItem(
      'ayush-selected-appointment-doctor',
      doctorName
    )

    navigate(
      '/patient/case-taking'
    )
  }


  const handleCancelAppointment = async (
    appointmentId
  ) => {

    if (!appointmentId) {
      return
    }

    setError('')
    setSuccess('')
    setCancellingId(
      appointmentId
    )

    try {

      await cancelAppointment(
        appointmentId
      )

      setAppointments(
        (previous) =>
          previous.map(
            (appointment) =>
              appointment.id ===
              appointmentId
                ? {
                    ...appointment,
                    status:
                      'CANCELLED',
                  }
                : appointment
          )
      )

      setSuccess(
        'Appointment cancelled successfully.'
      )

    } catch (requestError) {

      setError(
        requestError?.message ||
          'Unable to cancel the appointment.'
      )

    } finally {

      setCancellingId(null)

    }
  }


  return (
    <div className="min-h-screen bg-slate-50">

      <header className="border-b border-slate-200 bg-white">

        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-5">

          <div>

            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
              AYUSH Care
            </p>

            <h1 className="mt-1 text-2xl font-bold text-slate-900">
              Appointments
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Select an approved doctor and book an appointment before starting a new case.
            </p>

          </div>


          <button
            type="button"
            onClick={() =>
              navigate(
                '/patient/dashboard'
              )
            }
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Dashboard
          </button>

        </div>

      </header>


      <main className="mx-auto max-w-5xl space-y-6 px-5 py-8">

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}


        {success && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {success}
          </div>
        )}


        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="mb-6">

            <h2 className="text-lg font-bold text-slate-900">
              Book a New Appointment
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Only approved doctors are shown here.
            </p>

          </div>


          {loading ? (

            <div className="rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">
              Loading approved doctors...
            </div>

          ) : doctors.length === 0 ? (

            <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
              No approved doctors are currently available. Please try again after a doctor is approved by the administrator.
            </div>

          ) : (

            <form
              onSubmit={
                handleBookAppointment
              }
              className="space-y-5"
            >

              <div>

                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Select Doctor
                </label>

                <select
                  value={
                    selectedDoctorId
                  }
                  onChange={(event) =>
                    setSelectedDoctorId(
                      event.target.value
                    )
                  }
                  disabled={booking}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                >

                  {doctors.map(
                    (doctor) => {

                      const doctorId =
                        getDoctorId(
                          doctor
                        )

                      return (
                        <option
                          key={
                            doctorId
                          }
                          value={
                            doctorId
                          }
                        >
                          Dr. {getDoctorName(
                            doctor
                          )}
                        </option>
                      )
                    }
                  )}

                </select>


                {selectedDoctor && (

                  <div className="mt-3 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">

                    {getDoctorDetails(
                      selectedDoctor
                    ).join(' • ') ||
                      'Approved AYUSH doctor'}

                  </div>

                )}

              </div>


              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

                <div>

                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Appointment Date
                  </label>

                  <input
                    type="date"
                    min={getToday()}
                    value={
                      appointmentDate
                    }
                    onChange={(event) =>
                      setAppointmentDate(
                        event.target.value
                      )
                    }
                    disabled={booking}
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />

                </div>


                <div>

                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Appointment Time
                  </label>

                  <input
                    type="time"
                    value={
                      appointmentTime
                    }
                    onChange={(event) =>
                      setAppointmentTime(
                        event.target.value
                      )
                    }
                    disabled={booking}
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />

                </div>

              </div>


              <div>

                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Reason for Appointment
                </label>

                <textarea
                  value={reason}
                  onChange={(event) =>
                    setReason(
                      event.target.value
                    )
                  }
                  rows={4}
                  placeholder="Describe why you want to consult the doctor..."
                  disabled={booking}
                  className="w-full resize-none rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />

              </div>


              <button
                type="submit"
                disabled={
                  booking ||
                  loading ||
                  doctors.length === 0
                }
                className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >

                {booking
                  ? 'Booking Appointment...'
                  : 'Book Appointment'}

              </button>

            </form>

          )}

        </section>


        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="mb-6">

            <h2 className="text-lg font-bold text-slate-900">
              My Appointments
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Use a confirmed appointment to start your case.
            </p>

          </div>


          {loading ? (

            <div className="text-sm text-slate-500">
              Loading appointments...
            </div>

          ) : appointments.length === 0 ? (

            <div className="rounded-xl border-2 border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
              No appointments booked yet.
            </div>

          ) : (

            <div className="space-y-4">

              {appointments.map(
                (appointment) => {

                  const status =
                    appointment.status ||
                    'CONFIRMED'

                  const isConfirmed =
                    String(
                      status
                    ).toUpperCase() ===
                    'CONFIRMED'

                  const doctorName =
                    getDoctorName(
                      appointment.doctor
                    )

                  return (
                    <div
                      key={
                        appointment.id
                      }
                      className="rounded-xl border border-slate-200 bg-slate-50 p-5"
                    >

                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                        <div>

                          <h3 className="font-bold text-slate-900">
                            Dr. {doctorName}
                          </h3>

                          <p className="mt-1 text-sm text-slate-600">

                            {formatDate(
                              appointment.appointmentDate
                            )}

                            {' • '}

                            {formatTime(
                              appointment.appointmentTime
                            )}

                          </p>

                          <p className="mt-2 text-sm text-slate-600">

                            <span className="font-semibold">
                              Reason:
                            </span>{' '}

                            {appointment.reason ||
                              'Not provided'}

                          </p>

                        </div>


                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${
                            isConfirmed
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                              : 'border-slate-200 bg-white text-slate-600'
                          }`}
                        >
                          {status}
                        </span>

                      </div>


                      <div className="mt-4 flex flex-wrap gap-3">

                        {isConfirmed && (

                          <button
                            type="button"
                            onClick={() =>
                              handleUseAppointment(
                                appointment
                              )
                            }
                            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700"
                          >
                            Start Case with This Appointment
                          </button>

                        )}


                        {isConfirmed && (

                          <button
                            type="button"
                            onClick={() =>
                              handleCancelAppointment(
                                appointment.id
                              )
                            }
                            disabled={
                              cancellingId ===
                              appointment.id
                            }
                            className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
                          >
                            {cancellingId ===
                            appointment.id
                              ? 'Cancelling...'
                              : 'Cancel'}
                          </button>

                        )}

                      </div>

                    </div>
                  )
                }
              )}

            </div>

          )}

        </section>

      </main>

    </div>
  )
}


export default Appointments