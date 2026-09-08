import { useEffect, useRef, useState } from 'react'

function useVoiceInput() {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState('')

  const recognitionRef = useRef(null)
  const transcriptRef = useRef('')

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition

    if (!SpeechRecognition) {
      setError(
        'Voice input is not supported in this browser. Please use Google Chrome.'
      )
      return
    }

    const recognition = new SpeechRecognition()

    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = 'en-IN'
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      setIsListening(true)
      setError('')
      transcriptRef.current = ''
      setTranscript('')
    }

    recognition.onresult = (event) => {
      let currentTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        currentTranscript += event.results[i][0].transcript
      }

      transcriptRef.current = currentTranscript
      setTranscript(currentTranscript)
    }

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error)

      setIsListening(false)

      if (event.error === 'not-allowed') {
        setError(
          'Microphone permission denied. Please allow microphone access.'
        )
      } else if (event.error === 'no-speech') {
        setError('No speech detected. Please try speaking again.')
      } else {
        setError(`Voice input error: ${event.error}`)
      }
    }

    recognition.onend = () => {
      setIsListening(false)

      // Make sure the final transcript remains available
      setTranscript(transcriptRef.current)
    }

    recognitionRef.current = recognition

    return () => {
      recognition.abort()
    }
  }, [])

  const startListening = () => {
    if (!recognitionRef.current) {
      setError(
        'Voice input is not supported. Please use Google Chrome.'
      )
      return
    }

    try {
      transcriptRef.current = ''
      setTranscript('')
      setError('')

      recognitionRef.current.start()
    } catch (error) {
      console.error('Could not start speech recognition:', error)
    }
  }

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
  }

  return {
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
  }
}

export default useVoiceInput