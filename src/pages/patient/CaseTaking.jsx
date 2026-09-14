
import { useEffect, useState } from 'react'
import { usePatientLanguage, getPatientLanguage } from '../../context/PatientLanguageContext'
import { CASE_TRANSLATIONS } from '../../data/caseTranslations'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'
import VoiceInputButton from '../../components/common/VoiceInputButton'
import LanguageSelector from '../../components/common/LanguageSelector'
import { apiRequest, submitPatientCase } from '../../services/api'
import {
  savePatientInformation,
  saveChiefComplaint,
  saveMedicalHistory,
  saveAyushAssessment,
  submitCase,
} from '../../store/slices/caseSlice'

function tx(text) {
  if (!text) return text
  try {
    const language = localStorage.getItem('ayush-patient-language') || 'hi-IN'
    return CASE_TRANSLATIONS?.[language]?.[text] || text
  } catch {
    return text
  }
}

const PRAKRITI_QUESTIONS = [
  {
    key: 'prakritiTrait1',
    question: 'How would you describe your natural body build?',
    options: [
      ['vata', 'Lean / light build'],
      ['pitta', 'Medium / well-proportioned build'],
      ['kapha', 'Broad / sturdy build'],
    ],
  },
  {
    key: 'prakritiTrait2',
    question: 'What is your natural skin tendency?',
    options: [
      ['vata', 'Dry / tends to feel rough'],
      ['pitta', 'Warm / sensitive or prone to redness'],
      ['kapha', 'Soft / smooth or more oily'],
    ],
  },
  {
    key: 'prakritiTrait3',
    question: 'How is your natural appetite?',
    options: [
      ['vata', 'Variable / sometimes irregular'],
      ['pitta', 'Strong / becomes hungry regularly'],
      ['kapha', 'Steady but generally slower'],
    ],
  },
  {
    key: 'prakritiTrait4',
    question: 'What best describes your natural sleep pattern?',
    options: [
      ['vata', 'Light / easily disturbed'],
      ['pitta', 'Moderate / usually regular'],
      ['kapha', 'Deep / longer sleep'],
    ],
  },
  {
    key: 'prakritiTrait5',
    question: 'What is your usual activity and work pace?',
    options: [
      ['vata', 'Fast / energetic but variable'],
      ['pitta', 'Focused / goal-oriented'],
      ['kapha', 'Steady / slower and consistent'],
    ],
  },
  {
    key: 'prakritiTrait6',
    question: 'How do you usually respond to stress?',
    options: [
      ['vata', 'Worry / overthinking'],
      ['pitta', 'Irritation / intensity'],
      ['kapha', 'Calm / slower to react'],
    ],
  },
  {
    key: 'prakritiTrait7',
    question: 'Which climate do you naturally prefer?',
    options: [
      ['vata', 'Warm and comfortable'],
      ['pitta', 'Cool and less hot'],
      ['kapha', 'Warm and dry / active environment'],
    ],
  },
  {
    key: 'prakritiTrait8',
    question: 'How would you describe your natural communication style?',
    options: [
      ['vata', 'Quick / expressive / changes topics easily'],
      ['pitta', 'Direct / precise / confident'],
      ['kapha', 'Calm / measured / patient'],
    ],
  },
  {
    key: 'prakritiTrait9',
    question: 'How do you usually learn or make decisions?',
    options: [
      ['vata', 'Quickly, with changing ideas'],
      ['pitta', 'Analytically and decisively'],
      ['kapha', 'Slowly, carefully and consistently'],
    ],
  },
]

function calculatePrakritiScore(data) {
  const scores = { vata: 0, pitta: 0, kapha: 0 }

  PRAKRITI_QUESTIONS.forEach(({ key }) => {
    const answer = data?.[key]
    if (answer && scores[answer] !== undefined) {
      scores[answer] += 1
    }
  })

  const answered = scores.vata + scores.pitta + scores.kapha
  if (!answered) {
    return {
      answered: 0,
      total: PRAKRITI_QUESTIONS.length,
      scores,
      primary: '',
      secondary: '',
      profile: '',
    }
  }

  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1])
  const primary = ranked[0][0]
  const secondary = ranked[1][1] > 0 ? ranked[1][0] : ''

  return {
    answered,
    total: PRAKRITI_QUESTIONS.length,
    scores,
    primary,
    secondary,
    profile: secondary ? `${primary} - ${secondary}` : primary,
  }
}

