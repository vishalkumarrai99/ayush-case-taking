import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { login } from '../../store/slices/authSlice'
import { apiRequest } from '../../services/api'

function Login() {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const [showPassword, setShowPassword] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: '',
      password: '',
      role: 'patient',
    },
  })

  const selectedRole = watch('role')

  const roles = [
    {
      id: 'patient',
      backendRole: 'PATIENT',
      icon: '👤',
      title: 'Patient',
      description: 'Take your case history',
      color: 'emerald',
    },
    {
      id: 'doctor',
      backendRole: 'DOCTOR',
      icon: '👨‍⚕️',
      title: 'Doctor',
      description: 'Review patient cases',
      color: 'blue',
    },
    {
      id: 'admin',
      backendRole: 'ADMIN',
      icon: '🛡️',
      title: 'Admin',
      description: 'Manage the system',
      color: 'violet',
    },
  ]

  const selectRole = (role) => {
    setValue('role', role, {
      shouldValidate: true,
      shouldDirty: true,
    })

    setLoginError('')
  }

  const onSubmit = async (data) => {
    setLoginError('')
    setIsLoading(true)

    try {
      const response = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: data.email,
          password: data.password,
        }),
      })

      if (!response?.token || !response?.user) {
        throw new Error('Invalid login response from server.')
      }

      const backendRole = String(response.user.role || '').toUpperCase()

      const roleMap = {
        PATIENT: 'patient',
        DOCTOR: 'doctor',
        ADMIN: 'admin',
      }

      const frontendRole = roleMap[backendRole]

      if (!frontendRole) {
        throw new Error('Invalid user role received from server.')
      }

      /*
       * IMPORTANT:
       * Role selected on frontend is only for UI.
       * Actual role comes from the backend/database.
       */
      if (frontendRole !== data.role) {
        throw new Error(
          `This account belongs to the ${frontendRole} role. Please select the correct role.`
        )
      }

      // Save JWT token for future API requests.
      localStorage.setItem('ayush-token', response.token)

      localStorage.setItem(
        'ayush-user',
        JSON.stringify(response.user)
      )

      localStorage.setItem(
        'ayush-role',
        frontendRole
      )

      // Save logged-in user in Redux.
      dispatch(
        login({
          user: response.user,
          role: frontendRole,
        })
      )

      // Navigate according to actual backend role.
      if (frontendRole === 'patient') {
        navigate('/patient/dashboard')
      } else if (frontendRole === 'doctor') {
        navigate('/doctor/dashboard')
      } else {
        navigate('/admin/dashboard')
      }
    } catch (error) {
      console.error('Login failed:', error)

      setLoginError(
        error.message ||
          'Unable to login. Please check your email and password.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-emerald-950 via-teal-900 to-sky-950">

      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">

        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-emerald-400/15 blur-3xl" />

        <div className="absolute top-1/3 -right-40 w-[30rem] h-[30rem] rounded-full bg-cyan-400/15 blur-3xl" />

        <div className="absolute -bottom-40 left-1/3 w-[28rem] h-[28rem] rounded-full bg-teal-300/10 blur-3xl" />

        <div className="absolute top-16 right-[12%] text-white/10 text-7xl font-light">
          +
        </div>

        <div className="absolute bottom-20 left-[10%] text-white/10 text-8xl font-light">
          +
        </div>

        <div className="absolute top-[18%] left-[7%] w-3 h-3 rounded-full bg-emerald-300/40 animate-pulse" />

        <div className="absolute top-[70%] right-[9%] w-4 h-4 rounded-full bg-cyan-300/30 animate-pulse" />

      </div>

      <div className="relative z-10 min-h-screen grid lg:grid-cols-2">

        {/* LEFT PANEL */}
        <section className="hidden lg:flex flex-col justify-center px-12 xl:px-20 text-white">

          <div className="max-w-xl">

            {/* Branding */}
            <div className="flex items-center gap-4 mb-8">

              <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center shadow-xl">

                <span className="text-3xl">
                  ⚕
                </span>

              </div>

              <div>

                <p className="text-sm uppercase tracking-[0.25em] text-emerald-200">
                  Smart Healthcare
                </p>

                <h1 className="text-2xl font-bold">
                  AYUSH Care
                </h1>

              </div>

            </div>

            {/* Heading */}
            <h2 className="text-5xl xl:text-6xl font-bold leading-tight">

              Smarter

              <span className="block text-emerald-300">
                Patient History.
              </span>

              Better Care.

            </h2>

            <p className="mt-6 text-lg leading-8 text-slate-200/85 max-w-lg">
              A digital patient case-taking platform designed to capture
              detailed medical and AYUSH history and prepare structured
              information for clinical review.
            </p>

            {/* Features */}
            <div className="mt-10 grid grid-cols-3 gap-4">

              <div className="rounded-2xl bg-white/10 border border-white/10 backdrop-blur-md p-4">

                <div className="text-2xl">
                  🎙️
                </div>

                <p className="mt-2 text-sm font-semibold">
                  Voice Input
                </p>

                <p className="mt-1 text-xs text-slate-300">
                  Speak your answers
                </p>

              </div>

              <div className="rounded-2xl bg-white/10 border border-white/10 backdrop-blur-md p-4">

                <div className="text-2xl">
                  📋
                </div>

                <p className="mt-2 text-sm font-semibold">
                  Structured Case
                </p>

                <p className="mt-1 text-xs text-slate-300">
                  Organized history
                </p>

              </div>

              <div className="rounded-2xl bg-white/10 border border-white/10 backdrop-blur-md p-4">

                <div className="text-2xl">
                  👨‍⚕️
                </div>

                <p className="mt-2 text-sm font-semibold">
                  Doctor Review
                </p>

                <p className="mt-1 text-xs text-slate-300">
                  Clinical verification
                </p>

              </div>

            </div>

            <div className="mt-8 flex items-center gap-3 text-sm text-emerald-100/80">

              <span className="w-2.5 h-2.5 rounded-full bg-emerald-300 animate-pulse" />

              Secure clinical workflow • Patient-first design

            </div>

          </div>

        </section>

        {/* RIGHT LOGIN PANEL */}
        <section className="flex items-center justify-center px-5 py-10 sm:px-8">

          <div className="w-full max-w-md">

            {/* Mobile branding */}
            <div className="lg:hidden text-center text-white mb-7">

              <div className="mx-auto w-14 h-14 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center">

                <span className="text-3xl">
                  ⚕
                </span>

              </div>

              <h1 className="mt-3 text-2xl font-bold">
                AYUSH Care
              </h1>

              <p className="text-sm text-emerald-100/80 mt-1">
                Smart Patient Case-Taking
              </p>

            </div>

            {/* Login Card */}
            <div className="rounded-3xl bg-white/95 backdrop-blur-xl shadow-2xl border border-white/50 p-7 sm:p-9">

              {/* Header */}
              <div className="mb-7">

                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">

                  <span className="w-2 h-2 rounded-full bg-emerald-500" />

                  Clinical Access Portal

                </div>

                <h2 className="text-3xl font-bold text-slate-900 mt-4">
                  Welcome back
                </h2>

                <p className="text-slate-500 mt-2">
                  Choose your role and sign in to continue.
                </p>

              </div>

              {/* BACKEND ERROR */}
              {loginError && (
                <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3">

                  <div className="flex items-start gap-3">

                    <span className="text-red-500">
                      ⚠️
                    </span>

                    <div>

                      <p className="text-sm font-semibold text-red-700">
                        Login failed
                      </p>

                      <p className="text-sm text-red-600 mt-0.5">
                        {loginError}
                      </p>

                    </div>

                  </div>

                </div>
              )}

              <form
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-5"
              >

                {/* EMAIL */}
                <div>

                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Email address
                  </label>

                  <div className="relative">

                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      ✉
                    </span>

                    <input
                      type="email"
                      placeholder="you@example.com"
                      {...register('email', {
                        required: 'Email is required',
                        pattern: {
                          value: /^\S+@\S+\.\S+$/,
                          message: 'Please enter a valid email',
                        },
                      })}
                      className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 outline-none transition focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                    />

                  </div>

                  {errors.email && (
                    <p className="mt-1.5 text-sm text-red-500">
                      {errors.email.message}
                    </p>
                  )}

                </div>

                {/* PASSWORD */}
                <div>

                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Password
                  </label>

                  <div className="relative">

                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      🔒
                    </span>

                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      {...register('password', {
                        required: 'Password is required',
                        minLength: {
                          value: 4,
                          message: 'Password must be at least 4 characters',
                        },
                      })}
                      className="w-full pl-11 pr-12 py-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 outline-none transition focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 text-slate-400 hover:text-emerald-600 transition"
                      aria-label={
                        showPassword
                          ? 'Hide password'
                          : 'Show password'
                      }
                    >
                      {showPassword ? '🙈' : '👁️'}
                    </button>

                  </div>

                  {errors.password && (
                    <p className="mt-1.5 text-sm text-red-500">
                      {errors.password.message}
                    </p>
                  )}

                </div>

                {/* ROLE SELECTION */}
                <div>

                  <div className="flex items-center justify-between mb-3">

                    <label className="block text-sm font-semibold text-slate-700">
                      Select your role
                    </label>

                    <span className="text-xs text-slate-400">
                      Required
                    </span>

                  </div>

                  {/* Hidden role input for React Hook Form */}
                  <input
                    type="hidden"
                    {...register('role', {
                      required: 'Please select a role',
                    })}
                  />

                  <div className="grid grid-cols-3 gap-2.5">

                    {roles.map((role) => {

                      const isSelected =
                        selectedRole === role.id

                      return (

                        <button
                          key={role.id}
                          type="button"
                          onClick={() => selectRole(role.id)}
                          className={`
                            relative rounded-2xl p-3 text-left border-2
                            transition-all duration-200
                            ${
                              isSelected
                                ? role.color === 'emerald'
                                  ? 'border-emerald-500 bg-emerald-50 shadow-md shadow-emerald-500/10 -translate-y-0.5'
                                  : role.color === 'blue'
                                  ? 'border-blue-500 bg-blue-50 shadow-md shadow-blue-500/10 -translate-y-0.5'
                                  : 'border-violet-500 bg-violet-50 shadow-md shadow-violet-500/10 -translate-y-0.5'
                                : 'border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300 hover:-translate-y-0.5'
                            }
                          `}
                        >

                          {/* Selected indicator */}
                          {isSelected && (
                            <span
                              className={`
                                absolute top-2 right-2 w-5 h-5 rounded-full
                                flex items-center justify-center text-white text-xs
                                ${
                                  role.color === 'emerald'
                                    ? 'bg-emerald-500'
                                    : role.color === 'blue'
                                    ? 'bg-blue-500'
                                    : 'bg-violet-500'
                                }
                              `}
                            >
                              ✓
                            </span>
                          )}

                          <div className="text-2xl mb-2">
                            {role.icon}
                          </div>

                          <p
                            className={`
                              text-sm font-bold
                              ${
                                isSelected
                                  ? role.color === 'emerald'
                                    ? 'text-emerald-700'
                                    : role.color === 'blue'
                                    ? 'text-blue-700'
                                    : 'text-violet-700'
                                  : 'text-slate-800'
                              }
                            `}
                          >
                            {role.title}
                          </p>

                          <p className="text-[10px] leading-4 text-slate-500 mt-1">
                            {role.description}
                          </p>

                        </button>

                      )
                    })}

                  </div>

                  {errors.role && (
                    <p className="mt-1.5 text-sm text-red-500">
                      {errors.role.message}
                    </p>
                  )}

                </div>

                {/* SELECTED ROLE INFO */}
                <div
                  className={`
                    rounded-xl px-4 py-3 border
                    ${
                      selectedRole === 'patient'
                        ? 'bg-emerald-50 border-emerald-100'
                        : selectedRole === 'doctor'
                        ? 'bg-blue-50 border-blue-100'
                        : 'bg-violet-50 border-violet-100'
                    }
                  `}
                >

                  <div className="flex items-center gap-3">

                    <span className="text-xl">
                      {
                        roles.find(
                          (role) => role.id === selectedRole
                        )?.icon
                      }
                    </span>

                    <div>

                      <p className="text-xs font-semibold text-slate-700">
                        Continuing as{' '}
                        {
                          roles.find(
                            (role) => role.id === selectedRole
                          )?.title
                        }
                      </p>

                      <p className="text-[11px] text-slate-500 mt-0.5">
                        You will be redirected to your workspace after login.
                      </p>

                    </div>

                  </div>

                </div>

                {/* LOGIN BUTTON */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`
                    w-full py-3.5 rounded-xl
                    bg-gradient-to-r from-emerald-600 to-teal-600
                    text-white font-bold
                    shadow-lg shadow-emerald-900/20
                    transition-all duration-200
                    ${
                      isLoading
                        ? 'opacity-70 cursor-not-allowed'
                        : 'hover:from-emerald-700 hover:to-teal-700 hover:-translate-y-0.5 active:translate-y-0'
                    }
                  `}
                >
                  {isLoading
                    ? 'Signing in...'
                    : 'Sign in securely →'}
                </button>

              </form>

              {/* REGISTER / SIGN UP */}
              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">

                <div className="text-center">

                  <p className="text-sm text-slate-500">
                    Don't have an account?
                  </p>

                  <button
                    type="button"
                    onClick={() => navigate('/register')}
                    className="mt-2 w-full rounded-xl border-2 border-emerald-500 bg-white px-5 py-3 text-sm font-bold text-emerald-700 transition-all duration-200 hover:bg-emerald-50 hover:-translate-y-0.5"
                  >
                    Create a new account →
                  </button>

                  <p className="mt-2 text-[11px] leading-5 text-slate-400">
                    Register as a Patient or Doctor
                  </p>

                </div>

              </div>

              {/* SECURITY NOTE */}
              <div className="mt-7 pt-5 border-t border-slate-100">

                <div className="flex items-start gap-3">

                  <div className="mt-0.5 text-emerald-600">
                    🛡️
                  </div>

                  <div>

                    <p className="text-xs font-semibold text-slate-700">
                      Privacy & clinical safety
                    </p>

                    <p className="text-xs leading-5 text-slate-500 mt-0.5">
                      Patient information should be handled securely.
                      Clinical decisions remain with the qualified
                      healthcare professional.
                    </p>

                  </div>

                </div>

              </div>

            </div>

            <p className="text-center text-xs text-white/60 mt-5">
              AYUSH Patient Case-Taking Software • Smart Healthcare Prototype
            </p>

          </div>

        </section>

      </div>

    </div>
  )
}

export default Login