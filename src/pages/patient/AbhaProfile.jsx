import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePatientLanguage } from '../../context/PatientLanguageContext'
import LanguageSelector from '../../components/common/LanguageSelector'
import {
  getMyAbhaProfile,
  saveAbhaProfile,
} from '../../services/api'

function AbhaProfile() {
  const lang = usePatientLanguage()
  const t = lang.t
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [profile, setProfile] = useState(null)

  const [form, setForm] = useState({
    abhaNumber: '',
    name: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  })

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await getMyAbhaProfile()

      const data =
        response?.data ||
        response?.profile ||
        response ||
        null

      if (data && typeof data === 'object') {
        setProfile(data)

        setForm({
          abhaNumber: data.abhaNumber || data.abhaId || '',
          name: data.name || '',
          address: data.address || '',
          city: data.city || '',
          state: data.state || '',
          pincode: data.pincode || '',
        })
      }
    } catch (err) {
      // A missing profile is treated as an empty profile.
      // Other errors are shown to the patient.
      const message = err?.message || ''
      if (
        !message.toLowerCase().includes('not found') &&
        !message.toLowerCase().includes('no abha')
      ) {
        setError(message || 'Unable to load ABHA profile.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (event) => {
    const { name, value } = event.target

    if (name === 'abhaNumber') {
      const digitsOnly = value.replace(/\D/g, '').slice(0, 14)

      setForm((previous) => ({
        ...previous,
        [name]: digitsOnly,
      }))
      return
    }

    if (name === 'pincode') {
      const digitsOnly = value.replace(/\D/g, '').slice(0, 6)

      setForm((previous) => ({
        ...previous,
        [name]: digitsOnly,
      }))
      return
    }

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    setError('')
    setSuccess('')

    const abhaNumber = form.abhaNumber.trim()

    if (!/^\d{14}$/.test(abhaNumber)) {
      setError('ABHA Number must contain exactly 14 digits.')
      return
    }

    if (!form.name.trim()) {
      setError('Please enter the name associated with the ABHA profile.')
      return
    }

    if (form.pincode && !/^\d{6}$/.test(form.pincode)) {
      setError('PIN code must contain 6 digits.')
      return
    }

    setSaving(true)

    try {
      const response = await saveAbhaProfile({
        abhaNumber,
        name: form.name.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        pincode: form.pincode.trim(),
      })

      const saved =
        response?.data ||
        response?.profile ||
        response ||
        null

      if (saved && typeof saved === 'object') {
        setProfile(saved)

        setForm((previous) => ({
          ...previous,
          abhaNumber: saved.abhaNumber || previous.abhaNumber,
          name: saved.name || previous.name,
          address: saved.address || previous.address,
          city: saved.city || previous.city,
          state: saved.state || previous.state,
          pincode: saved.pincode || previous.pincode,
        }))
      }

      setSuccess(
        'ABHA profile saved successfully. Verification is not performed by this prototype.'
      )
    } catch (err) {
      setError(err?.message || 'Unable to save ABHA profile.')
    } finally {
      setSaving(false)
    }
  }

  const isVerified =
    profile?.verified === true ||
    String(profile?.verificationStatus || '').toUpperCase() === 'VERIFIED'

  const displayStatus = isVerified
    ? 'Verified'
    : 'Not Verified'

  const inputClass =
    'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10'

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-5">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-2xl animate-pulse">
            🪪
          </div>
          <p className="mt-4 text-sm font-semibold text-slate-600">
            Loading ABHA profile...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* HEADER */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-5 sm:px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <span className="text-2xl">⚕</span>
              </div>

              <div>
                <h1 className="text-lg sm:text-xl font-bold text-slate-900">
                  AYUSH Care
                </h1>
                <p className="text-xs text-slate-500">{t('abhaAbdmProfile')}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('/patient/dashboard')}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
            >
              ← Dashboard
            </button>
          </div>
        </div>
      </header>

      <div className="fixed top-4 right-4 z-50"><LanguageSelector compact /></div>

      <main className="max-w-5xl mx-auto px-5 sm:px-6 py-8 sm:py-10">
        {/* PAGE INTRO */}
        <section className="mb-7">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
            <div>
              <p className="text-sm font-bold text-emerald-600 uppercase tracking-wider">{t('digitalHealthIdentity')}</p>

              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mt-2">{t('abhaProfile')}</h2>

              <p className="text-slate-500 mt-3 max-w-2xl leading-7">
                Save your ABHA details so they can be associated with your
                digital patient case. Please enter your details carefully.
              </p>
            </div>

            <div
              className={`inline-flex items-center gap-2 self-start md:self-auto px-4 py-2.5 rounded-full border text-sm font-bold ${
                isVerified
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                  : 'bg-amber-50 text-amber-700 border-amber-100'
              }`}
            >
              <span>{isVerified ? '✓' : '!'}</span>
              {displayStatus}
            </div>
          </div>
        </section>

        {/* STATUS NOTICE */}
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 mb-6">
          <div className="flex gap-3">
            <div className="text-xl">🔐</div>
            <div>
              <h3 className="font-bold text-amber-900">
                Verification status
              </h3>
              <p className="text-sm text-amber-800 mt-1 leading-6">
                This prototype can store and display an entered ABHA Number,
                but it does not perform live ABDM identity verification.
                Do not treat “Not Verified” as a failed ABHA identity.
              </p>
            </div>
          </div>
        </section>

        {/* ERROR / SUCCESS */}
        {error && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
            ⚠️ {error}
          </div>
        )}

        {success && (
          <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-700">
            ✓ {success}
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 sm:px-8 py-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-xl">
                  🪪
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">
                    ABHA Information
                  </h3>
                  <p className="text-sm text-slate-500 mt-0.5">
                    Enter the details associated with your ABHA account.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              {/* ABHA NUMBER */}
              <div>
                <label
                  htmlFor="abhaNumber"
                  className="block text-sm font-bold text-slate-700 mb-2"
                >{t('abhaNumber')}<span className="text-red-500">*</span>
                </label>

                <input
                  id="abhaNumber"
                  name="abhaNumber"
                  value={form.abhaNumber}
                  onChange={handleChange}
                  inputMode="numeric"
                  maxLength={14}
                  placeholder="Enter 14-digit ABHA Number"
                  className={inputClass}
                />

                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-slate-500">
                    Example format: 14 digits
                  </p>
                  <p
                    className={`text-xs font-bold ${
                      form.abhaNumber.length === 14
                        ? 'text-emerald-600'
                        : 'text-slate-400'
                    }`}
                  >
                    {form.abhaNumber.length}/14
                  </p>
                </div>
              </div>

              {/* NAME */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-bold text-slate-700 mb-2"
                >{t('name')}<span className="text-red-500">*</span>
                </label>

                <input
                  id="name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Name associated with ABHA"
                  className={inputClass}
                />
              </div>

              {/* ADDRESS */}
              <div>
                <label
                  htmlFor="address"
                  className="block text-sm font-bold text-slate-700 mb-2"
                >{t('address')}</label>

                <textarea
                  id="address"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  rows={3}
                  placeholder="House / street / locality"
                  className={`${inputClass} resize-none`}
                />
              </div>

              {/* CITY / STATE / PIN */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label
                    htmlFor="city"
                    className="block text-sm font-bold text-slate-700 mb-2"
                  >{t('city')}</label>

                  <input
                    id="city"
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    placeholder="City"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label
                    htmlFor="state"
                    className="block text-sm font-bold text-slate-700 mb-2"
                  >{t('state')}</label>

                  <input
                    id="state"
                    name="state"
                    value={form.state}
                    onChange={handleChange}
                    placeholder="State"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label
                    htmlFor="pincode"
                    className="block text-sm font-bold text-slate-700 mb-2"
                  >
                    PIN Code
                  </label>

                  <input
                    id="pincode"
                    name="pincode"
                    value={form.pincode}
                    onChange={handleChange}
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="6-digit PIN"
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            {/* ACTIONS */}
            <div className="px-6 sm:px-8 py-5 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row gap-3 sm:justify-end">
              <button
                type="button"
                onClick={() => navigate('/patient/dashboard')}
                className="px-5 py-3 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-bold hover:bg-slate-100 transition"
              >{t('cancel')}</button>

              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 rounded-xl bg-emerald-600 text-white text-sm font-bold shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
              >
                {saving ? 'Saving...' : 'Save ABHA Profile'}
              </button>
            </div>
          </div>
        </form>

        {/* PRIVACY CARD */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex gap-3">
            <div className="text-xl">🛡️</div>
            <div>
              <h3 className="font-bold text-slate-800">{t('privacyConsent')}</h3>
              <p className="text-sm text-slate-500 mt-1 leading-6">
                Only enter an ABHA Number that belongs to you. This screen is
                part of the prototype and should not be used as proof of
                identity or live ABDM verification.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default AbhaProfile