function CaseTaking() {

  const { language: selectedLanguage } = usePatientLanguage()
  const speechLanguage = selectedLanguage === 'hinglish' ? 'en-IN' : selectedLanguage

  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [selectedAppointmentId] = useState(() =>
    sessionStorage.getItem('ayush-selected-appointment-id') || ''
  )
  const [selectedAppointmentDoctor] = useState(() =>
    sessionStorage.getItem('ayush-selected-appointment-doctor') || ''
  )
  const CONSENT_VERSION = 'AYUSH-CASE-CONSENT-v1.0'

  const [consent, setConsent] = useState(() => {
    try {
      const savedConsent = localStorage.getItem('ayush-case-consent')
      return savedConsent
        ? JSON.parse(savedConsent)
        : {
            given: false,
            consentAt: null,
            version: CONSENT_VERSION,
          }
    } catch (error) {
      console.error('Failed to load consent:', error)
      return {
        given: false,
        consentAt: null,
        version: CONSENT_VERSION,
      }
    }
  })


  useEffect(() => {
    try {
      localStorage.setItem('ayush-case-consent', JSON.stringify(consent))
    } catch (error) {
      console.error('Failed to save consent:', error)
    }
  }, [consent])

  const handleConsentChange = (checked) => {
    setConsent({
      given: checked,
      consentAt: checked ? new Date().toISOString() : null,
      version: CONSENT_VERSION,
    })
    setSubmitError('')
  }

  const navigate = useNavigate()
  const dispatch = useDispatch()
  const caseData = useSelector((state) => state.case)

  const [patientData, setPatientData] = useState(
    caseData.patientInformation || {}
  )

  const [complaintData, setComplaintData] = useState(
    caseData.chiefComplaint || {}
  )

  const [medicalHistoryData, setMedicalHistoryData] = useState(
    caseData.medicalHistory || {}
  )

  const [ayushData, setAyushData] = useState(
    caseData.ayushAssessment || {}
  )

  const totalSteps = 5

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm()

  const previousIllness = watch('previousIllness')
  const previousSurgery = watch('previousSurgery')
  const currentMedication = watch('currentMedication')
  const allergies = watch('allergies')
  const hospitalization = watch('hospitalization')

  const nextStep = () => {
    if (step < totalSteps) {
      setStep(step + 1)
    }
  }

  const previousStep = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  // Step 1
  
const onPatientSubmit = (data) => {
  setPatientData(data)

  dispatch(savePatientInformation(data))

  nextStep()
}



  // Step 2
  
const onComplaintSubmit = (data) => {
  setComplaintData(data)

  dispatch(saveChiefComplaint(data))

  nextStep()
}



  // Step 3
 
const onMedicalHistorySubmit = (data) => {
  setMedicalHistoryData(data)

  dispatch(saveMedicalHistory(data))

  nextStep()
}



  // Step 4
 
const onAyushSubmit = (data) => {
  const prakritiResult = calculatePrakritiScore(data)

  const enrichedAyushData = {
    ...data,
    prakritiScore: `Vata ${prakritiResult.scores.vata}/${prakritiResult.total} | Pitta ${prakritiResult.scores.pitta}/${prakritiResult.total} | Kapha ${prakritiResult.scores.kapha}/${prakritiResult.total}`,
    prakritiIndicativeProfile: prakritiResult.profile
      ? prakritiResult.profile.toUpperCase()
      : 'Not enough responses',
    prakritiQuestionsAnswered: `${prakritiResult.answered}/${prakritiResult.total}`,
    prakritiAssessmentMethod: 'Rule-based self-reported questionnaire; physician verification required',
  }

  setAyushData(enrichedAyushData)
  dispatch(saveAyushAssessment(enrichedAyushData))
  nextStep()
}

  // Final Submit
  const handleFinalSubmit = async () => {
    if (isSubmitting) return

    if (!selectedAppointmentId) {
      setSubmitError(
        'Please book and select a confirmed appointment before submitting your case.'
      )
      return
    }

    if (!consent.given) {
      setSubmitError(
        'Please provide consent before submitting your case.'
      )
      return
    }

    setIsSubmitting(true)
    setSubmitError('')

    const patientInformationWithConsent = {
      ...patientData,
      consentStatus: 'GIVEN',
      consentVersion: consent.version,
      consentAt: consent.consentAt,
      consentScope:
        'Patient data collection, medical document processing, AI-assisted case summarization, and healthcare professional review.',
    }

    const completeCase = {
      // IMPORTANT: appointmentId must be a top-level Case field.
      // Case.java exposes appointmentId as @Transient, so putting it
      // only inside patientInformation will not bind it in Spring.
      appointmentId: Number(selectedAppointmentId),
      patientInformation: formatSection({
        ...patientInformationWithConsent,
        appointmentId: selectedAppointmentId,
        assignedDoctor: selectedAppointmentDoctor || 'Selected appointment doctor',
      }),
      chiefComplaint: formatSection(complaintData),
      medicalHistory: formatSection(medicalHistoryData),
      ayushAssessment: formatSection(ayushData),
    }

    try {
      // Step 1: Save patient consent first.
      // The consent is intentionally saved before the case is created.
      // This ensures a failed consent request blocks case submission.
      const consentPayload = {
        caseId: null,
        consentVersion: consent.version || CONSENT_VERSION,
        consentGiven: true,
        consentScope:
          'Patient data collection, medical document processing, AI-assisted case summarization, and healthcare professional review.',
        consentAt: consent.consentAt || new Date().toISOString(),
      }

      const savedConsent = await apiRequest('/consents', {
        method: 'POST',
        body: JSON.stringify(consentPayload),
      })

      console.log('Patient consent saved to backend:', savedConsent)

      // Step 2: Only after consent succeeds, submit the patient case.
      const savedCase = await submitPatientCase(completeCase)

      console.log('Patient case saved to backend:', savedCase)

      dispatch(submitCase())
      sessionStorage.setItem('ayush-case-submitted', 'true')
      navigate('/patient/dashboard')
    } catch (error) {
      console.error('Patient case submission failed:', error)
      setSubmitError(
        error.message ||
          'Unable to save consent or submit your case. Please try again.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-100">

      {/* HEADER */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold text-slate-800">
            {tx('AYUSH Case Taking')}
          </h1>

          <p className="text-sm text-slate-500">
            {tx('Patient History & Assessment')}
          </p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">

        <LanguageSelector compact />

        {/* PROGRESS */}
        <div className="mb-8">

          <div className="flex justify-between mb-2">

            <span className="text-sm font-medium text-slate-700">
              {tx('Step')} {step} {tx('of')} {totalSteps}
            </span>

            <span className="text-sm text-slate-500">
              {Math.round((step / totalSteps) * 100)}%
            </span>

          </div>

          <div className="w-full bg-slate-200 rounded-full h-2">

            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{
                width: `${(step / totalSteps) * 100}%`,
              }}
            />

          </div>

        </div>

        {/* MAIN CARD */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">

          <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-4">
            {selectedAppointmentId ? (
              <>
                <p className="font-bold text-blue-900">Case linked to appointment #{selectedAppointmentId}</p>
                <p className="mt-1 text-sm text-blue-700">
                  {selectedAppointmentDoctor
                    ? `This case will automatically be sent to ${selectedAppointmentDoctor}.`
                    : 'This case will automatically be sent to the doctor selected in your appointment.'}
                </p>
              </>
            ) : (
              <>
                <p className="font-bold text-blue-900">Appointment required</p>
                <p className="mt-1 text-sm text-blue-700">Book an appointment with an approved doctor before submitting a new case.</p>
                <button
                  type="button"
                  onClick={() => navigate('/patient/appointments')}
                  className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700"
                >
                  Go to Appointments
                </button>
              </>
            )}
          </div>

          {/* ================================================= */}
          {/* STEP 1 */}
          {/* ================================================= */}

          {step === 1 && (
            <>
              <div className="mb-8">

                <p className="text-sm text-blue-600 font-semibold uppercase tracking-wide">
                  {tx('Step 1')}
                </p>

                <h2 className="text-2xl font-bold text-slate-800 mt-2">
                  {tx('Patient Basic Information')}
                </h2>

                <p className="text-slate-500 mt-2">
                  {tx('Please provide your basic information to begin the case-taking process.')}
                </p>

              </div>

              <form onSubmit={handleSubmit(onPatientSubmit)}>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  {/* Full Name */}
                  <div>

                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {tx('Full Name')}
                    </label>

                    <input
                      type="text"
                      placeholder={tx('Enter your full name')}
                      defaultValue={patientData.fullName || ''}
                      {...register('fullName', {
                        required: tx('Full name is required'),
                      })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    {errors.fullName && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.fullName.message}
                      </p>
                    )}

                  </div>

                  {/* Age */}
                  <div>

                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {tx('Age')}
                    </label>

                    <input
                      type="number"
                      placeholder={tx('Enter your age')}
                      defaultValue={patientData.age || ''}
                      {...register('age', {
                        required: tx('Age is required'),
                        min: {
                          value: 1,
                          message: tx('Age must be at least 1'),
                        },
                        max: {
                          value: 120,
                          message: tx('Please enter a valid age'),
                        },
                      })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    {errors.age && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.age.message}
                      </p>
                    )}

                  </div>

                  {/* Gender */}
                  <div>

                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {tx('Gender')}
                    </label>

                    <select
                      defaultValue={patientData.gender || ''}
                      {...register('gender', {
                        required: tx('Please select your gender'),
                      })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">{tx('Select gender')}</option>
                      <option value="male">{tx('Male')}</option>
                      <option value="female">{tx('Female')}</option>
                      <option value="other">{tx('Other')}</option>
                    </select>

                    {errors.gender && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.gender.message}
                      </p>
                    )}

                  </div>

                  {/* Mobile */}
                  <div>

                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {tx('Mobile Number')}
                    </label>

                    <input
                      type="tel"
                      placeholder={tx('Enter 10-digit mobile number')}
                      defaultValue={patientData.mobile || ''}
                      {...register('mobile', {
                        required: tx('Mobile number is required'),
                        pattern: {
                          value: /^[0-9]{10}$/,
                          message:
                            'Enter a valid 10-digit mobile number',
                        },
                      })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    {errors.mobile && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.mobile.message}
                      </p>
                    )}

                  </div>

                  {/* Blood Group */}
                  <div>

                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {tx('Blood Group')}
                    </label>

                    <select
                      defaultValue={patientData.bloodGroup || ''}
                      {...register('bloodGroup')}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">{tx('Select blood group')}</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>

                  </div>

                  {/* Height */}
                  <div>

                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {tx('Height (cm)')}
                    </label>

                    <input
                      type="number"
                      placeholder={tx('Enter height')}
                      defaultValue={patientData.height || ''}
                      {...register('height')}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    />

                  </div>

                  {/* Weight */}
                  <div>

                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {tx('Weight (kg)')}
                    </label>

                    <input
                      type="number"
                      placeholder={tx('Enter weight')}
                      defaultValue={patientData.weight || ''}
                      {...register('weight')}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    />

                  </div>

                </div>

                <div className="flex justify-end mt-8">

                  <button
                    type="submit"
                    className="px-8 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
                  >
                    {tx('Save & Continue')}
                  </button>

                </div>

              </form>
            </>
          )}

          {/* ================================================= */}
          {/* STEP 2 */}
          {/* ================================================= */}

          {step === 2 && (
            <>
              <div className="mb-8">

                <p className="text-sm text-blue-600 font-semibold uppercase tracking-wide">
                  {tx('Step 2')}
                </p>

                <h2 className="text-2xl font-bold text-slate-800 mt-2">
                  {tx('Chief Complaint & Symptoms')}
                </h2>

                <p className="text-slate-500 mt-2">
                  {tx('Tell us about the main health problem you are experiencing.')}
                </p>

              </div>

              <form onSubmit={handleSubmit(onComplaintSubmit)}>

                <div className="space-y-6">

                  <div>

                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {tx('What is your main health problem?')}
                    </label>

                    <textarea
                      rows="4"
                      placeholder={tx('Describe your main problem...')}
                      defaultValue={complaintData.mainComplaint || ''}
                      {...register('mainComplaint', {
                        required: tx('Please describe your main problem'),
                      })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg outline-none resize-none focus:ring-2 focus:ring-blue-500"
                    />

                    <VoiceInputButton
                      language={speechLanguage}
                      onTranscript={(text) =>
                        setValue('mainComplaint', text, {
                          shouldValidate: true,
                          shouldDirty: true,
                        })
                      }
                    />

                    {errors.mainComplaint && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.mainComplaint.message}
                      </p>
                    )}

                  </div>

                  <div>

                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {tx('Since when are you experiencing this problem?')}
                    </label>

                    <input
                      type="text"
                      placeholder={tx('Example: 5 days, 2 weeks, 3 months')}
                      defaultValue={complaintData.duration || ''}
                      {...register('duration', {
                        required: tx('Please enter the duration'),
                      })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    {errors.duration && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.duration.message}
                      </p>
                    )}

                  </div>

                  <div>

                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {tx('What symptoms are you experiencing?')}
                    </label>

                    <textarea
                      rows="4"
                      placeholder={tx('Example: fever, headache, cough, weakness...')}
                      defaultValue={complaintData.symptoms || ''}
                      {...register('symptoms', {
                        required: tx('Please describe your symptoms'),
                      })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg outline-none resize-none focus:ring-2 focus:ring-blue-500"
                    />

                    <VoiceInputButton
                      language={speechLanguage}
                      onTranscript={(text) =>
                        setValue('symptoms', text, {
                          shouldValidate: true,
                          shouldDirty: true,
                        })
                      }
                    />

                    {errors.symptoms && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.symptoms.message}
                      </p>
                    )}

                  </div>

                  <div>

                    <label className="block text-sm font-medium text-slate-700 mb-3">
                      {tx('Are you experiencing pain?')}
                    </label>

                    <div className="flex gap-6">

                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          value="yes"
                          defaultChecked={complaintData.hasPain === 'yes'}
                          {...register('hasPain', {
                            required: tx('Please select an option'),
                          })}
                        />
                        {tx('Yes')}
                      </label>

                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          value="no"
                          defaultChecked={complaintData.hasPain === 'no'}
                          {...register('hasPain', {
                            required: tx('Please select an option'),
                          })}
                        />
                        {tx('No')}
                      </label>

                    </div>

                    {errors.hasPain && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.hasPain.message}
                      </p>
                    )}

                  </div>

                  <div>

                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {tx('Pain Severity')}
                    </label>

                    <select
                      defaultValue={complaintData.painSeverity || ''}
                      {...register('painSeverity')}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">{tx('Select severity')}</option>
                      <option value="mild">{tx('Mild')}</option>
                      <option value="moderate">{tx('Moderate')}</option>
                      <option value="severe">{tx('Severe')}</option>
                    </select>

                  </div>

                  <div>

                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {tx('What makes your problem worse?')}
                    </label>

                    <textarea
                      rows="3"
                      defaultValue={complaintData.aggravatingFactors || ''}
                      {...register('aggravatingFactors')}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg outline-none resize-none focus:ring-2 focus:ring-blue-500"
                    />

                    <VoiceInputButton
                      language={speechLanguage}
                      onTranscript={(text) =>
                        setValue('aggravatingFactors', text, {
                          shouldValidate: true,
                          shouldDirty: true,
                        })
                      }
                    />

                  </div>

                  <div>

                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {tx('What gives you relief?')}
                    </label>

                    <textarea
                      rows="3"
                      defaultValue={complaintData.relievingFactors || ''}
                      {...register('relievingFactors')}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg outline-none resize-none focus:ring-2 focus:ring-blue-500"
                    />

                    <VoiceInputButton
                      language={speechLanguage}
                      onTranscript={(text) =>
                        setValue('relievingFactors', text, {
                          shouldValidate: true,
                          shouldDirty: true,
                        })
                      }
                    />

                  </div>

                  <div>

                    <label className="block text-sm font-medium text-slate-700 mb-3">
                      {tx('Have you taken any treatment for this problem before?')}
                    </label>

                    <div className="flex gap-6">

                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          value="yes"
                          defaultChecked={
                            complaintData.previousTreatment === 'yes'
                          }
                          {...register('previousTreatment')}
                        />
                        {tx('Yes')}
                      </label>

                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          value="no"
                          defaultChecked={
                            complaintData.previousTreatment === 'no'
                          }
                          {...register('previousTreatment')}
                        />
                        {tx('No')}
                      </label>

                    </div>

                  </div>

                </div>

                <div className="flex justify-between mt-8">

                  <button
                    type="button"
                    onClick={previousStep}
                    className="px-6 py-3 rounded-lg border border-slate-300 font-semibold text-slate-700 hover:bg-slate-50 transition"
                  >
                    {tx('Previous')}
                  </button>

                  <button
                    type="submit"
                    className="px-8 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
                  >
                    {tx('Save & Continue')}
                  </button>

                </div>

              </form>
            </>
          )}

          {/* ================================================= */}
          {/* STEP 3 */}
          {/* ================================================= */}

          {step === 3 && (
            <>
              <div className="mb-8">

                <p className="text-sm text-blue-600 font-semibold uppercase tracking-wide">
                  {tx('Step 3')}
                </p>

                <h2 className="text-2xl font-bold text-slate-800 mt-2">
                  {tx('Medical History')}
                </h2>

                <p className="text-slate-500 mt-2">
                  {tx('Tell us about your previous and current medical history.')}
                </p>

              </div>

              <form onSubmit={handleSubmit(onMedicalHistorySubmit)}>

                <div className="space-y-8">

                  {/* Previous Illness */}
                  <div>

                    <label className="block text-sm font-medium text-slate-700 mb-3">
                      {tx('Have you had any major illness in the past?')}
                    </label>

                    <div className="flex gap-6">

                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          value="yes"
                          defaultChecked={
                            medicalHistoryData.previousIllness === 'yes'
                          }
                          {...register('previousIllness', {
                            required: tx('Please select an option'),
                          })}
                        />
                        {tx('Yes')}
                      </label>

                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          value="no"
                          defaultChecked={
                            medicalHistoryData.previousIllness === 'no'
                          }
                          {...register('previousIllness', {
                            required: tx('Please select an option'),
                          })}
                        />
                        {tx('No')}
                      </label>

                    </div>

                    {errors.previousIllness && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.previousIllness.message}
                      </p>
                    )}

                    {previousIllness === 'yes' && (
                      <>
                      <textarea
                        rows="3"
                        defaultValue={
                          medicalHistoryData.previousIllnessDetails || ''
                        }
                        placeholder={tx('Mention previous illnesses...')}
                        {...register('previousIllnessDetails')}
                        className="mt-4 w-full px-4 py-3 border border-slate-300 rounded-lg outline-none resize-none focus:ring-2 focus:ring-blue-500"
                      />

                      <VoiceInputButton
                        language={speechLanguage}
                        onTranscript={(text) =>
                          setValue('previousIllnessDetails', text, {
                            shouldValidate: true,
                            shouldDirty: true,
                          })
                        }
                      />
                      </>
                    )}

                  </div>

                  {/* Surgery */}
                  <div>

                    <label className="block text-sm font-medium text-slate-700 mb-3">
                      {tx('Have you had any surgery in the past?')}
                    </label>

                    <div className="flex gap-6">

                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          value="yes"
                          defaultChecked={
                            medicalHistoryData.previousSurgery === 'yes'
                          }
                          {...register('previousSurgery', {
                            required: tx('Please select an option'),
                          })}
                        />
                        {tx('Yes')}
                      </label>

                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          value="no"
                          defaultChecked={
                            medicalHistoryData.previousSurgery === 'no'
                          }
                          {...register('previousSurgery', {
                            required: tx('Please select an option'),
                          })}
                        />
                        {tx('No')}
                      </label>

                    </div>

                    {errors.previousSurgery && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.previousSurgery.message}
                      </p>
                    )}

                    {previousSurgery === 'yes' && (
                      <>
                      <textarea
                        rows="3"
                        defaultValue={
                          medicalHistoryData.surgeryDetails || ''
                        }
                        placeholder={tx('Mention surgery name and approximate year...')}
                        {...register('surgeryDetails')}
                        className="mt-4 w-full px-4 py-3 border border-slate-300 rounded-lg outline-none resize-none focus:ring-2 focus:ring-blue-500"
                      />

                      <VoiceInputButton
                        language={speechLanguage}
                        onTranscript={(text) =>
                          setValue('surgeryDetails', text, {
                            shouldValidate: true,
                            shouldDirty: true,
                          })
                        }
                      />
                      </>
                    )}

                  </div>

                  {/* Medication */}
                  <div>

                    <label className="block text-sm font-medium text-slate-700 mb-3">
                      {tx('Are you currently taking any medicines?')}
                    </label>

                    <div className="flex gap-6">

                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          value="yes"
                          defaultChecked={
                            medicalHistoryData.currentMedication === 'yes'
                          }
                          {...register('currentMedication', {
                            required: tx('Please select an option'),
                          })}
                        />
                        {tx('Yes')}
                      </label>

                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          value="no"
                          defaultChecked={
                            medicalHistoryData.currentMedication === 'no'
                          }
                          {...register('currentMedication', {
                            required: tx('Please select an option'),
                          })}
                        />
                        {tx('No')}
                      </label>

                    </div>

                    {errors.currentMedication && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.currentMedication.message}
                      </p>
                    )}

                    {currentMedication === 'yes' && (
                      <>
                      <textarea
                        rows="3"
                        defaultValue={
                          medicalHistoryData.medicationDetails || ''
                        }
                        placeholder={tx('Mention medicine names and dosage if known...')}
                        {...register('medicationDetails')}
                        className="mt-4 w-full px-4 py-3 border border-slate-300 rounded-lg outline-none resize-none focus:ring-2 focus:ring-blue-500"
                      />

                      <VoiceInputButton
                        language={speechLanguage}
                        onTranscript={(text) =>
                          setValue('medicationDetails', text, {
                            shouldValidate: true,
                            shouldDirty: true,
                          })
                        }
                      />
                      </>
                    )}

                  </div>

                  {/* Allergies */}
                  <div>

                    <label className="block text-sm font-medium text-slate-700 mb-3">
                      {tx('Do you have any known allergies?')}
                    </label>

                    <div className="flex gap-6">

                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          value="yes"
                          defaultChecked={
                            medicalHistoryData.allergies === 'yes'
                          }
                          {...register('allergies', {
                            required: tx('Please select an option'),
                          })}
                        />
                        {tx('Yes')}
                      </label>

                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          value="no"
                          defaultChecked={
                            medicalHistoryData.allergies === 'no'
                          }
                          {...register('allergies', {
                            required: tx('Please select an option'),
                          })}
                        />
                        {tx('No')}
                      </label>

                    </div>

                    {errors.allergies && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.allergies.message}
                      </p>
                    )}

                    {allergies === 'yes' && (
                      <>
                      <textarea
                        rows="3"
                        defaultValue={
                          medicalHistoryData.allergyDetails || ''
                        }
                        placeholder={tx('Mention your allergies...')}
                        {...register('allergyDetails')}
                        className="mt-4 w-full px-4 py-3 border border-slate-300 rounded-lg outline-none resize-none focus:ring-2 focus:ring-blue-500"
                      />

                      <VoiceInputButton
                        language={speechLanguage}
                        onTranscript={(text) =>
                          setValue('allergyDetails', text, {
                            shouldValidate: true,
                            shouldDirty: true,
                          })
                        }
                      />
                      </>
                    )}

                  </div>

                  {/* Hospitalization */}
                  <div>

                    <label className="block text-sm font-medium text-slate-700 mb-3">
                      {tx('Have you ever been hospitalized?')}
                    </label>

                    <div className="flex gap-6">

                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          value="yes"
                          defaultChecked={
                            medicalHistoryData.hospitalization === 'yes'
                          }
                          {...register('hospitalization', {
                            required: tx('Please select an option'),
                          })}
                        />
                        {tx('Yes')}
                      </label>

                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          value="no"
                          defaultChecked={
                            medicalHistoryData.hospitalization === 'no'
                          }
                          {...register('hospitalization', {
                            required: tx('Please select an option'),
                          })}
                        />
                        {tx('No')}
                      </label>

                    </div>

                    {errors.hospitalization && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.hospitalization.message}
                      </p>
                    )}

                    {hospitalization === 'yes' && (
                      <>
                      <textarea
                        rows="3"
                        defaultValue={
                          medicalHistoryData.hospitalizationDetails || ''
                        }
                        placeholder={tx('Mention reason and approximate year...')}
                        {...register('hospitalizationDetails')}
                        className="mt-4 w-full px-4 py-3 border border-slate-300 rounded-lg outline-none resize-none focus:ring-2 focus:ring-blue-500"
                      />

                      <VoiceInputButton
                        language={speechLanguage}
                        onTranscript={(text) =>
                          setValue('hospitalizationDetails', text, {
                            shouldValidate: true,
                            shouldDirty: true,
                          })
                        }
                      />
                      </>
                    )}

                  </div>

                  {/* Family History */}
                  <div>

                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {tx('Family Medical History')}
                    </label>

                    <textarea
                      rows="3"
                      defaultValue={medicalHistoryData.familyHistory || ''}
                      {...register('familyHistory')}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg outline-none resize-none focus:ring-2 focus:ring-blue-500"
                    />

                    <VoiceInputButton
                      language={speechLanguage}
                      onTranscript={(text) =>
                        setValue('familyHistory', text, {
                          shouldValidate: true,
                          shouldDirty: true,
                        })
                      }
                    />

                  </div>

                  {/* Lifestyle */}
                  <div>

                    <h3 className="text-lg font-semibold text-slate-800 mb-4">
                      {tx('Lifestyle Information')}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                      <div>

                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          {tx('Smoking')}
                        </label>

                        <select
                          defaultValue={
                            medicalHistoryData.smoking || ''
                          }
                          {...register('smoking')}
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">{tx('Select')}</option>
                          <option value="never">Never</option>
                          <option value="occasionally">Occasionally</option>
                          <option value="regularly">Regularly</option>
                        </select>

                      </div>

                      <div>

                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          {tx('Alcohol Consumption')}
                        </label>

                        <select
                          defaultValue={
                            medicalHistoryData.alcohol || ''
                          }
                          {...register('alcohol')}
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">{tx('Select')}</option>
                          <option value="never">Never</option>
                          <option value="occasionally">Occasionally</option>
                          <option value="regularly">Regularly</option>
                        </select>

                      </div>

                      <div>

                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          {tx('Sleep Quality')}
                        </label>

                        <select
                          defaultValue={
                            medicalHistoryData.sleep || ''
                          }
                          {...register('sleep')}
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">{tx('Select')}</option>
                          <option value="good">Good</option>
                          <option value="average">Average</option>
                          <option value="poor">Poor</option>
                        </select>

                      </div>

                      <div>

                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          {tx('Appetite')}
                        </label>

                        <select
                          defaultValue={
                            medicalHistoryData.appetite || ''
                          }
                          {...register('appetite')}
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">{tx('Select')}</option>
                          <option value="good">Good</option>
                          <option value="average">Average</option>
                          <option value="poor">Poor</option>
                        </select>

                      </div>

                      <div className="md:col-span-2">

                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          {tx('Bowel Habits')}
                        </label>

                        <select
                          defaultValue={
                            medicalHistoryData.bowelHabits || ''
                          }
                          {...register('bowelHabits')}
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">{tx('Select')}</option>
                          <option value="regular">{tx('Regular')}</option>
                          <option value="constipation">
                            {tx('Constipation')}
                          </option>
                          <option value="loose_stools">
                            {tx('Loose Stools')}
                          </option>
                          <option value="irregular">
                            {tx('Irregular')}
                          </option>
                        </select>

                      </div>

                    </div>

                  </div>

                  {/* Additional */}
                  <div>

                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {tx('Any Other Important Medical Information')}
                    </label>

                    <textarea
                      rows="4"
                      defaultValue={
                        medicalHistoryData.additionalInformation || ''
                      }
                      {...register('additionalInformation')}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg outline-none resize-none focus:ring-2 focus:ring-blue-500"
                    />

                    <VoiceInputButton
                      language={speechLanguage}
                      onTranscript={(text) =>
                        setValue('additionalInformation', text, {
                          shouldValidate: true,
                          shouldDirty: true,
                        })
                      }
                    />

                  </div>

                </div>

                <div className="flex justify-between mt-8">

                  <button
                    type="button"
                    onClick={previousStep}
                    className="px-6 py-3 rounded-lg border border-slate-300 font-semibold text-slate-700 hover:bg-slate-50 transition"
                  >
                    {tx('Previous')}
                  </button>

                  <button
                    type="submit"
                    className="px-8 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
                  >
                    {tx('Save & Continue')}
                  </button>

                </div>

              </form>
            </>
          )}

          {/* ================================================= */}
          {/* STEP 4 */}
          {/* ================================================= */}

          {step === 4 && (
            <>
              <div className="mb-8">

                <p className="text-sm text-blue-600 font-semibold uppercase tracking-wide">
                  {tx('Step 4')}
                </p>

                <h2 className="text-2xl font-bold text-slate-800 mt-2">
                  {tx('AYUSH Assessment')}
                </h2>

                <p className="text-slate-500 mt-2">
                  {tx('Please provide information related to your Ayurveda assessment.')}
                </p>

              </div>

              <form onSubmit={handleSubmit(onAyushSubmit)}>

                <div className="space-y-8">

                  {/* Prakriti */}
                  <div>

                    <h3 className="text-lg font-semibold text-slate-800">
                      {tx('Prakriti')}
                    </h3>

                    <p className="text-sm text-slate-500 mt-1 mb-4">
                      {tx('Select the Prakriti type if it is already known.')}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                      {['vata', 'pitta', 'kapha'].map((type) => (
                        <label
                          key={type}
                          className="border border-slate-300 rounded-xl p-4 cursor-pointer hover:border-blue-500"
                        >
                          <input
                            type="radio"
                            value={type}
                            defaultChecked={
                              ayushData.prakriti === type
                            }
                            {...register('prakriti', {
                              required: 'Please select Prakriti',
                            })}
                            className="mr-2"
                          />

                          <span className="font-medium capitalize">
                            {type}
                          </span>

                        </label>
                      ))}

                    </div>

                    {errors.prakriti && (
                      <p className="text-red-500 text-sm mt-2">
                        {errors.prakriti.message}
                      </p>
                    )}

                  </div>

                  {/* Prakriti Questionnaire */}
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 md:p-6">
                    <div className="flex items-start gap-3 mb-5">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-lg">
                        🌿
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-800">
                          {tx('Prakriti Questionnaire')}
                        </h3>
                        <p className="text-sm text-slate-600 mt-1">
                          {tx('Answer based on your natural, long-term tendencies. This creates an indicative Vata/Pitta/Kapha profile for physician review.')}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      {PRAKRITI_QUESTIONS.map((item, index) => (
                        <div key={item.key} className="bg-white rounded-xl border border-slate-200 p-4">
                          <p className="font-medium text-slate-800 mb-3">
                            {index + 1}. {tx(item.question)}
                          </p>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {item.options.map(([value, label]) => (
                              <label
                                key={value}
                                className="flex items-start gap-2 rounded-xl border border-slate-200 p-3 cursor-pointer hover:border-emerald-400 hover:bg-emerald-50 transition"
                              >
                                <input
                                  type="radio"
                                  value={value}
                                  defaultChecked={ayushData[item.key] === value}
                                  {...register(item.key)}
                                  className="mt-1"
                                />
                                <span className="text-sm text-slate-700">
                                  {tx(label)}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-5 rounded-xl bg-white border border-emerald-200 p-4">
                      <p className="text-sm font-semibold text-emerald-800">
                        {tx('Assessment note')}
                      </p>
                      <p className="text-xs text-slate-600 mt-1">
                        This is a prototype screening aid based on self-reported responses. It is not a diagnosis or a substitute for an Ayurvedic physician's assessment.
                      </p>
                    </div>
                  </div>

                  {/* Vikriti */}
                  <div>

                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {tx('Vikriti / Current Imbalance')}
                    </label>

                    <textarea
                      rows="4"
                      defaultValue={ayushData.vikriti || ''}
                      placeholder={tx('Describe current imbalance or symptoms if known...')}
                      {...register('vikriti')}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg outline-none resize-none focus:ring-2 focus:ring-blue-500"
                    />

                      <VoiceInputButton
                        language={speechLanguage}
                        onTranscript={(text) =>
                          setValue('vikriti', text, {
                            shouldValidate: true,
                            shouldDirty: true,
                          })
                        }
                      />


                  </div>

                  {/* Agni */}
                  <div>

                    <label className="block text-sm font-medium text-slate-700 mb-3">
                      {tx('Agni')}
                    </label>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                      {[
                        ['sama', 'Sama'],
                        ['manda', 'Manda'],
                        ['tikshna', 'Tikshna'],
                        ['vishama', 'Vishama'],
                      ].map(([value, label]) => (
                        <label
                          key={value}
                          className="border border-slate-300 rounded-xl p-4 cursor-pointer hover:border-blue-500"
                        >
                          <input
                            type="radio"
                            value={value}
                            defaultChecked={
                              ayushData.agni === value
                            }
                            {...register('agni', {
                              required: tx('Please select Agni'),
                            })}
                            className="mr-2"
                          />

                          {tx(label)}

                        </label>
                      ))}

                    </div>

                    {errors.agni && (
                      <p className="text-red-500 text-sm mt-2">
                        {errors.agni.message}
                      </p>
                    )}

                  </div>

                  {/* Koshtha */}
                  <div>

                    <label className="block text-sm font-medium text-slate-700 mb-3">
                      {tx('Koshtha')}
                    </label>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                      {[
                        ['mridu', 'Mridu'],
                        ['madhyama', 'Madhyama'],
                        ['krura', 'Krura'],
                      ].map(([value, label]) => (
                        <label
                          key={value}
                          className="border border-slate-300 rounded-xl p-4 cursor-pointer hover:border-blue-500"
                        >
                          <input
                            type="radio"
                            value={value}
                            defaultChecked={
                              ayushData.koshtha === value
                            }
                            {...register('koshtha', {
                              required: tx('Please select Koshtha'),
                            })}
                            className="mr-2"
                          />

                          {tx(label)}

                        </label>
                      ))}

                    </div>

                    {errors.koshtha && (
                      <p className="text-red-500 text-sm mt-2">
                        {errors.koshtha.message}
                      </p>
                    )}

                  </div>

                  {/* Ahara */}
                  <div>

                    <h3 className="text-lg font-semibold text-slate-800 mb-4">
                      {tx('Ahara - Dietary Habits')}
                    </h3>

                    <div className="space-y-5">

                      <div>

                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          {tx('How many meals do you usually take in a day?')}
                        </label>

                        <select
                          defaultValue={
                            ayushData.mealFrequency || ''
                          }
                          {...register('mealFrequency')}
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">{tx('Select')}</option>
                          <option value="1">{tx('1 meal')}</option>
                          <option value="2">{tx('2 meals')}</option>
                          <option value="3">{tx('3 meals')}</option>
                          <option value="4_plus">
                            {tx('4 or more meals')}
                          </option>
                        </select>

                      </div>

                      <div>

                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          {tx('Describe your usual diet')}
                        </label>

                        <textarea
                          rows="3"
                          defaultValue={ayushData.dietDetails || ''}
                          {...register('dietDetails')}
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg outline-none resize-none focus:ring-2 focus:ring-blue-500"
                        />

                          <VoiceInputButton
                            language={speechLanguage}
                            onTranscript={(text) =>
                              setValue('dietDetails', text, {
                                shouldValidate: true,
                                shouldDirty: true,
                              })
                            }
                          />


                      </div>

                    </div>

                  </div>

                  {/* Vihara */}
                  <div>

                    <h3 className="text-lg font-semibold text-slate-800 mb-4">
                      {tx('Vihara - Daily Routine')}
                    </h3>

                    <div className="space-y-5">

                      <div>

                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          {tx('Physical Activity')}
                        </label>

                        <select
                          defaultValue={
                            ayushData.physicalActivity || ''
                          }
                          {...register('physicalActivity')}
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">{tx('Select')}</option>
                          <option value="low">{tx('Low')}</option>
                          <option value="moderate">{tx('Moderate')}</option>
                          <option value="high">{tx('High')}</option>
                        </select>

                      </div>

                      <div>

                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          {tx('Describe your daily routine')}
                        </label>

                        <textarea
                          rows="4"
                          defaultValue={ayushData.dailyRoutine || ''}
                          {...register('dailyRoutine')}
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg outline-none resize-none focus:ring-2 focus:ring-blue-500"
                        />

                          <VoiceInputButton
                            language={speechLanguage}
                            onTranscript={(text) =>
                              setValue('dailyRoutine', text, {
                                shouldValidate: true,
                                shouldDirty: true,
                              })
                            }
                          />


                      </div>

                    </div>

                  </div>

                  {/* Nidana */}
                  <div>

                    <h3 className="text-lg font-semibold text-slate-800">
                      {tx('Nidana - Reported Causative / Trigger Factors')}
                    </h3>

                    <p className="text-sm text-slate-500 mt-1 mb-4">
                      {tx('Record patient-reported or physician-identified factors that may be relevant to the current complaint.')}
                    </p>

                    <textarea
                      rows="4"
                      defaultValue={ayushData.nidana || ''}
                      placeholder={tx('Enter reported triggers, dietary/lifestyle factors, environmental factors or other relevant observations...')}
                      {...register('nidana')}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg outline-none resize-none focus:ring-2 focus:ring-blue-500"
                    />

                    <VoiceInputButton
                      language={speechLanguage}
                      onTranscript={(text) =>
                        setValue('nidana', text, {
                          shouldValidate: true,
                          shouldDirty: true,
                        })
                      }
                    />

                  </div>

                  {/* Samprapti */}
                  <div>

                    <h3 className="text-lg font-semibold text-slate-800">
                      {tx('Samprapti - Clinical Process Notes')}
                    </h3>

                    <p className="text-sm text-slate-500 mt-1 mb-4">
                      {tx('Capture available physician observations about the reported progression or clinical process.')}
                    </p>

                    <textarea
                      rows="5"
                      defaultValue={ayushData.samprapti || ''}
                      placeholder={tx('Enter available Samprapti observations for physician review...')}
                      {...register('samprapti')}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg outline-none resize-none focus:ring-2 focus:ring-blue-500"
                    />

                    <VoiceInputButton
                      language={speechLanguage}
                      onTranscript={(text) =>
                        setValue('samprapti', text, {
                          shouldValidate: true,
                          shouldDirty: true,
                        })
                      }
                    />

                  </div>

                  {/* Dashavidha */}
                  <div>

                    <h3 className="text-lg font-semibold text-slate-800">
                      {tx('Dashavidha Pariksha')}
                    </h3>

                    <p className="text-sm text-slate-500 mt-1 mb-4">
                      Additional assessment observations can be
                      entered here for physician review.
                    </p>

                    <textarea
                      rows="6"
                      defaultValue={
                        ayushData.dashavidhaPariksha || ''
                      }
                      placeholder={tx('Enter available Dashavidha Pariksha observations...')}
                      {...register('dashavidhaPariksha')}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg outline-none resize-none focus:ring-2 focus:ring-blue-500"
                    />

                      <VoiceInputButton
                        language={speechLanguage}
                        onTranscript={(text) =>
                          setValue('dashavidhaPariksha', text, {
                            shouldValidate: true,
                            shouldDirty: true,
                          })
                        }
                      />


                  </div>

                </div>

                <div className="flex justify-between mt-8">

                  <button
                    type="button"
                    onClick={previousStep}
                    className="px-6 py-3 rounded-lg border border-slate-300 font-semibold text-slate-700 hover:bg-slate-50 transition"
                  >
                    {tx('Previous')}
                  </button>

                  <button
                    type="submit"
                    className="px-8 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
                  >
                    {tx('Review Case')}
                  </button>

                </div>

              </form>
            </>
          )}

          {/* ================================================= */}
          {/* STEP 5 - REVIEW */}
          {/* ================================================= */}

          {step === 5 && (
            <>
              <div className="mb-8">

                <p className="text-sm text-blue-600 font-semibold uppercase tracking-wide">
                  {tx('Step 5')}
                </p>

                <h2 className="text-2xl font-bold text-slate-800 mt-2">
                  {tx('Review & Submit')}
                </h2>

                <p className="text-slate-500 mt-2">
                  Please review all information before submitting
                  your case to the doctor.
                </p>

              </div>

              <div className="space-y-6">

                {/* Patient Information */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">

                  <div className="bg-slate-50 px-5 py-4 flex items-center justify-between">

                    <h3 className="font-semibold text-slate-800">
                      👤 Patient Information
                    </h3>

                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="text-blue-600 font-medium hover:underline"
                    >
                      {tx('Edit')}
                    </button>

                  </div>

                  <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">

                    <ReviewItem
                      label="Full Name"
                      value={patientData.fullName}
                    />

                    <ReviewItem
                      label="Age"
                      value={patientData.age}
                    />

                    <ReviewItem
                      label="Gender"
                      value={patientData.gender}
                    />

                    <ReviewItem
                      label="Mobile"
                      value={patientData.mobile}
                    />

                    <ReviewItem
                      label="Blood Group"
                      value={patientData.bloodGroup}
                    />

                    <ReviewItem
                      label="Height"
                      value={
                        patientData.height
                          ? `${patientData.height} cm`
                          : ''
                      }
                    />

                    <ReviewItem
                      label="Weight"
                      value={
                        patientData.weight
                          ? `${patientData.weight} kg`
                          : ''
                      }
                    />

                  </div>

                </div>

                {/* Complaint */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">

                  <div className="bg-slate-50 px-5 py-4 flex items-center justify-between">

                    <h3 className="font-semibold text-slate-800">
                      🩺 Chief Complaint & Symptoms
                    </h3>

                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="text-blue-600 font-medium hover:underline"
                    >
                      {tx('Edit')}
                    </button>

                  </div>

                  <div className="p-5 space-y-4">

                    <ReviewItem
                      label="Main Complaint"
                      value={complaintData.mainComplaint}
                    />

                    <ReviewItem
                      label="Duration"
                      value={complaintData.duration}
                    />

                    <ReviewItem
                      label="Symptoms"
                      value={complaintData.symptoms}
                    />

                    <ReviewItem
                      label="Pain"
                      value={complaintData.hasPain}
                    />

                    <ReviewItem
                      label="Pain Severity"
                      value={complaintData.painSeverity}
                    />

                    <ReviewItem
                      label="Aggravating Factors"
                      value={complaintData.aggravatingFactors}
                    />

                    <ReviewItem
                      label="Relieving Factors"
                      value={complaintData.relievingFactors}
                    />

                    <ReviewItem
                      label="Previous Treatment"
                      value={complaintData.previousTreatment}
                    />

                  </div>

                </div>

                {/* Medical History */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">

                  <div className="bg-slate-50 px-5 py-4 flex items-center justify-between">

                    <h3 className="font-semibold text-slate-800">
                      📋 Medical History
                    </h3>

                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="text-blue-600 font-medium hover:underline"
                    >
                      {tx('Edit')}
                    </button>

                  </div>

                  <div className="p-5 space-y-4">

                    <ReviewItem
                      label="Previous Major Illness"
                      value={medicalHistoryData.previousIllness}
                    />

                    {medicalHistoryData.previousIllnessDetails && (
                      <ReviewItem
                        label="Illness Details"
                        value={
                          medicalHistoryData.previousIllnessDetails
                        }
                      />
                    )}

                    <ReviewItem
                      label="Previous Surgery"
                      value={medicalHistoryData.previousSurgery}
                    />

                    {medicalHistoryData.surgeryDetails && (
                      <ReviewItem
                        label="Surgery Details"
                        value={medicalHistoryData.surgeryDetails}
                      />
                    )}

                    <ReviewItem
                      label="Current Medication"
                      value={medicalHistoryData.currentMedication}
                    />

                    {medicalHistoryData.medicationDetails && (
                      <ReviewItem
                        label="Medication Details"
                        value={
                          medicalHistoryData.medicationDetails
                        }
                      />
                    )}

                    <ReviewItem
                      label="Allergies"
                      value={medicalHistoryData.allergies}
                    />

                    {medicalHistoryData.allergyDetails && (
                      <ReviewItem
                        label="Allergy Details"
                        value={medicalHistoryData.allergyDetails}
                      />
                    )}

                    <ReviewItem
                      label="Hospitalization"
                      value={medicalHistoryData.hospitalization}
                    />

                    {medicalHistoryData.hospitalizationDetails && (
                      <ReviewItem
                        label="Hospitalization Details"
                        value={
                          medicalHistoryData.hospitalizationDetails
                        }
                      />
                    )}

                    <ReviewItem
                      label="Family Medical History"
                      value={medicalHistoryData.familyHistory}
                    />

                    <ReviewItem
                      label="Smoking"
                      value={medicalHistoryData.smoking}
                    />

                    <ReviewItem
                      label="Alcohol"
                      value={medicalHistoryData.alcohol}
                    />

                    <ReviewItem
                      label="Sleep"
                      value={medicalHistoryData.sleep}
                    />

                    <ReviewItem
                      label="Appetite"
                      value={medicalHistoryData.appetite}
                    />

                    <ReviewItem
                      label="Bowel Habits"
                      value={medicalHistoryData.bowelHabits}
                    />

                    <ReviewItem
                      label="Additional Information"
                      value={
                        medicalHistoryData.additionalInformation
                      }
                    />

                  </div>

                </div>

                {/* AYUSH */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">

                  <div className="bg-slate-50 px-5 py-4 flex items-center justify-between">

                    <h3 className="font-semibold text-slate-800">
                      🌿 AYUSH Assessment
                    </h3>

                    <button
                      type="button"
                      onClick={() => setStep(4)}
                      className="text-blue-600 font-medium hover:underline"
                    >
                      {tx('Edit')}
                    </button>

                  </div>

                  <div className="p-5 space-y-4">

                    <ReviewItem
                      label="Prakriti"
                      value={ayushData.prakriti}
                    />

                    <ReviewItem
                      label="Prakriti Questionnaire Score"
                      value={ayushData.prakritiScore}
                    />

                    <ReviewItem
                      label="Indicative Prakriti Profile"
                      value={ayushData.prakritiIndicativeProfile}
                    />

                    <ReviewItem
                      label="Questionnaire Responses"
                      value={ayushData.prakritiQuestionsAnswered}
                    />

                    <ReviewItem
                      label="Vikriti"
                      value={ayushData.vikriti}
                    />

                    <ReviewItem
                      label="Agni"
                      value={ayushData.agni}
                    />

                    <ReviewItem
                      label="Koshtha"
                      value={ayushData.koshtha}
                    />

                    <ReviewItem
                      label="Meal Frequency"
                      value={ayushData.mealFrequency}
                    />

                    <ReviewItem
                      label="Diet Details"
                      value={ayushData.dietDetails}
                    />

                    <ReviewItem
                      label="Physical Activity"
                      value={ayushData.physicalActivity}
                    />

                    <ReviewItem
                      label="Daily Routine"
                      value={ayushData.dailyRoutine}
                    />

                    <ReviewItem
                      label="Dashavidha Pariksha"
                      value={ayushData.dashavidhaPariksha}
                    />

                  </div>

                </div>

              </div>

              {/* Submit Area */}
              <div className="mt-8 bg-blue-50 border border-blue-100 rounded-xl p-5">

                <div className="flex gap-3">

                  <span className="text-xl">
                    ℹ️
                  </span>

                  <div>

                    <h3 className="font-semibold text-slate-800">
                      {tx('Before submitting')}
                    </h3>

                    <p className="text-sm text-slate-600 mt-1">
                      Please make sure the information provided is
                      accurate. The final clinical assessment will
                      be reviewed and verified by a qualified
                      healthcare professional.
                    </p>

                  </div>

                </div>

              </div>

              {/* Consent & Privacy */}
              <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-lg shrink-0">
                    🔒
                  </div>

                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-800">
                      {tx('Patient Consent & Privacy')}
                    </h3>

                    <p className="text-sm text-slate-600 mt-1">
                      {tx('Your consent is required before this case can be submitted to the healthcare professional.')}
                    </p>

                    <div className="mt-4 space-y-3 text-sm text-slate-700">
                      <div className="flex gap-2">
                        <span>•</span>
                        <span>
                          {tx('I understand that the information I provide will be collected for patient case-taking and healthcare review.')}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <span>•</span>
                        <span>
                          {tx('I understand that uploaded medical documents may be processed to extract relevant information for the case record.')}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <span>•</span>
                        <span>
                          {tx('I understand that AI may assist with information extraction and case summarization, but AI output is not a diagnosis or final clinical decision.')}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <span>•</span>
                        <span>
                          {tx('I understand that a qualified healthcare professional must review and verify the case before making clinical decisions.')}
                        </span>
                      </div>
                    </div>

                    <label className="mt-5 flex items-start gap-3 cursor-pointer rounded-xl border border-emerald-200 bg-white p-4 hover:border-emerald-400 transition">
                      <input
                        type="checkbox"
                        checked={consent.given}
                        onChange={(event) =>
                          handleConsentChange(event.target.checked)
                        }
                        className="mt-1 h-5 w-5 accent-emerald-600"
                      />

                      <span className="text-sm font-medium text-slate-800">
                        {tx('I have read and understood the above information and voluntarily consent to the collection and processing of my case information for this healthcare workflow.')}
                      </span>
                    </label>

                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 font-semibold ${
                          consent.given
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {consent.given
                          ? '✓ Consent Given'
                          : tx('Consent Required')}
                      </span>

                      <span className="text-slate-500">
                        Consent version: {CONSENT_VERSION}
                      </span>

                      {consent.consentAt && (
                        <span className="text-slate-500">
                          Recorded:{' '}
                          {new Date(consent.consentAt).toLocaleString()}
                        </span>
                      )}
                    </div>

                    <p className="mt-3 text-xs text-slate-500">
                      Prototype privacy notice: this consent flow records the
                      user's consent status and timestamp in the application
                      and attaches the consent metadata to the submitted case
                      information. Full legal/privacy compliance requires
                      deployment-specific policies and controls.
                    </p>
                  </div>
                </div>
              </div>

              {submitError && (
                <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4">
                  <p className="text-sm font-semibold text-red-700">
                    {tx('Submission failed')}
                  </p>
                  <p className="text-sm text-red-600 mt-1">
                    {submitError}
                  </p>
                </div>
              )}

              <div className="flex justify-between mt-8">

                <button
                  type="button"
                  onClick={previousStep}
                  className="px-6 py-3 rounded-lg border border-slate-300 font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  {tx('Previous')}
                </button>

                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={isSubmitting || !consent.given}
                  className="px-8 py-3 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting
                    ? tx('Submitting...')
                    : consent.given
                      ? tx('Submit Case')
                      : tx('Give Consent to Submit')}
                </button>

              </div>

            </>
          )}

        </div>

      </main>

    </div>
  )
}

/* ================================================= */
/* BACKEND PAYLOAD FORMATTER */
/* ================================================= */

function formatSection(data) {
  if (!data || typeof data !== 'object') {
    return data ? String(data) : 'Not provided'
  }

  const entries = Object.entries(data).filter(
    ([, value]) => value !== undefined && value !== null && value !== ''
  )

  if (entries.length === 0) {
    return 'Not provided'
  }

  return entries
    .map(([key, value]) => {
      const label = key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (char) => char.toUpperCase())

      return `${tx(label)}: ${String(value)}`
    })
    .join('\n')
}

/* ================================================= */
/* REVIEW ITEM COMPONENT */
/* ================================================= */

function ReviewItem({ label, value }) {
  if (!value) {
    return null
  }

  return (
    <div>
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
        {tx(label)}
      </p>

      <p className="text-slate-800 mt-1 whitespace-pre-wrap">
        {String(value)}
      </p>
    </div>
  )
}

export default CaseTaking

