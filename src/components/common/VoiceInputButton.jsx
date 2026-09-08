import { useEffect, useRef, useState } from 'react'

const LANGUAGE_LABELS = {
  'hi-IN': 'Hindi',
  'en-IN': 'English',
  hinglish: 'Hinglish',
  'bn-IN': 'Bengali',
  'mr-IN': 'Marathi',
  'te-IN': 'Telugu',
  'ta-IN': 'Tamil',
  'gu-IN': 'Gujarati',
  'kn-IN': 'Kannada',
  'ml-IN': 'Malayalam',
  'pa-IN': 'Punjabi',
  'or-IN': 'Odia',
  'as-IN': 'Assamese',
}

function VoiceInputButton({ onTranscript, language }) {
  const recognitionRef = useRef(null)
  const streamRef = useRef(null)
  const finalTextRef = useRef('')

  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState('')
  const [micStatus, setMicStatus] = useState('')

  const selectedLanguage =
    language || localStorage.getItem('ayush-patient-language') || 'hi-IN'

  const speechLanguage =
    selectedLanguage === 'hinglish' ? 'hi-IN' : selectedLanguage

  const languageLabel =
    LANGUAGE_LABELS[selectedLanguage] || 'Indian language'

  const cleanupStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop()
        } catch {}
      })
      streamRef.current = null
    }
  }

  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.stop?.()
      } catch {}

      recognitionRef.current = null
      cleanupStream()
    }
  }, [])

  const checkMicrophonePermission = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error(
        'Microphone access is not supported by this browser.'
      )
    }

    setMicStatus('Checking microphone...')

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      })

      streamRef.current = stream
      setMicStatus('Microphone access granted.')

      // We only need the permission check here.
      // SpeechRecognition will handle the actual speech input.
      cleanupStream()

      return true
    } catch (micError) {
      console.error('Microphone permission/access error:', micError)

      const name = micError?.name || ''

      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        setError(
          'Microphone access is blocked. Please click the lock/site-settings icon near the address bar and set Microphone to Allow.'
        )
      } else if (name === 'NotFoundError') {
        setError(
          'No microphone was found. Please connect or enable a microphone.'
        )
      } else if (name === 'NotReadableError') {
        setError(
          'Microphone is busy or cannot be accessed. Close other apps using the microphone and try again.'
        )
      } else if (name === 'SecurityError') {
        setError(
          'Browser security blocked microphone access. Please use Chrome/Edge on localhost.'
        )
      } else {
        setError(
          `Microphone access failed${name ? ` (${name})` : ''}. Please check your browser microphone settings.`
        )
      }

      setMicStatus('')
      return false
    }
  }

  const startRecognition = async () => {
    if (isRecording) return

    setError('')
    setMicStatus('')

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognition) {
      setError(
        'Voice recognition is not supported in this browser. Please use Chrome or Edge.'
      )
      return
    }

    // First verify that the browser can actually access the microphone.
    const microphoneReady = await checkMicrophonePermission()

    if (!microphoneReady) {
      return
    }

    const recognition = new SpeechRecognition()

    recognition.lang = speechLanguage
    recognition.continuous = true
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    finalTextRef.current = ''

    recognition.onstart = () => {
      recognitionRef.current = recognition
      setIsRecording(true)
      setError('')
      setMicStatus('Microphone active. Speak now...')
    }

    recognition.onresult = (event) => {
      let interimText = ''

      for (
        let index = event.resultIndex;
        index < event.results.length;
        index += 1
      ) {
        const text =
          event.results[index][0]?.transcript?.trim() || ''

        if (!text) continue

        if (event.results[index].isFinal) {
          finalTextRef.current =
            `${finalTextRef.current}${finalTextRef.current ? ' ' : ''}${text}`
        } else {
          interimText =
            `${interimText}${interimText ? ' ' : ''}${text}`
        }
      }

      const combinedText =
        `${finalTextRef.current}${interimText ? `${finalTextRef.current ? ' ' : ''}${interimText}` : ''}`.trim()

      setTranscript(combinedText)

      // Keep the actual React Hook Form field synchronized.
      if (combinedText) {
        onTranscript?.(combinedText)
      }
    }

    recognition.onerror = (event) => {
      console.error('SpeechRecognition error:', event.error, event)

      const messages = {
        'not-allowed':
          'Speech recognition permission/service was blocked. Microphone access itself was granted, so please check Chrome speech recognition permissions and try again.',
        'service-not-allowed':
          'Browser speech recognition service is not allowed. Please use Chrome or Edge and try again.',
        'audio-capture':
          'The browser could not capture audio. Please check that your microphone is connected and not being used by another app.',
        network:
          'Speech recognition needs an internet connection in this browser.',
        'no-speech':
          'No speech was detected. Please speak clearly and try again.',
        aborted:
          'Voice recognition was stopped.',
      }

      setError(
        messages[event.error] ||
          `Voice recognition error: ${event.error || 'Unknown error'}`
      )

      setIsRecording(false)
      setMicStatus('')
    }

    recognition.onend = () => {
      setIsRecording(false)
      recognitionRef.current = null
      cleanupStream()

      if (!error) {
        setMicStatus('')
      }
    }

    recognitionRef.current = recognition

    try {
      recognition.start()
    } catch (startError) {
      console.error('SpeechRecognition start error:', startError)

      setIsRecording(false)
      recognitionRef.current = null
      cleanupStream()

      setError(
        startError?.message ||
          'Voice recognition start nahi ho saka. Please try again.'
      )
      setMicStatus('')
    }
  }

  const stopRecognition = () => {
    try {
      recognitionRef.current?.stop?.()
    } catch (stopError) {
      console.error('SpeechRecognition stop error:', stopError)
    }

    setIsRecording(false)
    recognitionRef.current = null
    cleanupStream()
    setMicStatus('')
  }

  const useAnswer = () => {
    const value = transcript.trim()

    if (!value) {
      setError('Please speak something first.')
      return
    }

    onTranscript?.(value)
    setError('')
  }

  const clearTranscript = () => {
    stopRecognition()
    finalTextRef.current = ''
    setTranscript('')
    setError('')
    setMicStatus('')
    onTranscript?.('')
  }

  return (
    <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-slate-800">
            Voice Input
          </p>
          <p className="text-xs text-slate-500">
            Speak in {languageLabel}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {!isRecording ? (
            <button
              type="button"
              onClick={startRecognition}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              🎙️ Speak
            </button>
          ) : (
            <button
              type="button"
              onClick={stopRecognition}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              ⏹ Stop
            </button>
          )}

          <button
            type="button"
            onClick={clearTranscript}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Clear
          </button>
        </div>
      </div>

      {isRecording && (
        <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          🎙️ Listening... Speak naturally.
        </div>
      )}

      {micStatus && !isRecording && (
        <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">
          {micStatus}
        </div>
      )}

      {error && (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <textarea
        value={transcript}
        onChange={(event) => {
          const value = event.target.value
          setTranscript(value)
          finalTextRef.current = value
          onTranscript?.(value)
        }}
        rows={3}
        placeholder="Your spoken answer will appear here. You can edit it."
        className="mt-3 w-full resize-y rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
      />

      <div className="mt-2 flex justify-end">
        <button
          type="button"
          onClick={useAnswer}
          disabled={!transcript.trim()}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Use This Answer
        </button>
      </div>
    </div>
  )
}

export default VoiceInputButton
