import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'

import {
  registerPatient,
  registerDoctor,
} from '../../services/api'

function Register() {
  const navigate = useNavigate()

  const [accountType, setAccountType] = useState('patient')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [doctorSubmitted, setDoctorSubmitted] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      email: '',
      mobile: '',
      password: '',
      dateOfBirth: '',
      gender: '',
      abhaNumber: '',

      medicalSystem: '',
      registrationNumber: '',
      qualification: '',
      specialization: '',
      experienceYears: '',
      hospital: '',
      department: '',
      city: '',
      state: '',
    },
  })

  const selectedAccountType = watch('accountType')

  const switchAccountType = (type) => {
    setAccountType(type)
    setError('')
    setSuccess('')
    setDoctorSubmitted(false)
    reset()
  }

  const onSubmit = async (data) => {
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      if (accountType === 'patient') {
        const response = await registerPatient({
          name: data.name.trim(),
          email: data.email.trim(),
          mobile: data.mobile.trim(),
          password: data.password,
          dateOfBirth: data.dateOfBirth || null,
          gender: data.gender || null,
          abhaNumber: data.abhaNumber?.trim() || null,
        })

        setSuccess(
          response?.message ||
            'Patient registration successful. Redirecting to login...'
        )

        setTimeout(() => {
          navigate('/login')
        }, 1500)

        return
      }

      const response = await registerDoctor({
        name: data.name.trim(),
        email: data.email.trim(),
        mobile: data.mobile.trim(),
        password: data.password,
        medicalSystem: data.medicalSystem,
        registrationNumber: data.registrationNumber.trim(),
        qualification: data.qualification.trim(),
        specialization: data.specialization?.trim() || null,
        experienceYears: data.experienceYears
          ? Number(data.experienceYears)
          : null,
        hospital: data.hospital?.trim() || null,
        department: data.department?.trim() || null,
        city: data.city?.trim() || null,
        state: data.state?.trim() || null,
      })

      setSuccess(
        response?.message ||
          'Doctor registration submitted successfully. Your account is pending admin approval.'
      )

      setDoctorSubmitted(true)
    } catch (err) {
      setError(
        err?.message ||
          'Registration failed. Please check your details and try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  const inputClass = (fieldError) =>
    `w-full rounded-xl border px-4 py-3 text-sm outline-none transition ${
      fieldError
        ? 'border-red-400 bg-red-50 focus:border-red-500'
        : 'border-slate-200 bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-100'
    }`

  const labelClass =
    'mb-2 block text-sm font-semibold text-slate-700'

  if (doctorSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-teal-950 to-emerald-950 px-4 py-10">
        <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-2xl items-center justify-center">
          <div className="w-full rounded-3xl border border-white/10 bg-white/95 p-8 text-center shadow-2xl backdrop-blur md:p-12">

            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-amber-100">
              <span className="text-4xl">⏳</span>
            </div>

            <div className="mb-2 text-sm font-bold uppercase tracking-[0.2em] text-teal-700">
              AYUSH Care
            </div>

            <h1 className="mb-4 text-3xl font-black text-slate-900">
              Registration Submitted
            </h1>

            <p className="mx-auto max-w-lg text-base leading-7 text-slate-600">
              Your doctor account has been successfully submitted.
              An administrator will verify your medical registration
              details before activating your account.
            </p>

            <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-left">
              <p className="font-bold text-amber-900">
                Account status: Pending Approval
              </p>

              <p className="mt-2 text-sm leading-6 text-amber-800">
                You will be able to log in after your account is approved
                by the administrator.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate('/login')}
              className="mt-8 w-full rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 px-6 py-3.5 font-bold text-white shadow-lg transition hover:from-teal-700 hover:to-emerald-700"
            >
              Go to Login
            </button>

            <button
              type="button"
              onClick={() => {
                setDoctorSubmitted(false)
                setSuccess('')
                reset()
              }}
              className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-6 py-3.5 font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Register Another Account
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-teal-950 to-emerald-950 px-4 py-8 md:py-12">

      {/* Background decoration */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-teal-500/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-emerald-400/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-5xl">

        {/* Header */}
        <div className="mb-8 text-center text-white">

          <div className="mb-4 inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-5 py-3 backdrop-blur">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-emerald-500 text-xl font-black text-white shadow-lg">
              A
            </div>

            <div className="text-left">
              <p className="text-lg font-black tracking-tight">
                AYUSH Care
              </p>
              <p className="text-xs text-teal-100">
                Intelligent Patient Case Taking
              </p>
            </div>
          </div>

          <h1 className="text-3xl font-black tracking-tight md:text-4xl">
            Create Your Account
          </h1>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-300 md:text-base">
            Join AYUSH Care to securely manage patient history,
            clinical cases and healthcare information.
          </p>
        </div>

        {/* Main Card */}
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white shadow-2xl">

          {/* Account Type */}
          <div className="border-b border-slate-200 bg-slate-50 p-5 md:p-7">

            <p className="mb-4 text-center text-sm font-bold uppercase tracking-wider text-slate-500">
              Choose Account Type
            </p>

            <div className="mx-auto grid max-w-2xl grid-cols-1 gap-3 md:grid-cols-2">

              {/* Patient */}
              <button
                type="button"
                onClick={() => switchAccountType('patient')}
                className={`group rounded-2xl border-2 p-4 text-left transition ${
                  accountType === 'patient'
                    ? 'border-teal-500 bg-teal-50 shadow-md'
                    : 'border-slate-200 bg-white hover:border-teal-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-4">

                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl ${
                      accountType === 'patient'
                        ? 'bg-teal-600 text-white'
                        : 'bg-slate-100'
                    }`}
                  >
                    👤
                  </div>

                  <div>
                    <p className="font-bold text-slate-900">
                      Patient
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Create and manage your health cases
                    </p>
                  </div>

                </div>
              </button>

              {/* Doctor */}
              <button
                type="button"
                onClick={() => switchAccountType('doctor')}
                className={`group rounded-2xl border-2 p-4 text-left transition ${
                  accountType === 'doctor'
                    ? 'border-emerald-500 bg-emerald-50 shadow-md'
                    : 'border-slate-200 bg-white hover:border-emerald-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-4">

                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl ${
                      accountType === 'doctor'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100'
                    }`}
                  >
                    👨‍⚕️
                  </div>

                  <div>
                    <p className="font-bold text-slate-900">
                      Doctor
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Review and manage patient cases
                    </p>
                  </div>

                </div>
              </button>

            </div>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="p-5 md:p-8 lg:p-10"
          >

            {/* Error */}
            {error && (
              <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4">
                <div className="flex gap-3">
                  <span className="text-xl">⚠️</span>

                  <div>
                    <p className="font-bold text-red-800">
                      Registration Failed
                    </p>

                    <p className="mt-1 text-sm leading-6 text-red-700">
                      {error}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Success */}
            {success && !doctorSubmitted && (
              <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex gap-3">
                  <span className="text-xl">✅</span>

                  <div>
                    <p className="font-bold text-emerald-800">
                      Registration Successful
                    </p>

                    <p className="mt-1 text-sm leading-6 text-emerald-700">
                      {success}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Basic Information */}
            <div className="mb-8">

              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-100 text-sm font-black text-teal-700">
                  1
                </div>

                <div>
                  <h2 className="font-bold text-slate-900">
                    Basic Information
                  </h2>

                  <p className="text-xs text-slate-500">
                    Enter your personal account details
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                {/* Name */}
                <div>
                  <label className={labelClass}>
                    Full Name *
                  </label>

                  <input
                    type="text"
                    placeholder="Enter your full name"
                    className={inputClass(errors.name)}
                    {...register('name', {
                      required: 'Full name is required',
                      minLength: {
                        value: 2,
                        message: 'Name must contain at least 2 characters',
                      },
                    })}
                  />

                  {errors.name && (
                    <p className="mt-1.5 text-xs font-medium text-red-600">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className={labelClass}>
                    Email Address *
                  </label>

                  <input
                    type="email"
                    placeholder="you@example.com"
                    className={inputClass(errors.email)}
                    {...register('email', {
                      required: 'Email is required',
                      pattern: {
                        value:
                          /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Enter a valid email address',
                      },
                    })}
                  />

                  {errors.email && (
                    <p className="mt-1.5 text-xs font-medium text-red-600">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Mobile */}
                <div>
                  <label className={labelClass}>
                    Mobile Number *
                  </label>

                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="10 digit mobile number"
                    className={inputClass(errors.mobile)}
                    {...register('mobile', {
                      required: 'Mobile number is required',
                      pattern: {
                        value: /^[6-9]\d{9}$/,
                        message:
                          'Enter a valid 10 digit Indian mobile number',
                      },
                    })}
                  />

                  {errors.mobile && (
                    <p className="mt-1.5 text-xs font-medium text-red-600">
                      {errors.mobile.message}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label className={labelClass}>
                    Password *
                  </label>

                  <input
                    type="password"
                    placeholder="Create a strong password"
                    className={inputClass(errors.password)}
                    {...register('password', {
                      required: 'Password is required',
                      minLength: {
                        value: 6,
                        message:
                          'Password must contain at least 6 characters',
                      },
                    })}
                  />

                  {errors.password && (
                    <p className="mt-1.5 text-xs font-medium text-red-600">
                      {errors.password.message}
                    </p>
                  )}
                </div>

              </div>
            </div>

            {/* Patient Fields */}
            {accountType === 'patient' && (
              <div className="mb-8">

                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-100 text-sm font-black text-teal-700">
                    2
                  </div>

                  <div>
                    <h2 className="font-bold text-slate-900">
                      Patient Profile
                    </h2>

                    <p className="text-xs text-slate-500">
                      Additional information for your health profile
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                  {/* DOB */}
                  <div>
                    <label className={labelClass}>
                      Date of Birth
                    </label>

                    <input
                      type="date"
                      className={inputClass(errors.dateOfBirth)}
                      {...register('dateOfBirth')}
                    />
                  </div>

                  {/* Gender */}
                  <div>
                    <label className={labelClass}>
                      Gender
                    </label>

                    <select
                      className={inputClass(errors.gender)}
                      {...register('gender')}
                    >
                      <option value="">Select gender</option>
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                      <option value="PREFER_NOT_TO_SAY">
                        Prefer not to say
                      </option>
                    </select>
                  </div>

                  {/* ABHA */}
                  <div className="md:col-span-2">
                    <label className={labelClass}>
                      ABHA Number
                      <span className="ml-2 font-normal text-slate-400">
                        (Optional)
                      </span>
                    </label>

                    <input
                      type="text"
                      placeholder="Enter your ABHA number"
                      className={inputClass(errors.abhaNumber)}
                      {...register('abhaNumber')}
                    />

                    <p className="mt-1.5 text-xs text-slate-500">
                      You can add or update your ABHA profile later as well.
                    </p>
                  </div>

                </div>
              </div>
            )}

            {/* Doctor Fields */}
            {accountType === 'doctor' && (
              <div className="mb-8">

                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-sm font-black text-emerald-700">
                    2
                  </div>

                  <div>
                    <h2 className="font-bold text-slate-900">
                      Professional Information
                    </h2>

                    <p className="text-xs text-slate-500">
                      These details will be verified by the administrator
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                  {/* Medical System */}
                  <div>
                    <label className={labelClass}>
                      Medical System *
                    </label>

                    <select
                      className={inputClass(errors.medicalSystem)}
                      {...register('medicalSystem', {
                        required: 'Medical system is required',
                      })}
                    >
                      <option value="">
                        Select medical system
                      </option>
                      <option value="AYURVEDA">Ayurveda</option>
                      <option value="UNANI">Unani</option>
                      <option value="SIDDHA">Siddha</option>
                      <option value="HOMEOPATHY">
                        Homoeopathy
                      </option>
                      <option value="SOWA_RIGPA">
                        Sowa-Rigpa
                      </option>
                    </select>

                    {errors.medicalSystem && (
                      <p className="mt-1.5 text-xs font-medium text-red-600">
                        {errors.medicalSystem.message}
                      </p>
                    )}
                  </div>

                  {/* Registration Number */}
                  <div>
                    <label className={labelClass}>
                      Medical Registration Number *
                    </label>

                    <input
                      type="text"
                      placeholder="e.g. AYU123456"
                      className={inputClass(errors.registrationNumber)}
                      {...register('registrationNumber', {
                        required:
                          'Medical registration number is required',
                      })}
                    />

                    {errors.registrationNumber && (
                      <p className="mt-1.5 text-xs font-medium text-red-600">
                        {errors.registrationNumber.message}
                      </p>
                    )}
                  </div>

                  {/* Qualification */}
                  <div>
                    <label className={labelClass}>
                      Qualification *
                    </label>

                    <input
                      type="text"
                      placeholder="e.g. BAMS, MD (Ayurveda)"
                      className={inputClass(errors.qualification)}
                      {...register('qualification', {
                        required: 'Qualification is required',
                      })}
                    />

                    {errors.qualification && (
                      <p className="mt-1.5 text-xs font-medium text-red-600">
                        {errors.qualification.message}
                      </p>
                    )}
                  </div>

                  {/* Specialization */}
                  <div>
                    <label className={labelClass}>
                      Specialization
                    </label>

                    <input
                      type="text"
                      placeholder="e.g. Panchakarma"
                      className={inputClass(errors.specialization)}
                      {...register('specialization')}
                    />
                  </div>

                  {/* Experience */}
                  <div>
                    <label className={labelClass}>
                      Experience (Years)
                    </label>

                    <input
                      type="number"
                      min="0"
                      max="70"
                      placeholder="e.g. 8"
                      className={inputClass(errors.experienceYears)}
                      {...register('experienceYears', {
                        min: {
                          value: 0,
                          message: 'Experience cannot be negative',
                        },
                        max: {
                          value: 70,
                          message:
                            'Please enter a valid experience',
                        },
                      })}
                    />

                    {errors.experienceYears && (
                      <p className="mt-1.5 text-xs font-medium text-red-600">
                        {errors.experienceYears.message}
                      </p>
                    )}
                  </div>

                  {/* Hospital */}
                  <div>
                    <label className={labelClass}>
                      Hospital / Clinic
                    </label>

                    <input
                      type="text"
                      placeholder="Hospital or clinic name"
                      className={inputClass(errors.hospital)}
                      {...register('hospital')}
                    />
                  </div>

                  {/* Department */}
                  <div>
                    <label className={labelClass}>
                      Department
                    </label>

                    <input
                      type="text"
                      placeholder="e.g. General Medicine"
                      className={inputClass(errors.department)}
                      {...register('department')}
                    />
                  </div>

                  {/* City */}
                  <div>
                    <label className={labelClass}>
                      City
                    </label>

                    <input
                      type="text"
                      placeholder="Enter city"
                      className={inputClass(errors.city)}
                      {...register('city')}
                    />
                  </div>

                  {/* State */}
                  <div>
                    <label className={labelClass}>
                      State
                    </label>

                    <input
                      type="text"
                      placeholder="Enter state"
                      className={inputClass(errors.state)}
                      {...register('state')}
                    />
                  </div>

                </div>
              </div>
            )}

            {/* Submit */}
            <div className="border-t border-slate-200 pt-7">

              {accountType === 'doctor' && (
                <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <div className="flex gap-3">
                    <span className="text-lg">🔐</span>

                    <div>
                      <p className="text-sm font-bold text-amber-900">
                        Doctor verification required
                      </p>

                      <p className="mt-1 text-xs leading-5 text-amber-800">
                        Your account will remain pending until an
                        administrator verifies your professional details.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 px-6 py-4 font-bold text-white shadow-lg shadow-teal-900/10 transition hover:from-teal-700 hover:to-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-3">
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Creating Account...
                  </span>
                ) : accountType === 'patient' ? (
                  'Create Patient Account'
                ) : (
                  'Submit Doctor Registration'
                )}
              </button>
            </div>

            {/* Login */}
            <div className="mt-7 text-center">

              <p className="text-sm text-slate-500">
                Already have an account?
              </p>

              <Link
                to="/login"
                className="mt-1 inline-block font-bold text-teal-700 transition hover:text-teal-900 hover:underline"
              >
                Sign in to AYUSH Care
              </Link>

            </div>

          </form>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs leading-5 text-slate-400">
          Your information is handled securely and used for healthcare
          case-taking and clinical workflow purposes.
        </p>

      </div>
    </div>
  )
}

export default Register